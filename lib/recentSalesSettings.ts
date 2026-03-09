import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function boolFromSetting(value?: string | null) {
  return (value || "").toLowerCase() === "true";
}

export async function getSystemSettings() {
  const { data, error } = await supabase
    .from("system_settings")
    .select("key,value");

  if (error) throw error;

  const map: Record<string, string> = {};
  for (const row of data || []) {
    map[row.key] = row.value;
  }
  return map;
}

export async function setSystemSetting(key: string, value: string) {
  const { error } = await supabase
    .from("system_settings")
    .upsert({ key, value }, { onConflict: "key" });

  if (error) throw error;
}

export async function resetMonthIfNeeded(settings: Record<string, string>) {
  const nowMonth = monthKey();
  const savedMonth = settings.rentcast_current_month || "";

  if (savedMonth === nowMonth) return settings;

  const nowIso = new Date().toISOString();

  await setSystemSetting("rentcast_current_month", nowMonth);
  await setSystemSetting("rentcast_global_freeze", "false");
  await setSystemSetting("rentcast_paid_lock_until_reset", "false");
  await setSystemSetting("rentcast_45_alert_pending", "false");
  await setSystemSetting("rentcast_45_alert_month", "");
  await setSystemSetting("rentcast_last_reset_at", nowIso);

  return {
    ...settings,
    rentcast_current_month: nowMonth,
    rentcast_global_freeze: "false",
    rentcast_paid_lock_until_reset: "false",
    rentcast_45_alert_pending: "false",
    rentcast_45_alert_month: "",
    rentcast_last_reset_at: nowIso,
  };
}
