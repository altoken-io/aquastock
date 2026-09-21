//! Pure vesting and match arithmetic. No account access, so it is testable on the host.

use anchor_lang::prelude::*;

use crate::{constants::BPS_DENOMINATOR, error::MatchPoolsError};

/// `floor(a * b / denominator)` with a u128 intermediate.
fn mul_div_floor(a: u64, b: u64, denominator: u64) -> Result<u64> {
    require!(denominator != 0, MatchPoolsError::MathOverflow);
    let product = u128::from(a)
        .checked_mul(u128::from(b))
        .ok_or(MatchPoolsError::MathOverflow)?;
    u64::try_from(product / u128::from(denominator))
        .map_err(|_| error!(MatchPoolsError::MathOverflow))
}

/// Match a deposit earns before the budget limit applies.
pub fn match_for_deposit(amount: u64, match_bps: u16) -> Result<u64> {
    mul_div_floor(amount, u64::from(match_bps), BPS_DENOMINATOR)
}

/// Linear vesting: nothing at `started_at`, everything once `duration` has elapsed.
/// Rounds down, so the sum of claims can never exceed `reserved`.
pub fn vested_amount(reserved: u64, started_at: i64, duration: i64, now: i64) -> Result<u64> {
    require!(duration > 0, MatchPoolsError::InvalidVestingDuration);
    if now <= started_at {
        return Ok(0);
    }
    let elapsed = now
        .checked_sub(started_at)
        .ok_or(MatchPoolsError::MathOverflow)?;
    if elapsed >= duration {
        return Ok(reserved);
    }
    let elapsed = u64::try_from(elapsed).map_err(|_| error!(MatchPoolsError::MathOverflow))?;
    let duration = u64::try_from(duration).map_err(|_| error!(MatchPoolsError::MathOverflow))?;
    mul_div_floor(reserved, elapsed, duration)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// splitmix64: a tiny deterministic generator, so the property tests need no dependency.
    struct Rng(u64);

    impl Rng {
        fn next(&mut self) -> u64 {
            self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
            let mut z = self.0;
            z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
            z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
            z ^ (z >> 31)
        }

        fn below(&mut self, bound: u64) -> u64 {
            self.next() % bound
        }
    }

    const CASES: usize = 20_000;

    #[test]
    fn vested_is_zero_at_start_and_full_at_end() {
        assert_eq!(vested_amount(1_000, 100, 60, 100).unwrap(), 0);
        assert_eq!(vested_amount(1_000, 100, 60, 99).unwrap(), 0);
        assert_eq!(vested_amount(1_000, 100, 60, 160).unwrap(), 1_000);
        assert_eq!(vested_amount(1_000, 100, 60, 10_000).unwrap(), 1_000);
    }

    #[test]
    fn vested_is_linear_and_rounds_down() {
        assert_eq!(vested_amount(1_000, 0, 100, 50).unwrap(), 500);
        assert_eq!(vested_amount(10, 0, 3, 1).unwrap(), 3);
        assert_eq!(vested_amount(10, 0, 3, 2).unwrap(), 6);
    }

    #[test]
    fn vested_handles_extreme_values_without_overflow() {
        let max_window = 5 * 365 * 24 * 60 * 60;
        let almost = vested_amount(u64::MAX, 0, max_window, max_window - 1).unwrap();
        assert!(almost < u64::MAX);
        assert_eq!(vested_amount(u64::MAX, 0, 1, 1).unwrap(), u64::MAX);
        // A timestamp span that does not fit in i64 must error, never wrap or panic.
        assert!(vested_amount(u64::MAX, i64::MIN, 10, i64::MAX).is_err());
    }

    #[test]
    fn zero_or_negative_duration_is_rejected() {
        assert!(vested_amount(1, 0, 0, 5).is_err());
        assert!(vested_amount(1, 0, -5, 5).is_err());
    }

    #[test]
    fn match_for_deposit_rounds_down_and_respects_ratio() {
        assert_eq!(match_for_deposit(1_000, 10_000).unwrap(), 1_000);
        assert_eq!(match_for_deposit(1_000, 5_000).unwrap(), 500);
        assert_eq!(match_for_deposit(3, 3_333).unwrap(), 0);
        assert_eq!(match_for_deposit(u64::MAX, 10_000).unwrap(), u64::MAX);
        assert_eq!(match_for_deposit(0, 10_000).unwrap(), 0);
    }

    #[test]
    fn property_vested_never_exceeds_reserved_and_is_monotonic() {
        let mut rng = Rng(0xA0A5_70CC);
        for _ in 0..CASES {
            let reserved = rng.next();
            let start = i64::try_from(rng.below(4_000_000_000)).unwrap();
            let duration = i64::try_from(rng.below(157_680_000) + 1).unwrap();
            let t1 = start + i64::try_from(rng.below(200_000_000)).unwrap();
            let t2 = t1 + i64::try_from(rng.below(200_000_000)).unwrap();

            let v1 = vested_amount(reserved, start, duration, t1).unwrap();
            let v2 = vested_amount(reserved, start, duration, t2).unwrap();
            assert!(v1 <= reserved, "vested exceeded reserved");
            assert!(v2 <= reserved, "vested exceeded reserved");
            assert!(v1 <= v2, "vesting went backwards");
            if t2 - start >= duration {
                assert_eq!(v2, reserved, "not fully vested at the end");
            }
        }
    }

    #[test]
    fn property_forfeit_plus_vested_conserves_the_reservation() {
        // Mirrors `withdraw`: forfeited = reserved - vested, and nothing is created or lost.
        let mut rng = Rng(0xF0BF_E17E);
        for _ in 0..CASES {
            let reserved = rng.below(u64::MAX / 2);
            let duration = i64::try_from(rng.below(10_000_000) + 1).unwrap();
            let now = i64::try_from(rng.below(20_000_000)).unwrap();
            let vested = vested_amount(reserved, 0, duration, now).unwrap();
            let forfeited = reserved.checked_sub(vested).unwrap();
            assert_eq!(vested + forfeited, reserved);
        }
    }

    #[test]
    fn property_claims_in_any_slicing_never_exceed_reserved() {
        // A saver claiming at arbitrary times cannot take more than the reservation,
        // because each claim pays only `vested - already_claimed`.
        let mut rng = Rng(0xC1A1_4E55);
        for _ in 0..2_000 {
            let reserved = rng.below(1_000_000_000_000);
            let duration = i64::try_from(rng.below(1_000_000) + 1).unwrap();
            let mut claimed = 0u64;
            let mut now = 0i64;
            for _ in 0..20 {
                now += i64::try_from(rng.below(200_000)).unwrap();
                let vested = vested_amount(reserved, 0, duration, now).unwrap();
                claimed += vested - claimed;
                assert!(claimed <= reserved);
            }
            let end = vested_amount(reserved, 0, duration, now + duration).unwrap();
            assert_eq!(end, reserved);
        }
    }

    #[test]
    fn property_match_never_exceeds_deposit_at_or_below_one_to_one() {
        let mut rng = Rng(0x5EED_0001);
        for _ in 0..CASES {
            let amount = rng.next();
            let bps = u16::try_from(rng.below(10_001)).unwrap();
            let matched = match_for_deposit(amount, bps).unwrap();
            assert!(matched <= amount);
        }
    }
}
