/**
 * The short number a pool is known by until its sponsor names it: the last six digits of the
 * pool id when it is long (ids from the create-pool form are 13-16 digits), the whole id when
 * it is already short. One rule, used by the server's placeholder and by the UI's fallback, so a
 * pool never changes name just because its first activity was recorded.
 */
export function shortPoolId(poolId: string): string {
  return poolId.length > 8 ? poolId.slice(-6) : poolId;
}

export function placeholderPoolName(poolId: string): string {
  return `Pool #${shortPoolId(poolId)}`;
}
