"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getCourse,
  getCourseTopics,
  getUserProgress,
  saveQuizSession,
} from "@/lib/firestore";
import { Course, Topic, LearnerProgress } from "@/types";
import { ChevronLeft, Lock, ArrowRight, Layers } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";

export default function CourseDetailPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const { courseId } = useParams<{ courseId: string }>();

  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, LearnerProgress>>({});
  const [fetching, setFetching] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user || !courseId) return;
    Promise.all([
      getCourse(courseId),
      getCourseTopics(courseId),
      getUserProgress(user.uid),
    ]).then(([c, t, progress]) => {
      setCourse(c);
      setTopics(t);
      const map: Record<string, LearnerProgress> = {};
      progress.forEach((p: LearnerProgress) => { map[p.topicId] = p; });
      setProgressMap(map);
    }).finally(() => setFetching(false));
  }, [user, courseId]);

  const isUnlocked = (topic: Topic) => {
    if (!topic.prerequisiteIds?.length) return true;
    return topic.prerequisiteIds.every((pid) => progressMap[pid]?.mastered === true);
  };

  const handleStartQuiz = async (topic: Topic) => {
    if (!user) return;
    setStartingQuiz(topic.id);
    try {
      const sessionId = await saveQuizSession({
        uid: user.uid,
        topicId: topic.id,
        courseId,
        questions: [],
        answers: {},
        currentIndex: 0,
        score: 0,
        completed: false,
        startedAt: new Date(),
      });
      router.push(`/quiz/${topic.id}__${courseId}__${sessionId}`);
    } finally {
      setStartingQuiz(null);
    }
  };

  if (loading || !user) {
    return (
      <>
        <style>{`
          .cd-spin-root { min-height:100vh; background:#faf9f7; display:flex; align-items:center; justify-content:center; }
          .cd-spinner { width:20px; height:20px; border:2px solid #e7e5e4; border-top-color:#1c1917; border-radius:50%; animation:cdspin .7s linear infinite; }
          @keyframes cdspin { to { transform:rotate(360deg); } }
        `}</style>
        <div className="cd-spin-root"><div className="cd-spinner" /></div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;1,300&family=Geist:wght@300;400;500&display=swap');

        .cd-root { min-height:100vh; background:#faf9f7; display:flex; font-family:'Geist',sans-serif; color:#1c1917; }
        .cd-main { flex:1; margin-left:220px; min-width:0; display:flex; flex-direction:column; }

        /* ── Top bar ── */
        .cd-topbar {
          padding: 20px 40px;
          border-bottom: 1px solid #e7e5e4;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .cd-back {
          display: inline-flex; align-items: center; gap: 5px;
          font-size: 12px; font-weight: 400; color: #a8a29e;
          background: none; border: none; cursor: pointer;
          font-family: 'Geist', sans-serif;
          transition: color .15s;
          padding: 0;
        }
        .cd-back:hover { color: #1c1917; }
        .cd-back-sep { color: #e7e5e4; font-size: 14px; }
        .cd-back-course { font-size: 13px; font-weight: 400; color: #78716c; }

        /* ── Course header ── */
        .cd-header {
          padding: 32px 40px 28px;
          border-bottom: 1px solid #e7e5e4;
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }
        .cd-header-index {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 40px;
          color: #e7e5e4;
          line-height: 1;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .cd-header-body { flex: 1; min-width: 0; }
        .cd-header-title {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 26px;
          color: #1c1917;
          line-height: 1.2;
          margin-bottom: 8px;
        }
        .cd-header-desc {
          font-size: 14px; font-weight: 300; color: #78716c;
          line-height: 1.7; max-width: 560px; margin-bottom: 14px;
        }
        .cd-header-meta {
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .cd-meta-item {
          display: flex; align-items: center; gap: 5px;
          font-size: 11px; font-weight: 400; color: #a8a29e;
        }
        .cd-meta-badge {
          font-size: 10px; font-weight: 500;
          letter-spacing: .06em; text-transform: uppercase;
          color: #a8a29e; background: #f5f4f2;
          padding: 3px 8px; border-radius: 3px;
        }

        /* ── Topics section ── */
        .cd-body { padding: 32px 40px 48px; }
        .cd-section-label {
          font-size: 11px; font-weight: 500;
          letter-spacing: .08em; text-transform: uppercase;
          color: #a8a29e; margin-bottom: 16px;
        }

        /* ── Topic table ── */
        .cd-topics {
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }
        .cd-topic-row {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-bottom: 1px solid #e7e5e4;
          transition: background .15s;
        }
        .cd-topic-row:last-child { border-bottom: none; }
        .cd-topic-row.unlocked:hover { background: #faf9f7; }
        .cd-topic-row.locked { opacity: .55; }

        .cd-topic-num {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size: 18px;
          color: #d6d3d1; line-height: 1;
          width: 28px; flex-shrink: 0; text-align: right;
        }
        .cd-topic-info { flex: 1; min-width: 0; }
        .cd-topic-title {
          font-size: 13px; font-weight: 500; color: #1c1917;
          margin-bottom: 4px;
        }

        /* mastery bar */
        .cd-mastery-row {
          display: flex; align-items: center; gap: 8px; margin-top: 6px;
        }
        .cd-mastery-bar-wrap {
          flex: 1; max-width: 160px;
          height: 3px; background: #f0ede8; border-radius: 2px; overflow: hidden;
        }
        .cd-mastery-bar-fill {
          height: 100%; background: #1c1917;
          border-radius: 2px; transition: width .4s ease;
        }
        .cd-mastery-pct {
          font-size: 11px; font-weight: 400; color: #a8a29e;
        }

        /* badges */
        .cd-badge {
          font-size: 10px; font-weight: 500;
          letter-spacing: .05em; text-transform: uppercase;
          padding: 3px 8px; border-radius: 3px;
          display: inline-flex; align-items: center; gap: 4px;
        }
        .cd-badge-mastered { color: #16a34a; background: #f0fdf4; }
        .cd-badge-progress { color: #b45309; background: #fffbeb; }
        .cd-badge-locked   { color: #a8a29e; background: #f5f4f2; }

        /* quiz button */
        .cd-quiz-btn {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'Geist', sans-serif;
          font-size: 12px; font-weight: 500;
          color: #faf9f7; background: #1c1917;
          border: none; border-radius: 4px;
          padding: 8px 16px; cursor: pointer;
          white-space: nowrap; flex-shrink: 0;
          transition: background .15s, opacity .15s;
          letter-spacing: .03em;
        }
        .cd-quiz-btn:hover:not(:disabled) { background: #292524; }
        .cd-quiz-btn:disabled { opacity: .45; cursor: not-allowed; }
        .cd-quiz-btn-ghost {
          background: none; color: #a8a29e; border: 1px solid #e7e5e4;
        }
        .cd-quiz-btn-ghost:hover:not(:disabled) { background: #f5f4f2; color: #1c1917; }

        /* spinner */
        .cd-btn-spinner {
          width: 12px; height: 12px;
          border: 1.5px solid rgba(255,255,255,.3); border-top-color: #fff;
          border-radius: 50%; animation: cdspin .7s linear infinite;
        }
        @keyframes cdspin { to { transform: rotate(360deg); } }

        /* empty */
        .cd-empty {
          padding: 40px 20px;
          display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
        }
        .cd-empty-title { font-size: 14px; font-weight: 400; color: #78716c; }
        .cd-empty-sub { font-size: 13px; font-weight: 300; color: #a8a29e; }

        /* loading */
        .cd-loading {
          display: flex; align-items: center; gap: 10px;
          padding: 40px 0;
          font-size: 13px; font-weight: 300; color: #a8a29e;
        }
        .cd-spinner { width:18px; height:18px; border:2px solid #e7e5e4; border-top-color:#1c1917; border-radius:50%; animation:cdspin .7s linear infinite; }

        @media (max-width: 1024px) {
          .cd-main { margin-left: 0; }
          .cd-topbar, .cd-header, .cd-body { padding-left: 20px; padding-right: 20px; }
        }
      `}</style>

      <div className="cd-root">
        <Sidebar />

        <main className="cd-main">

          {/* Breadcrumb top bar */}
          <div className="cd-topbar">
            <button className="cd-back" onClick={() => router.push("/learn")}>
              <ChevronLeft size={13} /> Courses
            </button>
            {course && (
              <>
                <span className="cd-back-sep">/</span>
                <span className="cd-back-course">{course.title}</span>
              </>
            )}
          </div>

          {fetching ? (
            <div style={{ padding: "40px" }}>
              <div className="cd-loading">
                <div className="cd-spinner" />
                Loading course…
              </div>
            </div>
          ) : (
            <>
              {/* Course header */}
              <div className="cd-header">
                <div className="cd-header-index">
                  {String(topics.length).padStart(2, "0")}
                </div>
                <div className="cd-header-body">
                  <h1 className="cd-header-title">{course?.title}</h1>
                  <p className="cd-header-desc">{course?.description}</p>
                  <div className="cd-header-meta">
                    <span className="cd-meta-item">
                      <Layers size={11} /> {topics.length} topics
                    </span>
                    <span className="cd-meta-item">Adaptive difficulty</span>
                    <span className="cd-meta-badge">Free</span>
                  </div>
                </div>
              </div>

              {/* Topics */}
              <div className="cd-body">
                <div className="cd-section-label">Course topics</div>

                {topics.length === 0 ? (
                  <div className="cd-topics">
                    <div className="cd-empty">
                      <p className="cd-empty-title">No topics yet</p>
                      <p className="cd-empty-sub">The instructor hasn&apos;t added any topics yet.</p>
                    </div>
                  </div>
                ) : (
                  <div className="cd-topics">
                    {topics.map((topic, idx) => {
                      const unlocked = isUnlocked(topic);
                      const progress = progressMap[topic.id];
                      const mastery = progress?.masteryScore ?? null;
                      const mastered = progress?.mastered ?? false;
                      const isStarting = startingQuiz === topic.id;

                      return (
                        <div
                          key={topic.id}
                          className={`cd-topic-row ${unlocked ? "unlocked" : "locked"}`}
                        >
                          {/* Number */}
                          <div className="cd-topic-num">
                            {String(idx + 1).padStart(2, "0")}
                          </div>

                          {/* Info */}
                          <div className="cd-topic-info">
                            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                              <span className="cd-topic-title">{topic.title}</span>
                              {mastered && (
                                <span className="cd-badge cd-badge-mastered">Mastered</span>
                              )}
                              {!mastered && mastery !== null && (
                                <span className="cd-badge cd-badge-progress">{mastery}% mastery</span>
                              )}
                              {!unlocked && (
                                <span className="cd-badge cd-badge-locked">
                                  <Lock size={9} /> Locked
                                </span>
                              )}
                            </div>
                            {mastery !== null && (
                              <div className="cd-mastery-row">
                                <div className="cd-mastery-bar-wrap">
                                  <div
                                    className="cd-mastery-bar-fill"
                                    style={{ width: `${mastery}%` }}
                                  />
                                </div>
                                <span className="cd-mastery-pct">{mastery}%</span>
                              </div>
                            )}
                          </div>

                          {/* Action */}
                          {unlocked && (
                            <button
                              onClick={() => handleStartQuiz(topic)}
                              disabled={isStarting}
                              className={`cd-quiz-btn ${mastery !== null ? "cd-quiz-btn-ghost" : ""}`}
                            >
                              {isStarting ? (
                                <div className="cd-btn-spinner" />
                              ) : (
                                <ArrowRight size={12} />
                              )}
                              {mastery !== null ? "Retake quiz" : "Start quiz"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}