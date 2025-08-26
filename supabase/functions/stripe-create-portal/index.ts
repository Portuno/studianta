// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@14.26.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
const returnUrl = Deno.env.get("STRIPE_PORTAL_RETURN_URL") || Deno.env.get("APP_URL") || "http://localhost:5173";
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

if (!stripeSecretKey) throw new Error("Missing STRIPE_SECRET_KEY");
const stripe = new Stripe(stripeSecretKey, { apiVersion: "2024-06-20" });

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

    const authHeader = req.headers.get("Authorization") || "";
    const jwt = authHeader.replace("Bearer ", "");
    if (!jwt) return new Response(JSON.stringify({ error: "Missing auth" }), { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: userRow, error } = await supabase.from('users').select('stripe_customer_id').eq('id', user.id).single();
    if (error || !userRow?.stripe_customer_id) return new Response(JSON.stringify({ error: "No customer" }), { status: 400 });

    const portal = await stripe.billingPortal.sessions.create({
      customer: userRow.stripe_customer_id,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: portal.url }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error('stripe-create-portal error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}); 