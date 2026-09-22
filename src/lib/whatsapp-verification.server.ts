import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

type AdminClient = SupabaseClient<Database>;

export async function attachVerifiedSmmPhone(
  db: AdminClient,
  params: { phone: string; smmUserId: string | null },
) {
  const { phone, smmUserId } = params;
  const verifiedAt = new Date().toISOString();

  if (!smmUserId) return { userId: null, guestToken: null, merged: false };

  const { data: current, error: currentError } = await db
    .from("sms_users")
    .select("id, guest_token, balance")
    .eq("id", smmUserId)
    .maybeSingle();
  if (currentError) throw new Error(currentError.message);

  const { data: existing, error: existingError } = await db
    .from("sms_users")
    .select("id, guest_token, balance, phone_verified_at")
    .eq("phone", phone)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing && existing.id !== smmUserId) {
    const tokenToKeep = current?.guest_token ?? existing.guest_token ?? null;
    const currentBalance = Number(current?.balance ?? 0);

    if (current?.guest_token && current.guest_token !== existing.guest_token) {
      const { error } = await db
        .from("sms_users")
        .update({ guest_token: null, updated_at: verifiedAt })
        .eq("id", current.id);
      if (error) throw new Error(error.message);
    }

    const existingBalance = Number(existing.balance ?? 0);
    const { error: updateExistingError } = await db
      .from("sms_users")
      .update({
        guest_token: tokenToKeep,
        balance: existingBalance + currentBalance,
        is_guest: false,
        phone_verified_at: existing.phone_verified_at ?? verifiedAt,
        updated_at: verifiedAt,
      })
      .eq("id", existing.id);
    if (updateExistingError) throw new Error(updateExistingError.message);

    await db.from("sms_orders").update({ user_id: existing.id }).eq("user_id", smmUserId);
    await db
      .from("sms_transactions")
      .update({ user_id: existing.id })
      .eq("user_id", smmUserId);

    return { userId: existing.id, guestToken: tokenToKeep, merged: true };
  }

  const { error: updateCurrentError } = await db
    .from("sms_users")
    .update({
      phone,
      phone_verified_at: verifiedAt,
      is_guest: false,
      updated_at: verifiedAt,
    })
    .eq("id", smmUserId);
  if (updateCurrentError) throw new Error(updateCurrentError.message);

  return { userId: smmUserId, guestToken: current?.guest_token ?? null, merged: false };
}