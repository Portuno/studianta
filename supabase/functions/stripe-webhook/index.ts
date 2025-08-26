// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@14.26.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!stripeSecret) throw new Error("Missing STRIPE_SECRET_KEY");
if (!webhookSecret) console.warn("Missing STRIPE_WEBHOOK_SECRET. Webhook verification will fail.");

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

const mapPriceToTier = (priceId: string | null | undefined): 'basic' | 'pro' | null => {
  const basic = Deno.env.get("STRIPE_BASIC_PRICE_ID");
  const pro = Deno.env.get("STRIPE_PRO_PRICE_ID");
  if (!priceId) return null;
  if (basic && priceId === basic) return 'basic';
  if (pro && priceId === pro) return 'pro';
  return null;
};

serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const body = await req.text();
    const sig = req.headers.get('Stripe-Signature');
    if (!sig) return new Response('Missing signature', { status: 400 });

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret!);
    } catch (err) {
      console.error('Webhook signature verification failed', err);
      return new Response('Bad signature', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const subscriptionId = session.subscription as string | undefined;
      const customerId = session.customer as string | undefined;
      const userId = session.metadata?.userId || session.subscription_data?.metadata?.userId;
      const plan = session.metadata?.plan as 'basic' | 'pro' | undefined;

      if (userId && subscriptionId && customerId) {
        await supabase.from('users').update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          plan_tier: plan || 'basic',
          plan_status: 'active',
        }).eq('id', userId);
      }
    }

    if (event.type.startsWith('customer.subscription.')) {
      const sub = event.data.object as any;
      const customerId = sub.customer as string;
      const status = sub.status as string; // trialing, active, past_due, canceled, unpaid, incomplete, incomplete_expired
      const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
      const cancelAtPeriodEnd = !!sub.cancel_at_period_end;

      // Try to find user by customerId
      const { data: userRow } = await supabase.from('users').select('id').eq('stripe_customer_id', customerId).single();
      if (userRow?.id) {
        // Map plan tier from price
        let tier: 'basic' | 'pro' | null = null;
        try {
          const priceId = sub.items?.data?.[0]?.price?.id as string | undefined;
          tier = mapPriceToTier(priceId);
        } catch (_) {}

        await supabase.from('users').update({
          plan_status: status,
          current_period_end: currentPeriodEnd,
          cancel_at_period_end: cancelAtPeriodEnd,
          ...(tier ? { plan_tier: tier } : {}),
          stripe_subscription_id: sub.id,
        }).eq('id', userRow.id);
      }
    }

    return new Response('ok', { status: 200 });
  } catch (err: any) {
    console.error('stripe-webhook error', err);
    return new Response('error', { status: 500 });
  }
}); 