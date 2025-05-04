import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

if (!STRIPE_PRICE_ID) {
    throw new Error("Missing STRIPE_PRICE_ID environment variable");
}

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
            });
        }
        const userId = session.user.id;
        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price: STRIPE_PRICE_ID,
                    quantity: 1,
                },
            ],
            mode: "payment",
            success_url: `${APP_URL}/?payment_success=true`,
            cancel_url: `${APP_URL}/?payment_cancel=true`,
            customer_email: session.user.email ?? undefined, 
            metadata: {
                userId: userId,
            },
        });
        if (!checkoutSession.url) {
            return new NextResponse(
                JSON.stringify({ error: "Could not create payment session." }),
                { status: 500 }
            );
        }
        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error(error);
        return new NextResponse(
            JSON.stringify({ error: "Failed to create checkout session" }),
            { status: 500 }
        );
    }
}
