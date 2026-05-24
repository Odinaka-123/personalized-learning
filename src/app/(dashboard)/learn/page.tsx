"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getCourses } from "@/lib/firestore";
import { Course } from "@/types";
import { Search, Layers, Clock, ArrowRight } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

export default function LearnPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user)
      getCourses()
        .then(setCourses)
        .finally(() => setFetching(false));
  }, [user]);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading || !user) {
    return (
      <>
        <style>{`
          .learn-spin-root {
            min-height: 100vh; background: #faf9f7;
            display: flex; align-items: center; justify-content: center;
          }
          .learn-spinner {
            width: 20px; height: 20px;
            border: 2px solid #e7e5e4; border-top-color: #1c1917;
            border-radius: 50%; animation: lspin 0.7s linear infinite;
          }
          @keyframes lspin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="learn-spin-root">
          <div className="learn-spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;1,300&family=Geist:wght@300;400;500&display=swap');

        .learn-root {
          min-height: 100vh;
          background: #faf9f7;
          display: flex;
          font-family: 'Geist', sans-serif;
          color: #1c1917;
        }
        .learn-main {
          flex: 1;
          margin-left: 220px;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        /* ── Top bar ── */
        .learn-topbar {
          padding: 28px 40px 24px;
          border-bottom: 1px solid #e7e5e4;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          flex-wrap: wrap;
        }
        .learn-heading {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 26px;
          color: #1c1917;
          line-height: 1.2;
        }
        .learn-sub {
          font-size: 13px;
          font-weight: 300;
          color: #a8a29e;
          margin-top: 4px;
        }

        /* ── Search ── */
        .learn-search-wrap {
          position: relative;
          width: 260px;
          flex-shrink: 0;
        }
        .learn-search-icon {
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          color: #a8a29e;
          pointer-events: none;
        }
        .learn-search {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid #d6d3d1;
          padding: 8px 0 8px 22px;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 300;
          color: #1c1917;
          outline: none;
          transition: border-color 0.2s;
        }
        .learn-search::placeholder { color: #c4bfba; }
        .learn-search:focus { border-bottom-color: #1c1917; }

        /* ── Body ── */
        .learn-body { padding: 32px 40px 48px; }

        /* ── Loading / empty ── */
        .learn-center {
          display: flex; flex-direction: column;
          align-items: flex-start; justify-content: center;
          padding: 40px 0; gap: 6px;
        }
        .learn-center-title {
          font-size: 14px; font-weight: 400; color: #78716c;
        }
        .learn-center-sub {
          font-size: 13px; font-weight: 300; color: #a8a29e;
        }
        .learn-spinner {
          width: 18px; height: 18px;
          border: 2px solid #e7e5e4; border-top-color: #1c1917;
          border-radius: 50%; animation: lspin 0.7s linear infinite;
          margin-bottom: 8px;
        }
        @keyframes lspin { to { transform: rotate(360deg); } }

        /* ── Course grid ── */
        .learn-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          overflow: hidden;
        }
        .learn-card {
          padding: 28px 24px;
          border-right: 1px solid #e7e5e4;
          border-bottom: 1px solid #e7e5e4;
          cursor: pointer;
          background: #fff;
          transition: background 0.15s;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        /* remove right border on every 3rd card */
        .learn-card:nth-child(3n) { border-right: none; }
        /* remove bottom border on last row */
        .learn-card:nth-last-child(-n+3):nth-child(3n+1),
        .learn-card:nth-last-child(-n+3):nth-child(3n+1) ~ .learn-card {
          border-bottom: none;
        }
        .learn-card:hover { background: #faf9f7; }

        .learn-card-num {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 13px;
          color: #d6d3d1;
          margin-bottom: 20px;
          line-height: 1;
        }
        .learn-card-title {
          font-size: 14px;
          font-weight: 500;
          color: #1c1917;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .learn-card-desc {
          font-size: 12px;
          font-weight: 300;
          color: #a8a29e;
          line-height: 1.65;
          flex: 1;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 20px;
        }
        .learn-card-meta {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
        }
        .learn-card-meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 300;
          color: #c4bfba;
        }
        .learn-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
          border-top: 1px solid #f5f4f2;
        }
        .learn-card-badge {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #a8a29e;
          background: #f5f4f2;
          padding: 3px 8px;
          border-radius: 3px;
        }
        .learn-card-cta {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 500;
          color: #78716c;
          transition: color 0.15s, gap 0.15s;
        }
        .learn-card:hover .learn-card-cta {
          color: #1c1917;
          gap: 8px;
        }

        @media (max-width: 1024px) {
          .learn-main { margin-left: 0; }
          .learn-topbar { padding: 20px 20px 16px; }
          .learn-search-wrap { width: 100%; }
          .learn-body { padding: 20px; }
          .learn-grid { grid-template-columns: repeat(2, 1fr); }
          .learn-card:nth-child(3n) { border-right: 1px solid #e7e5e4; }
          .learn-card:nth-child(2n) { border-right: none; }
        }
        @media (max-width: 640px) {
          .learn-grid { grid-template-columns: 1fr; }
          .learn-card { border-right: none !important; }
          .learn-card:last-child { border-bottom: none; }
        }
      `}</style>

      <div className="learn-root">
        <Sidebar />

        <main className="learn-main">
          {/* Top bar */}
          <div className="learn-topbar">
            <div>
              <h1 className="learn-heading">Browse courses</h1>
              <p className="learn-sub">
                Enrol in a course to start your adaptive learning journey.
              </p>
            </div>
            <div className="learn-search-wrap">
              <Search size={13} className="learn-search-icon" />
              <input
                type="text"
                placeholder="Search courses…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="learn-search"
              />
            </div>
          </div>

          {/* Body */}
          <div className="learn-body">
            {fetching ?
              <div className="learn-center">
                <div className="learn-spinner" />
                <span className="learn-center-sub">Loading courses…</span>
              </div>
            : filtered.length === 0 ?
              <div className="learn-center">
                <p className="learn-center-title">No courses found</p>
                <p className="learn-center-sub">
                  {search ?
                    "No courses match your search."
                  : "No courses have been published yet. Check back soon."}
                </p>
              </div>
            : <div className="learn-grid">
                {filtered.map((course, i) => (
                  <div
                    key={course.id}
                    className="learn-card"
                    onClick={() => router.push(`/learn/${course.id}`)}
                  >
                    <div className="learn-card-num">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="learn-card-title">{course.title}</div>
                    <div className="learn-card-desc">{course.description}</div>
                    <div className="learn-card-meta">
                      <span className="learn-card-meta-item">
                        <Layers size={10} />
                        {course.topics?.length ?? 0} topics
                      </span>
                      <span className="learn-card-meta-item">
                        <Clock size={10} />
                        Adaptive
                      </span>
                    </div>
                    <div className="learn-card-footer">
                      <span className="learn-card-badge">Free</span>
                      <span className="learn-card-cta">
                        Enrol <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </main>
      </div>
    </>
  );
}
