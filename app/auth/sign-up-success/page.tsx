import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, LayoutDashboard, Mail, ArrowRight } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 mb-3">
            <LayoutDashboard className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Dayflow HRMS</h1>
        </div>

        {/* Success Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Registration Successful! 🎉
          </h2>

          {/* Description */}
          <p className="text-slate-600 mb-6">
            Your company has been registered successfully.
            Please check your email to verify your account.
          </p>

          {/* Email Notice */}
          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700 text-left">
              We&apos;ve sent a verification link to your email.
              Click the link to activate your account.
            </p>
          </div>

          {/* What's Next */}
          <div className="text-left mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">What&apos;s next?</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 flex-shrink-0">1</span>
                <span>Verify your email address</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 flex-shrink-0">2</span>
                <span>Sign in to your dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600 flex-shrink-0">3</span>
                <span>Add your employees and start managing your team</span>
              </li>
            </ul>
          </div>

          {/* Sign In Button */}
          <Link href="/auth/login">
            <Button className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-md">
              Continue to Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Footer Note */}
        <p className="mt-4 text-xs text-slate-500 text-center">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <Link href="/auth/sign-up" className="text-indigo-600 hover:underline">
            try again
          </Link>
        </p>
      </div>
    </div>
  );
}
