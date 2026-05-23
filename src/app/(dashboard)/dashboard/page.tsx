"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getUserProgress, getUserSessions, getCourses,
  getUserProfile,
} from "@/lib/firestore";
import {
  BookOpen, Brain, Flame, Star, TrendingUp, Clock,
  ChevronRight, CheckCircle2, XCircle,
} from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import { Course, Topic } from "@/types";

// ─── Local types ────────────────────────────────────────────────────────────

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

// ─── Page ───────────────────────────────────────────────────────────────────

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

  // Stable reference so we can safely include it in deps
  const stableUpdateUser = useCallback(
    (data: Parameters<typeof updateUser>[0]) => updateUser(data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    if (!user?.uid) return;
    Promise.all([
      getUserProgress(user.uid),
      getUserSessions(user.uid),
      getCourses(),
      getUserProfile(user.uid),
    ]).then(([progress, userSessions, allCourses, freshProfile]) => {
      if (freshProfile) {
        stableUpdateUser({ xp: freshProfile.xp ?? 0, streak: freshProfile.streak ?? 0 });
      }
      const typed = progress as ProgressEntry[];
      const activeCourseIds = new Set(
        typed.map((p) => p.courseId).filter(Boolean)
      );
      setCoursesCount(activeCourseIds.size || allCourses.length);
      setMasteredCount(typed.filter((p) => p.mastered).length);
      setSessions(userSessions as UserSession[]);
    }).finally(() => setFetching(false));
  }, [user?.uid, stableUpdateUser]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "XP earned",       value: user.xp ?? 0,                      icon: Star,     color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/20"  },
    { label: "Day streak",      value: user.streak ?? 0,                   icon: Flame,    color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
    { label: "Courses",         value: fetching ? "—" : coursesCount,      icon: BookOpen, color: "text-blue-400",   bg: "bg-blue-500/10 border-blue-500/20"    },
    { label: "Mastered topics", value: fetching ? "—" : masteredCount,     icon: Brain,    color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  ];

  const formatDate = (
    val: { toDate?: () => Date } | Date | string | number | null | undefined
  ) => {
    if (!val) return "—";
    const d =
      val instanceof Date
        ? val
        : typeof val === "object" && "toDate" in val && typeof val.toDate === "function"
          ? val.toDate()
          : new Date(val as string | number);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <Sidebar />

      {/* ── Main content ── */}
      {/* ml-60 on large screens; no margin on mobile (sidebar overlays or is hidden) */}
      <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 w-full min-w-0">

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Good day, {user.displayName?.split(" ")[0]} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Ready to continue learning? Here&apos;s your overview.
          </p>
        </div>

        {/* Stats grid — 2 cols on mobile, 4 on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 sm:p-5 ${bg} flex flex-col gap-2 sm:gap-3`}>
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <Icon size={16} className={color} />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
                <p className="text-slate-500 text-xs mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Cards grid — 1 col on mobile, 2 on lg */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Continue learning */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm sm:text-base">Continue learning</h2>
              <button
                onClick={() => router.push("/learn")}
                className="text-purple-400 text-xs hover:text-purple-300 flex items-center gap-1"
              >
                Browse all <ChevronRight size={12} />
              </button>
            </div>

            {masteredCount === 0 && !fetching ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-3">
                  <BookOpen size={20} className="text-purple-400" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No courses yet</p>
                <p className="text-slate-600 text-xs mt-1">Enrol in a course to get started</p>
                <button
                  onClick={() => router.push("/learn")}
                  className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  Browse courses
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-slate-500 text-xs mb-2">Pick up where you left off</p>
                <button
                  onClick={() => router.push("/learn")}
                  className="flex items-center justify-between px-3 sm:px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Brain size={14} className="text-purple-400" />
                    </div>
                    <span className="text-white text-sm font-medium">Continue learning</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                </button>
                <button
                  onClick={() => router.push("/progress")}
                  className="flex items-center justify-between px-3 sm:px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0">
                      <TrendingUp size={14} className="text-teal-400" />
                    </div>
                    <span className="text-white text-sm font-medium">View full progress</span>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-slate-300 transition-colors" />
                </button>
              </div>
            )}
          </div>

          {/* Recent activity */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm sm:text-base">Recent activity</h2>
              <button
                onClick={() => router.push("/progress")}
                className="text-purple-400 text-xs hover:text-purple-300 flex items-center gap-1"
              >
                View all <ChevronRight size={12} />
              </button>
            </div>

            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-3">
                  <Clock size={20} className="text-teal-400" />
                </div>
                <p className="text-slate-400 text-sm font-medium">No activity yet</p>
                <p className="text-slate-600 text-xs mt-1">Your learning sessions will appear here</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {sessions.slice(0, 5).map((s) => {
                  const passed = (s.score ?? 0) >= 70;
                  return (
                    <div
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-white/5 rounded-xl border border-white/5"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        passed
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-red-500/10 border border-red-500/20"
                      }`}>
                        {passed
                          ? <CheckCircle2 size={13} className="text-emerald-400" />
                          : <XCircle size={13} className="text-red-400" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">Quiz completed</p>
                        <p className="text-slate-600 text-xs">{formatDate(s.startedAt)}</p>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${passed ? "text-emerald-400" : "text-red-400"}`}>
                        {s.score ?? 0}%
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Recommendations — full width */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-white font-semibold text-sm sm:text-base">AI recommendations</h2>
                <p className="text-slate-500 text-xs mt-0.5">Personalised for your learning style</p>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 sm:px-3 py-1">
                <Brain size={11} className="text-purple-400" />
                <span className="text-purple-300 text-xs hidden sm:inline">AI powered</span>
              </div>
            </div>
            <AIRecommendations uid={user.uid} learningStyle={user.learningStyle} />
          </div>

        </div>
      </main>
    </div>
  );
}

// ─── AI Recommendations ──────────────────────────────────────────────────────

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
        const { getUserProgress, getCourses, getCourseTopics } = await import("@/lib/firestore");
        const [rawProgress, courses] = await Promise.all([
          getUserProgress(uid),
          getCourses(),
        ]);

        const topicMap: Record<string, string> = {};
        await Promise.all(
          courses.map(async (c: Course) => {
            const topics = await getCourseTopics(c.id);
            topics.forEach((t: Topic) => { topicMap[t.id] = t.title; });
          })
        );

        const typed = rawProgress as ProgressEntry[];
        const weakTopics = typed
          .filter((p) => !p.mastered && p.masteryScore < 60)
          .sort((a, b) => a.masteryScore - b.masteryScore)
          .slice(0, 5)
          .map((p) => topicMap[p.topicId] ?? p.topicId);

        const prompt = weakTopics.length > 0
          ? `You are a learning coach. A student with a ${learningStyle} learning style is struggling with: ${weakTopics.join(", ")}. Give exactly 3 short, specific, actionable recommendations tailored to their learning style. Each must be one sentence. Return only a JSON array of 3 strings, no other text, no markdown.`
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
      <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-3">
          <Brain size={20} className="text-pink-400" />
        </div>
        <p className="text-slate-400 text-sm font-medium">No recommendations yet</p>
        <p className="text-slate-600 text-xs mt-1">Set your learning style to get personalised suggestions</p>
        <button
          onClick={() => router.push("/profile")}
          className="mt-4 px-4 py-2 bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/20 text-pink-300 text-xs font-medium rounded-xl transition-colors"
        >
          Set learning style
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-10 gap-3">
        <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Generating recommendations…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
        <p className="text-slate-400 text-sm">Could not load recommendations.</p>
        <button
          onClick={() => { fetched.current = false; setError(false); }}
          className="mt-3 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium rounded-xl transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    /* 1 col on mobile, 3 on md+ */
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {recs.map((rec, i) => (
        <div
          key={i}
          className="bg-white/5 border border-purple-500/10 rounded-xl p-3 sm:p-4 flex flex-col gap-2"
        >
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <span className="text-purple-400 text-xs font-bold">{i + 1}</span>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">{rec}</p>
        </div>
      ))}
    </div>
  );
}