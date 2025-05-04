import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Add or update this function
export function formatPrice({
    price,
    currency = "EUR", // Default currency
    notation = "standard", // Or 'compact'
}: {
    price: number | string;
    currency?: string;
    notation?: "standard" | "compact";
}): string {
    const numericPrice = typeof price === "string" ? parseFloat(price) : price;

    // Stripe amounts are in cents/smallest unit, convert to major unit
    const amountInMajorUnit = numericPrice / 100;

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation,
        minimumFractionDigits: 2, // Ensure cents are shown
        maximumFractionDigits: 2,
    }).format(amountInMajorUnit);
}
