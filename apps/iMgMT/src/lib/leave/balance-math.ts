export function availableBalance(balance: {
  entitled: number;
  carriedOver: number;
  adjusted: number;
  used: number;
  pending: number;
}): number {
  return balance.entitled + balance.carriedOver + balance.adjusted - balance.used - balance.pending;
}
