"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getInstructorCourses,
  getCourseTopics,
  getCourseProgress,
} from "@/lib/firestore";
import { Course, Topic } from "@/types";
import {
  GraduationCap,
  BarChart3,
  Users,
  BookOpen,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  LogOut,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const difficultyLabel: Record<number, string> = {
  1: "Beginner",
  2: "Easy",
  3: "Intermediate",
  4: "Hard",
  5: "Advanced",
};

interface TopicStat {
  topic: Topic;
  courseName: string;
  courseId: string;
  totalAttempts: number;
  uniqueStudents: number;
  masteredCount: number;
  strugglingCount: number;
  avgMastery: number;
}

export default function InstructorAnalyticsPage() {
  const { user, loading, clearUser } = useAuthStore();
  const router = useRouter();

  const [stats, setStats] = useState<TopicStat[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
    if (!loading && user && user.role !== "instructor")
      router.replace("/dashboard");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user?.uid) return;

    async function load() {
      try {
        const allCourses = await getInstructorCourses(user!.uid);
        setCourses(allCourses);

        const topicsByCourse = await Promise.all(
          allCourses.map((c) =>
            getCourseTopics(c.id).then((topics) => ({ course: c, topics })),
          ),
        );

        const allTopics: {
          topic: Topic;
          courseName: string;
          courseId: string;
        }[] = topicsByCourse.flatMap(({ course, topics }) =>
          topics.map((t) => ({
            topic: t,
            courseName: course.title,
            courseId: course.id,
          })),
        );

        const topicIds = allTopics.map((t) => t.topic.id);
        const allProgress = await getCourseProgress(topicIds);

        const built: TopicStat[] = allTopics.map(
          ({ topic, courseName, courseId }) => {
            const rows = allProgress.filter((p) => p.topicId === topic.id);
            const uniqueStudents = new Set(rows.map((p) => p.uid)).size;
            const masteredCount = rows.filter((p) => p.mastered).length;
            const strugglingCount = rows.filter(
              (p) => !p.mastered && p.attempts > 0 && p.masteryScore < 40,
            ).length;
            const avgMastery =
              rows.length > 0 ?
                Math.round(
                  rows.reduce((a, p) => a + p.masteryScore, 0) / rows.length,
                )
              : 0;
            const totalAttempts = rows.reduce((a, p) => a + p.attempts, 0);
            return {
              topic,
              courseName,
              courseId,
              totalAttempts,
              uniqueStudents,
              masteredCount,
              strugglingCount,
              avgMastery,
            };
          },
        );

        setStats(built);
      } finally {
        setFetching(false);
      }
    }

    load();
  }, [user]);

  const handleSignOut = async () => {
    await signOut(auth);
    clearUser();
    router.replace("/login");
  };

  const filtered =
    selectedCourse === "all" ? stats : (
      stats.filter((s) => s.courseId === selectedCourse)
    );
  const totalMastered = filtered.reduce((a, s) => a + s.masteredCount, 0);
  const totalStruggling = filtered.reduce((a, s) => a + s.strugglingCount, 0);
  const overallAvg =
    filtered.length > 0 ?
      Math.round(
        filtered.reduce((a, s) => a + s.avgMastery, 0) / filtered.length,
      )
    : 0;

  const barColor = (score: number) =>
    score >= 70 ? "#16a34a"
    : score >= 40 ? "#ca8a04"
    : "#dc2626";
  const scoreColor = (score: number) =>
    score >= 70 ? "#166534"
    : score >= 40 ? "#92400e"
    : "#991b1b";

  if (loading || !user) {
    return (
      <>
        <style>{`
          .ia-spin { min-height:100vh; background:#faf9f7; display:flex; align-items:center; justify-content:center; }
          .ia-spinner { width:20px; height:20px; border:2px solid #e7e5e4; border-top-color:#1c1917; border-radius:50%; animation:iaspin .7s linear infinite; }
          @keyframes iaspin { to { transform:rotate(360deg); } }
        `}</style>
        <div className="ia-spin">
          <div className="ia-spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Geist:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .ia-root { min-height:100vh; background:#faf9f7; display:flex; font-family:'Geist',sans-serif; color:#1c1917; }

        /* ── Sidebar ── */
        .ia-sidebar {
          width: 220px;
          flex-shrink: 0;
          border-right: 1px solid #e7e5e4;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100%;
          background: #faf9f7;
          z-index: 10;
        }

        .ia-brand {
          padding: 24px 20px 20px;
          border-bottom: 1px solid #e7e5e4;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ia-brand-icon {
          width: 28px; height: 28px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          color: #78716c;
        }
        .ia-brand-name { font-size:13px; font-weight:500; color:#1c1917; }
        .ia-brand-badge {
          margin-left: auto;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #78716c;
          background: #f0ede8;
          padding: 2px 7px;
          border-radius: 3px;
        }

        .ia-nav { flex: 1; padding: 12px 12px 0; display: flex; flex-direction: column; gap: 2px; }

        .ia-nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 10px;
          border-radius: 5px;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #78716c;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background .12s, color .12s;
        }
        .ia-nav-btn:hover     { background: #f0ede8; color: #1c1917; }
        .ia-nav-btn.active    { background: #f0ede8; color: #1c1917; font-weight: 500; }

        .ia-sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid #e7e5e4;
        }
        .ia-user-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 4px;
          margin-bottom: 8px;
        }
        .ia-user-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 1px solid #e7e5e4;
          background: #f0ede8;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size: 14px;
          color: #78716c;
          flex-shrink: 0;
        }
        .ia-user-name  { font-size:12px; font-weight:500; color:#1c1917; }
        .ia-user-role  { font-size:11px; font-weight:300; color:#a8a29e; }
        .ia-signout {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 5px;
          font-family: 'Geist', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: #a8a29e;
          background: none;
          border: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background .12s, color .12s;
        }
        .ia-signout:hover { background: #fef2f2; color: #991b1b; }

        /* ── Main ── */
        .ia-main { flex:1; margin-left:220px; min-width:0; display:flex; flex-direction:column; }

        /* ── Top bar ── */
        .ia-topbar {
          padding: 28px 40px 24px;
          border-bottom: 1px solid #e7e5e4;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
        }
        .ia-heading {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size: 26px;
          color: #1c1917; line-height: 1.2;
        }
        .ia-sub { font-size:13px; font-weight:300; color:#a8a29e; margin-top:4px; }

        .ia-select {
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #1c1917;
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 5px;
          padding: 8px 12px;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 30px;
          transition: border-color .15s;
          flex-shrink: 0;
        }
        .ia-select:focus { outline: none; border-color: #1c1917; }

        /* ── Body layout ── */
        .ia-body {
          display: grid;
          grid-template-columns: 260px 1fr;
          flex: 1;
        }

        /* ── Left stats panel ── */
        .ia-left {
          border-right: 1px solid #e7e5e4;
          display: flex;
          flex-direction: column;
        }

        .ia-stats { display: grid; grid-template-columns: 1fr 1fr; }
        .ia-stat {
          padding: 20px 20px;
          border-right: 1px solid #e7e5e4;
          border-bottom: 1px solid #e7e5e4;
        }
        .ia-stat:nth-child(2n)        { border-right: none; }
        .ia-stat:nth-last-child(-n+2) { border-bottom: none; }
        .ia-stat-icon  { color:#a8a29e; margin-bottom:8px; }
        .ia-stat-value {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size:24px;
          color:#1c1917; line-height:1;
        }
        .ia-stat-label {
          font-size:10px; font-weight:400;
          letter-spacing:.05em; text-transform:uppercase;
          color:#a8a29e; margin-top:5px;
        }

        /* summary block at bottom of left */
        .ia-summary-block {
          margin-top: auto;
          padding: 20px;
          border-top: 1px solid #e7e5e4;
        }
        .ia-summary-label { font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:#a8a29e; margin-bottom:8px; }
        .ia-summary-value {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size:32px;
          color:#1c1917; line-height:1;
        }
        .ia-summary-sub { font-size:12px; font-weight:300; color:#c4bfba; margin-top:4px; }

        /* ── Right panel ── */
        .ia-right { padding: 28px 32px; }

        .ia-section-label {
          font-size:11px; font-weight:500;
          letter-spacing:.08em; text-transform:uppercase;
          color:#a8a29e; margin-bottom:16px;
        }

        /* Table card */
        .ia-table-card {
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
        }
        .ia-table-header {
          padding: 14px 20px;
          border-bottom: 1px solid #e7e5e4;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ia-table-title { font-size:12px; font-weight:500; color:#57534e; }
        .ia-table-hint  { font-size:11px; font-weight:300; color:#c4bfba; }

        .ia-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          border-bottom: 1px solid #f0ede8;
        }
        .ia-row:last-child { border-bottom: none; }

        .ia-row-left { flex: 1; min-width: 0; }
        .ia-row-name {
          font-size: 13px;
          font-weight: 500;
          color: #1c1917;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 2px;
        }
        .ia-row-course {
          font-size: 11px;
          font-weight: 300;
          color: #a8a29e;
        }
        .ia-row-tags { display: flex; align-items: center; gap: 6px; margin-top: 4px; }

        .ia-diff-badge {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .05em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 3px;
          background: #f5f4f2;
          color: #78716c;
        }

        /* Mastery bar */
        .ia-mastery-col { width: 140px; flex-shrink: 0; }
        .ia-mastery-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        .ia-mastery-label { font-size:10px; font-weight:400; color:#a8a29e; }
        .ia-mastery-pct {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 14px;
        }
        .ia-bar-track { height:2px; background:#f0ede8; border-radius:99px; overflow:hidden; }
        .ia-bar-fill  { height:100%; border-radius:99px; }

        /* Counters */
        .ia-counters { display:flex; align-items:center; gap:20px; flex-shrink:0; }
        .ia-counter { text-align:center; }
        .ia-counter-value {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size:16px;
          color:#1c1917; line-height:1;
        }
        .ia-counter-label {
          font-size:10px; font-weight:400;
          text-transform:uppercase; letter-spacing:.05em;
          color:#a8a29e; margin-top:3px;
        }
        .ia-counter-value--green { color:#166534; }
        .ia-counter-value--red   { color:#991b1b; }

        /* Empty */
        .ia-empty {
          padding: 48px 20px;
          display: flex; flex-direction: column; align-items: center; text-align: center; gap: 8px;
        }
        .ia-empty-icon {
          width: 40px; height: 40px;
          border: 1px solid #e7e5e4;
          border-radius: 7px;
          background: #f5f4f2;
          display: flex; align-items: center; justify-content: center;
          color: #a8a29e;
          margin-bottom: 4px;
        }
        .ia-empty-title { font-size:13px; font-weight:500; color:#1c1917; }
        .ia-empty-desc  { font-size:12px; font-weight:300; color:#a8a29e; }

        /* Loading */
        .ia-loading { display:flex; align-items:center; justify-content:center; padding:60px 0; }
        .ia-spinner { width:18px; height:18px; border:2px solid #e7e5e4; border-top-color:#1c1917; border-radius:50%; animation:iaspin .7s linear infinite; }
        @keyframes iaspin { to { transform:rotate(360deg); } }

        @media (max-width:1024px) {
          .ia-sidebar { display:none; }
          .ia-main    { margin-left:0; }
          .ia-topbar  { padding:20px; flex-wrap:wrap; }
          .ia-body    { grid-template-columns:1fr; }
          .ia-left    { border-right:none; border-bottom:1px solid #e7e5e4; }
          .ia-stats   { grid-template-columns: repeat(4,1fr); }
          .ia-stat:nth-child(2n)        { border-right:1px solid #e7e5e4; }
          .ia-stat:nth-child(4n)        { border-right:none; }
          .ia-right   { padding:20px; }
          .ia-mastery-col { display:none; }
          .ia-counters { gap:12px; }
        }
        @media (max-width:600px) {
          .ia-stats { grid-template-columns:1fr 1fr; }
          .ia-stat:nth-child(2n) { border-right:none; }
        }
      `}</style>

      <div className="ia-root">
        {/* ── Sidebar ── */}
        <aside className="ia-sidebar">
          <div className="ia-brand">
            <div className="ia-brand-icon">
              <GraduationCap size={14} />
            </div>
            <span className="ia-brand-name">PLPAC</span>
            <span className="ia-brand-badge">Instructor</span>
          </div>

          <nav className="ia-nav">
            {[
              {
                icon: BarChart3,
                label: "Overview",
                href: "/instructor/courses",
                active: false,
              },
              {
                icon: Users,
                label: "Analytics",
                href: "/instructor/analytics",
                active: true,
              },
            ].map(({ icon: Icon, label, href, active }) => (
              <button
                key={label}
                onClick={() => router.push(href)}
                className={`ia-nav-btn${active ? " active" : ""}`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </nav>

          <div className="ia-sidebar-footer">
            <div className="ia-user-row">
              <div className="ia-user-avatar">
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="ia-user-name">{user.displayName}</div>
                <div className="ia-user-role">Instructor</div>
              </div>
            </div>
            <button onClick={handleSignOut} className="ia-signout">
              <LogOut size={13} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="ia-main">
          {/* ── Top bar ── */}
          <div className="ia-topbar">
            <div>
              <h1 className="ia-heading">Analytics</h1>
              <p className="ia-sub">
                Student progress across all your courses.
              </p>
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="ia-select"
            >
              <option value="all">All courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div className="ia-body">
            {/* ── Left stats panel ── */}
            <div className="ia-left">
              <div className="ia-stats">
                {[
                  {
                    label: "Topics tracked",
                    value: filtered.length,
                    icon: BookOpen,
                  },
                  {
                    label: "Avg mastery",
                    value: fetching ? "—" : `${overallAvg}%`,
                    icon: TrendingUp,
                  },
                  {
                    label: "Mastered",
                    value: fetching ? "—" : totalMastered,
                    icon: CheckCircle2,
                  },
                  {
                    label: "Struggling",
                    value: fetching ? "—" : totalStruggling,
                    icon: AlertTriangle,
                  },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="ia-stat">
                    <Icon size={13} className="ia-stat-icon" />
                    <div className="ia-stat-value">{value}</div>
                    <div className="ia-stat-label">{label}</div>
                  </div>
                ))}
              </div>

              <div className="ia-summary-block">
                <div className="ia-summary-label">Topics shown</div>
                <div className="ia-summary-value">{filtered.length}</div>
                <div className="ia-summary-sub">
                  {selectedCourse === "all" ?
                    "Across all courses"
                  : (courses.find((c) => c.id === selectedCourse)?.title ?? "")}
                </div>
              </div>
            </div>

            {/* ── Right panel ── */}
            <div className="ia-right">
              <div className="ia-section-label">
                Topic breakdown — lowest mastery first
              </div>

              {fetching ?
                <div className="ia-loading">
                  <div className="ia-spinner" />
                </div>
              : filtered.length === 0 ?
                <div className="ia-table-card">
                  <div className="ia-empty">
                    <div className="ia-empty-icon">
                      <Brain size={16} />
                    </div>
                    <div className="ia-empty-title">No data yet</div>
                    <p className="ia-empty-desc">
                      Students need to attempt quizzes before analytics appear.
                    </p>
                  </div>
                </div>
              : <div className="ia-table-card">
                  <div className="ia-table-header">
                    <span className="ia-table-title">
                      {filtered.length} topic{filtered.length !== 1 ? "s" : ""}
                    </span>
                    <span className="ia-table-hint">
                      Sorted by avg mastery ↑
                    </span>
                  </div>

                  <div>
                    {[...filtered]
                      .sort((a, b) => a.avgMastery - b.avgMastery)
                      .map((s) => (
                        <div key={s.topic.id} className="ia-row">
                          {/* Left: name + course + badge */}
                          <div className="ia-row-left">
                            <div className="ia-row-name">{s.topic.title}</div>
                            <div className="ia-row-course">{s.courseName}</div>
                            <div className="ia-row-tags">
                              <span className="ia-diff-badge">
                                {difficultyLabel[s.topic.difficultyLevel]}
                              </span>
                            </div>
                          </div>

                          {/* Mastery bar */}
                          <div className="ia-mastery-col">
                            <div className="ia-mastery-row">
                              <span className="ia-mastery-label">
                                Avg mastery
                              </span>
                              <span
                                className="ia-mastery-pct"
                                style={{ color: scoreColor(s.avgMastery) }}
                              >
                                {s.avgMastery}%
                              </span>
                            </div>
                            <div className="ia-bar-track">
                              <div
                                className="ia-bar-fill"
                                style={{
                                  width: `${s.avgMastery}%`,
                                  background: barColor(s.avgMastery),
                                }}
                              />
                            </div>
                          </div>

                          {/* Counters */}
                          <div className="ia-counters">
                            <div className="ia-counter">
                              <div className="ia-counter-value">
                                {s.uniqueStudents}
                              </div>
                              <div className="ia-counter-label">Students</div>
                            </div>
                            <div className="ia-counter">
                              <div className="ia-counter-value ia-counter-value--green">
                                {s.masteredCount}
                              </div>
                              <div className="ia-counter-label">Mastered</div>
                            </div>
                            <div className="ia-counter">
                              <div className="ia-counter-value ia-counter-value--red">
                                {s.strugglingCount}
                              </div>
                              <div className="ia-counter-label">Struggling</div>
                            </div>
                            <div className="ia-counter">
                              <div className="ia-counter-value">
                                {s.totalAttempts}
                              </div>
                              <div className="ia-counter-label">Attempts</div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              }
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
