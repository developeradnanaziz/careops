"use client";

import { createClient } from "@/lib/supabase-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If Supabase auto-confirmed (session exists), go straight to onboarding
    if (data.session) {
      router.push("/onboarding");
      router.refresh();
      return;
    }

    // Otherwise email confirmation is required — show success screen
    setLoading(false);
    setSuccess(true);
  };

  // ── Success: email confirmation required ──────────────────
  if (success) {
    return (
      <div className="max-w-sm w-full text-center">
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-8">
          <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
          <h1 className="text-xl font-bold text-zinc-900 mb-2">Check your email</h1>
          <p className="text-sm text-zinc-500 mb-1">
            We sent a confirmation link to
          </p>
          <p className="text-sm font-medium text-zinc-900 mb-6">{email}</p>
          <p className="text-xs text-zinc-400 mb-6">
            Click the link in the email to activate your account, then come back here to sign in.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-800 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // ── Signup form ───────────────────────────────────────────
  return (
    <div className="max-w-sm w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-zinc-900">Create an account</h1>
        <p className="text-sm text-zinc-500 mt-1">Get started with CareOps</p>
      </div>

      <form onSubmit={handleSignup} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Full name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="••••••••"
          />
          <p className="text-xs text-zinc-400 mt-1">Minimum 6 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-zinc-900 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
