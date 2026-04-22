import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
    profileComplete: boolean;
    justLinked: "google" | "github" | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    profileComplete?: boolean;
    justLinked?: "google" | "github" | null;
  }
}
