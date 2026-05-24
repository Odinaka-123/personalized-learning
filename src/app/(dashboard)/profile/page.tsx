"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getUserProgress, getUserSessions } from "@/lib/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LearningStyle } from "@/types";
import Sidebar from "@/components/dashboard/Sidebar";
import { Eye, Headphones, BookOpen, Activity, Star, Flame, Trophy, TrendingUp, CheckCircle2 } from "lucide-react";

interface ProgressEntry { mastered: boolean; }
interface SessionEntry  { score?: number; }

const learningStyles: {
  value: LearningStyle;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  { value: "visual",      label: "Visual",           icon: Eye,       description: "You learn best through diagrams, charts, and seeing information laid out spatially." },
  { value: "auditory",    label: "Auditory",          icon: Headphones,description: "You learn best by listening, discussing, and talking through concepts." },
  { value: "reading",     label: "Reading / Writing", icon: BookOpen,  description: "You learn best through reading text and taking written notes." },
  { value: "kinesthetic", label: "Kinesthetic",       icon: Activity,  description: "You learn best through practice, hands-on activities, and doing." },
];

export default function ProfilePage() {
  const { user, loading, updateUser } = useAuthStore();
  const router = useRouter();

  const [selectedStyle, setSelectedStyle] = useState<LearningStyle | null>(user?.learningStyle ?? null);
  const [saving, setSaving]               = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [sessionCount, setSessionCount]   = useState(0);
  const [avgScore, setAvgScore]           = useState(0);
  const [fetching, setFetching]           = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserProgress(user.uid), getUserSessions(user.uid)])
      .then(([progress, sessions]: [ProgressEntry[], SessionEntry[]]) => {
        setMasteredCount(progress.filter((p) => p.mastered).length);
        setSessionCount(sessions.length);
        setAvgScore(
          sessions.length > 0
            ? Math.round(sessions.reduce((sum, s) => sum + (s.score ?? 0), 0) / sessions.length)
            : 0,
        );
      })
      .finally(() => setFetching(false));
  }, [user]);

  const handleSave = async () => {
    if (!user || !selectedStyle) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { learningStyle: selectedStyle });
      updateUser({ learningStyle: selectedStyle });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <>
        <style>{`
          .pf-spin-root { min-height:100vh; background:#faf9f7; display:flex; align-items:center; justify-content:center; }
          .pf-spinner { width:20px; height:20px; border:2px solid #e7e5e4; border-top-color:#1c1917; border-radius:50%; animation:pfspin .7s linear infinite; }
          @keyframes pfspin { to { transform:rotate(360deg); } }
        `}</style>
        <div className="pf-spin-root"><div className="pf-spinner" /></div>
      </>
    );
  }

  const stats = [
    { label: "XP earned",        value: user.xp ?? 0,                    icon: Star      },
    { label: "Day streak",       value: user.streak ?? 0,                 icon: Flame     },
    { label: "Topics mastered",  value: fetching ? "—" : masteredCount,   icon: Trophy    },
    { label: "Avg score",        value: fetching ? "—" : `${avgScore}%`,  icon: TrendingUp},
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;1,300&family=Geist:wght@300;400;500&display=swap');

        .pf-root  { min-height:100vh; background:#faf9f7; display:flex; font-family:'Geist',sans-serif; color:#1c1917; }
        .pf-main  { flex:1; margin-left:220px; min-width:0; display:flex; flex-direction:column; }

        /* ── Top bar ── */
        .pf-topbar {
          padding: 28px 40px 24px;
          border-bottom: 1px solid #e7e5e4;
        }
        .pf-heading {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size: 26px;
          color: #1c1917; line-height: 1.2;
        }
        .pf-sub { font-size:13px; font-weight:300; color:#a8a29e; margin-top:4px; }

        /* ── Body ── */
        .pf-body {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 0;
          flex: 1;
          border-top: none;
        }

        /* ── Left panel ── */
        .pf-left {
          border-right: 1px solid #e7e5e4;
          display: flex;
          flex-direction: column;
        }

        /* Avatar block */
        .pf-avatar-block {
          padding: 28px 24px;
          border-bottom: 1px solid #e7e5e4;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
        }
        .pf-avatar {
          width: 48px; height: 48px;
          border-radius: 50%;
          border: 1px solid #e7e5e4;
          background: #f0ede8;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; font-weight: 500;
          font-family: 'Fraunces', serif;
          color: #78716c;
        }
        .pf-name  { font-size:15px; font-weight:500; color:#1c1917; }
        .pf-email { font-size:12px; font-weight:300; color:#a8a29e; }
        .pf-pills { display:flex; gap:6px; flex-wrap:wrap; margin-top:2px; }
        .pf-pill {
          font-size:10px; font-weight:500;
          letter-spacing:.06em; text-transform:uppercase;
          color:#a8a29e; background:#f5f4f2;
          padding: 3px 8px; border-radius:3px;
        }

        /* Stats */
        .pf-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
        .pf-stat {
          padding: 20px 24px;
          border-right: 1px solid #e7e5e4;
          border-bottom: 1px solid #e7e5e4;
        }
        .pf-stat:nth-child(2n) { border-right: none; }
        .pf-stat:nth-last-child(-n+2) { border-bottom: none; }
        .pf-stat-icon { color:#a8a29e; margin-bottom:10px; }
        .pf-stat-value {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size:24px;
          color:#1c1917; line-height:1;
        }
        .pf-stat-label { font-size:11px; font-weight:400; color:#a8a29e; margin-top:4px; }

        /* Quiz count */
        .pf-quiz-block {
          padding: 20px 24px;
          border-top: 1px solid #e7e5e4;
          margin-top: auto;
        }
        .pf-quiz-label { font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; color:#a8a29e; margin-bottom:8px; }
        .pf-quiz-value {
          font-family: 'Fraunces', serif;
          font-weight: 300; font-size:32px;
          color:#1c1917; line-height:1;
        }
        .pf-quiz-sub { font-size:12px; font-weight:300; color:#c4bfba; margin-top:4px; }

        /* ── Right panel ── */
        .pf-right { padding: 28px 32px; }

        .pf-section-label {
          font-size:11px; font-weight:500;
          letter-spacing:.08em; text-transform:uppercase;
          color:#a8a29e; margin-bottom:20px;
        }

        /* Style grid */
        .pf-style-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 28px;
        }
        .pf-style-btn {
          text-align: left;
          padding: 18px 16px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          font-family: 'Geist', sans-serif;
          transition: border-color .15s, background .15s;
          position: relative;
        }
        .pf-style-btn:hover { border-color: #d6d3d1; background: #faf9f7; }
        .pf-style-btn.selected {
          border-color: #1c1917;
          background: #faf9f7;
        }
        .pf-style-icon {
          width:30px; height:30px;
          border: 1px solid #e7e5e4;
          border-radius:5px;
          display:flex; align-items:center; justify-content:center;
          color:#78716c; background:#faf9f7;
          margin-bottom:14px;
        }
        .pf-style-btn.selected .pf-style-icon {
          border-color:#1c1917; color:#1c1917; background:#fff;
        }
        .pf-style-check {
          position:absolute; top:14px; right:14px;
          color:#1c1917;
        }
        .pf-style-title {
          font-size:13px; font-weight:500; color:#1c1917; margin-bottom:5px;
        }
        .pf-style-desc {
          font-size:11px; font-weight:300; color:#a8a29e; line-height:1.6;
        }

        /* Save row */
        .pf-save-row { display:flex; align-items:center; gap:12px; }
        .pf-save-btn {
          display:inline-flex; align-items:center; gap:6px;
          font-family:'Geist',sans-serif;
          font-size:13px; font-weight:500;
          color:#faf9f7; background:#1c1917;
          border:none; border-radius:4px;
          padding:10px 22px; cursor:pointer;
          transition:background .15s, opacity .15s;
          letter-spacing:.03em;
        }
        .pf-save-btn:hover:not(:disabled) { background:#292524; }
        .pf-save-btn:disabled { opacity:.4; cursor:not-allowed; }
        .pf-save-hint { font-size:12px; font-weight:300; color:#c4bfba; }

        .pf-save-spinner {
          width:13px; height:13px;
          border:1.5px solid rgba(255,255,255,.3); border-top-color:#fff;
          border-radius:50%; animation:pfspin .7s linear infinite;
        }
        @keyframes pfspin { to { transform:rotate(360deg); } }

        @media (max-width:1024px) {
          .pf-main { margin-left:0; }
          .pf-topbar { padding:20px; }
          .pf-body { grid-template-columns:1fr; }
          .pf-left { border-right:none; border-bottom:1px solid #e7e5e4; }
          .pf-right { padding:20px; }
        }
        @media (max-width:640px) {
          .pf-style-grid { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="pf-root">
        <Sidebar />

        <main className="pf-main">

          {/* Top bar */}
          <div className="pf-topbar">
            <h1 className="pf-heading">Profile</h1>
            <p className="pf-sub">Manage your learning preferences and view your stats.</p>
          </div>

          <div className="pf-body">

            {/* ── Left panel ── */}
            <div className="pf-left">

              {/* Avatar */}
              <div className="pf-avatar-block">
                <div className="pf-avatar">
                  {user.displayName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="pf-name">{user.displayName}</div>
                  <div className="pf-email">{user.email}</div>
                </div>
                <div className="pf-pills">
                  <span className="pf-pill">{user.role}</span>
                  {user.learningStyle && (
                    <span className="pf-pill">{user.learningStyle}</span>
                  )}
                </div>
              </div>

              {/* Stats 2×2 */}
              <div className="pf-stats">
                {stats.map(({ label, value, icon: Icon }) => (
                  <div key={label} className="pf-stat">
                    <Icon size={14} className="pf-stat-icon" />
                    <div className="pf-stat-value">{value}</div>
                    <div className="pf-stat-label">{label}</div>
                  </div>
                ))}
              </div>

              {/* Quiz count */}
              <div className="pf-quiz-block">
                <div className="pf-quiz-label">Quizzes taken</div>
                <div className="pf-quiz-value">{fetching ? "—" : sessionCount}</div>
                <div className="pf-quiz-sub">Total quiz sessions completed</div>
              </div>

            </div>

            {/* ── Right panel ── */}
            <div className="pf-right">
              <div className="pf-section-label">Learning style</div>

              <div className="pf-style-grid">
                {learningStyles.map(({ value, label, description, icon: Icon }) => {
                  const selected = selectedStyle === value;
                  return (
                    <button
                      key={value}
                      onClick={() => setSelectedStyle(value)}
                      className={`pf-style-btn${selected ? " selected" : ""}`}
                    >
                      <div className="pf-style-icon"><Icon size={14} /></div>
                      {selected && <CheckCircle2 size={14} className="pf-style-check" />}
                      <div className="pf-style-title">{label}</div>
                      <div className="pf-style-desc">{description}</div>
                    </button>
                  );
                })}
              </div>

              <div className="pf-save-row">
                <button
                  onClick={handleSave}
                  disabled={!selectedStyle || saving || selectedStyle === user.learningStyle}
                  className="pf-save-btn"
                >
                  {saving ? (
                    <div className="pf-save-spinner" />
                  ) : saved ? (
                    <CheckCircle2 size={13} />
                  ) : null}
                  {saved ? "Saved" : saving ? "Saving…" : "Save preference"}
                </button>
                {user.learningStyle && selectedStyle === user.learningStyle && (
                  <span className="pf-save-hint">
                    Currently set to <em>{user.learningStyle}</em>
                  </span>
                )}
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}