CREATE TABLE public.sms_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE,
  email text,
  name text,
  is_guest boolean NOT NULL DEFAULT true,
  guest_token text UNIQUE,
  balance numeric(12,2) NOT NULL DEFAULT 0,
  auth_user_id uuid,
  clerk_user_id text UNIQUE,
  phone_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.sms_users TO service_role;
ALTER TABLE public.sms_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sms_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.sms_users(id) ON DELETE CASCADE,
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
CREATE INDEX sms_orders_user_idx ON public.sms_orders(user_id, created_at DESC);
GRANT ALL ON public.sms_orders TO service_role;
ALTER TABLE public.sms_orders ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sms_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.sms_users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL,
  type text NOT NULL,
  reference text,
  status text NOT NULL DEFAULT 'pending',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sms_tx_user_idx ON public.sms_transactions(user_id, created_at DESC);
CREATE UNIQUE INDEX sms_transactions_deposit_ref_uniq
  ON public.sms_transactions (reference)
  WHERE type = 'deposit' AND reference IS NOT NULL;
GRANT ALL ON public.sms_transactions TO service_role;
ALTER TABLE public.sms_transactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sms_whatsapp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  sms_user_id uuid REFERENCES public.sms_users(id) ON DELETE CASCADE,
  verified_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sms_wv_status_valid CHECK (status IN ('pending','verified','expired'))
);
GRANT ALL ON public.sms_whatsapp_verifications TO service_role;
ALTER TABLE public.sms_whatsapp_verifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX sms_wv_phone_status_idx ON public.sms_whatsapp_verifications(phone, status);

CREATE TABLE public.sms_services (
  service_id integer PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  rate numeric(12,4) NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 1,
  max_quantity integer NOT NULL DEFAULT 1000,
  refill boolean NOT NULL DEFAULT false,
  cancel boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sms_services_category_idx ON public.sms_services(category);
GRANT SELECT ON public.sms_services TO anon, authenticated;
GRANT ALL ON public.sms_services TO service_role;
ALTER TABLE public.sms_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active services are public" ON public.sms_services
  FOR SELECT TO anon, authenticated USING (is_active);

CREATE OR REPLACE FUNCTION public.sms_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER sms_users_touch BEFORE UPDATE ON public.sms_users
  FOR EACH ROW EXECUTE FUNCTION public.sms_touch_updated_at();
CREATE TRIGGER sms_orders_touch BEFORE UPDATE ON public.sms_orders
  FOR EACH ROW EXECUTE FUNCTION public.sms_touch_updated_at();
CREATE TRIGGER sms_services_touch BEFORE UPDATE ON public.sms_services
  FOR EACH ROW EXECUTE FUNCTION public.sms_touch_updated_at();

CREATE OR REPLACE FUNCTION public.sms_credit_deposit(_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.sms_transactions%ROWTYPE;
BEGIN
  SELECT * INTO v_tx FROM public.sms_transactions
    WHERE reference = _reference AND type = 'deposit'
    FOR UPDATE;

  IF v_tx.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'deposit_not_found');
  END IF;

  IF v_tx.status = 'completed' THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  UPDATE public.sms_transactions SET status = 'completed' WHERE id = v_tx.id;
  UPDATE public.sms_users SET balance = COALESCE(balance, 0) + v_tx.amount WHERE id = v_tx.user_id;

  RETURN jsonb_build_object('ok', true, 'amount', v_tx.amount, 'user_id', v_tx.user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sms_credit_deposit(text) TO service_role;