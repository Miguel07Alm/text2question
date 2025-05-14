import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";
import { auth } from "@/auth";

export const DAILY_LIMIT_AUTH_USER = 3;
export const DAILY_LIMIT_ANONYMOUS = 1;
export const CREDITS_PER_PURCHASE = 5;

export const ipRateLimiter = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(DAILY_LIMIT_ANONYMOUS, "1 d"),
    analytics: true,
    prefix: "@upstash/ratelimit_ip",
});

interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
    purchasedCredits: number;
    dailyUsed: number;
}

export async function checkRateLimit(req: Request): Promise<RateLimitResult> {
    const session = await auth();
    const userId = session?.user?.id;
    const now = new Date();
    let purchasedCreditsCount = 0;
    let dailyUsedCount = 0;

    if (userId) {
        const limit = DAILY_LIMIT_AUTH_USER;
        const userGenerationsKey = `user:generations:${userId}`;
        const creditsKey = `purchased_credits:user:${userId}`;

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

        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (lastResetDate < oneDayAgo) {
            currentDailyCount = 0;
            lastResetDate = now;
        }
        dailyUsedCount = currentDailyCount;

        const rawCredits = purchasedCreditsData
            ? parseInt(purchasedCreditsData as string)
            : 0;
        purchasedCreditsCount = isNaN(rawCredits) ? 0 : rawCredits;

        const remainingDaily = Math.max(0, limit - currentDailyCount);
        const hasGenerationsLeft =
            remainingDaily > 0 || purchasedCreditsCount > 0;
        const totalRemaining = remainingDaily + purchasedCreditsCount;
        const resetTime = lastResetDate.getTime() + 24 * 60 * 60 * 1000;

        return {
            success: hasGenerationsLeft,
            limit: limit,
            remaining: totalRemaining,
            reset: resetTime,
            purchasedCredits: purchasedCreditsCount,
            dailyUsed: dailyUsedCount,
        };
    } else {
        const ip =
            req.headers.get("x-forwarded-for") ??
            req.headers.get("remote-addr") ??
            "127.0.0.1";
        const { success, limit, remaining, reset } = await ipRateLimiter.limit(
            ip
        );

        return {
            success: success,
            limit: limit,
            remaining: remaining,
            reset: reset,
            purchasedCredits: 0,
            dailyUsed: DAILY_LIMIT_ANONYMOUS - remaining,
        };
    }
}

export async function consumeGeneration(
    userId: string | undefined
): Promise<void> {
    if (userId) {
        const userGenerationsKey = `user:generations:${userId}`;
        const creditsKey = `purchased_credits:user:${userId}`;
        const now = new Date();

        const userData = await redis.hgetall<{
            count: string;
            lastReset: string;
        }>(userGenerationsKey);
        let currentDailyCount = parseInt(userData?.count || "0");
        let lastResetDate = userData?.lastReset
            ? new Date(userData.lastReset)
            : new Date(0);

        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (lastResetDate < oneDayAgo) {
            await redis.hset(userGenerationsKey, {
                count: "1",
                lastReset: now.toISOString(),
            });
            console.log(
                `Reset and consumed first generation for user ${userId}`
            );
        } else if (currentDailyCount < DAILY_LIMIT_AUTH_USER) {
            const newCount = await redis.hincrby(
                userGenerationsKey,
                "count",
                1
            );
            if (newCount === 1 && !userData?.lastReset) {
                await redis.hset(userGenerationsKey, {
                    lastReset: now.toISOString(),
                });
            }
            console.log(
                `Consumed daily generation ${newCount}/${DAILY_LIMIT_AUTH_USER} for user ${userId}`
            );
        } else {
            const remainingCredits = await redis.decr(creditsKey);
            console.log(
                `Consumed purchased credit for user ${userId}. Remaining purchased: ${remainingCredits}`
            );
        }
    }
}
