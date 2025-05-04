import { NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { redis } from "@/lib/redis";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const CREDITS_PER_PURCHASE = 5;

if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable");
}

export async function POST(req: Request) {
    const body = await req.text();
    const awaitedHeaders = await headers();
    const signature =awaitedHeaders.get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error(
            `Webhook signature verification failed: ${error.message}`
        );
        return new NextResponse(`Webhook Error: ${error.message}`, {
            status: 400,
        });
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (!session?.metadata?.userId) {
            return new NextResponse("Webhook Error: Missing user ID", {
                status: 400,
            });
        }
        const userId = session.metadata.userId;
        const creditsKey = `purchased_credits:user:${userId}`;
        await redis.incrby(creditsKey, CREDITS_PER_PURCHASE);
    }

    return new NextResponse(null, { status: 200 });
}
