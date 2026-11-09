import { OWNERSHIP_LABELS, STATUS_LABELS } from '@/types/piano';
import type { OwnershipCategory, PianoStatus } from '@/types/piano';

// Shared by the summary count and its destination so they always describe the same items.
export const RESTORATION_STATUSES: readonly PianoStatus[] = [
  'restoration_work', 'regulation', 'voicing', 'tuning', 'cabinet_work',
];
export type InventoryStatusFilter = PianoStatus | 'in_restoration' | 'all';
export type InventoryOwnershipFilter = OwnershipCategory | 'all';

export function readInventoryFilters(params: URLSearchParams) {
  const status = params.get('status');
  const ownership = params.get('ownership');
  return {
    status: (status === 'in_restoration' || (status && Object.prototype.hasOwnProperty.call(STATUS_LABELS, status))
      ? status : 'all') as InventoryStatusFilter,
    ownership: (ownership && Object.prototype.hasOwnProperty.call(OWNERSHIP_LABELS, ownership)
      ? ownership : 'all') as InventoryOwnershipFilter,
  };
}

export function matchesInventoryStatus(status: string, filter: InventoryStatusFilter) {
  return filter === 'all' || (filter === 'in_restoration'
    ? RESTORATION_STATUSES.includes(status as PianoStatus)
    : status === filter);
}
