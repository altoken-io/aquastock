//! Behavior and failure-path tests for every instruction, plus a randomized suite that
//! checks the pool's accounting identities after every operation.

mod common;

use {
    anchor_lang::{error::ErrorCode as AnchorError, prelude::Pubkey},
    common::*,
    match_pools::{
        error::MatchPoolsError as E, CreatePoolParams, MAX_MATCH_BPS, MAX_POOL_WINDOW_SECONDS,
        MAX_VESTING_SECONDS, MIN_VESTING_SECONDS,
    },
    solana_signer::Signer,
};

const BUDGET: u64 = 500 * ONE;

fn code(error: E) -> u32 {
    error.into()
}

#[track_caller]
fn expect(label: &str, result: &TxResult, error: E) {
    assert!(
        failed_with(result, code(error)),
        "{label}: expected {error:?}, got {:?}\n{}",
        result.as_ref().err().map(|e| &e.err),
        logs(result)
    );
}

// ---- config and pool creation ----

#[test]
fn only_the_upgrade_authority_can_initialise_the_config_and_only_once() {
    let mut w = World::with_mint(&MintOptions::default(), false);

    // A stranger cannot choose the mint, even by front-running the deploy.
    let stranger = w.sponsor.pubkey();
    let ix = w.init_config_ix(&stranger, &w.mint);
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.sponsor]);
    expect_err(&result, E::Unauthorized);
    assert!(w.svm.get_account(&w.config_pda()).is_none());

    w.init_config().unwrap();
    let config = w.config();
    assert_eq!(config.admin, w.upgrade_authority.pubkey());
    assert_eq!(config.allowed_mint, w.mint);

    // There is no way to change it afterwards, not even for the authority.
    let other = w.create_mint(&MintOptions::default());
    let ix = w.init_config_ix(&w.upgrade_authority.pubkey(), &other);
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.upgrade_authority]);
    assert!(result.is_err(), "config must be write-once");
    assert_eq!(w.config(), config);
}

#[test]
fn create_pool_only_accepts_the_allow_listed_mint() {
    let mut w = World::new();
    let other = w.create_mint(&MintOptions::default());
    let sponsor = w.sponsor.pubkey();
    let params = w.default_params(1);
    let ix = w.create_pool_ix(&sponsor, &other, params);
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.sponsor]);
    expect_err(&result, E::MintNotAllowed);
    assert!(w.svm.get_account(&w.pool_pda(&sponsor, 1)).is_none());
}

#[test]
fn create_pool_rejects_invalid_parameters_and_accepts_the_exact_limits() {
    let mut w = World::new();
    let sponsor = w.sponsor.pubkey();
    let base = w.default_params(0);
    let now = w.now();

    let bad: Vec<(&str, CreatePoolParams, E)> = vec![
        (
            "zero match",
            CreatePoolParams {
                match_bps: 0,
                ..base
            },
            E::InvalidMatchBps,
        ),
        (
            "match above 1:1",
            CreatePoolParams {
                match_bps: MAX_MATCH_BPS + 1,
                ..base
            },
            E::InvalidMatchBps,
        ),
        (
            "zero cap",
            CreatePoolParams {
                per_saver_cap: 0,
                ..base
            },
            E::InvalidPerSaverCap,
        ),
        (
            "vesting too short",
            CreatePoolParams {
                vesting_seconds: MIN_VESTING_SECONDS - 1,
                ..base
            },
            E::InvalidVestingDuration,
        ),
        (
            "vesting negative",
            CreatePoolParams {
                vesting_seconds: -1,
                ..base
            },
            E::InvalidVestingDuration,
        ),
        (
            "vesting too long",
            CreatePoolParams {
                vesting_seconds: MAX_VESTING_SECONDS + 1,
                ..base
            },
            E::InvalidVestingDuration,
        ),
        (
            "window already over",
            CreatePoolParams {
                ends_at: now - 1,
                ..base
            },
            E::InvalidPoolWindow,
        ),
        (
            "window ends now",
            CreatePoolParams {
                ends_at: now,
                ..base
            },
            E::InvalidPoolWindow,
        ),
        (
            "window too long",
            CreatePoolParams {
                ends_at: now + MAX_POOL_WINDOW_SECONDS + 1,
                ..base
            },
            E::InvalidPoolWindow,
        ),
    ];
    for (index, (label, mut params, error)) in bad.into_iter().enumerate() {
        params.pool_id = 100 + index as u64;
        let ix = w.create_pool_ix(&sponsor, &w.mint, params);
        let result = send(&mut w.svm, &w.payer, &[ix], &[&w.sponsor]);
        expect(label, &result, error);
        assert!(w
            .svm
            .get_account(&w.pool_pda(&sponsor, params.pool_id))
            .is_none());
    }

    let good = [
        CreatePoolParams {
            pool_id: 1,
            match_bps: 1,
            vesting_seconds: MIN_VESTING_SECONDS,
            ..base
        },
        CreatePoolParams {
            pool_id: 2,
            match_bps: MAX_MATCH_BPS,
            vesting_seconds: MAX_VESTING_SECONDS,
            ends_at: now + MAX_POOL_WINDOW_SECONDS,
            per_saver_cap: u64::MAX,
        },
    ];
    for params in good {
        let ix = w.create_pool_ix(&sponsor, &w.mint, params);
        send(&mut w.svm, &w.payer, &[ix], &[&w.sponsor]).unwrap();
        assert_eq!(
            w.pool(&w.pool_pda(&sponsor, params.pool_id)).match_bps,
            params.match_bps
        );
    }
}

