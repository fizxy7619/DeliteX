import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("waitlist").insert([
      {
        email: email.toLowerCase().trim(),
        name: name?.trim() ?? null,
        source: "landing_page",
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      // Supabase unique constraint error code
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You're already on the waitlist!" },
          { status: 409 }
        );
      }
      console.error("[waitlist] Supabase error:", error.message);
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "You're on the list! We'll be in touch soon." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[waitlist] Unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
