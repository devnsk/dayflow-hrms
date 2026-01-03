import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
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
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value),
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options),
                    );
                },
            },
        }
    );

    // refreshing the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users to login
    if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
        return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Redirect authenticated users from /dashboard to /dashboard/employees
    // (Employees page is the main landing page after login)
    if (request.nextUrl.pathname === "/dashboard" && user) {
        return NextResponse.redirect(new URL("/dashboard/employees", request.url));
    }

    return response;
}
