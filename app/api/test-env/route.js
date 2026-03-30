// app/api/test-env/route.js
import { NextResponse } from "next/server";

export async function GET() {
  console.log("FULL ENV:", process.env);

  return NextResponse.json({
    mongo: process.env.MONGODB_URI || "NOT FOUND",
  });
}