// TODO Phase 6: replace with RevenueCat server-side entitlement check.
// Returns true during development. MUST be replaced before App Store submission.
export async function checkProEntitlement(_userId: string): Promise<boolean> {
  return true;
}
