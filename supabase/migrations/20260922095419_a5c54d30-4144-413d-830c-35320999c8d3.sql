CREATE TABLE public.sms_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_service_id integer NOT NULL UNIQUE,
  platform text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  price_override numeric(16,6),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sms_catalog TO anon, authenticated;
GRANT ALL ON public.sms_catalog TO service_role;

ALTER TABLE public.sms_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Catalog is publicly readable"
ON public.sms_catalog FOR SELECT
TO anon, authenticated
USING (is_active);

CREATE TRIGGER sms_catalog_touch
BEFORE UPDATE ON public.sms_catalog
FOR EACH ROW EXECUTE FUNCTION public.sms_touch_updated_at();