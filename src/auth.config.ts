import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent", // Important: Ask for consent to ensure refresh token is sent
          access_type: "offline", // Important: Request offline access for refresh token
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email", // Keep existing scopes
        },
      },
    }),
  ],
} satisfies NextAuthConfig;
