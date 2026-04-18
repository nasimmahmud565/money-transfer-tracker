import { useState, useEffect, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Transfer {
  id: string;
  date: string;
  recipientName: string;
  amountSent: number;
  currency: string;
  amountReceived: number;
  receivedCurrency: string;
  paymentMethod: string;
  reference: string;
}

type ThemeName = "midnight" | "aurora" | "sunset" | "paper";

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "money_transfer_records_v2";
const THEME_KEY = "money_transfer_theme";

const CURRENCIES = [
  { code: "SAR", symbol: "﷼", label: "Saudi Riyal" },
  { code: "GBP", symbol: "£", label: "Pound" },
  { code: "USD", symbol: "$", label: "Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "QAR", symbol: "﷼", label: "Qatari Riyal" },
  { code: "KWD", symbol: "د.ك", label: "Kuwaiti Dinar" },
  { code: "OMR", symbol: "﷼", label: "Omani Rial" },
  { code: "BHD", symbol: ".د.ب", label: "Bahraini Dinar" },
  { code: "MYR", symbol: "RM", label: "Malaysian Ringgit" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "AUD", symbol: "A$", label: "Australian Dollar" },
  { code: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { code: "BDT", symbol: "৳", label: "Bangladeshi Taka" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee" },
];

const PAYMENT_METHODS = [
  { name: "Bkash Transfer",   color: "#e2136b", bg: "rgba(226,19,107,0.18)",  border: "rgba(226,19,107,0.45)" },
  { name: "Nagad Transfer",   color: "#f37021", bg: "rgba(243,112,33,0.18)",  border: "rgba(243,112,33,0.45)" },
  { name: "Bank Transfer",    color: "#3b82f6", bg: "rgba(59,130,246,0.18)",  border: "rgba(59,130,246,0.45)" },
  { name: "Western Union",    color: "#facc15", bg: "rgba(250,204,21,0.18)",  border: "rgba(250,204,21,0.45)" },
  { name: "Wise",             color: "#9be15d", bg: "rgba(155,225,93,0.18)",  border: "rgba(155,225,93,0.45)" },
  { name: "Remitly",          color: "#a78bfa", bg: "rgba(167,139,250,0.2)",  border: "rgba(167,139,250,0.45)" },
  { name: "Other",            color: "#94a3b8", bg: "rgba(148,163,184,0.18)", border: "rgba(148,163,184,0.45)" },
];

const methodStyle = (name: string) =>
  PAYMENT_METHODS.find((m) => m.name === name) ?? PAYMENT_METHODS[PAYMENT_METHODS.length - 1];

const THEMES: Record<ThemeName, {
  label: string;
  bg: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  subtext: string;
  muted: string;
  accent: string;
  accent2: string;
  accentSoft: string;
  modalBg: string;
  inputBg: string;
}> = {
  midnight: {
    label: "Midnight",
    bg: "radial-gradient(ellipse at 20% 0%, #1e1b4b 0%, #0a0f1e 45%, #050816 100%)",
    surface: "rgba(255,255,255,0.04)",
    surfaceBorder: "rgba(255,255,255,0.08)",
    text: "#e2e8f0",
    subtext: "#94a3b8",
    muted: "#475569",
    accent: "#a78bfa",
    accent2: "#22d3ee",
    accentSoft: "rgba(167,139,250,0.15)",
    modalBg: "#111827",
    inputBg: "rgba(255,255,255,0.06)",
  },
  aurora: {
    label: "Aurora",
    bg: "radial-gradient(ellipse at 80% 10%, #064e3b 0%, #0f172a 50%, #020617 100%)",
    surface: "rgba(255,255,255,0.04)",
    surfaceBorder: "rgba(74,222,128,0.12)",
    text: "#ecfdf5",
    subtext: "#86efac",
    muted: "#4b6358",
    accent: "#4ade80",
    accent2: "#22d3ee",
    accentSoft: "rgba(74,222,128,0.15)",
    modalBg: "#0f1f1a",
    inputBg: "rgba(255,255,255,0.05)",
  },
  sunset: {
    label: "Sunset",
    bg: "radial-gradient(ellipse at 20% 100%, #7c2d12 0%, #1f0a1a 55%, #0a0510 100%)",
    surface: "rgba(255,255,255,0.05)",
    surfaceBorder: "rgba(251,146,60,0.18)",
    text: "#fef3c7",
    subtext: "#fbbf77",
    muted: "#7a5544",
    accent: "#fb923c",
    accent2: "#f43f5e",
    accentSoft: "rgba(251,146,60,0.15)",
    modalBg: "#1f1410",
    inputBg: "rgba(255,255,255,0.06)",
  },
  paper: {
    label: "Paper",
    bg: "radial-gradient(ellipse at 30% 0%, #f5f3ee 0%, #ebe7df 100%)",
    surface: "rgba(255,255,255,0.7)",
    surfaceBorder: "rgba(15,23,42,0.1)",
    text: "#1e293b",
    subtext: "#64748b",
    muted: "#94a3b8",
    accent: "#7c3aed",
    accent2: "#0ea5e9",
    accentSoft: "rgba(124,58,237,0.1)",
    modalBg: "#ffffff",
    inputBg: "rgba(15,23,42,0.04)",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const fmtMoney = (n: number, currency: string) => {
  const c = CURRENCIES.find((x) => x.code === currency);
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n);
  } catch {
    return `${c?.symbol ?? ""} ${n.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
  }
};

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const EMPTY_FORM = (): Omit<Transfer, "id"> => ({
  date: new Date().toISOString().split("T")[0],
  recipientName: "",
  amountSent: 0,
  currency: "SAR",
  amountReceived: 0,
  receivedCurrency: "BDT",
  paymentMethod: "Bkash Transfer",
  reference: "",
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function Index() {
  const [theme, setTheme] = useState<ThemeName>("midnight");
  const t = THEMES[theme];

  const [records, setRecords] = useState<Transfer[]>([]);
  const [form, setForm] = useState<Omit<Transfer, "id">>(EMPTY_FORM());
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Transfer>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"records" | "dashboard">("dashboard");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRecords(JSON.parse(stored));
      const tStored = localStorage.getItem(THEME_KEY) as ThemeName | null;
      if (tStored && THEMES[tStored]) setTheme(tStored);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...records]
      .filter(
        (r) =>
          r.recipientName.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          r.paymentMethod.toLowerCase().includes(q) ||
          r.date.includes(q) ||
          r.currency.toLowerCase().includes(q)
      )
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [records, search, sortField, sortDir]);

  const stats = useMemo(() => {
    const totalBDT = records.reduce((s, r) => s + r.amountReceived, 0);
    const byCurrency: Record<string, number> = {};
    records.forEach((r) => {
      byCurrency[r.currency] = (byCurrency[r.currency] || 0) + r.amountSent;
    });

    const thisMonth = records.filter((r) => {
      const now = new Date();
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const byYear: Record<string, number> = {};
    records.forEach((r) => {
      const yr = r.date.slice(0, 4);
      byYear[yr] = (byYear[yr] || 0) + r.amountReceived;
    });

    const byMethod: Record<string, number> = {};
    records.forEach((r) => {
      byMethod[r.paymentMethod] = (byMethod[r.paymentMethod] || 0) + 1;
    });

    return {
      totalBDT,
      byCurrency,
      count: records.length,
      thisMonthCount: thisMonth.length,
      thisMonthBDT: thisMonth.reduce((s, r) => s + r.amountReceived, 0),
      byYear,
      byMethod,
    };
  }, [records]);

  function handleSort(field: keyof Transfer) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }
  function openAdd() {
    setForm(EMPTY_FORM());
    setEditId(null);
    setFormError("");
    setShowForm(true);
  }
  function openEdit(r: Transfer) {
    setForm({ date: r.date, recipientName: r.recipientName, amountSent: r.amountSent, currency: r.currency, amountReceived: r.amountReceived, receivedCurrency: r.receivedCurrency ?? "BDT", paymentMethod: r.paymentMethod, reference: r.reference });
    setEditId(r.id);
    setFormError("");
    setShowForm(true);
  }
  function handleSubmit() {
    if (!form.date) return setFormError("Date is required.");
    if (!form.recipientName.trim()) return setFormError("Recipient name is required.");
    if (!form.amountSent || form.amountSent <= 0) return setFormError("Amount sent must be greater than 0.");
    if (!form.amountReceived || form.amountReceived <= 0) return setFormError("Amount received must be greater than 0.");
    setFormError("");
    if (editId) {
      setRecords((prev) => prev.map((r) => (r.id === editId ? { ...form, id: editId } : r)));
    } else {
      setRecords((prev) => [...prev, { ...form, id: genId() }]);
    }
    setShowForm(false);
  }
  function handleDelete(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setDeleteConfirm(null);
  }

  const maxYearBDT = Math.max(...Object.values(stats.byYear), 1);
  const isLight = theme === "paper";

  // ─── Styles bound to theme ────────────────────────────────────────────────
  const s: Record<string, any> = {
    root: {
      minHeight: "100vh",
      background: t.bg,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      color: t.text,
      position: "relative",
      overflowX: "hidden",
    },
    glow1: {
      position: "fixed", top: -120, right: -120, width: 360, height: 360, borderRadius: "50%",
      background: `radial-gradient(circle, ${t.accent}55, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none", zIndex: 0,
    },
    glow2: {
      position: "fixed", bottom: -160, left: -160, width: 420, height: 420, borderRadius: "50%",
      background: `radial-gradient(circle, ${t.accent2}40, transparent 70%)`, filter: "blur(50px)", pointerEvents: "none", zIndex: 0,
    },
    header: {
      position: "relative", zIndex: 10,
      borderBottom: `1px solid ${t.surfaceBorder}`,
      background: isLight ? "rgba(255,255,255,0.7)" : "rgba(10,15,30,0.55)",
      backdropFilter: "blur(20px)",
      padding: "0 16px",
    },
    headerInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, height: 64, flexWrap: "wrap" },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoIcon: {
      width: 40, height: 40,
      background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
      borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 20, flexShrink: 0, boxShadow: `0 8px 24px ${t.accent}55`,
    },
    logoTitle: { fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: "-0.02em", lineHeight: 1.2 },
    logoSub: { fontSize: 10, color: t.accent, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" },
    headerActions: { display: "flex", alignItems: "center", gap: 8 },
    themeToggle: {
      display: "flex", gap: 4, padding: 4,
      background: t.surface, border: `1px solid ${t.surfaceBorder}`, borderRadius: 12,
    },
    themeBtn: (active: boolean): React.CSSProperties => ({
      width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
      transition: "transform 0.2s",
      transform: active ? "scale(1.1)" : "scale(1)",
      boxShadow: active ? `0 0 0 2px ${t.accent}` : "none",
    }),
    addBtn: {
      display: "flex", alignItems: "center", gap: 6, padding: "10px 16px",
      background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
      border: "none", borderRadius: 12, color: isLight ? "#fff" : "#0a0f1e",
      fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: "0.02em",
      boxShadow: `0 8px 20px ${t.accent}55`,
    },
    tabs: {
      position: "relative", zIndex: 10, display: "flex", padding: "0 16px",
      borderBottom: `1px solid ${t.surfaceBorder}`,
      background: isLight ? "rgba(255,255,255,0.5)" : "rgba(10,15,30,0.4)",
      overflowX: "auto",
    },
    tab: {
      padding: "14px 18px", background: "transparent", border: "none",
      borderBottom: "2px solid transparent", color: t.muted,
      fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap",
    },
    tabActive: { color: t.accent, borderBottom: `2px solid ${t.accent}` },
    main: { position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "24px 16px" },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 },
    card: {
      background: t.surface, border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 18, padding: 20, marginBottom: 20,
      backdropFilter: "blur(10px)",
    },
    cardTitle: { fontSize: 12, fontWeight: 700, color: t.subtext, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 },
    chartWrap: { display: "flex", alignItems: "flex-end", gap: 12, height: 140, paddingBottom: 4, overflowX: "auto" },
    barGroup: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, minWidth: 50, height: "100%" },
    barLabelTop: { fontSize: 10, color: t.subtext, fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" },
    barTrack: {
      flex: 1, width: "60%", background: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.05)",
      borderRadius: 8, display: "flex", alignItems: "flex-end", overflow: "hidden", minWidth: 28,
    },
    bar: {
      width: "100%", borderRadius: 8, transition: "height 0.5s ease",
      background: `linear-gradient(to top, ${t.accent}, ${t.accent2})`,
    },
    barLabel: { fontSize: 11, color: t.muted, fontWeight: 700 },
    empty: { textAlign: "center", padding: "48px 0" },
    searchWrap: { position: "relative", marginBottom: 16, display: "flex", alignItems: "center" },
    searchIcon: { position: "absolute", left: 14, fontSize: 16, pointerEvents: "none" },
    searchInput: {
      width: "100%", padding: "12px 40px 12px 42px",
      background: t.inputBg, border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 12, color: t.text, fontSize: 14, outline: "none", boxSizing: "border-box",
    },
    clearBtn: { position: "absolute", right: 14, background: "none", border: "none", color: t.muted, cursor: "pointer", fontSize: 16 },
    tableWrap: {
      overflowX: "auto", borderRadius: 16,
      border: `1px solid ${t.surfaceBorder}`,
      background: t.surface,
    },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: {
      padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700,
      color: t.subtext, letterSpacing: "0.06em", textTransform: "uppercase",
      borderBottom: `1px solid ${t.surfaceBorder}`, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
    },
    td: {
      padding: "12px 14px",
      borderBottom: `1px solid ${isLight ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.04)"}`,
      verticalAlign: "middle", color: t.text, whiteSpace: "nowrap",
    },
    editBtn: {
      background: t.inputBg, border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 8, color: t.text, padding: "5px 12px",
      cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 6,
    },
    delBtn: {
      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: 8, color: "#f87171", padding: "5px 12px",
      cursor: "pointer", fontSize: 12, fontWeight: 600,
    },
    tableFooter: { padding: "12px 4px", color: t.muted, fontSize: 13, textAlign: "right" },
    overlay: {
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 100, padding: 12,
    },
    modal: {
      background: t.modalBg, border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 20, padding: 24, maxWidth: 560, width: "100%",
      maxHeight: "90vh", overflowY: "auto",
      boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
    },
    modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 800, color: t.text, letterSpacing: "-0.02em", margin: 0 },
    closeBtn: {
      background: t.inputBg, border: "none", borderRadius: 8,
      color: t.subtext, width: 32, height: 32, cursor: "pointer", fontSize: 14,
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 },
    input: {
      padding: "11px 14px", background: t.inputBg, border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 10, color: t.text, fontSize: 14, outline: "none",
      width: "100%", boxSizing: "border-box", fontFamily: "inherit",
    },
    amountRow: { display: "flex", gap: 8 },
    currencySelect: {
      padding: "11px 10px", background: "#0a0f1e", border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 10, color: "#ffffff", fontSize: 13, outline: "none",
      fontFamily: "inherit", minWidth: 90, fontWeight: 700, cursor: "pointer",
      colorScheme: "dark",
    },
    methodPicker: { display: "flex", flexWrap: "wrap", gap: 8 },
    methodChip: (m: typeof PAYMENT_METHODS[number], active: boolean): React.CSSProperties => ({
      padding: "8px 14px", borderRadius: 999,
      background: active ? m.color : m.bg,
      border: `1.5px solid ${active ? m.color : m.border}`,
      color: active ? "#fff" : m.color,
      fontWeight: 700, fontSize: 12, cursor: "pointer",
      transition: "all 0.15s",
      boxShadow: active ? `0 6px 16px ${m.color}66` : "none",
      transform: active ? "translateY(-1px)" : "none",
    }),
    ratePreview: {
      background: t.accentSoft, border: `1px solid ${t.accent}55`,
      borderRadius: 10, padding: "10px 16px", fontSize: 13,
      color: t.subtext, marginBottom: 16,
    },
    formError: {
      background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
      borderRadius: 10, padding: "10px 16px", color: "#f87171", fontSize: 13, marginBottom: 16,
    },
    modalFooter: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8, flexWrap: "wrap" },
    cancelBtn: {
      padding: "11px 22px", background: t.inputBg, border: `1px solid ${t.surfaceBorder}`,
      borderRadius: 10, color: t.subtext, fontWeight: 600, fontSize: 14, cursor: "pointer",
    },
    saveBtn: {
      padding: "11px 24px",
      background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
      border: "none", borderRadius: 10,
      color: isLight ? "#fff" : "#0a0f1e",
      fontWeight: 700, fontSize: 14, cursor: "pointer",
    },
  };

  const themeSwatches: { name: ThemeName; gradient: string }[] = [
    { name: "midnight", gradient: "linear-gradient(135deg,#a78bfa,#22d3ee)" },
    { name: "aurora",   gradient: "linear-gradient(135deg,#4ade80,#22d3ee)" },
    { name: "sunset",   gradient: "linear-gradient(135deg,#fb923c,#f43f5e)" },
    { name: "paper",    gradient: "linear-gradient(135deg,#7c3aed,#0ea5e9)" },
  ];

  const currencyObj = CURRENCIES.find((c) => c.code === form.currency) ?? CURRENCIES[0];

  return (
    <div style={s.root}>
      <div style={s.glow1} />
      <div style={s.glow2} />

      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <span style={{
              width: 56, height: 56,
              background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
              borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 30, flexShrink: 0,
              boxShadow: `0 10px 30px ${t.accent}77, inset 0 1px 0 rgba(255,255,255,0.3)`,
              border: "2px solid rgba(255,255,255,0.15)",
            }}>💰</span>
            <div>
              <div style={{ ...s.logoTitle, fontSize: 18 }}>Money Transfer Tracker</div>
              <div style={s.logoSub}>Send · Track · Save</div>
            </div>
          </div>
          <div style={s.headerActions}>
            <div style={s.themeToggle} title="Change theme">
              {themeSwatches.map((sw) => (
                <button
                  key={sw.name}
                  aria-label={`Theme: ${THEMES[sw.name].label}`}
                  onClick={() => setTheme(sw.name)}
                  style={{ ...s.themeBtn(theme === sw.name), background: sw.gradient }}
                />
              ))}
            </div>
            <button style={s.addBtn} onClick={openAdd}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New
            </button>
          </div>
        </div>
      </header>

      <div style={s.tabs}>
        {(["dashboard", "records"] as const).map((tab) => (
          <button
            key={tab}
            style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "dashboard" ? "📊 Dashboard" : "📋 Records"}
          </button>
        ))}
      </div>

      <main style={s.main}>
        {activeTab === "dashboard" && (
          <>
            <div style={s.statsGrid}>
              <StatCard theme={t} label="Total Received" value={`৳ ${stats.totalBDT.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`} sub="BDT" accent={t.accent} />
              <StatCard theme={t} label="Transfers" value={String(stats.count)} sub={`${stats.thisMonthCount} this month`} accent={t.accent2} />
              <StatCard theme={t} label="This Month" value={`৳ ${stats.thisMonthBDT.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`} sub="BDT received" accent="#fb923c" />
              <StatCard theme={t} label="Currencies" value={String(Object.keys(stats.byCurrency).length)} sub="used" accent="#f43f5e" />
            </div>

            {Object.keys(stats.byCurrency).length > 0 && (
              <div style={s.card}>
                <div style={s.cardTitle}>Sent by Currency</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {Object.entries(stats.byCurrency).map(([code, amt]) => (
                    <div key={code} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: t.accentSoft, border: `1px solid ${t.surfaceBorder}`,
                      borderRadius: 10, padding: "8px 14px",
                    }}>
                      <span style={{ fontWeight: 800, color: t.accent, fontSize: 13 }}>{code}</span>
                      <span style={{ color: t.text, fontWeight: 600, fontSize: 13 }}>{fmtMoney(amt, code)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(stats.byYear).length > 0 && (
              <div style={s.card}>
                <div style={s.cardTitle}>Yearly Received (BDT)</div>
                <div style={s.chartWrap}>
                  {Object.entries(stats.byYear).sort(([a], [b]) => a.localeCompare(b)).map(([yr, bdt]) => (
                    <div key={yr} style={s.barGroup}>
                      <div style={s.barLabelTop}>৳ {bdt.toLocaleString("en-BD", { maximumFractionDigits: 0 })}</div>
                      <div style={s.barTrack}>
                        <div style={{ ...s.bar, height: `${Math.max(8, (bdt / maxYearBDT) * 100)}%` }} />
                      </div>
                      <div style={s.barLabel}>{yr}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(stats.byMethod).length > 0 && (
              <div style={s.card}>
                <div style={s.cardTitle}>Payment Methods</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {Object.entries(stats.byMethod).map(([method, count]) => {
                    const m = methodStyle(method);
                    return (
                      <div key={method} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        background: m.bg, border: `1.5px solid ${m.border}`,
                        borderRadius: 999, padding: "6px 12px",
                      }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.color, boxShadow: `0 0 8px ${m.color}` }} />
                        <span style={{ color: m.color, fontWeight: 700, fontSize: 12 }}>{method}</span>
                        <span style={{
                          background: m.color, color: "#fff", borderRadius: 999,
                          padding: "1px 8px", fontSize: 11, fontWeight: 800,
                        }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {records.length === 0 && (
              <div style={s.empty}>
                <div style={{ fontSize: 56 }}>💸</div>
                <p style={{ color: t.subtext, marginTop: 12 }}>No transfers yet. Add your first record!</p>
              </div>
            )}
          </>
        )}

        {activeTab === "records" && (
          <>
            <div style={s.searchWrap}>
              <span style={s.searchIcon}>🔍</span>
              <input
                style={s.searchInput}
                placeholder="Search name, reference, method, currency…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>}
            </div>

            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {([
                      ["date", "Date"],
                      ["recipientName", "Recipient"],
                      ["amountSent", "Sent"],
                      ["amountReceived", "Received (BDT)"],
                      ["paymentMethod", "Method"],
                      ["reference", "Reference"],
                    ] as [keyof Transfer, string][]).map(([field, label]) => (
                      <th key={field} style={s.th} onClick={() => handleSort(field)}>
                        {label}
                        {sortField === field && (
                          <span style={{ marginLeft: 4, opacity: 0.7 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
                        )}
                      </th>
                    ))}
                    <th style={{ ...s.th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "48px 0", color: t.muted }}>
                        {search ? "No matching records." : "No records yet. Tap \"+ New\" to add one."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, i) => {
                      const m = methodStyle(r.paymentMethod);
                      return (
                        <tr key={r.id} style={{ background: i % 2 === 0 ? (isLight ? "rgba(15,23,42,0.02)" : "rgba(255,255,255,0.02)") : "transparent" }}>
                          <td style={s.td}>{fmtDate(r.date)}</td>
                          <td style={{ ...s.td, fontWeight: 700 }}>{r.recipientName}</td>
                          <td style={{ ...s.td, color: t.accent, fontWeight: 700 }}>{fmtMoney(r.amountSent, r.currency)}</td>
                          <td style={{ ...s.td, color: t.accent2, fontWeight: 700 }}>৳ {r.amountReceived.toLocaleString("en-BD", { maximumFractionDigits: 2 })}</td>
                          <td style={s.td}>
                            <span style={{
                              background: m.bg, color: m.color,
                              border: `1.5px solid ${m.border}`,
                              borderRadius: 999, padding: "4px 10px",
                              fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
                            }}>{r.paymentMethod}</span>
                          </td>
                          <td style={{ ...s.td, color: t.subtext }}>{r.reference}</td>
                          <td style={{ ...s.td, textAlign: "right" }}>
                            <button style={s.editBtn} onClick={() => openEdit(r)}>Edit</button>
                            <button style={s.delBtn} onClick={() => setDeleteConfirm(r.id)}>Delete</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div style={s.tableFooter}>
                Showing {filtered.length} of {records.length} record{records.length !== 1 ? "s" : ""}
              </div>
            )}
          </>
        )}
      </main>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{editId ? "Edit Transfer" : "New Transfer"}</h2>
              <button style={s.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>

            <div style={s.formGrid}>
              <Field theme={t} label="Date *">
                <input type="date" style={s.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field theme={t} label="Recipient Name *">
                <input type="text" style={s.input} placeholder="" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
              </Field>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field theme={t} label={`Amount Sent (${currencyObj.code}) *`}>
                  <div style={s.amountRow}>
                    <select
                      style={s.currencySelect}
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} style={{ background: "#0a0f1e", color: "#fff" }}>{c.symbol} {c.code} — {c.label}</option>
                      ))}
                    </select>
                    <input
                      type="number" step="0.01" min="0"
                      style={s.input} placeholder=""
                      value={form.amountSent || ""}
                      onChange={(e) => setForm({ ...form, amountSent: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </Field>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field theme={t} label={`Amount Received (${form.receivedCurrency}) *`}>
                  <div style={s.amountRow}>
                    <select
                      style={s.currencySelect}
                      value={form.receivedCurrency}
                      onChange={(e) => setForm({ ...form, receivedCurrency: e.target.value })}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} style={{ background: "#0a0f1e", color: "#fff" }}>{c.symbol} {c.code} — {c.label}</option>
                      ))}
                    </select>
                    <input
                      type="number" step="0.01" min="0"
                      style={s.input} placeholder=""
                      value={form.amountReceived || ""}
                      onChange={(e) => setForm({ ...form, amountReceived: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </Field>
              </div>

              <Field theme={t} label="Reference / Purpose">
                <input type="text" style={s.input} placeholder="" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </Field>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field theme={t} label="Payment Method">
                  <div style={s.methodPicker}>
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        style={s.methodChip(m, form.paymentMethod === m.name)}
                        onClick={() => setForm({ ...form, paymentMethod: m.name })}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            {form.amountSent > 0 && form.amountReceived > 0 && (
              <div style={s.ratePreview}>
                Exchange rate: <strong style={{ color: t.accent }}>
                  ৳ {(form.amountReceived / form.amountSent).toFixed(2)}
                </strong> per {currencyObj.code}
              </div>
            )}
            {formError && <div style={s.formError}>⚠ {formError}</div>}

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={handleSubmit}>
                {editId ? "Save Changes" : "Add Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={s.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...s.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Delete Record?</h2>
              <button style={s.closeBtn} onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ color: t.subtext, marginBottom: 24 }}>
              This action cannot be undone. The transfer will be permanently removed from your device.
            </p>
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={{ ...s.saveBtn, background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" }} onClick={() => handleDelete(deleteConfirm!)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children, theme }: { label: string; children: React.ReactNode; theme: typeof THEMES[ThemeName] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: theme.subtext, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent, theme }: { label: string; value: string; sub: string; accent: string; theme: typeof THEMES[ThemeName] }) {
  return (
    <div style={{
      background: theme.surface, border: `1px solid ${theme.surfaceBorder}`,
      borderRadius: 16, padding: "18px 20px",
      borderTop: `3px solid ${accent}`,
      backdropFilter: "blur(10px)",
    }}>
      <div style={{ fontSize: 11, color: theme.subtext, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