// ---- funding ----

#[test]
fn fund_match_failure_paths_and_top_ups() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, 0);
    expect("zero amount", &w.fund(&pool, 0), E::ZeroAmount);

    // Someone else cannot fund through the sponsor slot.
    let stranger = w.add_actor(50 * ONE);
    let ix = w.fund_match_ix(&w.actor_key(stranger), &w.actors[stranger].ata, &pool, ONE);
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.actors[stranger].kp]);
    expect("stranger", &result, E::Unauthorized);

    // A token account of another mint is refused by the account constraints.
    let other = w.create_mint(&MintOptions::default());
    let sponsor = w.sponsor.pubkey();
    let foreign = w.create_token_account(&sponsor, &other);
    let ix = w.fund_match_ix(&sponsor, &foreign, &pool, ONE);
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.sponsor]);
    expect_anchor_err(&result, AnchorError::ConstraintTokenMint);

    w.fund(&pool, 10 * ONE).unwrap();
    w.fund(&pool, 5 * ONE).unwrap();
    assert_eq!(w.pool(&pool).budget_total, 15 * ONE);
    assert_eq!(w.balance(&w.vault_pda(&pool)), 15 * ONE);

    w.set_time(T0 + 86_400);
    expect("after the window", &w.fund(&pool, ONE), E::PoolEnded);
    assert_eq!(w.pool(&pool).budget_total, 15 * ONE);
}

// ---- deposits ----

#[test]
fn deposit_failure_paths() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, 0);
    let (a, a_ata) = (w.saver_a.pubkey(), w.saver_a_ata);
    expect(
        "no budget",
        &w.deposit_as_a(&pool, ONE, 0),
        E::BudgetExhausted,
    );

    w.fund(&pool, BUDGET).unwrap();
    expect("zero", &w.deposit_as_a(&pool, 0, 0), E::ZeroAmount);
    expect(
        "over the cap",
        &w.deposit_as_a(&pool, 100 * ONE + 1, 0),
        E::DepositExceedsCap,
    );
    expect(
        "match below the minimum",
        &w.deposit_as_a(&pool, 10 * ONE, 10 * ONE + 1),
        E::MatchBelowMinimum,
    );

    // Another pool's vault, and another mint, are both refused.
    let params2 = w.default_params(2);
    let pool2 = w.open_pool(params2, BUDGET);
    let mut ix = w.deposit_ix(&a, &a_ata, &pool, ONE, 0);
    ix.accounts[4].pubkey = w.vault_pda(&pool2); // vault
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.saver_a]);
    expect("wrong vault", &result, E::WrongVault);

    let other = w.create_mint(&MintOptions::default());
    let mut ix = w.deposit_ix(&a, &a_ata, &pool, ONE, 0);
    ix.accounts[3].pubkey = other; // mint
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.saver_a]);
    expect("wrong mint", &result, E::WrongMint);

    // None of the failures left anything behind.
    let state = w.pool(&pool);
    assert_eq!((state.reserved, state.deposits_total), (0, 0));
    assert!(w.try_position(&a, &pool).is_none());

    // One deposit per saver per pool.
    w.deposit_as_a(&pool, 10 * ONE, 10 * ONE).unwrap();
    assert!(w.deposit_as_a(&pool, ONE, 0).is_err());
    assert_eq!(w.pool(&pool).deposits_total, 10 * ONE);

    w.set_time(T0 + 86_400);
    expect(
        "after the window",
        &w.deposit_as_b(&pool, ONE, 0),
        E::PoolEnded,
    );
}

