"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain } from "lucide-react";
import { apiClient } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await apiClient.login(email, password);
      } else {
        await apiClient.register(email, password, fullName);
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <Brain className="w-10 h-10 text-indigo-400" />
          <span
            className="text-2xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            CRACLE
          </span>
        </div>

        <div
          className="rounded-xl border p-8"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2
            className="text-xl font-semibold mb-6 text-center"
            style={{ color: "var(--color-text)" }}
          >
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm text-red-400"
              style={{ background: "rgba(239,68,68,0.1)" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-indigo-500"
                  style={{
                    background: "var(--color-bg-elevated)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                  placeholder="John Doe"
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-indigo-500"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-indigo-500"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--color-primary)" }}
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p
            className="mt-6 text-center text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-indigo-400 hover:underline"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
