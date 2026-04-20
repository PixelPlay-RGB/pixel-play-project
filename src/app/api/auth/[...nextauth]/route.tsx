import { createClient } from "@/lib/supabase/server";
import NextAuth, { NextAuthOptions } from "next-auth";

import Google from "next-auth/providers/google";
import Kakao from "next-auth/providers/kakao";
import Credentials from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        return { id: "1", name: "전지호" };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET as string,
    }),
    Kakao({
      clientId: process.env.AUTH_KAKAO_CLIENT_ID as string,
      clientSecret: process.env.AUTH_KAKAO_CLIENT_SECRET as string,
    }),
  ],
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user }) {
      const supabase = await createClient();

      const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("oauth_id", user.id)
        .single();

      if (!existingUser) {
        await supabase.from("users").insert({
          oauth_id: user.id,
          name: user.name,
          email: user.email,
          data: { points: 10000 },
        });
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
