"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { UserProfile } from "@/types";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "student" as "student" | "instructor",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      );

      await updateProfile(user, { displayName: form.displayName });

      const profile: UserProfile = {
        uid: user.uid,
        email: form.email,
        displayName: form.displayName,
        role: form.role,
        xp: 0,
        streak: 0,
        createdAt: new Date(),
      };

      await setDoc(doc(db, "users", user.uid), profile);

      router.replace(
        form.role === "instructor" ? "/instructor/courses" : "/dashboard",
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("email-already-in-use"))
          setError("An account with this email already exists.");
        else if (msg.includes("weak-password"))
          setError("Password must be at least 6 characters.");
        else if (msg.includes("invalid-email"))
          setError("Please enter a valid email address.");
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

        *, *::before, *::after { box-sizing: border-box; }

        .reg-root {
          min-height: 100vh;
          min-height: 100dvh;
          background-color: #faf9f7;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.25rem;
          font-family: 'Geist', sans-serif;
        }

        .reg-wrap {
          width: 100%;
          max-width: 400px;
          animation: fadeUp 0.45s ease both;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Wordmark ── */
        .reg-wordmark {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 40px;
        }
        .reg-mark {
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
        .reg-brand {
          font-size: 14px;
          font-weight: 500;
          color: #1c1917;
          letter-spacing: 0.03em;
        }

        /* ── Heading ── */
        .reg-heading {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 28px;
          color: #1c1917;
          line-height: 1.25;
          margin: 0 0 8px;
        }
        .reg-sub {
          font-size: 14px;
          color: #a8a29e;
          font-weight: 300;
          margin: 0 0 28px;
        }

        .reg-rule {
          border: none;
          border-top: 1px solid #e7e5e4;
          margin: 0 0 28px;
        }

        /* ── Fields ── */
        .reg-field {
          margin-bottom: 24px;
        }
        .reg-label {
          display: block;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: #78716c;
          margin-bottom: 6px;
        }
        .reg-input-wrap {
          position: relative;
        }
        .reg-input {
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
          -webkit-appearance: none;
          appearance: none;
          /* prevent zoom on iOS — font-size >= 16px on focus */
        }
        .reg-input::placeholder { color: #c4bfba; }
        .reg-input:focus { border-bottom-color: #1c1917; }
        .reg-input.pr { padding-right: 36px; }

        /* prevent iOS zoom on inputs < 16px */
        @media (max-width: 480px) {
          .reg-input { font-size: 16px; }
        }

        .reg-eye {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #a8a29e;
          padding: 6px;
          display: flex;
          align-items: center;
          transition: color 0.15s;
          /* larger tap target on mobile */
          min-width: 36px;
          min-height: 36px;
          justify-content: center;
        }
        .reg-eye:hover { color: #1c1917; }

        /* ── Role toggle ── */
        .reg-role-toggle {
          display: flex;
          border-bottom: 1px solid #d6d3d1;
        }
        .reg-role-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 10px 0;
          font-family: 'Geist', sans-serif;
          font-size: 14px;
          font-weight: 300;
          color: #a8a29e;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
          text-align: center;
          /* larger tap target */
          min-height: 44px;
        }
        .reg-role-btn::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: #1c1917;
          transform: scaleX(0);
          transition: transform 0.2s ease;
        }
        .reg-role-btn.active {
          color: #1c1917;
          font-weight: 400;
        }
        .reg-role-btn.active::after {
          transform: scaleX(1);
        }

        /* ── Error ── */
        .reg-error {
          font-size: 13px;
          color: #b45309;
          margin-bottom: 20px;
          padding: 10px 0;
          border-top: 1px solid #fde68a;
        }

        /* ── Submit row ── */
        .reg-submit {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-top: 32px;
          flex-wrap: wrap;
        }
        .reg-btn {
          background: #1c1917;
          color: #faf9f7;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.04em;
          padding: 12px 28px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: background 0.15s, opacity 0.15s;
          display: flex;
          align-items: center;
          gap: 8px;
          /* full-width on small screens */
          flex: 1 1 100%;
          justify-content: center;
          min-height: 44px;
        }
        .reg-btn:hover:not(:disabled) { background: #292524; }
        .reg-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .reg-login {
          font-size: 13px;
          color: #a8a29e;
          text-align: center;
          width: 100%;
        }
        .reg-login a {
          color: #1c1917;
          text-decoration: none;
          font-weight: 500;
          border-bottom: 1px solid #d6d3d1;
          padding-bottom: 1px;
          transition: border-color 0.15s;
        }
        .reg-login a:hover { border-color: #1c1917; }

        /* on wider screens: put button and login link side-by-side */
        @media (min-width: 480px) {
          .reg-btn {
            flex: 0 0 auto;
            width: auto;
          }
          .reg-login {
            width: auto;
            text-align: right;
          }
        }

        /* ── Footer ── */
        .reg-footer {
          margin-top: 48px;
          padding-top: 20px;
          border-top: 1px solid #e7e5e4;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 10px;
        }
        .reg-footer-copy {
          font-size: 11px;
          color: #c4bfba;
        }
        .reg-footer-links {
          display: flex;
          gap: 16px;
        }
        .reg-footer-links a {
          font-size: 11px;
          color: #c4bfba;
          text-decoration: none;
          transition: color 0.15s;
          /* bigger tap targets */
          padding: 4px 0;
        }
        .reg-footer-links a:hover { color: #78716c; }

        /* ── Very small screens ── */
        @media (max-width: 360px) {
          .reg-heading { font-size: 24px; }
          .reg-root { padding: 1.5rem 1rem; }
        }
      `}</style>

      <main className="reg-root">
        <div className="reg-wrap">
          {/* Wordmark */}
          <div className="reg-wordmark">
            <div className="reg-mark">L</div>
            <span className="reg-brand">LearnSpace</span>
          </div>

          {/* Heading */}
          <h1 className="reg-heading">
            Create your
            <br />
            account
          </h1>
          <p className="reg-sub">Start your personalised learning journey.</p>

          <hr className="reg-rule" />

          <form onSubmit={handleSubmit}>
            {/* Full name */}
            <div className="reg-field">
              <label className="reg-label">Full name</label>
              <input
                name="displayName"
                type="text"
                placeholder="Your full name"
                value={form.displayName}
                onChange={handleChange}
                required
                autoComplete="name"
                className="reg-input"
              />
            </div>

            {/* Email */}
            <div className="reg-field">
              <label className="reg-label">Email address</label>
              <input
                name="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                inputMode="email"
                className="reg-input"
              />
            </div>

            {/* Password */}
            <div className="reg-field">
              <label className="reg-label">Password</label>
              <div className="reg-input-wrap">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  className="reg-input pr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="reg-eye"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ?
                    <EyeOff size={15} />
                  : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Role toggle */}
            <div className="reg-field">
              <label className="reg-label">I am a</label>
              <div className="reg-role-toggle">
                <button
                  type="button"
                  className={`reg-role-btn${form.role === "student" ? " active" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, role: "student" }))}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`reg-role-btn${form.role === "instructor" ? " active" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, role: "instructor" }))}
                >
                  Instructor
                </button>
              </div>
            </div>

            {/* Error */}
            {error && <div className="reg-error">{error}</div>}

            {/* Submit row */}
            <div className="reg-submit">
              <button type="submit" disabled={loading} className="reg-btn">
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? "Creating…" : "Create account →"}
              </button>
              <span className="reg-login">
                Have an account? <Link href="/login">Sign in</Link>
              </span>
            </div>
          </form>

          {/* Footer */}
          <div className="reg-footer">
            <span className="reg-footer-copy">© 2025 LearnSpace</span>
            <div className="reg-footer-links">
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
