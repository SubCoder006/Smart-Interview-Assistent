// app/api/auth/signin/route.ts
import { NextRequest, NextResponse }  from "next/server";
import connectDB                      from "@/lib/mongodb";
import User                           from "@/models/User";

// ─── POST /api/auth/signin ────────────────────────────────────────────────────
// Called by NextAuth CredentialsProvider → authorize()
// Can also be called directly to validate credentials before signIn()

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse body ─────────────────────────────────────────────────────────
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // ── 2. Validate inputs ────────────────────────────────────────────────────
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }

    // ── 3. DB connect ─────────────────────────────────────────────────────────
    await connectDB();

    // ── 4. Find user ──────────────────────────────────────────────────────────
    // passwordHash is select:false in schema — must explicitly select it
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+passwordHash");

    if (!user) {
      // generic message — don't reveal whether email exists
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── 5. OAuth account guard ────────────────────────────────────────────────
    if (user.provider !== "local") {
      return NextResponse.json(
        {
          error: `This account was created with ${user.provider}. Please sign in with ${user.provider}.`,
          provider: user.provider,
        },
        { status: 400 }
      );
    }

    // ── 6. Password check ─────────────────────────────────────────────────────
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // ── 7. Update login metadata ──────────────────────────────────────────────
    await User.findByIdAndUpdate(user._id, {
      $set: { lastLoginAt: new Date() },
      $inc: { loginCount: 1 },
    });

    // ── 8. Return safe user object (no passwordHash) ──────────────────────────
    return NextResponse.json(
      {
        user: {
          id:         user._id.toString(),
          name:       user.name,
          email:      user.email,
          plan:       user.plan,
          avatarUrl:  user.avatarUrl ?? null,
          isVerified: user.isVerified,
          stats:      user.stats,
          preferences: user.preferences,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[/api/auth/signin]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}