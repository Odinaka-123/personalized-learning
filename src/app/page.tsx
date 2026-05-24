import Link from "next/link";
import { Brain, BarChart3, Crosshair, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Adaptive content",
    desc: "Difficulty adjusts in real time based on your performance",
  },
  {
    icon: BarChart3,
    title: "Mastery tracking",
    desc: "Advance only when you truly understand the material",
  },
  {
    icon: Crosshair,
    title: "Personalised paths",
    desc: "AI recommends your next best learning step",
  },
];

const stats = [
  { value: "28%", label: "improvement in learning outcomes" },
  { value: "42%", label: "higher course completion rates" },
  { value: "250+", label: "students tested in pilot study" },
];

export default function Home() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Geist:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .home-root {
          min-height: 100vh;
          background-color: #faf9f7;
          color: #1c1917;
          font-family: 'Geist', sans-serif;
          display: flex;
          flex-direction: column;
        }

        /* ── Nav ── */
        .home-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 48px;
          border-bottom: 1px solid #e7e5e4;
        }
        .home-nav-brand {
          display: flex;
          align-items: center;
          gap: 9px;
          text-decoration: none;
        }
        .home-nav-mark {
          width: 26px;
          height: 26px;
          border: 2px solid #1c1917;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 500;
          color: #1c1917;
          flex-shrink: 0;
        }
        .home-nav-name {
          font-size: 14px;
          font-weight: 500;
          color: #1c1917;
          letter-spacing: 0.03em;
        }
        .home-nav-links {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .home-nav-signin {
          font-size: 13px;
          color: #78716c;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 5px;
          transition: color 0.15s;
        }
        .home-nav-signin:hover { color: #1c1917; }
        .home-nav-cta {
          font-size: 13px;
          font-weight: 500;
          color: #faf9f7;
          background: #1c1917;
          text-decoration: none;
          padding: 8px 20px;
          border-radius: 5px;
          transition: background 0.15s;
          letter-spacing: 0.03em;
        }
        .home-nav-cta:hover { background: #292524; }

        /* ── Hero ── */
        .home-hero {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 96px 48px 80px;
          max-width: 780px;
          animation: fadeUp 0.5s ease both;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .home-hero-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a8a29e;
          margin-bottom: 24px;
        }
        .home-hero-h1 {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: clamp(42px, 6vw, 64px);
          line-height: 1.1;
          color: #1c1917;
          margin-bottom: 28px;
        }
        .home-hero-h1 em {
          font-style: italic;
          color: #78716c;
        }
        .home-hero-p {
          font-size: 16px;
          font-weight: 300;
          color: #78716c;
          line-height: 1.75;
          max-width: 520px;
          margin-bottom: 44px;
        }
        .home-hero-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .home-hero-btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #faf9f7;
          background: #1c1917;
          text-decoration: none;
          padding: 11px 24px;
          border-radius: 5px;
          transition: background 0.15s;
          letter-spacing: 0.03em;
        }
        .home-hero-btn-primary:hover { background: #292524; }
        .home-hero-btn-ghost {
          font-size: 13px;
          font-weight: 400;
          color: #78716c;
          text-decoration: none;
          border-bottom: 1px solid #d6d3d1;
          padding-bottom: 2px;
          transition: color 0.15s, border-color 0.15s;
        }
        .home-hero-btn-ghost:hover { color: #1c1917; border-color: #1c1917; }

        /* ── Stats ── */
        .home-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px solid #e7e5e4;
          border-bottom: 1px solid #e7e5e4;
        }
        .home-stat {
          padding: 40px 48px;
          border-right: 1px solid #e7e5e4;
        }
        .home-stat:last-child { border-right: none; }
        .home-stat-value {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 40px;
          color: #1c1917;
          line-height: 1;
          margin-bottom: 8px;
        }
        .home-stat-label {
          font-size: 13px;
          font-weight: 300;
          color: #a8a29e;
          line-height: 1.5;
          max-width: 160px;
        }

        /* ── Features ── */
        .home-features {
          padding: 96px 48px;
        }
        .home-features-header {
          margin-bottom: 56px;
        }
        .home-features-eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #a8a29e;
          margin-bottom: 16px;
        }
        .home-features-h2 {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 32px;
          color: #1c1917;
          max-width: 400px;
          line-height: 1.2;
        }
        .home-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          overflow: hidden;
        }
        .home-feature-card {
          padding: 36px 32px;
          border-right: 1px solid #e7e5e4;
        }
        .home-feature-card:last-child { border-right: none; }
        .home-feature-icon {
          width: 36px;
          height: 36px;
          border: 1px solid #e7e5e4;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #78716c;
          margin-bottom: 24px;
          background: #fff;
        }
        .home-feature-title {
          font-size: 14px;
          font-weight: 500;
          color: #1c1917;
          margin-bottom: 8px;
        }
        .home-feature-desc {
          font-size: 13px;
          font-weight: 300;
          color: #a8a29e;
          line-height: 1.65;
        }

        /* ── CTA Banner ── */
        .home-cta {
          margin: 0 48px 96px;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 56px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          background: #fff;
        }
        .home-cta-text h3 {
          font-family: 'Fraunces', serif;
          font-weight: 300;
          font-size: 26px;
          color: #1c1917;
          margin-bottom: 8px;
          line-height: 1.2;
        }
        .home-cta-text p {
          font-size: 14px;
          font-weight: 300;
          color: #a8a29e;
        }
        .home-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #faf9f7;
          background: #1c1917;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 5px;
          white-space: nowrap;
          transition: background 0.15s;
          letter-spacing: 0.03em;
          flex-shrink: 0;
        }
        .home-cta-btn:hover { background: #292524; }

        /* ── Footer ── */
        .home-footer {
          margin-top: auto;
          border-top: 1px solid #e7e5e4;
          padding: 20px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .home-footer-copy {
          font-size: 11px;
          color: #c4bfba;
        }
        .home-footer-right {
          font-size: 11px;
          color: #c4bfba;
        }

        @media (max-width: 768px) {
          .home-nav { padding: 16px 24px; }
          .home-hero { padding: 64px 24px 56px; }
          .home-stats { grid-template-columns: 1fr; }
          .home-stat { border-right: none; border-bottom: 1px solid #e7e5e4; padding: 28px 24px; }
          .home-stat:last-child { border-bottom: none; }
          .home-features { padding: 64px 24px; }
          .home-features-grid { grid-template-columns: 1fr; }
          .home-feature-card { border-right: none; border-bottom: 1px solid #e7e5e4; }
          .home-feature-card:last-child { border-bottom: none; }
          .home-cta { margin: 0 24px 64px; flex-direction: column; align-items: flex-start; padding: 36px 28px; }
          .home-footer { padding: 16px 24px; flex-direction: column; gap: 6px; align-items: flex-start; }
        }
      `}</style>

      <main className="home-root">
        {/* Nav */}
        <nav className="home-nav">
          <Link href="/" className="home-nav-brand">
            <div className="home-nav-mark">L</div>
            <span className="home-nav-name">LearnSpace</span>
          </Link>
          <div className="home-nav-links">
            <Link href="/login" className="home-nav-signin">
              Sign in
            </Link>
            <Link href="/register" className="home-nav-cta">
              Get started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section className="home-hero">
          <p className="home-hero-eyebrow">AI-powered adaptive education</p>
          <h1 className="home-hero-h1">
            Learning that adapts
            <br />
            <em>to you</em>
          </h1>
          <p className="home-hero-p">
            LearnSpace uses machine learning to personalise your content, pace,
            and assessments in real time — so every learner gets exactly what
            they need.
          </p>
          <div className="home-hero-actions">
            <Link href="/register" className="home-hero-btn-primary">
              Start learning free <ArrowRight size={14} />
            </Link>
            <Link href="/login" className="home-hero-btn-ghost">
              Sign in to dashboard
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="home-stats">
          {stats.map((s) => (
            <div key={s.label} className="home-stat">
              <div className="home-stat-value">{s.value}</div>
              <div className="home-stat-label">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Features */}
        <section className="home-features">
          <div className="home-features-header">
            <p className="home-features-eyebrow">Platform features</p>
            <h2 className="home-features-h2">Everything your learning needs</h2>
          </div>
          <div className="home-features-grid">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="home-feature-card">
                <div className="home-feature-icon">
                  <Icon size={17} />
                </div>
                <div className="home-feature-title">{title}</div>
                <div className="home-feature-desc">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <div className="home-cta">
          <div className="home-cta-text">
            <h3>Ready to learn smarter?</h3>
            <p>
              Join students already using LearnSpace to hit their goals faster.
            </p>
          </div>
          <Link href="/register" className="home-cta-btn">
            Create free account <ArrowRight size={14} />
          </Link>
        </div>

        {/* Footer */}
        <footer className="home-footer">
          <span className="home-footer-copy">
            © 2025 LearnSpace · Ewaleifoh Anointed Eromosele
          </span>
          <span className="home-footer-right">SCN/CSC/220161</span>
        </footer>
      </main>
    </>
  );
}
