"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginEmailSchema, loginPhoneSchema } from "@/lib/schemas";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, SHOP_NAME } from "@/lib/constants";
import type { ConfirmationResult } from "firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { parseFirebaseError } from "@/lib/auth/errors";

function LoginForm() {
  const [mode, setMode] = useState<"email" | "phone">("phone");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailMode, setEmailMode] = useState<"signin" | "signup">("signin");
  const [success, setSuccess] = useState<string | null>(null);
  const { signInEmail, signUpEmail, sendPhoneOtp, user, profile, loading: authLoading, configured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const emailForm = useForm({
    resolver: zodResolver(loginEmailSchema),
    defaultValues: { email: "", password: "" },
  });

  const phoneForm = useForm({
    resolver: zodResolver(loginPhoneSchema),
    defaultValues: { phone: "" },
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) return;

    const go =
      profile?.role === "worker" ? "/worker" : redirect;

    setSuccess("Login successful! Redirecting...");
    const t = setTimeout(() => router.replace(go), 400);
    return () => clearTimeout(t);
  }, [user, profile, authLoading, router, redirect]);

  const onEmailSubmit = emailForm.handleSubmit(async (data) => {
    setLoading(true);
    setError(null);
    try {
      if (emailMode === "signup") {
        const name = data.email.split("@")[0] || "User";
        await signUpEmail(data.email, data.password, name);
      } else {
        await signInEmail(data.email, data.password);
      }
    } catch (e) {
      setError(parseFirebaseError(e));
    } finally {
      setLoading(false);
    }
  });

  const sendOtp = phoneForm.handleSubmit(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await sendPhoneOtp(data.phone, "recaptcha-container");
      setConfirmation(result);
      setOtpSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  });

  const verifyOtp = async () => {
    if (!confirmation || !otp) return;
    setLoading(true);
    setError(null);
    try {
      await confirmation.confirm(otp);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  if (!configured) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <p className="text-zinc-400 text-sm text-center">
              Configure Firebase in .env.local to enable login.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-violet-600 flex items-center justify-center text-2xl font-bold mb-4">
        V
      </div>
      <h1 className="text-2xl font-bold text-white mb-1">{APP_NAME}</h1>
      <p className="text-zinc-500 text-sm mb-8">{SHOP_NAME}</p>

      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("phone")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "phone"
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              Phone OTP
            </button>
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                mode === "email"
                  ? "bg-violet-600 text-white"
                  : "text-zinc-400 hover:bg-white/5"
              }`}
            >
              Email
            </button>
          </div>
          <CardTitle className="mt-4">
            {mode === "email"
              ? emailMode === "signup"
                ? "Create account"
                : "Sign in"
              : "Sign in"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mode === "email" ? (
            <form onSubmit={onEmailSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...emailForm.register("email")}
                />
              </div>
              <div>
                <Label htmlFor="password">Password (min 6 characters)</Label>
                <Input
                  id="password"
                  type="password"
                  {...emailForm.register("password")}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : emailMode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-violet-400 hover:text-violet-300"
                onClick={() => {
                  setEmailMode(emailMode === "signin" ? "signup" : "signin");
                  setError(null);
                  setSuccess(null);
                }}
              >
                {emailMode === "signin"
                  ? "Naya account? Create account"
                  : "Pehle se account hai? Sign in"}
              </button>
              {emailMode === "signin" && (
                <button
                  type="button"
                  className="w-full text-xs text-zinc-500 hover:text-zinc-300"
                  onClick={async () => {
                    const email = emailForm.getValues("email");
                    if (!email) {
                      setError("Pehle email likho");
                      return;
                    }
                    try {
                      await sendPasswordResetEmail(getFirebaseAuth(), email);
                      setSuccess("Password reset email bhej di — inbox check karo");
                      setError(null);
                    } catch (e) {
                      setError(parseFirebaseError(e));
                    }
                  }}
                >
                  Password bhool gaye?
                </button>
              )}
            </form>
          ) : (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={sendOtp} className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone number</Label>
                    <Input
                      id="phone"
                      {...phoneForm.register("phone")}
                      placeholder="9876543210"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    Send OTP
                  </Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="6-digit code"
                    />
                  </div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={loading}
                    onClick={verifyOtp}
                  >
                    Verify OTP
                  </Button>
                </div>
              )}
            </div>
          )}
          {success && (
            <p className="text-emerald-400 text-sm mt-4 rounded-lg bg-emerald-500/10 p-3">
              {success}
            </p>
          )}
          {error && (
            <p className="text-red-400 text-sm mt-4 rounded-lg bg-red-500/10 p-3">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
      <div id="recaptcha-container" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
