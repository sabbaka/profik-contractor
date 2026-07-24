import { useAppSelector } from '@/src/store/hooks';

export function useIsGuest(): boolean {
  return !useAppSelector((state) => state.auth.token);
}
