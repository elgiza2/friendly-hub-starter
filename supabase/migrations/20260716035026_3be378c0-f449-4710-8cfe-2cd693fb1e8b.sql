
CREATE TABLE public.smm_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE,
  name text,
  is_guest boolean NOT NULL DEFAULT true,
  guest_token text UNIQUE,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  auth_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.smm_users TO service_role;
ALTER TABLE public.smm_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.smm_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.smm_users(id) ON DELETE CASCADE,
  service_id integer NOT NULL,
  service_name text NOT NULL,
  category text,
  link text NOT NULL,
  quantity integer NOT NULL,
  charge numeric(12,2) NOT NULL,
  provider_order_id text,
  status text NOT NULL DEFAULT 'pending',
  start_count integer,
  remains integer,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX smm_orders_user_idx ON public.smm_orders(user_id, created_at DESC);
GRANT ALL ON public.smm_orders TO service_role;
ALTER TABLE public.smm_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.smm_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.smm_users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL,
  reference text,
  status text NOT NULL DEFAULT 'pending',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX smm_tx_user_idx ON public.smm_transactions(user_id, created_at DESC);
GRANT ALL ON public.smm_transactions TO service_role;
ALTER TABLE public.smm_transactions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.smm_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER smm_users_touch BEFORE UPDATE ON public.smm_users
  FOR EACH ROW EXECUTE FUNCTION public.smm_touch_updated_at();
CREATE TRIGGER smm_orders_touch BEFORE UPDATE ON public.smm_orders
  FOR EACH ROW EXECUTE FUNCTION public.smm_touch_updated_at();
