/** Routes that are intentionally usable without an account. */
export function isGuestAccessibleRoute(segments: string[]): boolean {
  const [root, child, detail] = segments;

  if (root === 'auth' || root === 'onboarding') return true;
  if (root !== '(contractor)') return false;

  if (child === '(tabs)' || child === 'jobs') return true;

  return (
    child === 'profile' &&
    (detail === 'privacy-policy' ||
      detail === 'help-support' ||
      detail === 'about')
  );
}
