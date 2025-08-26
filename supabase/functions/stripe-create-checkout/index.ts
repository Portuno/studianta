// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@18.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": Deno.env.get("CORS_ALLOW_ORIGIN") ?? "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const basicPriceId = Deno.env.get("STRIPE_BASIC_PRICE_ID");
const proPriceId = Deno.env.get("STRIPE_PRO_PRICE_ID");
const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
const successUrl = Deno.env.get("STRIPE_SUCCESS_URL") || `${appUrl}/payment-success?status=success`;
const cancelUrl = Deno.env.get("STRIPE_CANCEL_URL") || `${appUrl}/billing?status=canceled`;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
if (!basicPriceId || !proPriceId) console.warn("Missing BASIC/PRO price IDs; set STRIPE_BASIC_PRICE_ID and STRIPE_PRO_PRICE_ID.");

const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const body = await req.json().catch(() => ({}));
    const { plan } = body as { plan: "basic" | "pro" };
    if (!plan || (plan !== "basic" && plan !== "pro")) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    const priceId = plan === "basic" ? basicPriceId : proPriceId;
    if (!priceId) return new Response(JSON.stringify({ error: "Plan price not configured" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });

    // Ensure customer exists or create
    const { data: userRow } = await supabase
      .from("users")
      .select("id, stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = userRow?.stripe_customer_id || undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await supabase.from("users").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      metadata: { userId: user.id, plan },
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (err: any) {
    console.error("stripe-create-checkout error", err);
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
}); 