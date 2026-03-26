import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });
const secret  = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body      = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    console.error('Webhook signature failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const sb = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId  = session.metadata?.user_id;
      const plan    = session.metadata?.plan as 'monthly' | 'yearly';
      if (userId) {
        await sb.from('profiles').update({
          subscription_status:    'active',
          subscription_plan:      plan,
          stripe_subscription_id: session.subscription as string,
          subscription_start:     new Date().toISOString(),
          subscription_end:       new Date(Date.now() + (plan === 'yearly' ? 365 : 30) * 864e5).toISOString(),
        }).eq('id', userId);
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub    = event.data.object as Stripe.Subscription;
      const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'lapsed';
      await sb.from('profiles').update({ subscription_status: status })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await sb.from('profiles').update({ subscription_status: 'cancelled', stripe_subscription_id: null })
        .eq('stripe_subscription_id', sub.id);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        await sb.from('profiles').update({ subscription_status: 'past_due' })
          .eq('stripe_subscription_id', invoice.subscription as string);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