#[test]
fn match_is_first_come_first_served_and_partial_when_the_budget_runs_short() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, 130 * ONE);
    let b = w.saver_b.pubkey();

    w.deposit_as_a(&pool, 100 * ONE, 100 * ONE).unwrap();
    // Only 30 is left. A strict minimum refuses; a lenient one takes what remains.
    expect(
        "strict minimum",
        &w.deposit_as_b(&pool, 100 * ONE, 100 * ONE),
        E::MatchBelowMinimum,
    );
    w.deposit_as_b(&pool, 100 * ONE, 0).unwrap();
    assert_eq!(w.position(&b, &pool).match_reserved, 30 * ONE);
    let state = w.pool(&pool);
    assert_eq!(state.reserved, state.budget_total);

    let late = w.add_actor(100 * ONE);
    expect(
        "budget gone",
        &w.deposit_by(late, &pool, ONE, 0),
        E::BudgetExhausted,
    );
}

#[test]
fn match_ratio_is_applied_and_rounds_down() {
    let mut w = World::new();
    let a = w.saver_a.pubkey();
    for (index, (bps, deposit, expected)) in [
        (10_000u16, 100 * ONE, 100 * ONE),
        (5_000, 100 * ONE, 50 * ONE),
        (2_500, 40 * ONE, 10 * ONE),
        (3_333, 10, 3),
        (1, 9_999, 0),
    ]
    .into_iter()
    .enumerate()
    {
        let params = CreatePoolParams {
            match_bps: bps,
            ..w.default_params(index as u64 + 1)
        };
        let pool = w.open_pool(params, BUDGET);
        w.deposit_as_a(&pool, deposit, 0).unwrap();
        assert_eq!(w.position(&a, &pool).match_reserved, expected, "{bps} bps");
    }
}

// ---- claiming ----

#[test]
fn claim_pays_only_what_has_vested_and_never_twice() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, BUDGET);
    let a = w.saver_a.pubkey();
    w.deposit_as_a(&pool, 100 * ONE, 100 * ONE).unwrap();
    let start = w.balance(&w.saver_a_ata);

    expect(
        "nothing vested yet",
        &w.claim_as_a(&pool),
        E::NothingToClaim,
    );

    // A stranger holding the saver's position account cannot claim it.
    let stranger = w.add_actor(0);
    let ix = w.claim_ix_raw(
        &w.actor_key(stranger),
        &w.actors[stranger].ata,
        &pool,
        &w.position_pda(&pool, &a),
    );
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.actors[stranger].kp]);
    expect("stranger", &result, E::Unauthorized);

    w.set_time(T0 + 250);
    w.claim_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata) - start, 25 * ONE);
    expect("double claim", &w.claim_as_a(&pool), E::NothingToClaim);

    w.set_time(T0 + 500);
    w.claim_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata) - start, 50 * ONE);

    // 999/1000 vested: 99.9 tokens in total, so this claim pays 49.9.
    w.set_time(T0 + 999);
    w.claim_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata) - start, 9_990_000_000);

    w.set_time(T0 + 5_000);
    w.claim_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata) - start, 100 * ONE);
    expect("all claimed", &w.claim_as_a(&pool), E::NothingToClaim);

    let state = w.pool(&pool);
    assert_eq!(state.claimed, 100 * ONE);
    assert_eq!(w.position(&a, &pool).match_claimed, 100 * ONE);
    w.assert_pool_invariants(&pool, &[a]);
}

