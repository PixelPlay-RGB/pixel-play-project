import { createClient } from "@/lib/supabase/server";
import NextAuth, { NextAuthOptions } from "next-auth";

import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        // TODO: 이메일 회원가입 기능 구현 필요
        return { id: "1", name: "전지호" };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET as string,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_CLIENT_ID as string,
      clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET as string,
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
        .from("user")
        .select("*")
        .eq("oauth_id", user.id)
        .single();

      if (!existingUser) {
        await supabase.from("user").insert({
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
