"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { Eye, EyeOff, LayoutDashboard, Upload, X, Loader2 } from "lucide-react";
import { signUpCompany } from "@/lib/actions/auth";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo file size must be less than 2MB");
        return;
      }
      setLogo(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    // Validate required fields
    if (!companyName.trim()) {
      setError("Company name is required");
      setIsLoading(false);
      return;
    }

    if (!name.trim()) {
      setError("Your name is required");
      setIsLoading(false);
      return;
    }

    try {
      // Create FormData for server action
      const formData = new FormData();
      formData.append("companyName", companyName.trim());
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("password", password);
      if (logo) {
        formData.append("logo", logo);
      }

      // Call server action
      const result = await signUpCompany(formData);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      // Success - redirect to success page
      router.push("/auth/sign-up-success");

    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during signup");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col items-center w-full max-w-lg mx-auto", className)} {...props}>
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-2">
          <LayoutDashboard className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Dayflow HRMS</h1>
      </div>

      {/* Sign Up Form */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSignUp} className="space-y-5">
          {/* Company Name with Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-slate-700">
              Company Name :-
            </Label>
            <div className="flex gap-3">
              <Input
                id="companyName"
                type="text"
                placeholder="Enter company name"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-10 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 flex-1"
                disabled={isLoading}
              />
              {/* Logo Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoUpload}
                  accept="image/*"
                  className="hidden"
                  id="logo-upload"
                  disabled={isLoading}
                />
                {logoPreview ? (
                  <div className="relative h-10 w-10">
                    <img
                      src={logoPreview}
                      alt="Company logo"
                      className="h-10 w-10 rounded-lg object-cover border border-slate-300"
                    />
                    <button
                      type="button"
                      onClick={removeLogo}
                      disabled={isLoading}
                      className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="h-2.5 w-2.5 text-white" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="logo-upload"
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-colors",
                      isLoading && "opacity-50 cursor-not-allowed"
                    )}
                    title="Upload Logo"
                  >
                    <Upload className="h-4 w-4 text-indigo-500" />
                  </label>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500">Optional: Upload your company logo (max 2MB)</p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-700">
              Name :-
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your full name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">
              Email :-
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-700">
              Phone :-
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
              disabled={isLoading}
            />
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
                placeholder="Create a password (min 6 characters)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                disabled={isLoading}
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

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700">
              Confirm Password :-
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-10 bg-white border-slate-300 focus:border-indigo-500 focus:ring-indigo-500 pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Sign Up Button */}
          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-md"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Note about employee registration */}
      <p className="mt-4 text-xs text-slate-500 text-center max-w-sm">
        Note: This signup is for Admin/HR to register a new company.
        Employee accounts are created by Admin within the dashboard.
      </p>
    </div>
  );
}
