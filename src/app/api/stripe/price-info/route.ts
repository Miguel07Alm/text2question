import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { formatPrice } from "@/lib/utils"; // Assuming you have or will create this helper

const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID;

if (!STRIPE_PRICE_ID) {
    console.error("Missing STRIPE_PRICE_ID environment variable");
    // Return an error response if the ID is missing during build/runtime
    // Note: This specific route might not be hit during build, but good practice.
}

export async function GET() {
    if (!STRIPE_PRICE_ID) {
        return NextResponse.json(
            { error: "Stripe price ID is not configured." },
            { status: 500 }
        );
    }

    try {
        const price = await stripe.prices.retrieve(STRIPE_PRICE_ID);

        if (!price || !price.unit_amount) {
            return NextResponse.json(
                { error: "Could not retrieve price details." },
                { status: 404 }
            );
        }

        const formattedPrice = formatPrice({
            price: price.unit_amount,
            currency: price.currency,
        });

        // You might want to include currency symbol or code depending on formatPrice
        return NextResponse.json({
            priceId: price.id,
            formattedPrice: formattedPrice, // e.g., "$2.00" or "€2.00"
            currency: price.currency, // e.g., "usd" or "eur"
            amount: price.unit_amount, // e.g., 200
        });
    } catch (error: any) {
        console.error("Error fetching Stripe price:", error);
        return NextResponse.json(
            { error: `Failed to fetch price: ${error.message}` },
            { status: 500 }
        );
    }
}
