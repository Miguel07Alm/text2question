import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
    // In production, you might want to throw an error or handle this differently
    console.warn('Missing STRIPE_SECRET_KEY environment variable. Stripe functionality will be disabled.');
    // Assign a dummy object or handle appropriately if you want the app to run without Stripe locally
    // For now, we throw to ensure it's set up during development
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe with the API key and specific API version
export const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20', // Use the latest API version
    typescript: true,
});
