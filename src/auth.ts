import NextAuth, { type Account, type Profile, type User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { UpstashRedisAdapter } from "@auth/upstash-redis-adapter";
import { redis } from "@/lib/redis";
import authConfig from "./auth.config";

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url =
      "https://oauth2.googleapis.com/token?" +
      new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string, // Type assertion
      });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token, // Keep the original token properties
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // Use the new refresh token if provided, otherwise fallback to old one
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      error: undefined, // Clear any previous error
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    // Indicate error and return original token
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: UpstashRedisAdapter(redis),
  session: { strategy: "jwt" },
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user?: User; account?: Account | null }): Promise<JWT> {
      // Initial sign in
      if (account && user) {
        return {
          accessToken: account.access_token,
          // Calculate expiry time (account.expires_at is in seconds since epoch)
          accessTokenExpires: account.expires_at ? account.expires_at * 1000 : Date.now() + 3600 * 1000, // Default to 1 hour if not present
          refreshToken: account.refresh_token,
          user, // Include user details in the token initially
          sub: user.id, // Keep sub for consistency
          error: undefined,
        };
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      // Ensure refreshToken exists before attempting refresh
      if (!token.refreshToken) {
          console.error("Missing refresh token for user:", token.sub);
          return { ...token, error: "MissingRefreshTokenError" };
      }
      
      console.log("Access token expired, refreshing...");
      return refreshAccessToken(token);
    },
    async session({ session, token }: { session: any; token: JWT }) {
      // Pass necessary info from token to session
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      // Pass the access token and any potential error to the session
      session.accessToken = token.accessToken;
      session.error = token.error;
      // You might want to expose user details stored in the token during jwt callback
      if (token.user) {
          session.user = { ...session.user, ...(token.user as any) }; // Merge user details
      }

      return session;
    },
  },
});
