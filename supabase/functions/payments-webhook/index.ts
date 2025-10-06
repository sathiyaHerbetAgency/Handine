import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.6.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type WebhookEvent = {
  event_type: string;
  type: string;
  stripe_event_id: string;
  created_at: string;
  modified_at: string;
  data: any;
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-customer-email",
};

function computeIsActive(input: {
  status?: string | null;
  periodEnd?: number | null;      // seconds
  cancelAtPeriodEnd?: boolean | null;
}) {
  const okStatus = input.status === "active" || input.status === "trialing";
  const okTime = !!input.periodEnd && input.periodEnd * 1000 > Date.now();
  const notCanceled = !input.cancelAtPeriodEnd;
  return Boolean(okStatus && okTime && notCanceled);
}

async function logAndStoreWebhookEvent(client: any, event: any, data: any) {
  await client.from("webhook_events").insert({
    event_type: event.type,
    type: event.type.split(".")[0],
    stripe_event_id: event.id,
    created_at: new Date(event.created * 1000).toISOString(),
    modified_at: new Date(event.created * 1000).toISOString(),
    data,
  } as WebhookEvent);
}

async function setAccountStatusForUser(client: any, userId: string, active: boolean) {
  await client.from("restaurants")
    .update({ status: active ? "active" : "inactive" })
    .eq("user_id", userId);

  // mirror on users table if you rely on it in UI; adjust/omit if not needed
  await client.from("users")
    .update({ subscription: active ? "active" : "inactive" })
    .eq("id", userId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      return new Response(JSON.stringify({ error: "Missing webhook secret" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Invalid signature:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    await logAndStoreWebhookEvent(supabase, event, event.data.object);

    // Helper to resolve user_id for a subscription
    async function getUserIdForSubscription(sub: Stripe.Subscription): Promise<string | null> {
      const metaUser = (sub.metadata?.user_id || sub.metadata?.userId) as string | undefined;
      if (metaUser) return metaUser;

      const { data } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_id", sub.id)
        .maybeSingle();
      return data?.user_id ?? null;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = (session.subscription as string) || null;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const item = sub.items.data[0];

        // upsert your subscriptions row
        await supabase.from("subscriptions").upsert({
          stripe_id: sub.id,
          user_id: (session.metadata?.user_id || session.metadata?.userId) ?? null,
          price_id: item?.price.id,
          stripe_price_id: item?.price.id,
          currency: sub.currency,
          interval: item?.plan.interval,
          status: sub.status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          amount: item?.plan.amount ?? 0,
          started_at: sub.start_date ?? Math.floor(Date.now() / 1000),
          customer_id: String(sub.customer),
          metadata: sub.metadata || {},
          canceled_at: sub.canceled_at,
          ended_at: sub.ended_at,
        }, { onConflict: "stripe_id" });

        const userId =
          (session.metadata?.user_id || session.metadata?.userId) ??
          (await getUserIdForSubscription(sub));

        if (userId) {
          const active = computeIsActive({
            status: sub.status,
            periodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          });
          await setAccountStatusForUser(supabase, userId, active);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const item = sub.items.data[0];

        await supabase.from("subscriptions").upsert({
          stripe_id: sub.id,
          user_id: (sub.metadata?.user_id || sub.metadata?.userId) ?? null,
          price_id: item?.price.id,
          stripe_price_id: item?.price.id,
          currency: sub.currency,
          interval: item?.plan.interval,
          status: sub.status,
          current_period_start: sub.current_period_start,
          current_period_end: sub.current_period_end,
          cancel_at_period_end: sub.cancel_at_period_end,
          amount: item?.plan.amount ?? 0,
          started_at: sub.start_date ?? Math.floor(Date.now() / 1000),
          customer_id: String(sub.customer),
          metadata: sub.metadata || {},
          canceled_at: sub.canceled_at,
          ended_at: sub.ended_at,
        }, { onConflict: "stripe_id" });

        const userId = await getUserIdForSubscription(sub);
        if (userId) {
          const active = computeIsActive({
            status: sub.status,
            periodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          });
          await setAccountStatusForUser(supabase, userId, active);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", ended_at: sub.ended_at, canceled_at: sub.canceled_at })
          .eq("stripe_id", sub.id);

        const { data } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_id", sub.id)
          .maybeSingle();

        if (data?.user_id) {
          await setAccountStatusForUser(supabase, data.user_id, false);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);

        const { data } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_id", sub.id)
          .maybeSingle();

        if (data?.user_id) {
          const active = computeIsActive({
            status: sub.status,
            periodEnd: sub.current_period_end,
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          });
          await setAccountStatusForUser(supabase, data.user_id, active);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.subscription) break;

        await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_id", invoice.subscription as string);
        break;
      }

      default:
        // no-op
        break;
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
