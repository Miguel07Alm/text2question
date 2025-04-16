import { NextResponse } from 'next/server';
import { auth } from '@/auth'; // Assuming your auth setup exports 'auth'
import { stripe } from '@/lib/stripe'; // We'll create this Stripe client next
import { redis } from '@/lib/redis'; // Your existing Redis client

// Ensure environment variables are loaded
const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Fallback for local dev

if (!STRIPE_PRICE_ID) {
    throw new Error('Missing STRIPE_PRICE_ID environment variable');
}

export async function POST(req: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }

        const userId = session.user.id;

        // Optional: Check if user actually needs credits before allowing purchase
        // const dailyLimitKey = `rate_limit:user:${userId}:${new Date().toISOString().split('T')[0]}`;
        // const usage = await redis.get(dailyLimitKey);
        // if (usage && Number(usage) < DAILY_LIMIT_AUTH_USER) {
        //     return new NextResponse(JSON.stringify({ error: 'You still have daily generations left.' }), { status: 400 });
        // }

        // Create Stripe Checkout Session
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${APP_URL}/?payment_success=true`, // Redirect back to home page on success
            cancel_url: `${APP_URL}/?payment_cancel=true`,   // Redirect back on cancellation
            metadata: {
                userId: userId, // Pass userId to identify user in webhook
            },
             // Store user ID for potential retrieval if metadata isn't enough
             // client_reference_id: userId
        });

        if (!checkoutSession.url) {
             console.error("Stripe Checkout Session creation failed, no URL returned.");
             return new NextResponse(JSON.stringify({ error: 'Could not create payment session.' }), { status: 500 });
        }

        // Return the session ID or URL for redirection
        // Returning URL is simpler for client-side redirect
        return NextResponse.json({ url: checkoutSession.url });
        // Or return NextResponse.json({ sessionId: checkoutSession.id }); if using stripe.redirectToCheckout

    } catch (error) {
        console.error('Stripe Checkout Error:', error);
        let errorMessage = 'Internal Server Error';
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return new NextResponse(JSON.stringify({ error: 'Failed to create checkout session', details: errorMessage }), { status: 500 });
    }
}
