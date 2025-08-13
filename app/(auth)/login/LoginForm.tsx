"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/dashboard";

  const onEmailPassword = async () => {
    try {
      setLoading(true);
      setError(null);
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.push(redirectTo);
    } catch (e: any) {
      setError(e.message || "Auth error");
    } finally {
      setLoading(false);
    }
  };

  const onGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
    });
  };

  return (
    <main className="container py-10">
      <div className="max-w-md mx-auto card">
        <h1 className="text-2xl font-semibold mb-4">Welcome</h1>
        <div className="space-y-3">
          {mode === "signup" && (
            <input
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={onEmailPassword}
            disabled={loading}
            className="bg-black text-white py-2 rounded-md"
          >
            {loading ? "Please wait…" : mode === "signup" ? "Sign up" : "Sign in"}
          </button>
          <button onClick={onGithub} className="py-2 rounded-md border">
            Continue with GitHub
          </button>
          <p className="text-sm">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="underline"
            >
              {mode === "signup" ? "Sign in" : "Create an account"}
            </button>
          </p>
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>
      </div>
    </main>
  );
}
