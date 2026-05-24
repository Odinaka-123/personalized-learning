"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getTopicQuestions,
  updateQuizSession,
  upsertProgress,
  awardXP,
} from "@/lib/firestore";
import {
  adaptDifficulty,
  selectNextQuestion,
  calculateMastery,
  hasMastered,
} from "@/lib/adaptiveEngine";
import { QuizQuestion, AdaptiveState } from "@/types";
import {
  Brain,
  CheckCircle,
  XCircle,
  ChevronRight,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
} from "lucide-react";

const difficultyLabel: Record<number, string> = {
  1: "Beginner",
  2: "Easy",
  3: "Intermediate",
  4: "Hard",
  5: "Advanced",
};

export default function QuizPage() {
  const { user, loading, updateUser } = useAuthStore();
  const router = useRouter();
  const { quizId } = useParams<{ quizId: string }>();

  const [topicId, sessionId] = quizId?.split("__") ?? [];

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null,
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [fetching, setFetching] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [difficultyChange, setDifficultyChange] = useState<
    "up" | "down" | null
  >(null);
  const [masteryScore, setMasteryScore] = useState(0);
  const [mastered, setMastered] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const [adaptive, setAdaptive] = useState<AdaptiveState>({
    currentDifficulty: 1,
    correctStreak: 0,
    incorrectStreak: 0,
    masteryScore: 0,
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (topicId) {
      getTopicQuestions(topicId)
        .then((qs) => {
          setQuestions(qs);
          if (qs.length > 0) {
            const first = selectNextQuestion(qs, [], 1);
            setCurrentQuestion(first);
          }
        })
        .finally(() => setFetching(false));
    }
  }, [topicId]);

  const handleNext = useCallback(async () => {
    if (!currentQuestion || selectedAnswer === null) return;

    const wasCorrect = selectedAnswer === currentQuestion.correctIndex;
    const newAnswers = { ...answers, [currentQuestion.id]: selectedAnswer };
    const newAnsweredIds = [...answeredIds, currentQuestion.id];

    const prevDifficulty = adaptive.currentDifficulty;
    const newAdaptive = adaptDifficulty(adaptive, wasCorrect);

    setAnswers(newAnswers);
    setAnsweredIds(newAnsweredIds);
    setAdaptive(newAdaptive);

    if (newAdaptive.currentDifficulty > prevDifficulty)
      setDifficultyChange("up");
    else if (newAdaptive.currentDifficulty < prevDifficulty)
      setDifficultyChange("down");
    else setDifficultyChange(null);

    if (newAnsweredIds.length >= Math.min(10, questions.length)) {
      const finalMastery = calculateMastery(
        newAnswers,
        questions.filter((q) => newAnsweredIds.includes(q.id)),
      );
      const isMastered = hasMastered(finalMastery, 70);

      setMasteryScore(finalMastery);
      setMastered(isMastered);
      setCompleted(true);

      if (sessionId && user) {
        await updateQuizSession(sessionId, {
          answers: newAnswers,
          completed: true,
          score: finalMastery,
        });
        await upsertProgress(user.uid, topicId, {
          masteryScore: finalMastery,
          mastered: isMastered,
          attempts: 1,
        });
        const { xp, streak } = await awardXP(user.uid, finalMastery);
        const bonus =
          finalMastery >= 70 ? 20
          : finalMastery >= 40 ? 10
          : 0;
        setXpEarned(10 + bonus);
        updateUser({ xp, streak });
      }
      return;
    }

    const next = selectNextQuestion(
      questions,
      newAnsweredIds,
      newAdaptive.currentDifficulty,
    );
    setCurrentQuestion(next);
    setSelectedAnswer(null);
    setAnswered(false);
  }, [
    currentQuestion,
    selectedAnswer,
    answers,
    answeredIds,
    adaptive,
    questions,
    sessionId,
    user,
    topicId,
    updateUser,
  ]);

  const handleSelect = (index: number) => {
    if (answered) return;
    setSelectedAnswer(index);
    setAnswered(true);
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;1,300&family=Geist:wght@300;400;500&display=swap');

    .qz-root {
      min-height: 100vh;
      background: #faf9f7;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      font-family: 'Geist', sans-serif;
      color: #1c1917;
    }

    .qz-inner { width: 100%; max-width: 560px; }

    /* ── Header ── */
    .qz-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .qz-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .qz-brand-icon {
      width: 28px; height: 28px;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      color: #78716c;
    }
    .qz-brand-label {
      font-size: 13px;
      font-weight: 500;
      color: #1c1917;
    }
    .qz-header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .qz-difficulty-pill {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: .06em;
      text-transform: uppercase;
      padding: 3px 9px;
      border-radius: 3px;
      background: #f5f4f2;
      color: #78716c;
    }
    .qz-trend {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 400;
      color: #a8a29e;
    }
    .qz-trend--up   { color: #166534; }
    .qz-trend--down { color: #92400e; }

    /* ── Progress bar ── */
    .qz-track {
      height: 2px;
      background: #e7e5e4;
      border-radius: 99px;
      margin-bottom: 32px;
      overflow: hidden;
    }
    .qz-fill {
      height: 100%;
      background: #1c1917;
      border-radius: 99px;
      transition: width .4s ease;
    }

    /* ── Question card ── */
    .qz-card {
      background: #fff;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 28px;
    }
    .qz-card-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .qz-counter {
      font-size: 11px;
      font-weight: 400;
      color: #a8a29e;
    }
    .qz-level-badge {
      font-size: 10px;
      font-weight: 500;
      letter-spacing: .06em;
      text-transform: uppercase;
      padding: 3px 8px;
      border-radius: 3px;
    }
    .qz-level-badge--1 { background: #f0fdf4; color: #166534; }
    .qz-level-badge--2 { background: #f0fdfa; color: #0f766e; }
    .qz-level-badge--3 { background: #fffbeb; color: #92400e; }
    .qz-level-badge--4 { background: #fff7ed; color: #9a3412; }
    .qz-level-badge--5 { background: #fef2f2; color: #991b1b; }

    .qz-question {
      font-family: 'Fraunces', serif;
      font-weight: 300;
      font-size: 20px;
      color: #1c1917;
      line-height: 1.5;
      margin-bottom: 24px;
    }

    /* ── Options ── */
    .qz-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }

    .qz-option {
      width: 100%;
      text-align: left;
      padding: 13px 16px;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      background: #faf9f7;
      font-family: 'Geist', sans-serif;
      font-size: 13px;
      font-weight: 400;
      color: #1c1917;
      cursor: pointer;
      transition: border-color .15s, background .15s;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .qz-option:hover:not(:disabled) {
      border-color: #d6d3d1;
      background: #f5f4f2;
    }
    .qz-option:disabled { cursor: default; }

    .qz-option--correct {
      border-color: #bbf7d0;
      background: #f0fdf4;
      color: #166534;
    }
    .qz-option--wrong {
      border-color: #fecaca;
      background: #fef2f2;
      color: #991b1b;
    }
    .qz-option--muted {
      border-color: #f0ede8;
      background: #faf9f7;
      color: #c4bfba;
    }

    /* ── Explanation ── */
    .qz-explanation {
      border: 1px solid #e7e5e4;
      border-left: 3px solid #1c1917;
      border-radius: 0 6px 6px 0;
      padding: 12px 16px;
      margin-bottom: 20px;
      background: #fff;
    }
    .qz-explanation p {
      font-size: 13px;
      font-weight: 300;
      color: #57534e;
      line-height: 1.7;
      margin: 0;
    }

    /* ── Next button ── */
    .qz-next {
      width: 100%;
      padding: 13px;
      background: #1c1917;
      color: #faf9f7;
      border: none;
      border-radius: 6px;
      font-family: 'Geist', sans-serif;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background .15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      letter-spacing: .03em;
    }
    .qz-next:hover { background: #292524; }

    /* ── Results ── */
    .qz-results { text-align: center; }
    .qz-trophy {
      width: 64px; height: 64px;
      border: 1px solid #e7e5e4;
      border-radius: 12px;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 20px;
      color: #78716c;
    }
    .qz-trophy--mastered { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
    .qz-trophy--partial  { border-color: #fde68a; background: #fffbeb; color: #92400e; }

    .qz-result-heading {
      font-family: 'Fraunces', serif;
      font-weight: 300;
      font-size: 28px;
      color: #1c1917;
      margin-bottom: 6px;
    }
    .qz-result-sub {
      font-size: 13px;
      font-weight: 300;
      color: #a8a29e;
      margin-bottom: 20px;
    }

    .qz-xp-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 500;
      letter-spacing: .04em;
      color: #92400e;
      background: #fffbeb;
      border: 1px solid #fde68a;
      padding: 5px 14px;
      border-radius: 3px;
      margin-bottom: 24px;
    }

    .qz-result-card {
      background: #fff;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
      text-align: left;
    }
    .qz-result-score-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    .qz-result-score-label { font-size: 12px; font-weight: 400; color: #a8a29e; }
    .qz-result-score-value {
      font-family: 'Fraunces', serif;
      font-weight: 300;
      font-size: 28px;
      color: #1c1917;
    }

    .qz-result-bar-track {
      height: 3px;
      background: #f0ede8;
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 20px;
    }
    .qz-result-bar-fill {
      height: 100%;
      border-radius: 99px;
      transition: width .5s;
    }
    .qz-result-bar-fill--mastered { background: #16a34a; }
    .qz-result-bar-fill--partial  { background: #ca8a04; }

    .qz-result-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0;
    }
    .qz-result-stat {
      padding: 12px 0;
      border-right: 1px solid #e7e5e4;
      text-align: center;
    }
    .qz-result-stat:last-child { border-right: none; }
    .qz-result-stat-value {
      font-family: 'Fraunces', serif;
      font-weight: 300;
      font-size: 20px;
      color: #1c1917;
    }
    .qz-result-stat-label {
      font-size: 10px;
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #a8a29e;
      margin-top: 3px;
    }

    .qz-result-actions { display: flex; gap: 10px; }
    .qz-btn-secondary {
      flex: 1;
      padding: 12px;
      background: #fff;
      border: 1px solid #e7e5e4;
      border-radius: 6px;
      font-family: 'Geist', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #1c1917;
      cursor: pointer;
      transition: border-color .15s, background .15s;
      letter-spacing: .03em;
    }
    .qz-btn-secondary:hover { border-color: #d6d3d1; background: #faf9f7; }
    .qz-btn-primary {
      flex: 1;
      padding: 12px;
      background: #1c1917;
      border: none;
      border-radius: 6px;
      font-family: 'Geist', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: #faf9f7;
      cursor: pointer;
      transition: background .15s;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      letter-spacing: .03em;
    }
    .qz-btn-primary:hover { background: #292524; }

    /* ── Empty / loading ── */
    .qz-center {
      min-height: 100vh;
      background: #faf9f7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Geist', sans-serif;
    }
    .qz-empty { text-align: center; }
    .qz-empty-icon {
      width: 48px; height: 48px;
      border: 1px solid #e7e5e4;
      border-radius: 8px;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      color: #a8a29e;
      margin: 0 auto 16px;
    }
    .qz-empty-title {
      font-family: 'Fraunces', serif;
      font-weight: 300;
      font-size: 20px;
      color: #1c1917;
      margin-bottom: 6px;
    }
    .qz-empty-desc { font-size: 13px; font-weight: 300; color: #a8a29e; margin-bottom: 20px; }

    .qz-spinner {
      width: 20px; height: 20px;
      border: 2px solid #e7e5e4;
      border-top-color: #1c1917;
      border-radius: 50%;
      animation: qzspin .7s linear infinite;
    }
    @keyframes qzspin { to { transform: rotate(360deg); } }
  `;

  if (loading || fetching) {
    return (
      <>
        <style>{styles}</style>
        <div className="qz-center">
          <div className="qz-spinner" />
        </div>
      </>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <style>{styles}</style>
        <div className="qz-center">
          <div className="qz-empty">
            <div className="qz-empty-icon">
              <Brain size={20} />
            </div>
            <div className="qz-empty-title">No questions yet</div>
            <p className="qz-empty-desc">
              This topic has no quiz questions added yet.
            </p>
            <button
              onClick={() => router.back()}
              className="qz-next"
              style={{ width: "auto", padding: "10px 24px" }}
            >
              Go back
            </button>
          </div>
        </div>
      </>
    );
  }

  const correctCount = Object.entries(answers).filter(([id, ans]) => {
    const q = questions.find((q) => q.id === id);
    return q && ans === q.correctIndex;
  }).length;

  if (completed) {
    return (
      <>
        <style>{styles}</style>
        <div className="qz-root">
          <div className="qz-inner">
            <div className="qz-results">
              <div
                className={`qz-trophy ${mastered ? "qz-trophy--mastered" : "qz-trophy--partial"}`}
              >
                <Trophy size={28} />
              </div>

              <div className="qz-result-heading">
                {mastered ? "Topic mastered!" : "Quiz complete!"}
              </div>
              <p className="qz-result-sub">
                {mastered ?
                  "Great work — you've demonstrated mastery of this topic."
                : "Keep practising to improve your mastery score."}
              </p>

              {xpEarned > 0 && (
                <div className="qz-xp-badge">
                  <Star size={12} />+{xpEarned} XP earned
                </div>
              )}

              <div className="qz-result-card">
                <div className="qz-result-score-row">
                  <span className="qz-result-score-label">Mastery score</span>
                  <span className="qz-result-score-value">{masteryScore}%</span>
                </div>
                <div className="qz-result-bar-track">
                  <div
                    className={`qz-result-bar-fill ${mastered ? "qz-result-bar-fill--mastered" : "qz-result-bar-fill--partial"}`}
                    style={{ width: `${masteryScore}%` }}
                  />
                </div>
                <div style={{ borderTop: "1px solid #e7e5e4", paddingTop: 16 }}>
                  <div className="qz-result-stats">
                    <div className="qz-result-stat">
                      <div className="qz-result-stat-value">
                        {answeredIds.length}
                      </div>
                      <div className="qz-result-stat-label">Questions</div>
                    </div>
                    <div className="qz-result-stat">
                      <div className="qz-result-stat-value">{correctCount}</div>
                      <div className="qz-result-stat-label">Correct</div>
                    </div>
                    <div className="qz-result-stat">
                      <div className="qz-result-stat-value">
                        {difficultyLabel[adaptive.currentDifficulty]}
                      </div>
                      <div className="qz-result-stat-label">Final level</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="qz-result-actions">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="qz-btn-secondary"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => router.push("/learn")}
                  className="qz-btn-primary"
                >
                  Continue learning <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const quizProgress =
    (answeredIds.length / Math.min(10, questions.length)) * 100;

  return (
    <>
      <style>{styles}</style>
      <div className="qz-root">
        <div className="qz-inner">
          {/* Header */}
          <div className="qz-header">
            <div className="qz-brand">
              <div className="qz-brand-icon">
                <Brain size={14} />
              </div>
              <span className="qz-brand-label">Adaptive quiz</span>
            </div>
            <div className="qz-header-right">
              {difficultyChange === "up" && answeredIds.length > 0 && (
                <span className="qz-trend qz-trend--up">
                  <TrendingUp size={12} /> Level up
                </span>
              )}
              {difficultyChange === "down" && answeredIds.length > 0 && (
                <span className="qz-trend qz-trend--down">
                  <TrendingDown size={12} /> Adjusted
                </span>
              )}
              {difficultyChange === null && answeredIds.length > 0 && (
                <span className="qz-trend">
                  <Minus size={12} /> Steady
                </span>
              )}
              <span className="qz-difficulty-pill">
                {difficultyLabel[adaptive.currentDifficulty]}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div className="qz-track">
            <div className="qz-fill" style={{ width: `${quizProgress}%` }} />
          </div>

          {/* Question */}
          {currentQuestion && (
            <div className="qz-card">
              <div className="qz-card-meta">
                <span className="qz-counter">
                  Question {answeredIds.length + 1} of{" "}
                  {Math.min(10, questions.length)}
                </span>
                <span
                  className={`qz-level-badge qz-level-badge--${adaptive.currentDifficulty}`}
                >
                  {difficultyLabel[adaptive.currentDifficulty]}
                </span>
              </div>

              <h2 className="qz-question">{currentQuestion.question}</h2>

              <div className="qz-options">
                {currentQuestion.options.map((option, index) => {
                  let cls = "qz-option";
                  if (answered) {
                    if (index === currentQuestion.correctIndex)
                      cls += " qz-option--correct";
                    else if (index === selectedAnswer)
                      cls += " qz-option--wrong";
                    else cls += " qz-option--muted";
                  }
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelect(index)}
                      disabled={answered}
                      className={cls}
                    >
                      <span>{option}</span>
                      {answered && index === currentQuestion.correctIndex && (
                        <CheckCircle size={14} style={{ flexShrink: 0 }} />
                      )}
                      {answered &&
                        index === selectedAnswer &&
                        index !== currentQuestion.correctIndex && (
                          <XCircle size={14} style={{ flexShrink: 0 }} />
                        )}
                    </button>
                  );
                })}
              </div>

              {answered && currentQuestion.explanation && (
                <div className="qz-explanation">
                  <p>{currentQuestion.explanation}</p>
                </div>
              )}

              {answered && (
                <button onClick={handleNext} className="qz-next">
                  {answeredIds.length + 1 >= Math.min(10, questions.length) ?
                    "See results"
                  : "Next question"}
                  <ChevronRight size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
