import { Link, useNavigate } from "react-router-dom";

// ─── Landing page (Midnight theme, matches the app's aesthetic) ──────────────
const T = {
  bg: "radial-gradient(ellipse at 20% 0%, #1e1b4b 0%, #0a0f1e 45%, #050816 100%)",
  surface: "rgba(255,255,255,0.04)",
  surfaceBorder: "rgba(255,255,255,0.08)",
  text: "#e2e8f0",
  subtext: "#94a3b8",
  muted: "#64748b",
  accent: "#a78bfa",
  accent2: "#22d3ee",
  accentSoft: "rgba(167,139,250,0.15)",
};

const FEATURES = [
  { icon: "📊", title: "Live Dashboard", body: "See total sent, total received and a full yearly chart of your transfers at a glance." },
  { icon: "💱", title: "13 Currencies", body: "Amounts sent and received in Saudi Riyal, Pound, Dollar, Euro, Taka and more — with SAR as default." },
  { icon: "🎨", title: "9 Payment Methods", body: "Colorful chips for Bkash, Nagad, Taptap Send, Mobile Banking, Wise, Remitly, Western Union and more." },
  { icon: "👥", title: "Recipient Totals", body: "A dedicated tab that sums up every person's total received amount, transfer count and last date." },
  { icon: "📝", title: "Notes Section", body: "Keep reminders and details alongside your transfers — saved automatically to the cloud." },
  { icon: "📈", title: "Excel Import & Export", body: "Export any section to Excel or CSV and import your own spreadsheets — all formats friendly." },
  { icon: "☁️", title: "Cloud Sync", body: "Sign in with Google and every change syncs across all your devices instantly, with an offline device cache." },
  { icon: "🌙", title: "4 Themes", body: "Switch between Midnight, Aurora, Sunset and Paper — each one fully responsive on desktop and mobile." },
];

const STEPS = [
  { n: "1", title: "Sign in with Google", body: "One tap — your data stays private to your own account." },
  { n: "2", title: "Add a transfer", body: "Pick recipient, amounts in any currency and the payment method used." },
  { n: "3", title: "Track & export", body: "Watch dashboards, recipient totals and notes update — export to Excel anytime." },
];

