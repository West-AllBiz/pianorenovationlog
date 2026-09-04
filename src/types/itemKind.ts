export type ItemKind =
  | 'piano'
  | 'digital_keyboard'
  | 'harp'
  | 'rocking_chair'
  | 'bench'
  | 'piano_action'
  | 'other';

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  piano: 'Piano',
  digital_keyboard: 'Digital Keyboard',
  harp: 'Harp',
  rocking_chair: 'Rocking Chair',
  bench: 'Bench',
  piano_action: 'Piano Action / Mechanism',
  other: 'Other',
};

/** Piano-like kinds keep the full piano field set and condition inspection behavior. */
const PIANO_LIKE: ItemKind[] = ['piano', 'digital_keyboard'];

export function isPianoLike(kind: string | null | undefined): boolean {
  return PIANO_LIKE.includes((kind || 'piano') as ItemKind);
}

export function itemKindLabel(kind: string | null | undefined): string {
  return ITEM_KIND_LABELS[(kind || 'piano') as ItemKind] || 'Item';
}

/** Display title for an inventory row, falling back to piano brand/model. */
export function itemDisplayName(row: {
  item_kind?: string | null;
  item_name?: string | null;
  brand?: string | null;
  model?: string | null;
}): string {
  if (!isPianoLike(row.item_kind) && row.item_name) return row.item_name;
  return [row.brand, row.model].filter(Boolean).join(' ') || row.item_name || 'Untitled item';
}
