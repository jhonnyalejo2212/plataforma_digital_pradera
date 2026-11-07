import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OTP_TYPES = new Set<EmailOtpType>(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);

/**
 * Destino de los enlaces de Supabase Auth (invitación de administradores y recuperación de contraseña).
 * Soporta el flujo con `code` (PKCE) y el de `token_hash` según la plantilla de correo configurada.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const nextParam = url.searchParams.get("next");
  const next = nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/admin";

  const supabase = await createClient();
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") ?? "";

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) console.error("auth/confirm code:", error.message);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  } else if (tokenHash && OTP_TYPES.has(type as EmailOtpType)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
    if (error) console.error("auth/confirm token_hash:", error.message);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  // Cuando Supabase envía los tokens en `#access_token=...` (flujo implícito en invitaciones),
  // el servidor no recibe el hash: redirigimos a /admin/login conservando `next`, donde el
  // cliente lee `window.location.hash`, establece la sesión SSR y navega a `next`.
  const loginUrl = new URL("/admin/login", url.origin);
  loginUrl.searchParams.set("next", next);
  return NextResponse.redirect(loginUrl);
}