// ---- withdrawing ----

#[test]
fn withdraw_forfeits_only_the_unvested_match_and_leaves_the_rest_claimable() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, BUDGET);
    let a = w.saver_a.pubkey();
    let start = w.balance(&w.saver_a_ata);
    w.deposit_as_a(&pool, 100 * ONE, 100 * ONE).unwrap();

    w.set_time(T0 + 250);
    w.withdraw_as_a(&pool).unwrap();
    assert_eq!(
        w.balance(&w.saver_a_ata),
        start,
        "principal comes back in full"
    );

    let position = w.position(&a, &pool);
    assert_eq!(
        (
            position.deposited,
            position.match_reserved,
            position.match_claimed
        ),
        (0, 25 * ONE, 0)
    );
    assert!(position.settled);
    let state = w.pool(&pool);
    assert_eq!(state.reserved, 25 * ONE);
    assert_eq!(state.budget_total - state.reserved, BUDGET - 25 * ONE);

    // What had vested is theirs, all of it, right now.
    w.claim_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata), start + 25 * ONE);
    expect("nothing more", &w.claim_as_a(&pool), E::NothingToClaim);
    expect(
        "double withdraw",
        &w.withdraw_as_a(&pool),
        E::AlreadyWithdrawn,
    );
    w.assert_pool_invariants(&pool, &[a]);
}

#[test]
fn claim_then_withdraw_forfeits_only_what_is_still_unvested() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, BUDGET);
    let a = w.saver_a.pubkey();
    let start = w.balance(&w.saver_a_ata);
    w.deposit_as_a(&pool, 100 * ONE, 100 * ONE).unwrap();

    w.set_time(T0 + 500);
    w.claim_as_a(&pool).unwrap();
    w.withdraw_as_a(&pool).unwrap();
    // Principal back, half the match already paid, the other half returned to the sponsor.
    assert_eq!(w.balance(&w.saver_a_ata), start + 50 * ONE);
    let position = w.position(&a, &pool);
    assert_eq!(
        (position.match_reserved, position.match_claimed),
        (50 * ONE, 50 * ONE)
    );
    assert_eq!(w.pool(&pool).reserved, 50 * ONE);
    expect("nothing left", &w.claim_as_a(&pool), E::NothingToClaim);
    w.assert_pool_invariants(&pool, &[a]);
}

#[test]
fn withdraw_by_someone_else_is_unauthorized() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, BUDGET);
    let a = w.saver_a.pubkey();
    w.deposit_as_a(&pool, 40 * ONE, 0).unwrap();

    let stranger = w.add_actor(0);
    let ix = w.withdraw_ix_raw(
        &w.actor_key(stranger),
        &w.actors[stranger].ata,
        &pool,
        &w.position_pda(&pool, &a),
    );
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.actors[stranger].kp]);
    expect("stranger", &result, E::Unauthorized);
    assert_eq!(w.position(&a, &pool).deposited, 40 * ONE);
}

// ---- reclaiming ----

#[test]
fn sponsor_reclaim_rules() {
    let mut w = World::new();
    // Slow vesting, so a withdrawal at the end of the window still forfeits something.
    let params = CreatePoolParams {
        vesting_seconds: 200_000,
        ..w.default_params(1)
    };
    let pool = w.open_pool(params, BUDGET);
    w.deposit_as_a(&pool, 100 * ONE, 100 * ONE).unwrap();

    expect("before the end", &w.reclaim(&pool), E::PoolNotEnded);
    let stranger = w.add_actor(0);
    let ix = w.reclaim_ix(&w.actor_key(stranger), &w.actors[stranger].ata, &pool);
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.actors[stranger].kp]);
    expect("stranger", &result, E::Unauthorized);

    w.set_time(T0 + 86_400);
    let before = w.balance(&w.sponsor_ata);
    w.reclaim(&pool).unwrap();
    // Only the unreserved budget moves; the saver's reservation stays.
    assert_eq!(w.balance(&w.sponsor_ata), before + BUDGET - 100 * ONE);
    assert_eq!(w.pool(&pool).budget_total, 100 * ONE);
    expect("nothing left", &w.reclaim(&pool), E::NothingToReclaim);

    // The saver leaves at the end of the window: 43.2 of 100 has vested.
    w.withdraw_as_a(&pool).unwrap();
    let vested = 100 * ONE * 86_400 / 200_000;
    let forfeited = 100 * ONE - vested;
    let before = w.balance(&w.sponsor_ata);
    w.reclaim(&pool).unwrap();
    assert_eq!(w.balance(&w.sponsor_ata), before + forfeited);

    // The vested part is still theirs, and once claimed the vault is empty.
    let start = w.balance(&w.saver_a_ata);
    w.claim_as_a(&pool).unwrap();
    assert_eq!(w.balance(&w.saver_a_ata), start + vested);
    assert_eq!(w.balance(&w.vault_pda(&pool)), 0);
}

