"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  getCourse,
  addTopic,
  getCourseTopics,
  addQuizQuestion,
} from "@/lib/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course, Topic } from "@/types";
import {
  GraduationCap,
  Plus,
  ArrowLeft,
  Layers,
  X,
} from "lucide-react";

const difficultyLabel: Record<number, string> = {
  1: "Beginner",
  2: "Easy",
  3: "Intermediate",
  4: "Hard",
  5: "Advanced",
};

export default function CourseDetailPage() {
  const { user, loading } = useAuthStore();
  const router = useRouter();
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    difficultyLevel: 1 as 1 | 2 | 3 | 4 | 5,
    contentType: "text" as "text" | "video" | "quiz" | "simulation",
    masteryThreshold: 80,
  });
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string>("");
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    question: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
    difficultyLevel: 1 as 1 | 2 | 3 | 4 | 5,
  });

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (courseId) {
      Promise.all([getCourse(courseId), getCourseTopics(courseId)])
        .then(([c, t]) => {
          setCourse(c);
          setTopics(t);
        })
        .finally(() => setFetching(false));
    }
  }, [courseId]);

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    setAdding(true);
    setError("");
    try {
      const id = await addTopic(courseId, {
        title: form.title,
        difficultyLevel: form.difficultyLevel,
        contentType: form.contentType,
        masteryThreshold: form.masteryThreshold,
        prerequisiteIds: [],
      });

      // Upload file if one was selected
      if (uploadFile && id) {
        setUploading(true);
        const storage = getStorage();
        const fileRef = ref(
          storage,
          `courses/${courseId}/topics/${id}/${uploadFile.name}`
        );
        const snap = await uploadBytes(fileRef, uploadFile);
        const url  = await getDownloadURL(snap.ref);
        await updateDoc(doc(db, "topics", id), {
          contentUrl:      url,
          contentFileName: uploadFile.name,
          contentFileType: uploadFile.type,
        });
        setUploading(false);
      }

      const newTopic: Topic = { id, courseId, ...form, prerequisiteIds: [] };
      setTopics((prev) => [...prev, newTopic]);
      setShowModal(false);
      setUploadFile(null);
      setForm({
        title: "",
        difficultyLevel: 1,
        contentType: "text",
        masteryThreshold: 80,
      });
    } catch {
      setError("Failed to add topic. Please try again.");
      setUploading(false);
    } finally {
      setAdding(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) return;
    setAddingQuestion(true);
    try {
      await addQuizQuestion({
        topicId: selectedTopicId,
        question: questionForm.question,
        options: questionForm.options,
        correctIndex: questionForm.correctIndex,
        explanation: questionForm.explanation,
        difficultyLevel: questionForm.difficultyLevel,
      });
      setShowQuestionModal(false);
      setQuestionForm({
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
        difficultyLevel: 1,
      });
    } catch {
      setError("Failed to add question.");
    } finally {
      setAddingQuestion(false);
    }
  };

  if (loading || !user || fetching) {
    return (
      <>
        <style>{`
          .cd-spin { min-height:100vh; background:#faf9f7; display:flex; align-items:center; justify-content:center; }
          .cd-spinner { width:20px; height:20px; border:2px solid #e7e5e4; border-top-color:#1c1917; border-radius:50%; animation:cdspin .7s linear infinite; }
          @keyframes cdspin { to { transform:rotate(360deg); } }
        `}</style>
        <div className="cd-spin">
          <div className="cd-spinner" />
        </div>
      </>
    );
  }

  const avgDifficulty =
    topics.length
      ? (topics.reduce((a, t) => a + t.difficultyLevel, 0) / topics.length).toFixed(1)
      : "—";
  const contentTypes = [...new Set(topics.map((t) => t.contentType))].length || "—";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;1,9..144,300&family=Geist:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .cd-root {
          min-height: 100vh;
          background: #faf9f7;
          font-family: 'Geist', sans-serif;
          color: #1c1917;
        }

        .cd-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 40px 32px 80px;
        }

        .cd-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 400;
          color: #a8a29e;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Geist', sans-serif;
          padding: 0;
          margin-bottom: 28px;
          transition: color .12s;
        }
        .cd-back:hover { color: #1c1917; }

        .cd-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 28px;
        }
        .cd-header-left { flex: 1; min-width: 0; }
        .cd-breadcrumb {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 10px;
        }
        .cd-breadcrumb-icon {
          width: 24px; height: 24px;
          border: 1px solid #e7e5e4;
          border-radius: 4px;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          color: #78716c;
        }
        .cd-breadcrumb-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #a8a29e;
        }
        .cd-title {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 26px;
          color: #1c1917;
          line-height: 1.25;
          margin-bottom: 6px;
        }
        .cd-desc {
          font-size: 13px;
          font-weight: 300;
          color: #a8a29e;
          line-height: 1.6;
        }
        .cd-add-topic-btn {
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
        .cd-add-topic-btn:hover { background: #292524; }

        .cd-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
          margin-bottom: 28px;
        }
        .cd-stat {
          padding: 18px 20px;
          border-right: 1px solid #e7e5e4;
        }
        .cd-stat:last-child { border-right: none; }
        .cd-stat-icon  { color:#a8a29e; margin-bottom:8px; }
        .cd-stat-value {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 24px;
          color: #1c1917;
          line-height: 1;
        }
        .cd-stat-label {
          font-size: 10px;
          font-weight: 400;
          letter-spacing: .05em;
          text-transform: uppercase;
          color: #a8a29e;
          margin-top: 4px;
        }

        .cd-topics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .cd-topics-title {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: #a8a29e;
        }
        .cd-topics-count {
          font-size: 11px;
          font-weight: 300;
          color: #c4bfba;
        }

        .cd-topic-list { display: flex; flex-direction: column; gap: 8px; }

        .cd-topic-row {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          background: #fff;
        }

        .cd-topic-index {
          width: 28px; height: 28px;
          border: 1px solid #e7e5e4;
          border-radius: 4px;
          background: #f5f4f2;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
          font-weight: 500;
          color: #a8a29e;
          flex-shrink: 0;
        }

        .cd-topic-info { flex: 1; min-width: 0; }
        .cd-topic-name {
          font-size: 13px;
          font-weight: 500;
          color: #1c1917;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 3px;
        }
        .cd-topic-meta {
          font-size: 11px;
          font-weight: 300;
          color: #a8a29e;
        }

        .cd-diff-badge {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: .05em;
          text-transform: uppercase;
          padding: 2px 8px;
          border-radius: 3px;
          background: #f5f4f2;
          color: #78716c;
          flex-shrink: 0;
        }

        .cd-add-q-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'Geist', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #57534e;
          background: #f5f4f2;
          border: 1px solid #e7e5e4;
          border-radius: 4px;
          padding: 6px 10px;
          cursor: pointer;
          transition: background .12s, border-color .12s, color .12s;
          white-space: nowrap;
          flex-shrink: 0;
          letter-spacing: .03em;
        }
        .cd-add-q-btn:hover { background: #edeae6; border-color: #d6d3d1; color: #1c1917; }

        .cd-empty {
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          background: #fff;
          padding: 48px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .cd-empty-icon {
          width: 40px; height: 40px;
          border: 1px solid #e7e5e4;
          border-radius: 7px;
          background: #f5f4f2;
          display: flex; align-items: center; justify-content: center;
          color: #a8a29e;
          margin-bottom: 4px;
        }
        .cd-empty-title { font-size:13px; font-weight:500; color:#1c1917; }
        .cd-empty-desc  { font-size:12px; font-weight:300; color:#a8a29e; }

        .cd-overlay {
          position: fixed;
          inset: 0;
          background: rgba(28,25,23,.35);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 20px;
          overflow-y: auto;
        }

        .cd-modal {
          background: #fff;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 28px;
          width: 100%;
          max-width: 460px;
          margin: auto;
        }
        .cd-modal-lg { max-width: 520px; }

        .cd-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }
        .cd-modal-title {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 20px;
          color: #1c1917;
        }
        .cd-modal-close {
          width: 28px; height: 28px;
          border: 1px solid #e7e5e4;
          border-radius: 4px;
          background: #f5f4f2;
          display: flex; align-items: center; justify-content: center;
          color: #a8a29e;
          cursor: pointer;
          transition: background .12s, color .12s;
        }
        .cd-modal-close:hover { background: #edeae6; color: #1c1917; }

        .cd-form { display: flex; flex-direction: column; gap: 18px; }
        .cd-field { display: flex; flex-direction: column; gap: 6px; }
        .cd-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: #78716c;
        }
        .cd-input, .cd-select, .cd-textarea {
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
        .cd-input::placeholder, .cd-textarea::placeholder { color: #c4bfba; }
        .cd-input:focus, .cd-select:focus, .cd-textarea:focus {
          outline: none;
          border-color: #1c1917;
        }
        .cd-textarea { resize: vertical; }
        .cd-select {
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a8a29e' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 10px center;
          padding-right: 28px;
          cursor: pointer;
        }

        .cd-field-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .cd-range { width: 100%; accent-color: #1c1917; cursor: pointer; }
        .cd-range-labels { display: flex; justify-content: space-between; font-size:11px; font-weight:300; color:#c4bfba; margin-top:4px; }

        /* ── File upload zone ── */
        .cd-upload-zone {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px dashed #e7e5e4;
          border-radius: 5px;
          padding: 14px;
          cursor: pointer;
          background: #faf9f7;
          transition: border-color .15s, background .15s;
          width: 100%;
          text-align: left;
        }
        .cd-upload-zone:hover {
          border-color: #d6d3d1;
          background: #f5f4f2;
        }
        .cd-upload-zone.has-file {
          border-color: #d6d3d1;
          background: #f5f4f2;
        }
        .cd-upload-icon {
          width: 32px; height: 32px;
          border: 1px solid #e7e5e4;
          border-radius: 5px;
          background: #fff;
          display: flex; align-items: center; justify-content: center;
          color: #a8a29e;
          flex-shrink: 0;
        }
        .cd-upload-text-main {
          font-size: 12px;
          font-weight: 500;
          color: #57534e;
        }
        .cd-upload-text-sub {
          font-size: 11px;
          font-weight: 300;
          color: #c4bfba;
          margin-top: 2px;
        }
        .cd-upload-clear {
          margin-left: auto;
          background: none;
          border: none;
          cursor: pointer;
          color: #a8a29e;
          display: flex;
          align-items: center;
          padding: 2px;
          transition: color .12s;
          flex-shrink: 0;
        }
        .cd-upload-clear:hover { color: #1c1917; }
        .cd-upload-meta {
          font-size: 11px;
          font-weight: 300;
          color: #a8a29e;
          margin-top: 4px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cd-uploading-bar {
          height: 2px;
          background: #e7e5e4;
          border-radius: 1px;
          overflow: hidden;
          margin-top: 6px;
        }
        .cd-uploading-fill {
          height: 100%;
          width: 60%;
          background: #1c1917;
          border-radius: 1px;
          animation: cdslide 1s ease-in-out infinite alternate;
        }
        @keyframes cdslide {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }

        .cd-option-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cd-radio { accent-color: #1c1917; cursor: pointer; flex-shrink: 0; }
        .cd-option-input {
          flex: 1;
          font-family: 'Geist', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #1c1917;
          background: #faf9f7;
          border: 1px solid #e7e5e4;
          border-radius: 5px;
          padding: 8px 12px;
          transition: border-color .15s;
        }
        .cd-option-input::placeholder { color: #c4bfba; }
        .cd-option-input:focus { outline: none; border-color: #1c1917; }
        .cd-options-hint { font-size:11px; font-weight:300; color:#c4bfba; }

        .cd-error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          border-radius: 5px;
          padding: 10px 14px;
          font-size: 13px;
          font-weight: 400;
          color: #991b1b;
        }

        .cd-modal-actions { display: flex; gap: 10px; }
        .cd-btn-cancel {
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
        .cd-btn-cancel:hover { background: #f0ede8; border-color: #d6d3d1; }
        .cd-btn-submit {
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
        .cd-btn-submit:hover:not(:disabled) { background: #292524; }
        .cd-btn-submit:disabled { opacity: .45; cursor: not-allowed; }

        .cd-spin-icon {
          width: 13px; height: 13px;
          border: 1.5px solid rgba(255,255,255,.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: cdspin .7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes cdspin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .cd-inner { padding: 24px 16px 60px; }
          .cd-header { flex-direction: column; align-items: stretch; }
          .cd-add-topic-btn { width: 100%; justify-content: center; }
          .cd-stats { grid-template-columns: 1fr 1fr 1fr; }
          .cd-diff-badge { display: none; }
          .cd-field-grid-2 { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="cd-root">
        <div className="cd-inner">
          <button className="cd-back" onClick={() => router.push("/instructor/courses")}>
            <ArrowLeft size={13} />
            Back to courses
          </button>

          <div className="cd-header">
            <div className="cd-header-left">
              <div className="cd-breadcrumb">
                <div className="cd-breadcrumb-icon">
                  <GraduationCap size={12} />
                </div>
                <span className="cd-breadcrumb-label">Course editor</span>
              </div>
              <h1 className="cd-title">{course?.title}</h1>
              {course?.description && <p className="cd-desc">{course.description}</p>}
            </div>
            <button className="cd-add-topic-btn" onClick={() => setShowModal(true)}>
              <Plus size={13} />
              Add topic
            </button>
          </div>

          <div className="cd-stats">
            {[
              { label: "Total topics",   value: topics.length,  icon: Layers       },
              { label: "Avg difficulty", value: avgDifficulty,  icon: GraduationCap},
              { label: "Content types",  value: contentTypes,   icon: Layers       },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="cd-stat">
                <Icon size={13} className="cd-stat-icon" />
                <div className="cd-stat-value">{value}</div>
                <div className="cd-stat-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="cd-topics-header">
            <span className="cd-topics-title">Topics</span>
            <span className="cd-topics-count">{topics.length} total</span>
          </div>

          {topics.length === 0 ? (
            <div className="cd-empty">
              <div className="cd-empty-icon"><Layers size={16} /></div>
              <div className="cd-empty-title">No topics yet</div>
              <p className="cd-empty-desc">Add your first topic to build the course.</p>
            </div>
          ) : (
            <div className="cd-topic-list">
              {topics.map((topic, index) => (
                <div key={topic.id} className="cd-topic-row">
                  <div className="cd-topic-index">{index + 1}</div>
                  <div className="cd-topic-info">
                    <div className="cd-topic-name">{topic.title}</div>
                    <div className="cd-topic-meta">
                      {topic.contentType} · Mastery {topic.masteryThreshold}%
                    </div>
                  </div>
                  <span className="cd-diff-badge">{difficultyLabel[topic.difficultyLevel]}</span>
                  <button className="cd-add-q-btn" onClick={() => {
                    setSelectedTopicId(topic.id);
                    setShowQuestionModal(true);
                  }}>
                    <Plus size={11} />
                    Add question
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add topic modal ── */}
      {showModal && (
        <div className="cd-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) { setShowModal(false); setError(""); setUploadFile(null); }
        }}>
          <div className="cd-modal">
            <div className="cd-modal-header">
              <span className="cd-modal-title">Add topic</span>
              <button className="cd-modal-close" onClick={() => {
                setShowModal(false); setError(""); setUploadFile(null);
              }}>
                <X size={13} />
              </button>
            </div>

            <form className="cd-form" onSubmit={handleAddTopic}>
              <div className="cd-field">
                <label className="cd-label">Topic title</label>
                <input className="cd-input" type="text"
                  placeholder="e.g. Introduction to Arrays"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required />
              </div>

              <div className="cd-field-grid-2">
                <div className="cd-field">
                  <label className="cd-label">Difficulty</label>
                  <select className="cd-select" value={form.difficultyLevel}
                    onChange={(e) => setForm((p) => ({ ...p, difficultyLevel: Number(e.target.value) as 1|2|3|4|5 }))}>
                    {[1,2,3,4,5].map((n) => (
                      <option key={n} value={n}>{difficultyLabel[n]}</option>
                    ))}
                  </select>
                </div>
                <div className="cd-field">
                  <label className="cd-label">Content type</label>
                  <select className="cd-select" value={form.contentType}
                    onChange={(e) => setForm((p) => ({ ...p, contentType: e.target.value as Topic["contentType"] }))}>
                    {["text","video","quiz","simulation"].map((t) => (
                      <option key={t} value={t} style={{textTransform:"capitalize"}}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cd-field">
                <label className="cd-label">Mastery threshold — {form.masteryThreshold}%</label>
                <input className="cd-range" type="range" min={50} max={100} step={5}
                  value={form.masteryThreshold}
                  onChange={(e) => setForm((p) => ({ ...p, masteryThreshold: Number(e.target.value) }))} />
                <div className="cd-range-labels"><span>50%</span><span>100%</span></div>
              </div>

              {/* ── File upload ── */}
              <div className="cd-field">
                <label className="cd-label">
                  Content file{" "}
                  <span style={{fontWeight:300,textTransform:"none",letterSpacing:0,color:"#c4bfba"}}>
                    (optional)
                  </span>
                </label>
                <label className={`cd-upload-zone${uploadFile ? " has-file" : ""}`}>
                  <div className="cd-upload-icon">
                    {uploadFile ? (
                      uploadFile.type.startsWith("video") ? (
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      )
                    ) : (
                      <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-8m0 0l-3 3m3-3l3 3M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1"/>
                      </svg>
                    )}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="cd-upload-text-main">
                      {uploadFile ? uploadFile.name : "Upload PDF or video"}
                    </div>
                    <div className="cd-upload-text-sub">
                      {uploadFile
                        ? `${(uploadFile.size / 1024 / 1024).toFixed(1)} MB`
                        : "PDF, MP4, MOV · max 50 MB"}
                    </div>
                  </div>
                  <input type="file" accept=".pdf,video/*" style={{display:"none"}}
                    onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                  {uploadFile && (
                    <button type="button" className="cd-upload-clear"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setUploadFile(null); }}>
                      <X size={13} />
                    </button>
                  )}
                </label>
                {uploading && (
                  <div className="cd-uploading-bar">
                    <div className="cd-uploading-fill" />
                  </div>
                )}
              </div>

              {error && <div className="cd-error">{error}</div>}

              <div className="cd-modal-actions">
                <button type="button" className="cd-btn-cancel" onClick={() => {
                  setShowModal(false); setError(""); setUploadFile(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="cd-btn-submit" disabled={adding || uploading}>
                  {(adding || uploading) && <div className="cd-spin-icon" />}
                  {uploading ? "Uploading…" : adding ? "Adding…" : "Add topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add question modal ── */}
      {showQuestionModal && (
        <div className="cd-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowQuestionModal(false);
        }}>
          <div className="cd-modal cd-modal-lg">
            <div className="cd-modal-header">
              <span className="cd-modal-title">Add quiz question</span>
              <button className="cd-modal-close" onClick={() => setShowQuestionModal(false)}>
                <X size={13} />
              </button>
            </div>

            <form className="cd-form" onSubmit={handleAddQuestion}>
              <div className="cd-field">
                <label className="cd-label">Question</label>
                <textarea className="cd-textarea"
                  placeholder="e.g. What is the time complexity of binary search?"
                  value={questionForm.question}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, question: e.target.value }))}
                  required rows={3} />
              </div>

              <div className="cd-field">
                <label className="cd-label">Answer options</label>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {questionForm.options.map((opt, i) => (
                    <div key={i} className="cd-option-row">
                      <input type="radio" name="correct" className="cd-radio"
                        checked={questionForm.correctIndex === i}
                        onChange={() => setQuestionForm((p) => ({ ...p, correctIndex: i }))} />
                      <input type="text" className="cd-option-input"
                        placeholder={`Option ${i + 1}`} value={opt} required
                        onChange={(e) => {
                          const opts = [...questionForm.options];
                          opts[i] = e.target.value;
                          setQuestionForm((p) => ({ ...p, options: opts }));
                        }} />
                    </div>
                  ))}
                  <span className="cd-options-hint">Select the radio button next to the correct answer.</span>
                </div>
              </div>

              <div className="cd-field">
                <label className="cd-label">
                  Explanation{" "}
                  <span style={{fontWeight:300,textTransform:"none",letterSpacing:0,color:"#c4bfba"}}>
                    (shown after answering)
                  </span>
                </label>
                <input className="cd-input" type="text"
                  placeholder="e.g. Binary search divides the search space in half each time…"
                  value={questionForm.explanation}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, explanation: e.target.value }))} />
              </div>

              <div className="cd-field">
                <label className="cd-label">Difficulty</label>
                <select className="cd-select" value={questionForm.difficultyLevel}
                  onChange={(e) => setQuestionForm((p) => ({ ...p, difficultyLevel: Number(e.target.value) as 1|2|3|4|5 }))}>
                  {[1,2,3,4,5].map((n) => (
                    <option key={n} value={n}>{difficultyLabel[n]}</option>
                  ))}
                </select>
              </div>

              {error && <div className="cd-error">{error}</div>}

              <div className="cd-modal-actions">
                <button type="button" className="cd-btn-cancel" onClick={() => setShowQuestionModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cd-btn-submit" disabled={addingQuestion}>
                  {addingQuestion && <div className="cd-spin-icon" />}
                  {addingQuestion ? "Saving…" : "Save question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}