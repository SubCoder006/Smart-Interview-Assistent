// lib/authOptions.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider  from "next-auth/providers/credentials";
import GoogleProvider        from "next-auth/providers/google";
import connectDB             from "@/lib/mongodb";
import User                  from "@/models/User";

// ─── Extend NextAuth types to include id + plan ───────────────────────────────

declare module "next-auth" {
  interface Session {
    user: {
      id:    string;
      name:  string;
      email: string;
      image?: string;
      plan:  "free" | "pro";
    };
  }
  interface User {
    id:   string;
    plan: "free" | "pro";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:   string;
    plan: "free" | "pro";
  }
}

// ─── Auth options ─────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {

  // ── Providers ───────────────────────────────────────────────────────────────

  providers: [

    // Email + password login
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        const user = await User.findOne({
          email: credentials.email.toLowerCase().trim(),
        }).select("+passwordHash"); // passwordHash is excluded by default — select it explicitly

        if (!user) {
          throw new Error("No account found with this email");
        }

        if (user.provider !== "local") {
          throw new Error(`This account uses ${user.provider} login. Please sign in with ${user.provider}.`);
        }

        const isValid = await user.comparePassword(credentials.password);
        if (!isValid) {
          throw new Error("Incorrect password");
        }

        // update login metadata
        await User.findByIdAndUpdate(user._id, {
          $set: { lastLoginAt: new Date() },
          $inc: { loginCount: 1 },
        });

        return {
          id:    user._id.toString(),
          name:  user.name,
          email: user.email,
          image: user.avatarUrl ?? null,
          plan:  user.plan,
        };
      },
    }),

    // Google OAuth (optional — remove if not needed)
    GoogleProvider({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

  ],

  // ── Callbacks ────────────────────────────────────────────────────────────────

  callbacks: {

    // runs after successful sign in
    async signIn({ user, account }) {
  if (account?.provider === "google") {
    await connectDB();

    const existing = await User.findOne({ email: user.email ?? undefined });

    if (!existing) {
      await User.create({
        name:         user.name      ?? undefined,   // ✅ no null
        email:        user.email     ?? undefined,   // ✅ no null
        avatarUrl:    user.image     ?? undefined,   // ✅ no null
        provider:     "google",
        isVerified:   true,
        passwordHash: "",
      });
    } else {
      await User.findByIdAndUpdate(existing._id, {
        $set: { avatarUrl: user.image ?? undefined, lastLoginAt: new Date() },
        $inc: { loginCount: 1 },
      });
    }
  }

  return true;
},

    // put extra fields into the JWT token
    async jwt({ token, user }) {
      if (user) {
        // first sign in — user object is available
        token.id   = user.id;
        token.plan = user.plan;
      } else if (token.id && !token.plan) {
        // token refresh — re-fetch plan from DB in case it changed
        await connectDB();
        const dbUser = await User.findById(token.id).select("plan");
        if (dbUser) token.plan = dbUser.plan;
      }

      return token;
    },

    // expose id + plan on the client-side session object
    async session({ session, token }) {
      if (token) {
        session.user.id   = token.id;
        session.user.plan = token.plan;
      }
      return session;
    },
  },

  // ── Pages ────────────────────────────────────────────────────────────────────

  pages: {
    signIn:  "/auth/signin",
    error:   "/auth/signin",   // redirect errors to signin page with ?error=...
  },

  // ── Session strategy ─────────────────────────────────────────────────────────

  session: {
    strategy: "jwt",          // no DB sessions table needed
    maxAge:   30 * 24 * 60 * 60, // 30 days
  },

  // ── JWT ──────────────────────────────────────────────────────────────────────

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // match session maxAge
  },

  // ── Security ─────────────────────────────────────────────────────────────────

  secret: process.env.NEXTAUTH_SECRET,

  debug: process.env.NODE_ENV === "development", // logs in dev, silent in prod
};