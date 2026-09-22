
CREATE TABLE public.whatsapp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  smm_user_id UUID REFERENCES public.smm_users(id) ON DELETE CASCADE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wv_status_valid CHECK (status IN ('pending','verified','expired'))
);

GRANT ALL ON public.whatsapp_verifications TO service_role;

ALTER TABLE public.whatsapp_verifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_wv_phone_status ON public.whatsapp_verifications(phone, status);
CREATE INDEX idx_wv_code_pending ON public.whatsapp_verifications(code) WHERE status='pending';

ALTER TABLE public.smm_users ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;
