"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getUserProgress,
  getUserSessions,
  getCourses,
  getUserProfile,
} from "@/lib/firestore";
import {
  BookOpen,
  Brain,
  Flame,
  Star,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { Course, Topic } from "@/types";

// ─── Local types ─────────────────────────────────────────────────────────────

type UserSession = {
  id: string;
  score?: number;
  startedAt?: { toDate: () => Date } | Date | string | number | null;
};

type ProgressEntry = {
  courseId?: string;
  mastered?: boolean;
  masteryScore: number;
  topicId: string;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading, updateUser } = useAuthStore();
  const router = useRouter();

  const [coursesCount, setCoursesCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  const stableUpdateUser = useCallback(
    (data: Parameters<typeof updateUser>[0]) => updateUser(data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      getUserProgress(user.uid),
      getUserSessions(user.uid),
      getCourses(),
      getUserProfile(user.uid),
    ])
      .then(([progress, userSessions, allCourses, freshProfile]) => {
        if (freshProfile) {
          stableUpdateUser({
            xp: freshProfile.xp ?? 0,
            streak: freshProfile.streak ?? 0,
          });
        }
        const typed = progress as ProgressEntry[];
        const activeCourseIds = new Set(
          typed.map((p) => p.courseId).filter(Boolean),
        );
        setCoursesCount(activeCourseIds.size || allCourses.length);
        setMasteredCount(typed.filter((p) => p.mastered).length);
        setSessions(userSessions as UserSession[]);
      })
      .finally(() => setFetching(false));
  }, [user?.uid, stableUpdateUser]);

  if (loading || !user) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500&display=swap');
          .dash-spinner-root {
            min-height: 100vh; background: #faf9f7;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Geist', sans-serif;
          }
          .dash-spinner {
            width: 20px; height: 20px;
            border: 2px solid #e7e5e4; border-top-color: #1c1917;
            border-radius: 50%; animation: spin 0.7s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div className="dash-spinner-root">
          <div className="dash-spinner" />
        </div>
      </>
    );
  }

  const stats = [
    { label: "XP earned", value: user.xp ?? 0, icon: Star, suffix: "xp" },
    {
      label: "Day streak",
      value: user.streak ?? 0,
      icon: Flame,
      suffix: "days",
    },
    {
      label: "Courses",
      value: fetching ? "—" : coursesCount,
      icon: BookOpen,
      suffix: "",
    },
    {
      label: "Mastered topics",
      value: fetching ? "—" : masteredCount,
      icon: Brain,
      suffix: "",
    },
  ];

  const formatDate = (
    val: { toDate?: () => Date } | Date | string | number | null | undefined,
  ) => {
    if (!val) return "—";
    const d =
      val instanceof Date ? val
      : (
        typeof val === "object" &&
        "toDate" in val &&
        typeof val.toDate === "function"
      ) ?
        val.toDate()
      : new Date(val as string | number);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;1,300&family=Geist:wght@300;400;500&display=swap');

        .dash-root {
          min-height: 100vh;
          background: #faf9f7;
          display: flex;
          font-family: 'Geist', sans-serif;
          color: #1c1917;
        }

        /* ── Main ── */
        .dash-main {
          flex: 1;
          margin-left: 240px;
          padding: 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        /* ── Top bar ── */
        .dash-topbar {
          padding: 28px 40px 24px;
          border-bottom: 1px solid #e7e5e4;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
        }
        .dash-greeting {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 26px;
          color: #1c1917;
          line-height: 1.2;
        }
        .dash-greeting em { font-style: italic; color: #78716c; }
        .dash-sub {
          font-size: 13px;
          font-weight: 300;
          color: #a8a29e;
          margin-top: 4px;
        }

        /* ── Stats row ── */
        .dash-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-bottom: 1px solid #e7e5e4;
        }
        .dash-stat {
          padding: 24px 32px;
          border-right: 1px solid #e7e5e4;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .dash-stat:last-child { border-right: none; }
        .dash-stat-icon {
          width: 32px; height: 32px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          background: #fff;
          color: #78716c;
        }
        .dash-stat-value {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 28px;
          color: #1c1917;
          line-height: 1;
        }
        .dash-stat-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #a8a29e;
          margin-top: 2px;
        }

        /* ── Content grid ── */
        .dash-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          flex: 1;
        }
        .dash-card {
          padding: 28px 32px;
          border-right: 1px solid #e7e5e4;
          border-bottom: 1px solid #e7e5e4;
        }
        .dash-card:nth-child(2) { border-right: none; }
        .dash-card-full {
          grid-column: 1 / -1;
          padding: 28px 32px;
          border-bottom: 1px solid #e7e5e4;
        }
        .dash-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .dash-card-title {
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #78716c;
        }
        .dash-card-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: #a8a29e;
          text-decoration: none;
          border-bottom: 1px solid #e7e5e4;
          padding-bottom: 1px;
          background: none;
          border-left: none; border-top: none; border-right: none;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
          font-family: 'Geist', sans-serif;
        }
        .dash-card-link:hover { color: #1c1917; border-color: #1c1917; }

        /* ── Empty state ── */
        .dash-empty {
          display: flex; flex-direction: column;
          align-items: flex-start; justify-content: center;
          padding: 12px 0 4px;
          gap: 6px;
        }
        .dash-empty-title {
          font-size: 14px; font-weight: 400; color: #78716c;
        }
        .dash-empty-sub {
          font-size: 13px; font-weight: 300; color: #a8a29e;
        }
        .dash-empty-btn {
          margin-top: 12px;
          font-family: 'Geist', sans-serif;
          font-size: 12px; font-weight: 500;
          color: #faf9f7; background: #1c1917;
          border: none; border-radius: 4px;
          padding: 8px 18px;
          cursor: pointer;
          transition: background 0.15s;
          letter-spacing: 0.03em;
        }
        .dash-empty-btn:hover { background: #292524; }

        /* ── Row items ── */
        .dash-row-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          margin-bottom: 8px;
          background: #fff;
          cursor: pointer;
          transition: border-color 0.15s;
          font-family: 'Geist', sans-serif;
          width: 100%; text-align: left;
        }
        .dash-row-item:last-child { margin-bottom: 0; }
        .dash-row-item:hover { border-color: #d6d3d1; }
        .dash-row-icon {
          width: 32px; height: 32px;
          border: 1px solid #e7e5e4;
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          background: #faf9f7; color: #78716c; flex-shrink: 0;
        }
        .dash-row-label { font-size: 13px; font-weight: 400; color: #1c1917; flex: 1; }
        .dash-row-chevron { color: #c4bfba; }

        /* ── Session items ── */
        .dash-session {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px;
          border-bottom: 1px solid #e7e5e4;
        }
        .dash-session:last-child { border-bottom: none; }
        .dash-session-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .dash-session-label { font-size: 13px; font-weight: 400; color: #1c1917; flex: 1; }
        .dash-session-date { font-size: 11px; color: #a8a29e; }
        .dash-session-score { font-size: 13px; font-weight: 500; }
        .dash-session-pass .dash-session-dot { background: #16a34a; }
        .dash-session-pass .dash-session-score { color: #16a34a; }
        .dash-session-fail .dash-session-dot { background: #dc2626; }
        .dash-session-fail .dash-session-score { color: #dc2626; }

        /* ── AI card ── */
        .dash-ai-badge {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 500;
          letter-spacing: 0.06em; text-transform: uppercase;
          color: #a8a29e;
        }
        .dash-ai-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .dash-ai-rec {
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          padding: 16px;
          background: #fff;
        }
        .dash-ai-num {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 22px;
          color: #d6d3d1;
          margin-bottom: 10px;
          line-height: 1;
        }
        .dash-ai-text {
          font-size: 13px; font-weight: 300;
          color: #78716c; line-height: 1.65;
        }
        .dash-ai-loading {
          display: flex; align-items: center; gap: 10px;
          padding: 24px 0;
          font-size: 13px; font-weight: 300; color: #a8a29e;
        }
        .dash-ai-spinner {
          width: 16px; height: 16px;
          border: 1.5px solid #e7e5e4; border-top-color: #78716c;
          border-radius: 50%; animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .dash-ai-set-btn {
          margin-top: 12px;
          font-family: 'Geist', sans-serif;
          font-size: 12px; font-weight: 500;
          color: #faf9f7; background: #1c1917;
          border: none; border-radius: 4px;
          padding: 8px 18px; cursor: pointer;
          transition: background 0.15s; letter-spacing: 0.03em;
        }
        .dash-ai-set-btn:hover { background: #292524; }

        @media (max-width: 1024px) {
          .dash-main { margin-left: 0; }
          .dash-topbar { padding: 20px 20px 16px; }
          .dash-stats { grid-template-columns: repeat(2, 1fr); }
          .dash-stat:nth-child(2) { border-right: none; }
          .dash-stat:nth-child(3) { border-top: 1px solid #e7e5e4; }
          .dash-content { grid-template-columns: 1fr; }
          .dash-card { border-right: none; }
          .dash-ai-grid { grid-template-columns: 1fr; }
          .dash-card, .dash-card-full { padding: 20px; }
        }
      `}</style>

      <div className="dash-root">
        <Sidebar />
        <main className="dash-main">
          {/* Top bar */}
          <div className="dash-topbar">
            <div>
              <h1 className="dash-greeting">
                Good day, <em>{user.displayName?.split(" ")[0]}</em>
              </h1>
              <p className="dash-sub">Here&apos;s your learning overview.</p>
            </div>
          </div>

          {/* Stats */}
          <div className="dash-stats">
            {stats.map(({ label, value, icon: Icon }) => (
              <div key={label} className="dash-stat">
                <div className="dash-stat-icon">
                  <Icon size={15} />
                </div>
                <div>
                  <div className="dash-stat-value">{value}</div>
                  <div className="dash-stat-label">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Cards */}
          <div className="dash-content">
            {/* Continue learning */}
            <div className="dash-card">
              <div className="dash-card-header">
                <span className="dash-card-title">Continue learning</span>
                <button
                  className="dash-card-link"
                  onClick={() => router.push("/learn")}
                >
                  Browse all <ChevronRight size={11} />
                </button>
              </div>

              {masteredCount === 0 && !fetching ?
                <div className="dash-empty">
                  <p className="dash-empty-title">No courses yet</p>
                  <p className="dash-empty-sub">
                    Enrol in a course to get started
                  </p>
                  <button
                    className="dash-empty-btn"
                    onClick={() => router.push("/learn")}
                  >
                    Browse courses
                  </button>
                </div>
              : <>
                  <button
                    className="dash-row-item"
                    onClick={() => router.push("/learn")}
                  >
                    <div className="dash-row-icon">
                      <Brain size={14} />
                    </div>
                    <span className="dash-row-label">Continue learning</span>
                    <ChevronRight size={13} className="dash-row-chevron" />
                  </button>
                  <button
                    className="dash-row-item"
                    onClick={() => router.push("/progress")}
                  >
                    <div className="dash-row-icon">
                      <TrendingUp size={14} />
                    </div>
                    <span className="dash-row-label">View full progress</span>
                    <ChevronRight size={13} className="dash-row-chevron" />
                  </button>
                </>
              }
            </div>

            {/* Recent activity */}
            <div className="dash-card">
              <div className="dash-card-header">
                <span className="dash-card-title">Recent activity</span>
                <button
                  className="dash-card-link"
                  onClick={() => router.push("/progress")}
                >
                  View all <ChevronRight size={11} />
                </button>
              </div>

              {sessions.length === 0 ?
                <div className="dash-empty">
                  <p className="dash-empty-title">No activity yet</p>
                  <p className="dash-empty-sub">
                    Your learning sessions will appear here
                  </p>
                </div>
              : <div
                  style={{
                    border: "1px solid #e7e5e4",
                    borderRadius: 6,
                    overflow: "hidden",
                    background: "#fff",
                  }}
                >
                  {sessions.slice(0, 5).map((s) => {
                    const passed = (s.score ?? 0) >= 70;
                    return (
                      <div
                        key={s.id}
                        className={`dash-session ${passed ? "dash-session-pass" : "dash-session-fail"}`}
                      >
                        <div className="dash-session-dot" />
                        <span className="dash-session-label">
                          Quiz completed
                        </span>
                        <span className="dash-session-date">
                          {formatDate(s.startedAt)}
                        </span>
                        <span className="dash-session-score">
                          {s.score ?? 0}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              }
            </div>

            {/* AI Recommendations — full width */}
            <div className="dash-card-full">
              <div className="dash-card-header">
                <span className="dash-card-title">AI recommendations</span>
                <div className="dash-ai-badge">
                  <Brain size={12} /> Personalised
                </div>
              </div>
              <AIRecommendations
                uid={user.uid}
                learningStyle={user.learningStyle}
              />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

// ─── AI Recommendations ───────────────────────────────────────────────────────

function AIRecommendations({
  uid,
  learningStyle,
}: {
  uid: string;
  learningStyle?: string;
}) {
  const router = useRouter();
  const [recs, setRecs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current || !learningStyle) return;
    fetched.current = true;

    async function fetchRecs() {
      setLoading(true);
      setError(false);
      try {
        const { getUserProgress, getCourses, getCourseTopics } =
          await import("@/lib/firestore");
        const [rawProgress, courses] = await Promise.all([
          getUserProgress(uid),
          getCourses(),
        ]);

        const topicMap: Record<string, string> = {};
        await Promise.all(
          courses.map(async (c: Course) => {
            const topics = await getCourseTopics(c.id);
            topics.forEach((t: Topic) => {
              topicMap[t.id] = t.title;
            });
          }),
        );

        const typed = rawProgress as ProgressEntry[];
        const weakTopics = typed
          .filter((p) => !p.mastered && p.masteryScore < 60)
          .sort((a, b) => a.masteryScore - b.masteryScore)
          .slice(0, 5)
          .map((p) => topicMap[p.topicId] ?? p.topicId);

        const prompt =
          weakTopics.length > 0 ?
            `You are a learning coach. A student with a ${learningStyle} learning style is struggling with: ${weakTopics.join(", ")}. Give exactly 3 short, specific, actionable recommendations tailored to their learning style. Each must be one sentence. Return only a JSON array of 3 strings, no other text, no markdown.`
          : `You are a learning coach. A student with a ${learningStyle} learning style has been doing well. Give exactly 3 short motivational next-step suggestions. Return only a JSON array of 3 strings, no other text, no markdown.`;

        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1000,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const data = await res.json();
        const text =
          (data.content as Array<{ type: string; text?: string }>)
            ?.map((b) => b.text ?? "")
            .join("") ?? "";
        const clean = text.replace(/```json|```/g, "").trim();
        const parsed: string[] = JSON.parse(clean);
        setRecs(parsed);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchRecs();
  }, [uid, learningStyle]);

  if (!learningStyle) {
    return (
      <div className="dash-empty">
        <p className="dash-empty-title">No recommendations yet</p>
        <p className="dash-empty-sub">
          Set your learning style to get personalised suggestions
        </p>
        <button
          className="dash-ai-set-btn"
          onClick={() => router.push("/profile")}
        >
          Set learning style
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dash-ai-loading">
        <div className="dash-ai-spinner" />
        Generating recommendations…
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-empty">
        <p className="dash-empty-title">Could not load recommendations</p>
        <button
          className="dash-empty-btn"
          onClick={() => {
            fetched.current = false;
            setError(false);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="dash-ai-grid">
      {recs.map((rec, i) => (
        <div key={i} className="dash-ai-rec">
          <div className="dash-ai-num">0{i + 1}</div>
          <p className="dash-ai-text">{rec}</p>
        </div>
      ))}
    </div>
  );
}
