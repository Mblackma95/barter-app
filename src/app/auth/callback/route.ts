import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/auth/reset-password", request.url));
  }
  return NextResponse.redirect(new URL("/auth?error=Reset%20link%20invalid%20or%20expired.%20Request%20a%20new%20link%20in%20this%20browser.", request.url));
}
