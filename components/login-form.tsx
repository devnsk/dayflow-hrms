"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Eye, EyeOff, LayoutDashboard, Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Clear form on mount to prevent autofill from showing previous session
  useEffect(() => {
    setLoginId("");
    setPassword("");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      // Determine if loginId is an email or employee ID
      let email = loginId;

      // If it's not an email format, try to look up the employee ID
      if (!loginId.includes("@")) {
        // Look up the email by employee_id
        const { data: profile, error: lookupError } = await supabase
          .from("profiles")
          .select("email")
          .eq("employee_id", loginId.toUpperCase())
          .single();

        if (lookupError || !profile) {
          setError("Invalid Login ID. Please check and try again.");
          setIsLoading(false);
          return;
        }
        email = profile.email;
      }

      // Sign in with email and password
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes("Email not confirmed")) {
          setError("Please verify your email before signing in. Check your inbox for the verification link.");
        } else if (signInError.message.includes("Invalid login credentials")) {
          setError("Invalid email/Login ID or password. Please try again.");
        } else {
          setError(signInError.message);
        }
        setIsLoading(false);
        return;
      }

      if (!data.user) {
        setError("Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Fetch user profile to get role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_first_login")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        // Profile doesn't exist yet - this shouldn't happen normally
        console.error("Profile not found:", profileError);
        setError("Account setup incomplete. Please contact support.");
        setIsLoading(false);
        return;
      }

      // Check if first login - redirect to password change if needed
      if (profile.is_first_login) {
        router.push("/auth/update-password?first_login=true");
        return;
      }

      // Redirect based on role - all roles go to employees page as main landing
      router.push("/dashboard/employees");

    } catch (error: unknown) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "An error occurred during login");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center w-full max-w-md mx-auto", className)} {...props}>
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-3">
          <LayoutDashboard className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">Dayflow HRMS</h1>
      </div>

      {/* Login Form */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Login ID / Email */}
          <div className="space-y-2">
            <Label htmlFor="loginId" className="text-slate-700">
              Login Id/Email :-
            </Label>
            <Input
              id="loginId"
              type="text"
              placeholder="Enter your Login ID or Email"
              required
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="h-11 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading}
              autoComplete="off"
              autoCapitalize="none"
              autoFocus
            />
            <p className="text-xs text-slate-500">
              Use your Login ID (e.g., DAJO20260001) or email address
            </p>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">
              Password :-
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sign In Button */}
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-md"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "SIGN IN"
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-sm text-slate-600">
          Don&apos;t have an Account?{" "}
          <Link
            href="/auth/sign-up"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
