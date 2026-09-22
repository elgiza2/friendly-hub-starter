CREATE POLICY "Deny direct sms_users access" ON public.sms_users FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "Deny direct sms_orders access" ON public.sms_orders FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "Deny direct sms_transactions access" ON public.sms_transactions FOR SELECT TO anon, authenticated USING (false);
CREATE POLICY "Deny direct sms_whatsapp_verifications access" ON public.sms_whatsapp_verifications FOR SELECT TO anon, authenticated USING (false);

REVOKE ALL ON FUNCTION public.sms_credit_deposit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sms_credit_deposit(text) TO service_role;