export default function Landing() {
  const navigate = useNavigate();
  const s = styles();

  return (
    <div style={s.root}>
      <div style={s.glow1} />
      <div style={s.glow2} />

      <header style={s.header}>
        <div style={s.container}>
          <div style={s.logo}>
            <span style={s.logoIcon}>💸</span>
            <div>
              <div style={s.logoTitle}>Money Transfer Tracker</div>
              <div style={s.logoSub}>Send · Track · Save</div>
            </div>
          </div>
          <button onClick={() => navigate("/app")} style={s.headerDemoBtn}>Live Demo</button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ ...s.container, ...s.hero }}>
        <div style={s.heroBadge}>✦ Free to use · Works on desktop & mobile</div>
        <h1 style={s.heroTitle}>
          Track every transfer,<br />
          in every currency,<br />
          <span style={{ background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            all in one place.
          </span>
        </h1>
        <p style={s.heroSub}>
          Money Transfer Tracker keeps a private record of the money you send and receive —
          with live dashboards, recipient totals, notes and one-tap Excel export. Synced to
          your cloud account on every change.
        </p>
        <div style={s.heroActions}>
          <button onClick={() => navigate("/app")} style={s.demoBtn}>
            Live Demo <span style={{ fontSize: 18 }}>→</span>
          </button>
          <a href="#features" style={s.ghostBtn}>See features</a>
        </div>
        <div style={s.heroStats}>
          {[["13", "currencies"], ["9", "payment methods"], ["4", "themes"], ["100%", "cloud synced"]].map(([v, l]) => (
            <div key={l} style={s.heroStat}>
              <div style={s.heroStatValue}>{v}</div>
              <div style={s.heroStatLabel}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ ...s.container, ...s.section }}>
        <h2 style={s.sectionTitle}>Everything you need to stay on top of your money</h2>
        <p style={s.sectionSub}>Built for people who send remittances and want a clear, private record of every transaction.</p>
        <div style={s.featureGrid}>
          {FEATURES.map((f) => (
            <div key={f.title} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <div style={s.featureTitle}>{f.title}</div>
              <div style={s.featureBody}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ ...s.container, ...s.section }}>
        <h2 style={s.sectionTitle}>Start in three steps</h2>
        <div style={s.stepRow}>
          {STEPS.map((st) => (
            <div key={st.n} style={s.stepCard}>
              <div style={s.stepNum}>{st.n}</div>
              <div style={s.featureTitle}>{st.title}</div>
              <div style={s.featureBody}>{st.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ ...s.container, ...s.section }}>
        <div style={s.ctaCard}>
          <h2 style={{ ...s.sectionTitle, marginTop: 0 }}>Ready to try it?</h2>
          <p style={s.sectionSub}>Open the live demo — you'll sign in with Google and your data stays private.</p>
          <button onClick={() => navigate("/app")} style={s.demoBtn}>
            Live Demo <span style={{ fontSize: 18 }}>→</span>
          </button>
        </div>
      </section>

      <footer style={s.footer}>
        <div style={s.container}>
          <div style={{ color: T.muted, fontSize: 13 }}>
            © {new Date().getFullYear()} Money Transfer Tracker
          </div>
          <div style={{ color: T.subtext, fontSize: 13 }}>
            Developed by{" "}
            <span style={{
              background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`,
              WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
              fontWeight: 800, fontSize: 15, letterSpacing: "-0.01em",
            }}>Nasim Mahmud</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles = () => {
  const container: React.CSSProperties = {
    maxWidth: 1080, margin: "0 auto", padding: "0 20px", width: "100%", boxSizing: "border-box",
  };
  return {
    container,
    root: {
      minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "inherit",
    } as React.CSSProperties,
    glow1: {
      position: "fixed", width: 480, height: 480, borderRadius: "50%", top: -160, left: -120,
      background: `radial-gradient(circle, ${T.accent}22 0%, transparent 70%)`, pointerEvents: "none",
    } as React.CSSProperties,
    glow2: {
      position: "fixed", width: 520, height: 520, borderRadius: "50%", bottom: -180, right: -140,
      background: `radial-gradient(circle, ${T.accent2}1a 0%, transparent 70%)`, pointerEvents: "none",
    } as React.CSSProperties,
    header: {
      position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)",
      background: "rgba(5,8,22,0.7)", borderBottom: `1px solid ${T.surfaceBorder}`,
    } as React.CSSProperties,
    logo: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 } as React.CSSProperties,
    logoIcon: {
      fontSize: 30, filter: `drop-shadow(0 4px 12px ${T.accent}88)`,
    } as React.CSSProperties,
    logoTitle: { fontWeight: 800, fontSize: 16, letterSpacing: "-0.02em", whiteSpace: "nowrap" } as React.CSSProperties,
    logoSub: { fontSize: 11, color: T.muted } as React.CSSProperties,
    headerDemoBtn: {
      padding: "10px 20px", borderRadius: 999, border: "none", cursor: "pointer",
      background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, color: "#0a0f1e",
      fontWeight: 800, fontSize: 14, boxShadow: `0 8px 20px ${T.accent}44`, whiteSpace: "nowrap",
    } as React.CSSProperties,
    hero: {
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
      paddingTop: 72, paddingBottom: 56, gap: 0,
    } as React.CSSProperties,
    heroBadge: {
      padding: "8px 16px", borderRadius: 999, background: T.accentSoft,
      border: `1px solid ${T.accent}55`, color: T.accent, fontSize: 12, fontWeight: 700,
      marginBottom: 24,
    } as React.CSSProperties,
    heroTitle: {
      fontSize: "clamp(30px, 6vw, 56px)", fontWeight: 900, lineHeight: 1.12,
      letterSpacing: "-0.03em", margin: "0 0 20px",
    } as React.CSSProperties,
    heroSub: {
      color: T.subtext, fontSize: "clamp(14px, 2vw, 17px)", maxWidth: 620,
      lineHeight: 1.6, margin: "0 0 32px",
    } as React.CSSProperties,
    heroActions: {
      display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center", marginBottom: 44,
    } as React.CSSProperties,
    demoBtn: {
      display: "inline-flex", alignItems: "center", gap: 8, padding: "15px 34px",
      borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 800, fontSize: 16,
      background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, color: "#0a0f1e",
      boxShadow: `0 12px 32px ${T.accent}44`, transition: "transform 0.15s",
    } as React.CSSProperties,
    ghostBtn: {
      display: "inline-flex", alignItems: "center", padding: "15px 30px", borderRadius: 14,
      background: T.surface, border: `1px solid ${T.surfaceBorder}`, color: T.subtext,
      fontWeight: 700, fontSize: 15, textDecoration: "none",
    } as React.CSSProperties,
    heroStats: {
      display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center",
    } as React.CSSProperties,
    heroStat: {
      padding: "14px 22px", borderRadius: 14, background: T.surface,
      border: `1px solid ${T.surfaceBorder}`, minWidth: 110, textAlign: "center",
    } as React.CSSProperties,
    heroStatValue: {
      fontWeight: 900, fontSize: 22,
      background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`,
      WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
    } as React.CSSProperties,
    heroStatLabel: { fontSize: 12, color: T.muted, marginTop: 2 } as React.CSSProperties,
    section: { paddingTop: 48, paddingBottom: 48 } as React.CSSProperties,
    sectionTitle: {
      fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, letterSpacing: "-0.02em",
      textAlign: "center", margin: "0 0 10px",
    } as React.CSSProperties,
    sectionSub: {
      color: T.subtext, fontSize: 15, textAlign: "center", maxWidth: 560,
      margin: "0 auto 36px", lineHeight: 1.6,
    } as React.CSSProperties,
    featureGrid: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16,
    } as React.CSSProperties,
    featureCard: {
      background: T.surface, border: `1px solid ${T.surfaceBorder}`, borderRadius: 16,
      padding: 20, backdropFilter: "blur(10px)",
    } as React.CSSProperties,
    featureIcon: { fontSize: 28, marginBottom: 10 } as React.CSSProperties,
    featureTitle: { fontWeight: 800, fontSize: 15, marginBottom: 6, letterSpacing: "-0.01em" } as React.CSSProperties,
    featureBody: { color: T.subtext, fontSize: 13, lineHeight: 1.6 } as React.CSSProperties,
    stepRow: {
      display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16,
    } as React.CSSProperties,
    stepCard: {
      background: T.surface, border: `1px solid ${T.surfaceBorder}`, borderRadius: 16,
      padding: 20, textAlign: "center",
    } as React.CSSProperties,
    stepNum: {
      width: 40, height: 40, borderRadius: "50%", margin: "0 auto 12px",
      display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 17,
      background: `linear-gradient(135deg, ${T.accent}, ${T.accent2})`, color: "#0a0f1e",
    } as React.CSSProperties,
    ctaCard: {
      background: T.surface, border: `1px solid ${T.accent}44`, borderRadius: 24,
      padding: "44px 24px", textAlign: "center", backdropFilter: "blur(10px)",
    } as React.CSSProperties,
    footer: {
      borderTop: `1px solid ${T.surfaceBorder}`, padding: "26px 0", marginTop: 24,
    } as React.CSSProperties,
  };
};
