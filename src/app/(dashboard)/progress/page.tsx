"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getUserProgress,
  getUserSessions,
  getCourseTopics,
  getCourses,
} from "@/lib/firestore";
import { LearnerProgress, QuizSession, Topic, Course } from "@/types";
import Sidebar from "@/components/dashboard/Sidebar";
import {
  TrendingUp,
  Brain,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  BookOpen,
  Zap,
  ChevronRight,
} from "lucide-react";

interface FirestoreTimestamp {
  toDate: () => Date;
}

interface EnrichedProgress extends LearnerProgress {
  topicTitle: string;
  courseTitle: string;
  courseId: string;
}

export default function ProgressPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();

  const [progress, setProgress] = useState<EnrichedProgress[]>([]);
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [topicMap, setTopicMap] = useState<Record<string, string>>({});
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getUserProgress(user.uid),
      getUserSessions(user.uid),
      getCourses(),
    ])
      .then(async ([rawProgress, rawSessions, courses]) => {
        setSessions(rawSessions);

        const tMap: Record<string, { title: string; courseId: string }> = {};
        await Promise.all(
          courses.map(async (course: Course) => {
            const topics = await getCourseTopics(course.id);
            topics.forEach((t: Topic) => {
              tMap[t.id] = { title: t.title, courseId: course.id };
            });
          }),
        );

        const courseMap: Record<string, string> = {};
        courses.forEach((c: Course) => {
          courseMap[c.id] = c.title;
        });

        const flatTopicMap: Record<string, string> = {};
        Object.entries(tMap).forEach(([id, val]) => {
          flatTopicMap[id] = val.title;
        });
        setTopicMap(flatTopicMap);

        const enriched: EnrichedProgress[] = rawProgress.map(
          (p: LearnerProgress) => ({
            ...p,
            topicTitle: tMap[p.topicId]?.title ?? "Unknown topic",
            courseId: tMap[p.topicId]?.courseId ?? "",
            courseTitle:
              courseMap[tMap[p.topicId]?.courseId ?? ""] ?? "Unknown course",
          }),
        );

        enriched.sort((a, b) => {
          if (a.mastered !== b.mastered) return a.mastered ? 1 : -1;
          return b.masteryScore - a.masteryScore;
        });

        setProgress(enriched);
      })
      .finally(() => setFetching(false));
  }, [user]);

  const mastered = progress.filter((p) => p.mastered).length;
  const inProgress = progress.filter(
    (p) => !p.mastered && p.masteryScore > 0,
  ).length;
  const totalSessions = sessions.length;
  const avgScore =
    sessions.length > 0 ?
      Math.round(
        sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / sessions.length,
      )
    : 0;

  const stats = [
    { label: "Topics mastered", value: mastered, icon: Trophy },
    { label: "In progress", value: inProgress, icon: TrendingUp },
    { label: "Quizzes taken", value: totalSessions, icon: Brain },
    { label: "Avg score", value: `${avgScore}%`, icon: Zap },
  ];

  const getMasteryBarColor = (score: number) => {
    if (score >= 70) return "#16a34a"; // stone-green
    if (score >= 40) return "#ca8a04"; // amber
    return "#dc2626"; // red
  };

  const getMasteryLabel = (p: EnrichedProgress) => {
    if (p.mastered)
      return { text: "Mastered", cls: "pr-badge pr-badge--green" };
    if (p.masteryScore >= 40)
      return { text: "Learning", cls: "pr-badge pr-badge--amber" };
    return { text: "Needs work", cls: "pr-badge pr-badge--red" };
  };

  const formatDate = (
    val: FirestoreTimestamp | Date | string | null | undefined,
  ) => {
    if (!val) return "—";
    const d =
      (val as FirestoreTimestamp)?.toDate ?
        (val as FirestoreTimestamp).toDate()
      : new Date(val as string | Date);
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading || !user) {
    return (
      <>
        <style>{`
          .pr-spin-root { min-height:100vh; background:#faf9f7; display:flex; align-items:center; justify-content:center; }
          .pr-spinner { width:20px; height:20px; border:2px solid #e7e5e4; border-top-color:#1c1917; border-radius:50%; animation:prspin .7s linear infinite; }
          @keyframes prspin { to { transform:rotate(360deg); } }
        `}</style>
        <div className="pr-spin-root">
          <div className="pr-spinner" />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;1,300&family=Geist:wght@300;400;500&display=swap');

        .pr-root  { min-height:100vh; background:#faf9f7; display:flex; font-family:'Geist',sans-serif; color:#1c1917; }
        .pr-main  { flex:1; margin-left:220px; min-width:0; display:flex; flex-direction:column; }

        /* ── Top bar ── */
        .pr-topbar {
          padding: 28px 40px 24px;
          border-bottom: 1px solid #e7e5e4;
        }
        .pr-heading {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size: 26px;
          color: #1c1917; line-height: 1.2;
        }
        .pr-sub { font-size:13px; font-weight:300; color:#a8a29e; margin-top:4px; }

        /* ── Body ── */
        .pr-body {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 0;
          flex: 1;
        }

        /* ── Left panel ── */
        .pr-left {
          border-right: 1px solid #e7e5e4;
          display: flex;
          flex-direction: column;
        }

        /* Stats 2×2 */
        .pr-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .pr-stat {
          padding: 20px 24px;
          border-right: 1px solid #e7e5e4;
          border-bottom: 1px solid #e7e5e4;
        }
        .pr-stat:nth-child(2n)      { border-right: none; }
        .pr-stat:nth-last-child(-n+2) { border-bottom: none; }
        .pr-stat-icon  { color:#a8a29e; margin-bottom:10px; }
        .pr-stat-value {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size:24px;
          color:#1c1917; line-height:1;
        }
        .pr-stat-label { font-size:11px; font-weight:400; color:#a8a29e; margin-top:4px; }

        /* Session count at bottom of left panel */
        .pr-session-block {
          padding: 20px 24px;
          border-top: 1px solid #e7e5e4;
          margin-top: auto;
        }
        .pr-session-label { font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:#a8a29e; margin-bottom:8px; }
        .pr-session-value {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size:32px;
          color:#1c1917; line-height:1;
        }
        .pr-session-sub { font-size:12px; font-weight:300; color:#c4bfba; margin-top:4px; }

        /* ── Right panel ── */
        .pr-right { padding: 28px 32px; display:flex; flex-direction:column; gap:28px; }

        .pr-section-label {
          font-size:11px; font-weight:500;
          letter-spacing:.08em; text-transform:uppercase;
          color:#a8a29e; margin-bottom:16px;
        }

        /* Topic mastery list */
        .pr-topic-list { display:flex; flex-direction:column; gap:8px; }

        .pr-topic-card {
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: #fff;
          padding: 14px 16px;
        }

        .pr-topic-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .pr-topic-name {
          font-size: 13px;
          font-weight: 500;
          color: #1c1917;
        }
        .pr-topic-course {
          font-size: 11px;
          font-weight: 300;
          color: #a8a29e;
          margin-top: 2px;
        }

        .pr-topic-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .pr-topic-score {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 18px;
          color: #1c1917;
        }

        .pr-topic-chevron {
          color: #a8a29e;
          cursor: pointer;
          transition: color .15s;
          background: none;
          border: none;
          display: flex;
          padding: 0;
        }
        .pr-topic-chevron:hover { color: #1c1917; }

        /* Progress bar */
        .pr-bar-track {
          height: 3px;
          background: #f0ede8;
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .pr-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width .3s;
        }

        .pr-topic-meta {
          display: flex;
          justify-content: space-between;
        }
        .pr-topic-meta-text {
          font-size: 11px;
          font-weight: 300;
          color: #c4bfba;
        }

        /* Badges */
        .pr-badge {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 3px;
        }
        .pr-badge--green { color: #166534; background: #f0fdf4; }
        .pr-badge--amber { color: #92400e; background: #fffbeb; }
        .pr-badge--red   { color: #991b1b; background: #fef2f2; }

        /* Empty state */
        .pr-empty {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 32px 0;
          gap: 10px;
        }
        .pr-empty-icon {
          width: 36px; height: 36px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          color: #a8a29e; background: #fff;
        }
        .pr-empty-title { font-size:13px; font-weight:500; color:#1c1917; }
        .pr-empty-desc  { font-size:12px; font-weight:300; color:#a8a29e; }
        .pr-empty-btn {
          margin-top: 4px;
          font-family: 'Geist', sans-serif;
          font-size: 12px; font-weight: 500;
          color: #faf9f7; background: #1c1917;
          border: none; border-radius: 4px;
          padding: 8px 18px; cursor: pointer;
          transition: background .15s;
          letter-spacing: .03em;
        }
        .pr-empty-btn:hover { background: #292524; }

        /* Recent quizzes */
        .pr-quiz-list { display:flex; flex-direction:column; gap:6px; }
        .pr-quiz-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: #fff;
        }
        .pr-quiz-icon {
          width: 32px; height: 32px;
          border-radius: 5px;
          border: 1px solid #e7e5e4;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pr-quiz-icon--pass { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
        .pr-quiz-icon--fail { background: #fef2f2; border-color: #fecaca; color: #991b1b; }

        .pr-quiz-name  { font-size:12px; font-weight:500; color:#1c1917; }
        .pr-quiz-date  { font-size:11px; font-weight:300; color:#a8a29e; margin-top:1px; }
        .pr-quiz-score {
          margin-left: auto;
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 16px;
          flex-shrink: 0;
        }
        .pr-quiz-score--pass { color: #166534; }
        .pr-quiz-score--fail { color: #991b1b; }

        .pr-more { font-size:12px; font-weight:300; color:#c4bfba; text-align:center; padding-top:4px; }

        /* Loading */
        .pr-loading { display:flex; align-items:center; justify-content:center; padding:80px 0; }
        .pr-spinner { width:20px; height:20px; border:2px solid #e7e5e4; border-top-color:#1c1917; border-radius:50%; animation:prspin .7s linear infinite; }
        @keyframes prspin { to { transform:rotate(360deg); } }

        /* Two-column section row */
        .pr-cols {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 24px;
        }

        @media (max-width:1200px) {
          .pr-cols { grid-template-columns: 1fr; }
        }
        @media (max-width:1024px) {
          .pr-main { margin-left:0; }
          .pr-topbar { padding:20px; }
          .pr-body { grid-template-columns:1fr; }
          .pr-left { border-right:none; border-bottom:1px solid #e7e5e4; }
          .pr-right { padding:20px; }
          .pr-stats { grid-template-columns: repeat(4,1fr); }
          .pr-stat:nth-child(2n)        { border-right:1px solid #e7e5e4; }
          .pr-stat:nth-child(4n)        { border-right:none; }
          .pr-stat:nth-last-child(-n+2) { border-bottom:1px solid #e7e5e4; }
          .pr-stat:last-child           { border-bottom:none; }
        }
        @media (max-width:600px) {
          .pr-stats { grid-template-columns:1fr 1fr; }
          .pr-stat:nth-child(2n) { border-right:none; }
        }
      `}</style>

      <div className="pr-root">
        <Sidebar />

        <main className="pr-main">
          {/* Top bar */}
          <div className="pr-topbar">
            <h1 className="pr-heading">Your progress</h1>
            <p className="pr-sub">
              Track your mastery across all topics and courses.
            </p>
          </div>

          {fetching ?
            <div className="pr-loading">
              <div className="pr-spinner" />
            </div>
          : <div className="pr-body">
              {/* ── Left panel: stats ── */}
              <div className="pr-left">
                <div className="pr-stats">
                  {stats.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="pr-stat">
                      <Icon size={14} className="pr-stat-icon" />
                      <div className="pr-stat-value">{value}</div>
                      <div className="pr-stat-label">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Recent quizzes count */}
                <div className="pr-session-block">
                  <div className="pr-session-label">Recent quizzes</div>
                  <div className="pr-session-value">{totalSessions}</div>
                  <div className="pr-session-sub">
                    Total quiz sessions completed
                  </div>
                </div>
              </div>

              {/* ── Right panel ── */}
              <div className="pr-right">
                <div className="pr-cols">
                  {/* Topic mastery */}
                  <div>
                    <div className="pr-section-label">Topic mastery</div>

                    {progress.length === 0 ?
                      <div className="pr-empty">
                        <div className="pr-empty-icon">
                          <BookOpen size={16} />
                        </div>
                        <div className="pr-empty-title">No progress yet</div>
                        <div className="pr-empty-desc">
                          Take a quiz to start tracking your mastery.
                        </div>
                        <button
                          onClick={() => router.push("/learn")}
                          className="pr-empty-btn"
                        >
                          Browse courses
                        </button>
                      </div>
                    : <div className="pr-topic-list">
                        {progress.map((p) => {
                          const label = getMasteryLabel(p);
                          return (
                            <div key={p.topicId} className="pr-topic-card">
                              <div className="pr-topic-row">
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <span className="pr-topic-name">
                                      {p.topicTitle}
                                    </span>
                                    <span className={label.cls}>
                                      {label.text}
                                    </span>
                                  </div>
                                  <div className="pr-topic-course">
                                    {p.courseTitle}
                                  </div>
                                </div>
                                <div className="pr-topic-right">
                                  <span className="pr-topic-score">
                                    {p.masteryScore}%
                                  </span>
                                  <button
                                    onClick={() =>
                                      router.push(`/learn/${p.courseId}`)
                                    }
                                    className="pr-topic-chevron"
                                    aria-label="Go to course"
                                  >
                                    <ChevronRight size={15} />
                                  </button>
                                </div>
                              </div>
                              <div className="pr-bar-track">
                                <div
                                  className="pr-bar-fill"
                                  style={{
                                    width: `${p.masteryScore}%`,
                                    background: getMasteryBarColor(
                                      p.masteryScore,
                                    ),
                                  }}
                                />
                              </div>
                              <div className="pr-topic-meta">
                                <span className="pr-topic-meta-text">
                                  {p.attempts} attempt
                                  {p.attempts !== 1 ? "s" : ""}
                                </span>
                                <span className="pr-topic-meta-text">
                                  {formatDate(p.lastAttemptAt)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    }
                  </div>

                  {/* Recent quizzes */}
                  <div>
                    <div className="pr-section-label">Recent quizzes</div>

                    {sessions.length === 0 ?
                      <div className="pr-empty">
                        <div className="pr-empty-icon">
                          <Clock size={16} />
                        </div>
                        <div className="pr-empty-title">No quizzes yet</div>
                        <div className="pr-empty-desc">
                          Completed quizzes appear here.
                        </div>
                      </div>
                    : <div className="pr-quiz-list">
                        {sessions.slice(0, 8).map((s) => {
                          const passed = (s.score ?? 0) >= 70;
                          return (
                            <div key={s.id} className="pr-quiz-row">
                              <div
                                className={`pr-quiz-icon ${passed ? "pr-quiz-icon--pass" : "pr-quiz-icon--fail"}`}
                              >
                                {passed ?
                                  <CheckCircle2 size={13} />
                                : <XCircle size={13} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  className="pr-quiz-name"
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {topicMap[s.topicId] ?? "Quiz"}
                                </div>
                                <div className="pr-quiz-date">
                                  {formatDate(s.startedAt)}
                                </div>
                              </div>
                              <span
                                className={`pr-quiz-score ${passed ? "pr-quiz-score--pass" : "pr-quiz-score--fail"}`}
                              >
                                {s.score ?? 0}%
                              </span>
                            </div>
                          );
                        })}
                        {sessions.length > 8 && (
                          <p className="pr-more">
                            +{sessions.length - 8} more sessions
                          </p>
                        )}
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </main>
      </div>
    </>
  );
}
