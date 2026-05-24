"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { UserProfile } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { user } = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const profile = docSnap.data() as UserProfile;
        setUser(profile);
        router.replace(
          profile.role === "instructor" ? "/instructor/courses" : "/dashboard",
        );
      } else {
        setError(
          "Account found but profile is missing. Please register again.",
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (
          msg.includes("user-not-found") ||
          msg.includes("wrong-password") ||
          msg.includes("invalid-credential")
        )
          setError("Invalid email or password.");
        else if (msg.includes("too-many-requests"))
          setError("Too many attempts. Please try again later.");
        else setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;1,300;1,400&family=Geist:wght@300;400;500&display=swap');

        .login-root {
          min-height: 100vh;
          background-color: #faf9f7;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          font-family: 'Geist', sans-serif;
        }

        .login-wrap {
          width: 100%;
          max-width: 400px;
          animation: fadeUp 0.45s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Wordmark */
        .login-wordmark {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 48px;
        }
        .login-mark {
          width: 26px;
          height: 26px;
          border: 2px solid #1c1917;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 500;
          color: #1c1917;
          letter-spacing: -0.02em;
          flex-shrink: 0;
        }
        .login-brand {
          font-size: 14px;
          font-weight: 500;
          color: #1c1917;
          letter-spacing: 0.03em;
        }

        /* Heading */
        .login-heading {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 28px;
          color: #1c1917;
          line-height: 1.25;
          margin-bottom: 8px;
        }
        .login-sub {
          font-size: 14px;
          color: #a8a29e;
          font-weight: 300;
          margin-bottom: 36px;
        }

        /* Divider */
        .login-rule {
          border: none;
          border-top: 1px solid #e7e5e4;
          margin: 0 0 28px;
        }

        /* Fields — underline style */
        .login-field {
          margin-bottom: 24px;
        }
        .login-field-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .login-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #78716c;
        }
        .login-forgot {
          font-size: 12px;
          color: #a8a29e;
          text-decoration: none;
          transition: color 0.15s;
        }
        .login-forgot:hover { color: #1c1917; }

        .login-input-wrap {
          position: relative;
        }
        .login-input {
          width: 100%;
          border: none;
          border-bottom: 1px solid #d6d3d1;
          background: transparent;
          padding: 8px 0;
          font-size: 15px;
          font-family: 'Geist', sans-serif;
          font-weight: 300;
          color: #1c1917;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .login-input::placeholder { color: #c4bfba; }
        .login-input:focus { border-bottom-color: #1c1917; }
        .login-input.pr { padding-right: 32px; }

        .login-eye {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #a8a29e;
          padding: 4px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .login-eye:hover { color: #1c1917; }

        /* Error */
        .login-error {
          font-size: 13px;
          color: #b45309;
          margin-bottom: 20px;
          padding: 10px 0;
          border-top: 1px solid #fde68a;
        }

        /* Submit */
        .login-submit {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 32px;
        }
        .login-btn {
          background: #1c1917;
          color: #faf9f7;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.04em;
          padding: 11px 28px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .login-btn:hover:not(:disabled) { background: #292524; }
        .login-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .login-register {
          font-size: 13px;
          color: #a8a29e;
        }
        .login-register a {
          color: #1c1917;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid #d6d3d1;
          padding-bottom: 1px;
          transition: border-color 0.15s;
        }
        .login-register a:hover { border-color: #1c1917; }

        /* Footer */
        .login-footer {
          margin-top: 56px;
          padding-top: 20px;
          border-top: 1px solid #e7e5e4;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .login-footer-copy {
          font-size: 11px;
          color: #c4bfba;
        }
        .login-footer-links {
          display: flex;
          gap: 16px;
        }
        .login-footer-links a {
          font-size: 11px;
          color: #c4bfba;
          text-decoration: none;
          transition: color 0.15s;
        }
        .login-footer-links a:hover { color: #78716c; }
      `}</style>

      <main className="login-root">
        <div className="login-wrap">
          {/* Wordmark */}
          <div className="login-wordmark">
            <div className="login-mark">L</div>
            <span className="login-brand">LearnSpace</span>
          </div>

          {/* Heading */}
          <h1 className="login-heading">
            Sign in to your
            <br />
            account
          </h1>
          <p className="login-sub">Continue where you left off.</p>

          <hr className="login-rule" />

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="login-field">
              <div className="login-field-header">
                <label className="login-label">Email address</label>
              </div>
              <div className="login-input-wrap">
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="login-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <div className="login-field-header">
                <label className="login-label">Password</label>
                <Link href="/forgot-password" className="login-forgot">
                  Forgot?
                </Link>
              </div>
              <div className="login-input-wrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="login-input pr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="login-eye"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ?
                    <EyeOff size={15} />
                  : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="login-error">{error}</div>}

            {/* Submit row */}
            <div className="login-submit">
              <button type="submit" disabled={loading} className="login-btn">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "Signing in…" : "Continue →"}
              </button>
              <span className="login-register">
                New here? <Link href="/register">Create account</Link>
              </span>
            </div>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <span className="login-footer-copy">© 2025 LearnSpace</span>
            <div className="login-footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Help</a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
