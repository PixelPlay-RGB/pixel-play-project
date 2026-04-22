import NextAuth from "next-auth";

import { createClient } from "@/lib/supabase/server";
import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "text" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const supabase = await createClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) return null;

        return {
          id: data.user.id,
          email: data.user.email ?? null,
          name: data.user.user_metadata?.name ?? null,
        };
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
    async signIn({ user, account }) {
      if (account?.provider === "credentials") return true;

      const supabase = await createClient();

      // oauth_id로 기존 유저 체크
      const { data: existingByOAuth } = await supabase
        .from("user")
        .select("id")
        .eq("oauth_id", user.id)
        .single();

      if (existingByOAuth) return true;

      // 동일 이메일로 계정 연동 체크
      const { data: existingByEmail } = await supabase
        .from("user")
        .select("id")
        .eq("email", user.email!)
        .single();

      if (existingByEmail) {
        await supabase.from("user").update({ oauth_id: user.id }).eq("id", existingByEmail.id);
        (user as { justLinked?: string }).justLinked = account!.provider;
        return true;
      }

      // 신규 OAuth 유저: birth/phone/gender가 NOT NULL이므로 여기서 insert하지 않음
      // → jwt 콜백이 row 없음을 감지 → profileComplete=false → proxy가 complete-profile로 redirect
      // → completeOAuthProfileAction의 upsert에서 모든 필드 포함하여 row 생성
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // 클라이언트 update({...}) 호출 처리
      if (trigger === "update" && session) {
        if (typeof session.profileComplete === "boolean") {
          token.profileComplete = session.profileComplete;
        }
        if ("justLinked" in session) {
          token.justLinked = session.justLinked ?? null;
        }
        return token;
      }

      // 최초 로그인 시 1회 DB 조회로 프로필 완성 여부 계산
      if (user) {
        token.id = user.id;
        token.justLinked = (user as { justLinked?: "google" | "github" | null }).justLinked ?? null;

        const supabase = await createClient();
        const { data } = await supabase
          .from("user")
          .select("birth, phone, gender, display_name")
          .eq("oauth_id", user.id)
          .single();

        token.profileComplete = Boolean(
          data?.birth && data?.phone && data?.gender && data?.display_name,
        );
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.profileComplete = Boolean(token.profileComplete);
        session.justLinked = (token.justLinked as "google" | "github" | null) ?? null;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
