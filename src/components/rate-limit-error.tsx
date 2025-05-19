import React from 'react';
import { Session } from 'next-auth';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

interface RateLimitErrorProps {
    error: Error;
    session: Session | null;
    handlePurchaseCredits: () => void;
    isCheckoutLoading: boolean;
    priceString?: string | null;
    dictionary: any;
}

export function RateLimitError({
    error,
    session,
    handlePurchaseCredits,
    isCheckoutLoading,
    priceString,
    dictionary
}: RateLimitErrorProps) {
    try {
        const parsedError = JSON.parse(error.message);

        if (
            parsedError &&
            parsedError.error === "Rate limit exceeded. Please try again later."
        ) {
            const resetTime = new Date(parsedError.reset);

            if (session?.user) {
                const buttonText = priceString
                    ? `Buy 5 Extra Generations (${priceString})`
                    : "Buy 5 Extra Generations"; 

                // Logged-in user: show purchase button
                return (
                    <>
                        <p>
                            You&apos;ve reached the daily generation limit (
                            {parsedError.limit}) for registered users.
                        </p>
                        <p>
                            Please try again after{" "}
                            {resetTime.toLocaleTimeString()}.
                        </p>
                        <div className="pt-3">
                            <Button
                                size="sm"
                                variant="default"
                                onClick={handlePurchaseCredits}
                                disabled={isCheckoutLoading || !priceString}
                            >
                                {isCheckoutLoading
                                    ? "Processing..."
                                    : buttonText}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">
                                Purchase credits to continue generating today.
                            </p>
                        </div>
                    </>
                );
            } else {
                // Anonymous user: show login button
                return (
                    <>
                        <p>
                            You&apos;ve reached the daily generation limit (
                            {parsedError.limit}) for anonymous users.
                        </p>
                        <p>
                            Please try again after{" "}
                            {resetTime.toLocaleTimeString()}.
                        </p>
                        <div className="pt-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => signIn("google")}
                            >
                                <LogIn className="mr-2 h-4 w-4" /> Sign in with
                                Google
                            </Button>
                            <p className="text-xs text-muted-foreground mt-1">
                                Sign in to increase your daily limit to 15
                                generations (3x more!).
                            </p>
                        </div>
                    </>
                );
            }
        }
    } catch (e) {
        // If parsing fails or it's not the specific rate limit error, show the raw message
        return <>{error.message}</>;
    }

    // Fallback to show the raw error message if it didn't match the rate limit structure
    return <>{error.message}</>;
}