// ---- closing ----

#[test]
fn close_position_only_when_nothing_is_left_and_refunds_the_rent() {
    let mut w = World::new();
    let params = w.default_params(1);
    let pool = w.open_pool(params, BUDGET);
    let (a, b) = (w.saver_a.pubkey(), w.saver_b.pubkey());
    w.deposit_as_a(&pool, 100 * ONE, 0).unwrap();
    w.deposit_as_b(&pool, 100 * ONE, 0).unwrap();

    expect(
        "still deposited",
        &w.close_as_a(&pool),
        E::PositionStillActive,
    );

    w.set_time(T0 + 500);
    w.claim_as_a(&pool).unwrap();
    expect(
        "claimed but still deposited",
        &w.close_as_a(&pool),
        E::PositionStillActive,
    );

    // B leaves with vested match unclaimed: still not closable until it is claimed.
    let ix = w.withdraw_ix(&b, &w.saver_b_ata, &pool);
    send(&mut w.svm, &w.payer, &[ix], &[&w.saver_b]).unwrap();
    let ix = w.close_position_ix(&b, &pool);
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.saver_b]);
    expect("unclaimed match", &result, E::PositionStillActive);

    // A stranger cannot close someone else's position.
    let stranger = w.add_actor(0);
    let ix = w.close_position_ix_raw(&w.actor_key(stranger), &pool, &w.position_pda(&pool, &b));
    let result = send(&mut w.svm, &w.payer, &[ix], &[&w.actors[stranger].kp]);
    expect("stranger", &result, E::Unauthorized);

    let ix = w.claim_ix(&b, &w.saver_b_ata, &pool);
    send(&mut w.svm, &w.payer, &[ix], &[&w.saver_b]).unwrap();
    let lamports_before = w.svm.get_balance(&b).unwrap();
    let position_lamports = w.svm.get_balance(&w.position_pda(&pool, &b)).unwrap();
    let ix = w.close_position_ix(&b, &pool);
    send(&mut w.svm, &w.payer, &[ix], &[&w.saver_b]).unwrap();
    assert!(w.try_position(&b, &pool).is_none(), "position must be gone");
    assert_eq!(
        w.svm.get_balance(&b).unwrap(),
        lamports_before + position_lamports
    );

    // A withdraws too and can close, freeing the slot for a fresh position.
    w.withdraw_as_a(&pool).unwrap();
    w.close_as_a(&pool).unwrap();
    assert!(w.try_position(&a, &pool).is_none());
    w.deposit_as_a(&pool, 10 * ONE, 0).unwrap();
    assert_eq!(w.position(&a, &pool).deposited, 10 * ONE);
    w.assert_pool_invariants(&pool, &[a, b]);
}

// ---- randomized invariants ----

#[test]
fn randomized_operation_sequences_preserve_every_accounting_identity() {
    for seed in 0..25u64 {
        run_random_sequence(seed);
    }
}

