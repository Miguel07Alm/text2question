import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit"; 


export async function GET(req: Request) {
    try {
        const { remaining } = await checkRateLimit(req);

        return NextResponse.json({ remainingGenerations: remaining });
    } catch (error) {
        console.error("Error fetching remaining generations:", error);
        return NextResponse.json(
            {
                remainingGenerations: 0,
                error: "Failed to fetch remaining generations",
            },
            { status: 500 }
        );
    }
}
