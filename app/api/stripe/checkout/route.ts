import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });

export async function POST(request: Request) {
  try {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await request.json();
    const priceId = plan === 'yearly'
      ? process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID!
      : process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID!;

    const { data: profile } = await sb.from('profiles').select('stripe_customer_id, email').eq('id', user.id).single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: profile?.email ?? user.email!, metadata: { supabase_id: user.id } });
      customerId = customer.id;
      await sb.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      customer:   customerId,
      mode:       'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/auth/signup`,
      metadata:    { user_id: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
