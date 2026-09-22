
-- Speed up webhook lookups and prevent double-crediting the same Kashier order.
CREATE UNIQUE INDEX IF NOT EXISTS smm_transactions_deposit_ref_uniq
  ON public.smm_transactions (reference)
  WHERE type = 'deposit' AND reference IS NOT NULL;

-- Atomic helper: mark a pending deposit as completed and add its amount to the wallet.
CREATE OR REPLACE FUNCTION public.smm_credit_deposit(_reference text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.smm_transactions%ROWTYPE;
BEGIN
  SELECT * INTO v_tx FROM public.smm_transactions
    WHERE reference = _reference AND type = 'deposit'
    FOR UPDATE;

  IF v_tx.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'deposit_not_found');
  END IF;

  IF v_tx.status = 'completed' THEN
    RETURN jsonb_build_object('ok', true, 'already', true);
  END IF;

  UPDATE public.smm_transactions
    SET status = 'completed'
    WHERE id = v_tx.id;

  UPDATE public.smm_users
    SET balance = COALESCE(balance, 0) + v_tx.amount
    WHERE id = v_tx.user_id;

  RETURN jsonb_build_object('ok', true, 'amount', v_tx.amount, 'user_id', v_tx.user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.smm_credit_deposit(text) TO service_role;
