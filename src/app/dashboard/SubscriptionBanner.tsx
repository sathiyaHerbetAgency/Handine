import Link from "next/link";
import OpenPortalButton from "./_components/OpenPortalButton"; // <-- path MUST match the file below
import { createClient } from "../../../supabase/server";          // <-- adjust if your server helper lives elsewhere

function isActive(status?: string | null, end?: number | null, cancelAt?: boolean | null) {
  const okStatus = status === "active" || status === "trialing";
  const okTime = !!end && end * 1000 > Date.now();
  return okStatus && okTime && !cancelAt;
}

function daysLeft(end?: number | null) {
  if (!end) return 0;
  const ms = end * 1000 - Date.now();
  return Math.max(0, Math.ceil(ms / 86400000));
}
export default async function SubscriptionBanner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status,current_period_end,cancel_at_period_end,customer_id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const active = isActive(sub?.status ?? null, sub?.current_period_end ?? null, sub?.cancel_at_period_end ?? null);
  const dLeft = daysLeft(sub?.current_period_end ?? null);

  // Hide banner if fully healthy and not expiring soon
  if (active && dLeft > 7) return null;

  const text = active
    ? `Your plan renews in ${dLeft} day${dLeft === 1 ? "" : "s"}.`
    : "Your subscription is expired. Renew to re-activate your menu.";

  return (
    <div
      className={`w-full rounded-lg border p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
        active
          ? "bg-amber-50 border-amber-200 text-amber-900"
          : "bg-red-50 border-red-200 text-red-900"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="text-sm sm:text-base">{text}</div>
      <div className="flex items-center gap-2">
        <Link
          href="/pricing"
          className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            active ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {active ? "Change plan" : "Renew now"}
        </Link>

        {sub?.customer_id ? (
          <OpenPortalButton
            customerId={sub.customer_id}
            returnUrl="/dashboard"
            className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium border bg-white hover:bg-gray-50"
          >
            Manage billing
          </OpenPortalButton>
        ) : null}
      </div>
    </div>
  );
}
