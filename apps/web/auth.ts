import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise, { getDb } from "./lib/mongodb";
import type { UserRole, UserStatus } from "@half-life/shared";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: UserRole;
      status: UserStatus;
    };
  }
  interface User {
    role?: UserRole;
    status?: UserStatus;
    lastSignInAt?: Date;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "halflife-default-super-secret-key-at-least-32-chars-long",
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: process.env.DB_NAME || "halflife",
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: false,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 60 * 60 * 12, // 12 hours sliding expiry
    updateAge: 60 * 60, // update token every 1 hour
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Hard security check: Google provider only with verified email
      if (account?.provider !== "google") return false;
      const isVerified = (profile as { email_verified?: boolean })?.email_verified === true;
      if (!isVerified) {
        console.warn(`[AUTH] Rejected sign-in for unverified email: ${profile?.email}`);
        return false;
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id || (user as any)._id?.toString() || "";
        session.user.role = (user.role as UserRole) || "member";
        session.user.status = (user.status as UserStatus) || "active";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const db = await getDb();
      const adminList = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      const email = user.email?.toLowerCase() || "";
      const role: UserRole = adminList.includes(email) ? "admin" : "member";
      const status: UserStatus = "active";

      await db.collection("users").updateOne(
        { email: user.email },
        {
          $set: {
            role,
            status,
            createdAt: new Date(),
            lastSignInAt: new Date(),
          },
        }
      );

      // Audit log event
      await db.collection("audit_log").insertOne({
        ts: new Date(),
        actorType: "system",
        actorId: user.id,
        action: "user.created",
        target: user.id,
        detail: { email: user.email, role, status },
      });
    },
    async signIn({ user }) {
      const db = await getDb();
      await db.collection("users").updateOne(
        { email: user.email },
        {
          $set: {
            lastSignInAt: new Date(),
          },
        }
      );
    },
  },
});

