
DO $$ BEGIN
  CREATE TYPE public.sale_type_enum AS ENUM ('internal_inventory','consignment','not_for_sale');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.pianos
  ADD COLUMN IF NOT EXISTS sale_type public.sale_type_enum NOT NULL DEFAULT 'internal_inventory',
  ADD COLUMN IF NOT EXISTS consignment_terms text,
  ADD COLUMN IF NOT EXISTS consignment_commission_pct numeric;

-- Backfill: client-owned pianos default to not_for_sale unless explicitly consignment
UPDATE public.pianos SET sale_type = 'not_for_sale'
  WHERE ownership_category = 'client_piano' AND sale_type = 'internal_inventory';

-- Tighten anon read on pianos so client/private data only leaks for publicly-listable items
DROP POLICY IF EXISTS "Anon can read pianos" ON public.pianos;
CREATE POLICY "Anon can read public pianos" ON public.pianos
  FOR SELECT TO anon
  USING (
    sale_type IN ('internal_inventory','consignment')
    AND EXISTS (SELECT 1 FROM public.catalogue c WHERE c.piano_id = pianos.id AND c.visible = true)
  );

-- Update Herald (P-013) per request
UPDATE public.pianos
SET ownership_category = 'client_piano',
    sale_type = 'consignment',
    status = 'ready_for_sale',
    asking_price = 12500
WHERE inventory_id = 'P-013';

UPDATE public.catalogue SET visible = true
WHERE piano_id = (SELECT id FROM public.pianos WHERE inventory_id = 'P-013');