fn run_random_sequence(seed: u64) {
    let mut rng = Rng(0xC0FF_EE00 ^ seed.wrapping_mul(0x9E37_79B9_7F4A_7C15));
    let mut w = World::new();
    let params = CreatePoolParams {
        match_bps: [2_500u16, 5_000, 10_000][rng.below(3) as usize],
        per_saver_cap: rng.range(10, 100) * ONE,
        vesting_seconds: rng.range(100, 5_000) as i64,
        ..w.default_params(1)
    };
    let pool = w.open_pool(params, rng.range(0, 300) * ONE);
    let savers: Vec<usize> = (0..4).map(|_| w.add_actor(200 * ONE)).collect();
    let keys: Vec<Pubkey> = savers.iter().map(|&i| w.actor_key(i)).collect();
    let vault = w.vault_pda(&pool);

    let balances = |w: &World| -> Vec<u64> {
        let mut all = vec![w.balance(&w.sponsor_ata), w.balance(&vault)];
        all.extend(savers.iter().map(|&i| w.balance(&w.actors[i].ata)));
        all
    };
    let books = |w: &World| {
        (
            w.pool(&pool),
            keys.iter()
                .map(|k| w.try_position(k, &pool))
                .collect::<Vec<_>>(),
        )
    };
    let total: u64 = balances(&w).iter().sum();

    for step in 0..60 {
        let (before_books, before_balances) = (books(&w), balances(&w));
        let who = rng.below(4) as usize;
        let op = rng.below(8);
        let result = match op {
            0 | 1 => {
                let amount = rng.range(1, params.per_saver_cap + ONE);
                let min = if rng.below(2) == 0 { 0 } else { amount };
                w.deposit_by(who, &pool, amount, min)
            }
            2 => w.claim_by(who, &pool),
            3 => w.withdraw_by(who, &pool),
            4 => w.close_by(who, &pool),
            5 => {
                let amount = rng.range(1, 50) * ONE;
                w.fund(&pool, amount)
            }
            6 => w.reclaim(&pool),
            _ => {
                let jump = if rng.below(2) == 0 { 500 } else { 60_000 };
                w.set_time(w.now() + rng.range(0, jump) as i64);
                continue_after_time(&mut w, &pool, &keys);
                continue;
            }
        };
        println!(
            "seed {seed} step {step} op {op} actor {who}: ok={}",
            result.is_ok()
        );

        if result.is_err() {
            assert_eq!(
                books(&w),
                before_books,
                "seed {seed} step {step}: a failed call changed the books"
            );
            assert_eq!(
                balances(&w),
                before_balances,
                "seed {seed} step {step}: a failed call moved tokens"
            );
        }
        assert_eq!(
            balances(&w).iter().sum::<u64>(),
            total,
            "seed {seed} step {step}: tokens were created or destroyed"
        );
        w.assert_pool_invariants(&pool, &keys);
    }

    settle_everything(&mut w, &pool, &savers, &keys, seed);
    assert_eq!(
        balances(&w).iter().sum::<u64>(),
        total,
        "seed {seed}: tokens were created or destroyed"
    );
}

/// Time only moves forward; the identities must hold at every instant, not just after calls.
fn continue_after_time(w: &mut World, pool: &Pubkey, keys: &[Pubkey]) {
    w.assert_pool_invariants(pool, keys);
}

/// Runs a pool to completion: everyone leaves, claims and closes, and the sponsor reclaims.
/// If the books are right, nothing is left behind in the vault.
fn settle_everything(w: &mut World, pool: &Pubkey, savers: &[usize], keys: &[Pubkey], seed: u64) {
    let state = w.pool(pool);
    w.set_time(state.ends_at.max(w.now()) + state.vesting_seconds + 1);
    for &who in savers {
        // Each may legitimately fail (no position, already withdrawn, nothing to claim).
        let _ = w.withdraw_by(who, pool);
        let _ = w.claim_by(who, pool);
        let _ = w.close_by(who, pool);
    }
    let _ = w.reclaim(pool);

    w.assert_pool_invariants(pool, keys);
    let end = w.pool(pool);
    assert_eq!(
        end.deposits_total, 0,
        "seed {seed}: principal left in the pool"
    );
    assert_eq!(
        end.reserved, end.claimed,
        "seed {seed}: match left unclaimed"
    );
    assert_eq!(
        end.budget_total, end.claimed,
        "seed {seed}: budget the sponsor could not reclaim"
    );
    assert_eq!(
        w.balance(&w.vault_pda(pool)),
        0,
        "seed {seed}: funds stuck in the vault"
    );
    for key in keys {
        assert!(
            w.try_position(key, pool).is_none(),
            "seed {seed}: a position could not be closed"
        );
    }
}
