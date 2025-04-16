import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { redis } from '@/lib/redis'; // Your existing Redis client

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const CREDITS_PER_PURCHASE = 5; // Number of credits to grant per purchase

if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable');
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = headers().get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error(`Webhook signature verification failed: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Check if metadata and userId exist
        if (!session?.metadata?.userId) {
            console.error('Webhook Error: Missing userId in checkout session metadata.');
            return new NextResponse('Webhook Error: Missing user ID', { status: 400 });
        }

        const userId = session.metadata.userId;

        try {
            // --- Logic to add credits to the user in Redis ---
            // Option 1: Store purchased credits separately
            const creditsKey = `purchased_credits:user:${userId}`;
            const creditsAdded = await redis.incrby(creditsKey, CREDITS_PER_PURCHASE);
            console.log(`Added ${CREDITS_PER_PURCHASE} credits to user ${userId}. Total purchased: ${creditsAdded}`);

            // Option 2: Update a user object (if you store user data as a hash)
            // Example: await redis.hincrby(`user:${userId}`, 'purchasedCredits', CREDITS_PER_PURCHASE);

            // ---------------------------------------------------

        } catch (dbError) {
            console.error('Webhook Error: Failed to update user credits in Redis:', dbError);
            // Important: Still return 200 to Stripe to acknowledge receipt,
            // but log the error for investigation.
            // You might implement retry logic or manual intervention here.
            return new NextResponse('Webhook received, but DB update failed.', { status: 500 });
        }
    }
     else if (event.type === 'payment_intent.succeeded') {
        // Handle successful payment intent if needed for other flows
        // const paymentIntent = event.data.object;
        // console.log('PaymentIntent was successful!');
    }
    // ... handle other event types if necessary
    else {
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return new NextResponse(null, { status: 200 });
}
