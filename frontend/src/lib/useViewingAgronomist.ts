import { useEffect } from 'react';
import { useAgronomists } from '@/api/hooks';
import { useSession } from '@/lib/session';

/**
 * PROTOTYPE DEMO ACCESS: which agronomist the workspace is showing. This is a "viewing as" choice, not a login.
 * Falls back to the first active agronomist so the workspace is never empty.
 */
export function useViewingAgronomist() {
  const { agronomistId, setAgronomistId } = useSession();
  const list = useAgronomists();
  const all = list.data ?? [];
  const current = all.find((a) => a.id === agronomistId) ?? all.find((a) => a.status === 'ACTIVE') ?? all[0];
  useEffect(() => { if (current && current.id !== agronomistId) setAgronomistId(current.id); }, [current, agronomistId, setAgronomistId]);
  return { id: current?.id, current, all, isLoading: list.isLoading, isError: list.isError, refetch: list.refetch, setAgronomistId };
}
