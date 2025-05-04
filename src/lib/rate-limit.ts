import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { auth } from "@/auth"; // Assuming auth setup provides user ID

// --- Constants ---
export const DAILY_LIMIT_AUTH_USER = 15;
export const DAILY_LIMIT_ANONYMOUS = 5;
export const CREDITS_PER_PURCHASE = 5; // If you want this constant here too

// --- Rate Limiters ---
// IP limiter for anonymous users (used for checking remaining and enforcing in chat)
export const ipRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(DAILY_LIMIT_ANONYMOUS, "1 d"),
    analytics: true,
    prefix: "@upstash/ratelimit_ip", // Consistent prefix
});

// --- Helper Types ---
interface RateLimitResult {
    /** Indicates if the request is allowed (true) or rate-limited (false). */
    success: boolean;
    /** The maximum number of requests allowed in the current window. */
    limit: number;
    /** The number of requests remaining in the current window. */
    remaining: number;
    /** The Unix timestamp (in milliseconds) when the limit resets. */
    reset: number;
    /** The number of purchased credits the user has (only for authenticated users). */
    purchasedCredits: number;
    /** The number of daily generations used so far (only for authenticated users). */
    dailyUsed: number;
}

// --- Core Rate Limit Check Function ---
/**
 * Checks the rate limit for the current request, considering authentication status.
 * IMPORTANT: This function CHECKS the limit but DOES NOT consume a request/credit yet.
 * Consumption logic should happen *after* this check succeeds in the API route.
 */
export async function checkRateLimit(req: Request): Promise<RateLimitResult> {
    const session = await auth();
    const userId = session?.user?.id;
    const now = new Date();
    let purchasedCreditsCount = 0;
    let dailyUsedCount = 0;

    if (userId) {
        // --- Authenticated User ---
        const limit = DAILY_LIMIT_AUTH_USER;
        const userGenerationsKey = `user:generations:${userId}`;
        const creditsKey = `purchased_credits:user:${userId}`;

        // Get daily usage data
        const [userData, purchasedCreditsData] = await Promise.all([
            redis.hgetall<{ count: string; lastReset: string }>(
                userGenerationsKey
            ),
            redis.get(creditsKey),
        ]);

        let currentDailyCount = parseInt(userData?.count || "0");
        let lastResetDate = userData?.lastReset
            ? new Date(userData.lastReset)
            : new Date(0);

        // Check if daily count needs reset
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (lastResetDate < oneDayAgo) {
            currentDailyCount = 0; // Reset conceptually for calculation
            lastResetDate = now; // Assume reset happens now for calculation
            // Actual reset write happens on first successful request after reset period in chat route
        }
        dailyUsedCount = currentDailyCount;

        // Get purchased credits
        const rawCredits = purchasedCreditsData
            ? parseInt(purchasedCreditsData as string)
            : 0;
        purchasedCreditsCount = isNaN(rawCredits) ? 0 : rawCredits;

        const remainingDaily = Math.max(0, limit - currentDailyCount);
        const hasGenerationsLeft =
            remainingDaily > 0 || purchasedCreditsCount > 0;
        const totalRemaining = remainingDaily + purchasedCreditsCount;
        const resetTime = lastResetDate.getTime() + 24 * 60 * 60 * 1000; // 24h after last conceptual reset

        return {
            success: hasGenerationsLeft,
            limit: limit, // Daily limit
            remaining: totalRemaining, // Combined remaining
            reset: resetTime,
            purchasedCredits: purchasedCreditsCount,
            dailyUsed: dailyUsedCount,
        };
    } else {
        // --- Unauthenticated User ---
        const ip =
            req.headers.get("x-forwarded-for") ??
            req.headers.get("remote-addr") ??
            "127.0.0.1";
        // Check remaining daily limit based on IP using the specific limiter instance
        const { success, limit, remaining, reset } = await ipRateLimiter.limit(
            ip
        );

        return {
            success: success, // Based on IP limit check
            limit: limit,
            remaining: remaining,
            reset: reset,
            purchasedCredits: 0, // Anonymous users don't have purchased credits
            dailyUsed: DAILY_LIMIT_ANONYMOUS - remaining, // Calculate used based on remaining
        };
    }
}

/**
 * Consumes one generation credit/limit for the user.
 * Should only be called after checkRateLimit returns success: true.
 */
export async function consumeGeneration(
    userId: string | undefined
): Promise<void> {
    if (userId) {
        // --- Authenticated User ---
        const userGenerationsKey = `user:generations:${userId}`;
        const creditsKey = `purchased_credits:user:${userId}`;
        const now = new Date();

        // Get current state again (slight race condition possible, but acceptable for this use case)
        const userData = await redis.hgetall<{
            count: string;
            lastReset: string;
        }>(userGenerationsKey);
        let currentDailyCount = parseInt(userData?.count || "0");
        let lastResetDate = userData?.lastReset
            ? new Date(userData.lastReset)
            : new Date(0);

        // Check for reset before incrementing
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (lastResetDate < oneDayAgo) {
            // Perform the actual reset write and set count to 1 for the current request
            await redis.hset(userGenerationsKey, {
                count: "1",
                lastReset: now.toISOString(),
            });
            console.log(
                `Reset and consumed first generation for user ${userId}`
            );
        } else if (currentDailyCount < DAILY_LIMIT_AUTH_USER) {
            // Increment daily count
            const newCount = await redis.hincrby(
                userGenerationsKey,
                "count",
                1
            );
            // Ensure lastReset is set if this is the first generation ever for the user
            if (newCount === 1 && !userData?.lastReset) {
                await redis.hset(userGenerationsKey, {
                    lastReset: now.toISOString(),
                });
            }
            console.log(
                `Consumed daily generation ${newCount}/${DAILY_LIMIT_AUTH_USER} for user ${userId}`
            );
        } else {
            // Daily limit reached, consume a purchased credit
            const remainingCredits = await redis.decr(creditsKey);
            console.log(
                `Consumed purchased credit for user ${userId}. Remaining purchased: ${remainingCredits}`
            );
            // Consider adding a check here if remainingCredits < 0, although checkRateLimit should prevent this.
        }
    }
    // No action needed for anonymous users here, ipRateLimiter.limit() handles consumption implicitly.
}
