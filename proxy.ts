import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Get the user
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Allow auth pages for unauthenticated users
  if (pathname.startsWith("/auth")) {
    // If authenticated, redirect away from auth pages (except success page)
    if (user && !pathname.includes("sign-up-success")) {
      return NextResponse.redirect(new URL("/dashboard/employees", request.url));
    }
    return supabaseResponse;
  }

  // Redirect root to appropriate page
  if (pathname === "/") {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard/employees", request.url));
    }
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    // Redirect /dashboard to /dashboard/employees
    if (pathname === "/dashboard") {
      return NextResponse.redirect(new URL("/dashboard/employees", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
