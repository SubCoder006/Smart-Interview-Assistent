// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, email, password } = body;

    // ── Validate ─────────────────────────────────────────────────────────────
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 },
      );
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    await connectDB();

    // ── Check duplicate ───────────────────────────────────────────────────────
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 },
      );
    }

    // ── Create user (hash password manually) ───────────────────────
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name:         name.trim(),
      email:        email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      provider:     "local",
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user._id },
      { status: 201 },
    );
  } catch (error) {
    console.error("[/api/auth/signup]", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
