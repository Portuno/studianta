// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import Stripe from "npm:stripe@18.4.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Validar variables de entorno críticas
if (!stripeSecret) {
  console.error("❌ Missing STRIPE_SECRET_KEY");
  throw new Error("Missing STRIPE_SECRET_KEY");
}

if (!webhookSecret) {
  console.error("❌ Missing STRIPE_WEBHOOK_SECRET");
  throw new Error("Missing STRIPE_WEBHOOK_SECRET");
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  throw new Error("Missing Supabase environment variables");
}

console.log("✅ Stripe webhook initialized with all required environment variables");

const stripe = new Stripe(stripeSecret, { apiVersion: "2024-06-20" });

const mapPriceToTier = (priceId: string | null | undefined): 'basic' | 'pro' | null => {
  const basic = Deno.env.get("STRIPE_BASIC_PRICE_ID");
  const pro = Deno.env.get("STRIPE_PRO_PRICE_ID");
  
  if (!priceId) return null;
  if (basic && priceId === basic) return 'basic';
  if (pro && priceId === pro) return 'pro';
  
  console.log(`⚠️ Unknown price ID: ${priceId}`);
  return null;
};

serve(async (req: Request) => {
  try {
    console.log(`📥 Webhook received: ${req.method} ${req.url}`);
    
    if (req.method !== 'POST') {
      console.log("❌ Method not allowed:", req.method);
      return new Response('Method not allowed', { status: 405 });
    }

    const body = await req.text();
    const sig = req.headers.get('Stripe-Signature');
    
    if (!sig) {
      console.error("❌ Missing Stripe signature");
      return new Response('Missing signature', { status: 400 });
    }

    let event: any;
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
      console.log(`✅ Webhook signature verified for event: ${event.type}`);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return new Response('Bad signature', { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Manejar checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      console.log("🔄 Processing checkout.session.completed");
      
      const session = event.data.object as any;
      const subscriptionId = session.subscription as string | undefined;
      const customerId = session.customer as string | undefined;
      const userId = session.metadata?.userId || session.subscription_data?.metadata?.userId;
      const plan = session.metadata?.plan as 'basic' | 'pro' | undefined;

      console.log("📋 Session data:", {
        subscriptionId,
        customerId,
        userId,
        plan,
        metadata: session.metadata
      });

      if (userId && subscriptionId && customerId) {
        try {
          const { data, error } = await supabase.from('users').update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan_tier: plan || 'basic',
            plan_status: 'active',
            updated_at: new Date().toISOString()
          }).eq('id', userId);

          if (error) {
            console.error("❌ Error updating user:", error);
            throw error;
          }

          console.log(`✅ User ${userId} updated successfully with plan: ${plan || 'basic'}`);
        } catch (updateError) {
          console.error("❌ Failed to update user:", updateError);
          throw updateError;
        }
      } else {
        console.warn("⚠️ Missing required data for user update:", { userId, subscriptionId, customerId });
      }
    }

    // Manejar eventos de suscripción
    if (event.type.startsWith('customer.subscription.')) {
      console.log(`🔄 Processing subscription event: ${event.type}`);
      
      const sub = event.data.object as any;
      const customerId = sub.customer as string;
      const status = sub.status as string;
      const currentPeriodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
      const cancelAtPeriodEnd = !!sub.cancel_at_period_end;

      console.log("📋 Subscription data:", {
        customerId,
        status,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        subscriptionId: sub.id
      });

      try {
        // Buscar usuario por customerId
        const { data: userRow, error: userError } = await supabase
          .from('users')
          .select('id, plan_tier')
          .eq('stripe_customer_id', customerId)
          .single();

        if (userError) {
          console.error("❌ Error finding user by customer ID:", userError);
          throw userError;
        }

        if (userRow?.id) {
          // Mapear plan tier desde el precio
          let tier: 'basic' | 'pro' | null = null;
          try {
            const priceId = sub.items?.data?.[0]?.price?.id as string | undefined;
            tier = mapPriceToTier(priceId);
          } catch (priceError) {
            console.warn("⚠️ Error mapping price to tier:", priceError);
          }

          const updateData: any = {
            plan_status: status,
            current_period_end: currentPeriodEnd,
            cancel_at_period_end: cancelAtPeriodEnd,
            stripe_subscription_id: sub.id,
            updated_at: new Date().toISOString()
          };

          if (tier) {
            updateData.plan_tier = tier;
          }

          const { error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', userRow.id);

          if (updateError) {
            console.error("❌ Error updating subscription:", updateError);
            throw updateError;
          }

          console.log(`✅ Subscription updated for user ${userRow.id}:`, {
            status,
            tier: tier || 'unchanged',
            cancelAtPeriodEnd
          });
        } else {
          console.warn("⚠️ No user found for customer ID:", customerId);
        }
      } catch (subscriptionError) {
        console.error("❌ Failed to process subscription event:", subscriptionError);
        throw subscriptionError;
      }
    }

    console.log("✅ Webhook processed successfully");
    return new Response('ok', { status: 200 });
    
  } catch (err: any) {
    console.error('❌ Stripe webhook error:', err);
    
    // Log detallado del error
    if (err.message) {
      console.error('Error message:', err.message);
    }
    if (err.stack) {
      console.error('Error stack:', err.stack);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed',
        message: err.message || 'Unknown error',
        timestamp: new Date().toISOString()
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}); 