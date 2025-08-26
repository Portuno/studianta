// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@18.4.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
const appUrl = Deno.env.get("APP_URL") || "https://studianta.vercel.app";
const successUrl = Deno.env.get("STRIPE_SUCCESS_URL") || `${appUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
const cancelUrl = Deno.env.get("STRIPE_CANCEL_URL") || `${appUrl}/billing?status=canceled`;

// Validar variables de entorno críticas
if (!stripeSecret) {
  console.error("❌ Missing STRIPE_SECRET_KEY");
  throw new Error("Missing STRIPE_SECRET_KEY");
}

console.log("✅ Stripe checkout initialized with:", {
  appUrl,
  successUrl,
  cancelUrl
});

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

serve(async (req: Request) => {
  try {
    console.log(`📥 Checkout request received: ${req.method} ${req.url}`);
    
    // Manejar CORS preflight
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    
    if (req.method !== 'POST') {
      console.log("❌ Method not allowed:", req.method);
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    const body = await req.text();
    let requestData: any;
    
    try {
      requestData = JSON.parse(body);
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return new Response('Invalid JSON', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    const { priceId, userId, plan } = requestData;

    if (!priceId || !userId || !plan) {
      console.error("❌ Missing required fields:", { priceId, userId, plan });
      return new Response('Missing required fields', { 
        status: 400,
        headers: corsHeaders 
      });
    }

    console.log("📋 Creating checkout session for:", { priceId, userId, plan });

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'klarna', 'link', 'amazon_pay'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        metadata: {
          userId: userId,
          plan: plan
        },
        subscription_data: {
          metadata: {
            userId: userId,
            plan: plan
          }
        },
        customer_creation: 'always',
        payment_method_collection: 'always',
        billing_address_collection: 'auto',
        tax_id_collection: {
          enabled: true,
        },
        automatic_tax: {
          enabled: true,
        },
        invoice_creation: {
          enabled: true,
        },
        payment_intent_data: {
          metadata: {
            userId: userId,
            plan: plan
          }
        }
      });

      console.log("✅ Checkout session created successfully:", session.id);
      
      return new Response(
        JSON.stringify({ 
          sessionId: session.id,
          url: session.url 
        }), 
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
      
    } catch (stripeError: any) {
      console.error("❌ Stripe error:", stripeError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create checkout session',
          message: stripeError.message 
        }), 
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          }
        }
      );
    }
    
  } catch (err: any) {
    console.error('❌ Checkout error:', err);
    
    return new Response(
      JSON.stringify({ 
        error: 'Checkout processing failed',
        message: err.message || 'Unknown error'
      }), 
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}); 