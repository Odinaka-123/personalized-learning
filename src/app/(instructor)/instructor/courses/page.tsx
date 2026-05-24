"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { createCourse, getInstructorCourses } from "@/lib/firestore";
import { Course } from "@/types";
import {
  GraduationCap,
  Plus,
  BookOpen,
  Layers,
  Clock,
  X,
  LogOut,
  BarChart3,
  Users,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function InstructorCoursesPage() {
  const { user, loading, clearUser } = useAuthStore();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", description: "" });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.role !== "instructor")
      router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === "instructor") {
      getInstructorCourses(user.uid)
        .then(setCourses)
        .finally(() => setFetching(false));
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
    clearUser();
    router.replace("/login");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    setError("");
    try {
      const id = await createCourse({
        title: form.title,
        description: form.description,
        instructorId: user.uid,
        topics: [],
      });
      router.push(`/instructor/courses/${id}`);
    } catch {
      setError("Failed to create course. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const navItems = [
    {
      icon: BarChart3,
      label: "Courses",
      href: "/instructor/courses",
      active: true,
    },
    {
      icon: Users,
      label: "Analytics",
      href: "/instructor/analytics",
      active: false,
    },
  ];

  if (loading || !user) {
    return (
      <>
        <style>{`
          .ic-spin { min-height:100vh; background:#faf9f7; display:flex; align-items:center; justify-content:center; }
          .ic-spinner { width:20px; height:20px; border:2px solid #e7e5e4; border-top-color:#1c1917; border-radius:50%; animation:icspin .7s linear infinite; }
          @keyframes icspin { to { transform:rotate(360deg); } }
        `}</style>
        <div className="ic-spin">
          <div className="ic-spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Geist:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ic-root {
          min-height: 100vh;
          background: #faf9f7;
          font-family: 'Geist', sans-serif;
          color: #1c1917;
          display: flex;
        }

        /* ── Sidebar ── */
        .ic-sidebar {
          width: 220px;
          flex-shrink: 0;
          border-right: 1px solid #e7e5e4;
          background: #fff;
          display: flex;
          flex-direction: column;
          padding: 28px 16px;
          position: fixed;
          height: 100vh;
          top: 0; left: 0;
          z-index: 10;
        }

        .ic-sidebar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 0 8px;
          margin-bottom: 32px;
        }
        .ic-sidebar-logo-icon {
          width: 28px; height: 28px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: #f5f4f2;
          display: flex; align-items: center; justify-content: center;
          color: #57534e;
        }
        .ic-sidebar-logo-name {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 15px;
          color: #1c1917;
          letter-spacing: .01em;
        }
        .ic-sidebar-badge {
          margin-left: auto;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #a8a29e;
          border: 1px solid #e7e5e4;
          border-radius: 3px;
          padding: 2px 6px;
          background: #f5f4f2;
        }

        .ic-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .ic-nav-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 10px;
          border-radius: 5px;
          border: none;
          background: none;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 400;
          cursor: pointer;
          transition: background .12s, color .12s;
          width: 100%;
          text-align: left;
          color: #a8a29e;
        }
        .ic-nav-btn:hover { background: #f5f4f2; color: #1c1917; }
        .ic-nav-btn.active {
          background: #f5f4f2;
          color: #1c1917;
          font-weight: 500;
        }
        .ic-nav-btn.active .ic-nav-dot {
          background: #1c1917;
        }
        .ic-nav-dot {
          width: 4px; height: 4px;
          border-radius: 50%;
          background: transparent;
          margin-left: auto;
          flex-shrink: 0;
        }

        .ic-sidebar-footer {
          border-top: 1px solid #e7e5e4;
          padding-top: 16px;
          margin-top: 16px;
        }
        .ic-user-row {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 0 8px;
          margin-bottom: 8px;
        }
        .ic-avatar {
          width: 28px; height: 28px;
          border-radius: 50%;
          border: 1px solid #e7e5e4;
          background: #f5f4f2;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 500;
          color: #78716c;
          flex-shrink: 0;
        }
        .ic-user-name {
          font-size: 12px;
          font-weight: 500;
          color: #1c1917;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ic-user-role {
          font-size: 11px;
          font-weight: 300;
          color: #a8a29e;
        }
        .ic-signout-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 10px;
          border-radius: 5px;
          border: none;
          background: none;
          font-family: 'Geist', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: #a8a29e;
          cursor: pointer;
          transition: background .12s, color .12s;
          width: 100%;
          text-align: left;
        }
        .ic-signout-btn:hover { background: #fef2f2; color: #991b1b; }

        /* ── Main ── */
        .ic-main {
          flex: 1;
          margin-left: 220px;
          padding: 40px 40px 80px;
          min-width: 0;
        }

        .ic-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 32px;
        }
        .ic-page-title {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 26px;
          color: #1c1917;
          line-height: 1.2;
          margin-bottom: 4px;
        }
        .ic-page-desc {
          font-size: 13px;
          font-weight: 300;
          color: #a8a29e;
        }
        .ic-new-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Geist', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #faf9f7;
          background: #1c1917;
          border: none;
          border-radius: 4px;
          padding: 9px 18px;
          cursor: pointer;
          transition: background .15s;
          letter-spacing: .03em;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .ic-new-btn:hover { background: #292524; }

        /* ── Summary row ── */
        .ic-summary {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
          margin-bottom: 28px;
        }
        .ic-summary-cell {
          padding: 18px 20px;
          border-right: 1px solid #e7e5e4;
        }
        .ic-summary-cell:last-child { border-right: none; }
        .ic-summary-icon { color: #a8a29e; margin-bottom: 8px; }
        .ic-summary-value {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 24px;
          color: #1c1917;
          line-height: 1;
        }
        .ic-summary-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: .05em;
          text-transform: uppercase;
          color: #a8a29e;
          margin-top: 4px;
        }

        /* ── Section header ── */
        .ic-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .ic-section-title {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #a8a29e;
        }
        .ic-section-count {
          font-size: 11px;
          font-weight: 300;
          color: #c4bfba;
        }

        /* ── Course grid ── */
        .ic-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
        }

        .ic-card {
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          background: #fff;
          padding: 20px;
          cursor: pointer;
          transition: border-color .15s, box-shadow .15s;
        }
        .ic-card:hover {
          border-color: #d6d3d1;
          box-shadow: 0 2px 12px rgba(28,25,23,.06);
        }

        .ic-card-icon {
          width: 34px; height: 34px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: #f5f4f2;
          display: flex; align-items: center; justify-content: center;
          color: #78716c;
          margin-bottom: 14px;
        }
        .ic-card-title {
          font-size: 14px;
          font-weight: 500;
          color: #1c1917;
          margin-bottom: 6px;
          line-height: 1.35;
        }
        .ic-card-desc {
          font-size: 12px;
          font-weight: 300;
          color: #a8a29e;
          line-height: 1.6;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .ic-card-meta {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .ic-card-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 400;
          color: #c4bfba;
        }

        /* ── Empty ── */
        .ic-empty {
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          background: #fff;
          padding: 64px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .ic-empty-icon {
          width: 44px; height: 44px;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          background: #f5f4f2;
          display: flex; align-items: center; justify-content: center;
          color: #a8a29e;
          margin-bottom: 4px;
        }
        .ic-empty-title { font-size: 13px; font-weight: 500; color: #1c1917; }
        .ic-empty-desc  { font-size: 12px; font-weight: 300; color: #a8a29e; max-width: 280px; line-height: 1.6; }
        .ic-empty-btn {
          margin-top: 16px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: 'Geist', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #faf9f7;
          background: #1c1917;
          border: none;
          border-radius: 4px;
          padding: 9px 18px;
          cursor: pointer;
          transition: background .15s;
          letter-spacing: .03em;
        }
        .ic-empty-btn:hover { background: #292524; }

        /* ── Fetching ── */
        .ic-fetching {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 0;
        }
        .ic-fetching-spinner {
          width: 20px; height: 20px;
          border: 2px solid #e7e5e4;
          border-top-color: #1c1917;
          border-radius: 50%;
          animation: icspin .7s linear infinite;
        }
        @keyframes icspin { to { transform: rotate(360deg); } }

        /* ── Modal ── */
        .ic-overlay {
          position: fixed;
          inset: 0;
          background: rgba(28,25,23,.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 20px;
        }
        .ic-modal {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 28px;
          width: 100%;
          max-width: 440px;
        }
        .ic-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .ic-modal-title {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 20px;
          color: #1c1917;
        }
        .ic-modal-close {
          width: 28px; height: 28px;
          border: 1px solid #e7e5e4;
          border-radius: 4px;
          background: #f5f4f2;
          display: flex; align-items: center; justify-content: center;
          color: #a8a29e;
          cursor: pointer;
          transition: background .12s, color .12s;
        }
        .ic-modal-close:hover { background: #edeae6; color: #1c1917; }

        .ic-form { display: flex; flex-direction: column; gap: 18px; }
        .ic-field { display: flex; flex-direction: column; gap: 6px; }
        .ic-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #78716c;
        }
        .ic-input, .ic-textarea {
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #1c1917;
          background: #faf9f7;
          border: 1px solid #e7e5e4;
          border-radius: 5px;
          padding: 10px 12px;
          transition: border-color .15s;
          width: 100%;
        }
        .ic-input::placeholder, .ic-textarea::placeholder { color: #c4bfba; }
        .ic-input:focus, .ic-textarea:focus { outline: none; border-color: #1c1917; }
        .ic-textarea { resize: vertical; }

        .ic-error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          border-radius: 5px;
          padding: 10px 14px;
          font-size: 13px;
          color: #991b1b;
        }

        .ic-modal-actions { display: flex; gap: 10px; }
        .ic-btn-cancel {
          flex: 1;
          padding: 11px;
          background: #faf9f7;
          border: 1px solid #e7e5e4;
          border-radius: 5px;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #57534e;
          cursor: pointer;
          transition: background .12s, border-color .12s;
          letter-spacing: .02em;
        }
        .ic-btn-cancel:hover { background: #f0ede8; border-color: #d6d3d1; }
        .ic-btn-submit {
          flex: 1;
          padding: 11px;
          background: #1c1917;
          border: none;
          border-radius: 5px;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #faf9f7;
          cursor: pointer;
          transition: background .15s;
          display: flex; align-items: center; justify-content: center; gap: 6px;
          letter-spacing: .02em;
        }
        .ic-btn-submit:hover:not(:disabled) { background: #292524; }
        .ic-btn-submit:disabled { opacity: .45; cursor: not-allowed; }

        .ic-spin-icon {
          width: 13px; height: 13px;
          border: 1.5px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: icspin .7s linear infinite;
          flex-shrink: 0;
        }

        @media (max-width: 1024px) {
          .ic-sidebar { display: none; }
          .ic-main { margin-left: 0; padding: 24px 20px 60px; }
          .ic-page-header { flex-direction: column; align-items: stretch; }
          .ic-new-btn { width: 100%; justify-content: center; }
          .ic-summary { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 480px) {
          .ic-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="ic-root">
        {/* Sidebar */}
        <aside className="ic-sidebar">
          <div className="ic-sidebar-logo">
            <div className="ic-sidebar-logo-icon">
              <GraduationCap size={13} />
            </div>
            <span className="ic-sidebar-logo-name">PLPAC</span>
            <span className="ic-sidebar-badge">Instructor</span>
          </div>

          <nav className="ic-nav">
            {navItems.map(({ icon: Icon, label, href, active }) => (
              <button
                key={label}
                className={`ic-nav-btn${active ? " active" : ""}`}
                onClick={() => router.push(href)}
              >
                <Icon size={14} />
                {label}
                <span className="ic-nav-dot" />
              </button>
            ))}
          </nav>

          <div className="ic-sidebar-footer">
            <div className="ic-user-row">
              <div className="ic-avatar">
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="ic-user-name">{user.displayName}</div>
                <div className="ic-user-role">Instructor</div>
              </div>
            </div>
            <button className="ic-signout-btn" onClick={handleSignOut}>
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Main */}
        <main className="ic-main">
          {/* Page header */}
          <div className="ic-page-header">
            <div>
              <h1 className="ic-page-title">My courses</h1>
              <p className="ic-page-desc">
                Create and manage your adaptive courses
              </p>
            </div>
            <button className="ic-new-btn" onClick={() => setShowModal(true)}>
              <Plus size={13} />
              New course
            </button>
          </div>

          {/* Summary stats */}
          {!fetching && (
            <div className="ic-summary">
              {[
                {
                  icon: BookOpen,
                  value: courses.length,
                  label: "Total courses",
                },
                {
                  icon: Layers,
                  value: courses.reduce(
                    (a, c) => a + (c.topics?.length ?? 0),
                    0,
                  ),
                  label: "Total topics",
                },
                {
                  icon: Clock,
                  value: courses.length > 0 ? "Active" : "—",
                  label: "Status",
                },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="ic-summary-cell">
                  <Icon size={13} className="ic-summary-icon" />
                  <div className="ic-summary-value">{value}</div>
                  <div className="ic-summary-label">{label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Section header */}
          <div className="ic-section-header">
            <span className="ic-section-title">Courses</span>
            {!fetching && (
              <span className="ic-section-count">{courses.length} total</span>
            )}
          </div>

          {/* Content */}
          {fetching ?
            <div className="ic-fetching">
              <div className="ic-fetching-spinner" />
            </div>
          : courses.length === 0 ?
            <div className="ic-empty">
              <div className="ic-empty-icon">
                <BookOpen size={18} />
              </div>
              <div className="ic-empty-title">No courses yet</div>
              <p className="ic-empty-desc">
                Create your first adaptive course and start helping students
                learn smarter.
              </p>
              <button
                className="ic-empty-btn"
                onClick={() => setShowModal(true)}
              >
                <Plus size={13} />
                Create first course
              </button>
            </div>
          : <div className="ic-grid">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="ic-card"
                  onClick={() =>
                    router.push(`/instructor/courses/${course.id}`)
                  }
                >
                  <div className="ic-card-icon">
                    <BookOpen size={15} />
                  </div>
                  <div className="ic-card-title">{course.title}</div>
                  <p className="ic-card-desc">{course.description}</p>
                  <div className="ic-card-meta">
                    <span className="ic-card-meta-item">
                      <Layers size={11} />
                      {course.topics?.length ?? 0} topics
                    </span>
                    <span className="ic-card-meta-item">
                      <Clock size={11} />
                      Adaptive
                    </span>
                  </div>
                </div>
              ))}
            </div>
          }
        </main>
      </div>

      {/* Create course modal */}
      {showModal && (
        <div
          className="ic-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setError("");
            }
          }}
        >
          <div className="ic-modal">
            <div className="ic-modal-header">
              <span className="ic-modal-title">New course</span>
              <button
                className="ic-modal-close"
                onClick={() => {
                  setShowModal(false);
                  setError("");
                }}
              >
                <X size={13} />
              </button>
            </div>

            <form className="ic-form" onSubmit={handleCreate}>
              <div className="ic-field">
                <label className="ic-label">Course title</label>
                <input
                  className="ic-input"
                  type="text"
                  placeholder="e.g. Introduction to Data Structures"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="ic-field">
                <label className="ic-label">Description</label>
                <textarea
                  className="ic-textarea"
                  placeholder="What will students learn in this course?"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  required
                  rows={4}
                />
              </div>

              {error && <div className="ic-error">{error}</div>}

              <div className="ic-modal-actions">
                <button
                  type="button"
                  className="ic-btn-cancel"
                  onClick={() => {
                    setShowModal(false);
                    setError("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ic-btn-submit"
                  disabled={creating}
                >
                  {creating && <div className="ic-spin-icon" />}
                  {creating ? "Creating…" : "Create course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
