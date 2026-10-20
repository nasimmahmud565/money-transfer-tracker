import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { fetchCloud, pushCloud } from "@/lib/cloudSync";


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

interface Note {
  id: string;
  date: string;
  title: string;
  body: string;
}

type ThemeName = "midnight" | "aurora" | "sunset" | "paper";
type TabName = "dashboard" | "records" | "recipients" | "notes";

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "money_transfer_records_v2";
const NOTES_KEY = "money_transfer_notes_v1";
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
  { name: "Taptap Send",      color: "#06b6d4", bg: "rgba(6,182,212,0.18)",   border: "rgba(6,182,212,0.45)" },
  { name: "Mobile Banking",   color: "#10b981", bg: "rgba(16,185,129,0.18)",  border: "rgba(16,185,129,0.45)" },
  { name: "Bank Transfer",    color: "#3b82f6", bg: "rgba(59,130,246,0.18)",  border: "rgba(59,130,246,0.45)" },
  { name: "Western Union",    color: "#facc15", bg: "rgba(250,204,21,0.18)",  border: "rgba(250,204,21,0.45)" },
  { name: "Wise",             color: "#9be15d", bg: "rgba(155,225,93,0.18)",  border: "rgba(155,225,93,0.45)" },
  { name: "Remitly",          color: "#a78bfa", bg: "rgba(167,139,250,0.2)",  border: "rgba(167,139,250,0.45)" },
  { name: "Other",            color: "#94a3b8", bg: "rgba(148,163,184,0.18)", border: "rgba(148,163,184,0.45)" },
];

const methodStyle = (name: string) =>
  PAYMENT_METHODS.find((m) => m.name === name) ?? PAYMENT_METHODS[PAYMENT_METHODS.length - 1];

const THEMES: Record<ThemeName, {
  label: string; bg: string; surface: string; surfaceBorder: string;
  text: string; subtext: string; muted: string;
  accent: string; accent2: string; accentSoft: string;
  modalBg: string; inputBg: string;
}> = {
  midnight: {
    label: "Midnight",
    bg: "radial-gradient(ellipse at 20% 0%, #1e1b4b 0%, #0a0f1e 45%, #050816 100%)",
    surface: "rgba(255,255,255,0.04)", surfaceBorder: "rgba(255,255,255,0.08)",
    text: "#e2e8f0", subtext: "#94a3b8", muted: "#475569",
    accent: "#a78bfa", accent2: "#22d3ee", accentSoft: "rgba(167,139,250,0.15)",
    modalBg: "#111827", inputBg: "rgba(255,255,255,0.06)",
  },
  aurora: {
    label: "Aurora",
    bg: "radial-gradient(ellipse at 80% 10%, #064e3b 0%, #0f172a 50%, #020617 100%)",
    surface: "rgba(255,255,255,0.04)", surfaceBorder: "rgba(74,222,128,0.12)",
    text: "#ecfdf5", subtext: "#86efac", muted: "#4b6358",
    accent: "#4ade80", accent2: "#22d3ee", accentSoft: "rgba(74,222,128,0.15)",
    modalBg: "#0f1f1a", inputBg: "rgba(255,255,255,0.05)",
  },
  sunset: {
    label: "Sunset",
    bg: "radial-gradient(ellipse at 20% 100%, #7c2d12 0%, #1f0a1a 55%, #0a0510 100%)",
    surface: "rgba(255,255,255,0.05)", surfaceBorder: "rgba(251,146,60,0.18)",
    text: "#fef3c7", subtext: "#fbbf77", muted: "#7a5544",
    accent: "#fb923c", accent2: "#f43f5e", accentSoft: "rgba(251,146,60,0.15)",
    modalBg: "#1f1410", inputBg: "rgba(255,255,255,0.06)",
  },
  paper: {
    label: "Paper",
    bg: "radial-gradient(ellipse at 30% 0%, #f5f3ee 0%, #ebe7df 100%)",
    surface: "rgba(255,255,255,0.7)", surfaceBorder: "rgba(15,23,42,0.1)",
    text: "#1e293b", subtext: "#64748b", muted: "#94a3b8",
    accent: "#7c3aed", accent2: "#0ea5e9", accentSoft: "rgba(124,58,237,0.1)",
    modalBg: "#ffffff", inputBg: "rgba(15,23,42,0.04)",
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
    day: "2-digit", month: "short", year: "numeric",
  });

const EMPTY_FORM = (): Omit<Transfer, "id"> => ({
  date: new Date().toISOString().split("T")[0],
  recipientName: "", amountSent: 0, currency: "SAR",
  amountReceived: 0, receivedCurrency: "BDT",
  paymentMethod: "Bkash Transfer", reference: "",
});

const EMPTY_NOTE = (): Omit<Note, "id"> => ({
  date: new Date().toISOString().split("T")[0],
  title: "", body: "",
});

// ─── App ──────────────────────────────────────────────────────────────────────
export default function Index() {
  const [theme, setTheme] = useState<ThemeName>("midnight");
  const t = THEMES[theme];

  const [records, setRecords] = useState<Transfer[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [form, setForm] = useState<Omit<Transfer, "id">>(EMPTY_FORM());
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [noteForm, setNoteForm] = useState<Omit<Note, "id">>(EMPTY_NOTE());
  const [editNoteId, setEditNoteId] = useState<string | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);

  const [search, setSearch] = useState("");
  const [noteSearch, setNoteSearch] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  const [sortField, setSortField] = useState<keyof Transfer>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteNoteConfirm, setDeleteNoteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("dashboard");
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const recordsImportRef = useRef<HTMLInputElement>(null);
  const notesImportRef = useRef<HTMLInputElement>(null);

  // ─── Auth (Google) ──────────────────────────────────────────────────────
  const [user, setUser] = useState<{ id: string; email?: string; name?: string; avatar?: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const loadedRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user;
      setUser(u ? { id: u.id, email: u.email ?? undefined, name: (u.user_metadata as any)?.full_name, avatar: (u.user_metadata as any)?.avatar_url } : null);
      setAuthLoading(false);
      if (!u) loadedRef.current = false;
    });
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setUser(u ? { id: u.id, email: u.email ?? undefined, name: (u.user_metadata as any)?.full_name, avatar: (u.user_metadata as any)?.avatar_url } : null);
      setAuthLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn() {
    setSigningIn(true);
    setAuthError("");
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) {
      setAuthError(result.error.message || "Sign-in failed. Please try again.");
      setSigningIn(false);
      return;
    }
    if (result.redirected) return;
    setSigningIn(false);
  }

  async function signOut() {
    loadedRef.current = false;
    await supabase.auth.signOut();
    setRecords([]);
    setNotes([]);
    setSyncState("idle");
  }

  // ─── Persistence: device storage (offline cache) ────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRecords(JSON.parse(stored));
      const n = localStorage.getItem(NOTES_KEY);
      if (n) setNotes(JSON.parse(n));
      const tStored = localStorage.getItem(THEME_KEY) as ThemeName | null;
      if (tStored && THEMES[tStored]) setTheme(tStored);
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem(THEME_KEY, theme); }, [theme]);

  // ─── Cloud: pull on sign-in (merging any offline-only local data) ───────
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setSyncState("syncing");
    (async () => {
      const { transfers, notes: cloudNotes, error } = await fetchCloud(user.id);
      if (cancelled) return;
      if (error) { setSyncState("error"); return; }
      setRecords((local) => {
        const map = new Map<string, Transfer>(transfers.map((r) => [r.id, r as Transfer]));
        local.forEach((r) => { if (!map.has(r.id)) map.set(r.id, r); });
        return Array.from(map.values());
      });
      setNotes((local) => {
        const map = new Map<string, Note>(cloudNotes.map((n) => [n.id, n as Note]));
        local.forEach((n) => { if (!map.has(n.id)) map.set(n.id, n); });
        return Array.from(map.values());
      });

      loadedRef.current = true;
      setSyncState("synced");
    })();
    return () => { cancelled = true; };
  }, [user]);

  // ─── Cloud: push on every change ────────────────────────────────────────
  useEffect(() => {
    if (!user || !loadedRef.current) return;
    setSyncState("syncing");
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(async () => {
      try {
        await pushCloud(user.id, records, notes);
        setSyncState("synced");
      } catch {
        setSyncState("error");
      }
    }, 600);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
  }, [records, notes, user]);


  // ─── Toast helper ───────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  }

  // ─── Filtering / sorting ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return [...records]
      .filter((r) => {
        if (!q) return true;
        return (
          r.recipientName.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          r.paymentMethod.toLowerCase().includes(q) ||
          r.date.toLowerCase().includes(q) ||
          r.currency.toLowerCase().includes(q) ||
          (r.receivedCurrency ?? "").toLowerCase().includes(q) ||
          String(r.amountSent).includes(q) ||
          String(r.amountReceived).includes(q)
        );
      })
      .sort((a, b) => {
        const av = a[sortField]; const bv = b[sortField];
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [records, search, sortField, sortDir]);

  const filteredNotes = useMemo(() => {
    const q = noteSearch.toLowerCase().trim();
    return [...notes]
      .filter((n) => !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || n.date.includes(q))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [notes, noteSearch]);

  // Recipient-wise totals: total received per name (grouped by received currency)
  const recipientTotals = useMemo(() => {
    const map = new Map<string, {
      name: string;
      count: number;
      lastDate: string;
      sentByCurrency: Record<string, number>;
      receivedByCurrency: Record<string, number>;
    }>();
    records.forEach((r) => {
      const key = r.recipientName.trim() || "(Unnamed)";
      const entry = map.get(key) ?? {
        name: key, count: 0, lastDate: "",
        sentByCurrency: {}, receivedByCurrency: {},
      };
      entry.count += 1;
      if (r.date > entry.lastDate) entry.lastDate = r.date;
      entry.sentByCurrency[r.currency] = (entry.sentByCurrency[r.currency] || 0) + r.amountSent;
      const rc = r.receivedCurrency ?? "BDT";
      entry.receivedByCurrency[rc] = (entry.receivedByCurrency[rc] || 0) + r.amountReceived;
      map.set(key, entry);
    });
    const q = recipientSearch.toLowerCase().trim();
    return Array.from(map.values())
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const aTot = Object.values(a.receivedByCurrency).reduce((s, v) => s + v, 0);
        const bTot = Object.values(b.receivedByCurrency).reduce((s, v) => s + v, 0);
        return bTot - aTot;
      });
  }, [records, recipientSearch]);

  const stats = useMemo(() => {
    const totalBDT = records.reduce((s, r) => s + r.amountReceived, 0);
    const byCurrency: Record<string, number> = {};
    records.forEach((r) => { byCurrency[r.currency] = (byCurrency[r.currency] || 0) + r.amountSent; });
    const thisMonth = records.filter((r) => {
      const now = new Date(); const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const byYear: Record<string, number> = {};
    records.forEach((r) => { const yr = r.date.slice(0, 4); byYear[yr] = (byYear[yr] || 0) + r.amountReceived; });
    const byMethod: Record<string, number> = {};
    records.forEach((r) => { byMethod[r.paymentMethod] = (byMethod[r.paymentMethod] || 0) + 1; });
    return {
      totalBDT, byCurrency, count: records.length,
      thisMonthCount: thisMonth.length,
      thisMonthBDT: thisMonth.reduce((s, r) => s + r.amountReceived, 0),
      byYear, byMethod,
    };
  }, [records]);

  // ─── Handlers ───────────────────────────────────────────────────────────
  function handleSort(field: keyof Transfer) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }
  function openAdd() { setForm(EMPTY_FORM()); setEditId(null); setFormError(""); setShowForm(true); }
  function openEdit(r: Transfer) {
    setForm({ date: r.date, recipientName: r.recipientName, amountSent: r.amountSent, currency: r.currency, amountReceived: r.amountReceived, receivedCurrency: r.receivedCurrency ?? "BDT", paymentMethod: r.paymentMethod, reference: r.reference });
    setEditId(r.id); setFormError(""); setShowForm(true);
  }
  function handleSubmit() {
    if (!form.date) return setFormError("Date is required.");
    if (!form.recipientName.trim()) return setFormError("Recipient name is required.");
    if (!form.amountSent || form.amountSent <= 0) return setFormError("Amount sent must be greater than 0.");
    if (!form.amountReceived || form.amountReceived <= 0) return setFormError("Amount received must be greater than 0.");
    setFormError("");
    if (editId) setRecords((prev) => prev.map((r) => (r.id === editId ? { ...form, id: editId } : r)));
    else setRecords((prev) => [...prev, { ...form, id: genId() }]);
    setShowForm(false);
  }
  function handleDelete(id: string) { setRecords((prev) => prev.filter((r) => r.id !== id)); setDeleteConfirm(null); }

  // Notes handlers
  function openAddNote() { setNoteForm(EMPTY_NOTE()); setEditNoteId(null); setShowNoteForm(true); }
  function openEditNote(n: Note) { setNoteForm({ date: n.date, title: n.title, body: n.body }); setEditNoteId(n.id); setShowNoteForm(true); }
  function handleSubmitNote() {
    if (!noteForm.title.trim() && !noteForm.body.trim()) return;
    if (editNoteId) setNotes((prev) => prev.map((n) => (n.id === editNoteId ? { ...noteForm, id: editNoteId } : n)));
    else setNotes((prev) => [...prev, { ...noteForm, id: genId() }]);
    setShowNoteForm(false);
  }
  function handleDeleteNote(id: string) { setNotes((prev) => prev.filter((n) => n.id !== id)); setDeleteNoteConfirm(null); }

  // ─── Excel Export / Import ──────────────────────────────────────────────
  function exportRecords(format: "xlsx" | "csv" | "ods" = "xlsx") {
    const rows = records.map((r) => ({
      Date: r.date,
      Recipient: r.recipientName,
      "Amount Sent": r.amountSent,
      "Sent Currency": r.currency,
      "Amount Received": r.amountReceived,
      "Received Currency": r.receivedCurrency ?? "BDT",
      "Payment Method": r.paymentMethod,
      Reference: r.reference,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transfers");
    XLSX.writeFile(wb, `money-transfers-${new Date().toISOString().slice(0,10)}.${format}`);
    showToast(`Exported ${rows.length} record${rows.length !== 1 ? "s" : ""}`);
  }

  function exportNotes(format: "xlsx" | "csv" | "ods" = "xlsx") {
    const rows = notes.map((n) => ({ Date: n.date, Title: n.title, Body: n.body }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    XLSX.writeFile(wb, `notes-${new Date().toISOString().slice(0,10)}.${format}`);
    showToast(`Exported ${rows.length} note${rows.length !== 1 ? "s" : ""}`);
  }

  function importRecords(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
        const imported: Transfer[] = rows.map((r) => {
          const dRaw = r.Date ?? r.date ?? "";
          let d = "";
          if (dRaw instanceof Date) d = dRaw.toISOString().slice(0, 10);
          else if (typeof dRaw === "string") d = dRaw.slice(0, 10);
          else d = new Date().toISOString().slice(0, 10);
          return {
            id: genId(), date: d || new Date().toISOString().slice(0, 10),
            recipientName: String(r.Recipient ?? r.recipientName ?? r.Name ?? ""),
            amountSent: Number(r["Amount Sent"] ?? r.amountSent ?? 0) || 0,
            currency: String(r["Sent Currency"] ?? r.currency ?? "SAR").toUpperCase(),
            amountReceived: Number(r["Amount Received"] ?? r.amountReceived ?? 0) || 0,
            receivedCurrency: String(r["Received Currency"] ?? r.receivedCurrency ?? "BDT").toUpperCase(),
            paymentMethod: String(r["Payment Method"] ?? r.paymentMethod ?? "Other"),
            reference: String(r.Reference ?? r.reference ?? ""),
          };
        }).filter((x) => x.recipientName || x.amountSent);
        setRecords((prev) => [...prev, ...imported]);
        showToast(`Imported ${imported.length} record${imported.length !== 1 ? "s" : ""}`);
      } catch (err) {
        showToast("Import failed: invalid file");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function importNotes(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
        const imported: Note[] = rows.map((r) => {
          const dRaw = r.Date ?? r.date ?? "";
          let d = "";
          if (dRaw instanceof Date) d = dRaw.toISOString().slice(0, 10);
          else if (typeof dRaw === "string") d = dRaw.slice(0, 10);
          else d = new Date().toISOString().slice(0, 10);
          return {
            id: genId(), date: d || new Date().toISOString().slice(0, 10),
            title: String(r.Title ?? r.title ?? ""),
            body: String(r.Body ?? r.body ?? r.Note ?? ""),
          };
        }).filter((n) => n.title || n.body);
        setNotes((prev) => [...prev, ...imported]);
        showToast(`Imported ${imported.length} note${imported.length !== 1 ? "s" : ""}`);
      } catch {
        showToast("Import failed: invalid file");
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const maxYearBDT = Math.max(...Object.values(stats.byYear), 1);
  const isLight = theme === "paper";

  // ─── Styles ─────────────────────────────────────────────────────────────
  const s: Record<string, any> = {
    root: { minHeight: "100vh", background: t.bg, fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", color: t.text, position: "relative", overflowX: "hidden" },
    glow1: { position: "fixed", top: -120, right: -120, width: 360, height: 360, borderRadius: "50%", background: `radial-gradient(circle, ${t.accent}55, transparent 70%)`, filter: "blur(40px)", pointerEvents: "none", zIndex: 0 },
    glow2: { position: "fixed", bottom: -160, left: -160, width: 420, height: 420, borderRadius: "50%", background: `radial-gradient(circle, ${t.accent2}40, transparent 70%)`, filter: "blur(50px)", pointerEvents: "none", zIndex: 0 },
    header: { position: "relative", zIndex: 10, borderBottom: `1px solid ${t.surfaceBorder}`, background: isLight ? "rgba(255,255,255,0.7)" : "rgba(10,15,30,0.55)", backdropFilter: "blur(20px)", padding: "10px 12px" },
    headerInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
    logo: { display: "flex", alignItems: "center", gap: 8, minWidth: 0 },
    logoTitle: { fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: "-0.02em", lineHeight: 1.15 },
    logoSub: { fontSize: 9, color: t.accent, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" },
    headerActions: { display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" },
    themeToggle: { display: "flex", gap: 4, padding: 4, background: t.surface, border: `1px solid ${t.surfaceBorder}`, borderRadius: 12 },
    themeBtn: (active: boolean): React.CSSProperties => ({
      width: 24, height: 24, borderRadius: 6, border: "none", cursor: "pointer", transition: "transform 0.2s",
      transform: active ? "scale(1.15)" : "scale(1)",
      boxShadow: active ? `0 0 0 2px ${t.accent}` : "none",
    }),
    addBtn: { display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, border: "none", borderRadius: 10, color: isLight ? "#fff" : "#0a0f1e", fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: "0.02em", boxShadow: `0 8px 20px ${t.accent}55`, whiteSpace: "nowrap" },
    iconBtn: { padding: "8px 10px", background: t.surface, border: `1px solid ${t.surfaceBorder}`, borderRadius: 10, color: t.text, fontWeight: 600, fontSize: 12, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" },
    tabs: { position: "relative", zIndex: 10, display: "flex", padding: "0 10px", borderBottom: `1px solid ${t.surfaceBorder}`, background: isLight ? "rgba(255,255,255,0.5)" : "rgba(10,15,30,0.4)", overflowX: "auto", WebkitOverflowScrolling: "touch" },
    tab: { padding: "13px 16px", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: t.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" },
    tabActive: { color: t.accent, borderBottom: `2px solid ${t.accent}` },
    main: { position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "20px 12px" },
    statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginBottom: 16 },
    card: { background: t.surface, border: `1px solid ${t.surfaceBorder}`, borderRadius: 16, padding: 16, marginBottom: 16, backdropFilter: "blur(10px)" },
    cardTitle: { fontSize: 12, fontWeight: 700, color: t.subtext, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 },
    chartWrap: { display: "flex", alignItems: "flex-end", gap: 12, height: 140, paddingBottom: 4, overflowX: "auto" },
    barGroup: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, minWidth: 50, height: "100%" },
    barLabelTop: { fontSize: 10, color: t.subtext, fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" },
    barTrack: { flex: 1, width: "60%", background: isLight ? "rgba(15,23,42,0.06)" : "rgba(255,255,255,0.05)", borderRadius: 8, display: "flex", alignItems: "flex-end", overflow: "hidden", minWidth: 28 },
    bar: { width: "100%", borderRadius: 8, transition: "height 0.5s ease", background: `linear-gradient(to top, ${t.accent}, ${t.accent2})` },
    barLabel: { fontSize: 11, color: t.muted, fontWeight: 700 },
    empty: { textAlign: "center", padding: "40px 0" },
    toolbar: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" },
    searchWrap: { position: "relative", display: "flex", alignItems: "center", flex: "1 1 220px", minWidth: 200 },
    searchIcon: { position: "absolute", left: 12, fontSize: 15, pointerEvents: "none" },
    searchInput: { width: "100%", padding: "10px 36px 10px 38px", background: t.inputBg, border: `1px solid ${t.surfaceBorder}`, borderRadius: 10, color: t.text, fontSize: 14, outline: "none", boxSizing: "border-box" },
    clearBtn: { position: "absolute", right: 10, background: "none", border: "none", color: t.muted, cursor: "pointer", fontSize: 15 },
    tableWrap: { overflowX: "auto", WebkitOverflowScrolling: "touch", borderRadius: 14, border: `1px solid ${t.surfaceBorder}`, background: t.surface },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 720 },
    th: { padding: "11px 12px", textAlign: "left", fontSize: 11, fontWeight: 700, color: t.subtext, letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: `1px solid ${t.surfaceBorder}`, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" },
    td: { padding: "11px 12px", borderBottom: `1px solid ${isLight ? "rgba(15,23,42,0.05)" : "rgba(255,255,255,0.04)"}`, verticalAlign: "middle", color: t.text, whiteSpace: "nowrap" },
    editBtn: { background: t.inputBg, border: `1px solid ${t.surfaceBorder}`, borderRadius: 8, color: t.text, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 6 },
    delBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
    tableFooter: { padding: "10px 4px", color: t.muted, fontSize: 13, textAlign: "right" },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 12 },
    modal: { background: t.modalBg, border: `1px solid ${t.surfaceBorder}`, borderRadius: 18, padding: 20, maxWidth: 560, width: "100%", maxHeight: "92vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.5)" },
    modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
    modalTitle: { fontSize: 18, fontWeight: 800, color: t.text, letterSpacing: "-0.02em", margin: 0 },
    closeBtn: { background: t.inputBg, border: "none", borderRadius: 8, color: t.subtext, width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" },
    formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 },
    input: { padding: "11px 14px", background: t.inputBg, border: `1px solid ${t.surfaceBorder}`, borderRadius: 10, color: t.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
    textarea: { padding: "11px 14px", background: t.inputBg, border: `1px solid ${t.surfaceBorder}`, borderRadius: 10, color: t.text, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit", minHeight: 120, resize: "vertical" },
    amountRow: { display: "flex", gap: 8, flexWrap: "wrap" },
    currencySelect: { padding: "11px 10px", background: "#0a0f1e", border: `1px solid ${t.surfaceBorder}`, borderRadius: 10, color: "#ffffff", fontSize: 13, outline: "none", fontFamily: "inherit", minWidth: 90, fontWeight: 700, cursor: "pointer", colorScheme: "dark" },
    methodPicker: { display: "flex", flexWrap: "wrap", gap: 8 },
    methodChip: (m: typeof PAYMENT_METHODS[number], active: boolean): React.CSSProperties => ({
      padding: "8px 14px", borderRadius: 999,
      background: active ? m.color : m.bg, border: `1.5px solid ${active ? m.color : m.border}`,
      color: active ? "#fff" : m.color, fontWeight: 700, fontSize: 12, cursor: "pointer",
      transition: "all 0.15s", boxShadow: active ? `0 6px 16px ${m.color}66` : "none",
      transform: active ? "translateY(-1px)" : "none",
    }),
    ratePreview: { background: t.accentSoft, border: `1px solid ${t.accent}55`, borderRadius: 10, padding: "10px 16px", fontSize: 13, color: t.subtext, marginBottom: 14 },
    formError: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 16px", color: "#f87171", fontSize: 13, marginBottom: 14 },
    modalFooter: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8, flexWrap: "wrap" },
    cancelBtn: { padding: "11px 22px", background: t.inputBg, border: `1px solid ${t.surfaceBorder}`, borderRadius: 10, color: t.subtext, fontWeight: 600, fontSize: 14, cursor: "pointer" },
    saveBtn: { padding: "11px 24px", background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`, border: "none", borderRadius: 10, color: isLight ? "#fff" : "#0a0f1e", fontWeight: 700, fontSize: 14, cursor: "pointer" },
    noteCard: { background: t.surface, border: `1px solid ${t.surfaceBorder}`, borderRadius: 14, padding: 16, marginBottom: 12, backdropFilter: "blur(10px)" },
    toast: { position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: t.modalBg, border: `1px solid ${t.accent}66`, color: t.text, padding: "12px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: `0 12px 30px ${t.accent}33` },
  };

  const themeSwatches: { name: ThemeName; gradient: string }[] = [
    { name: "midnight", gradient: "linear-gradient(135deg,#a78bfa,#22d3ee)" },
    { name: "aurora",   gradient: "linear-gradient(135deg,#4ade80,#22d3ee)" },
    { name: "sunset",   gradient: "linear-gradient(135deg,#fb923c,#f43f5e)" },
    { name: "paper",    gradient: "linear-gradient(135deg,#7c3aed,#0ea5e9)" },
  ];

  const currencyObj = CURRENCIES.find((c) => c.code === form.currency) ?? CURRENCIES[0];

  // ─── Auth gate ──────────────────────────────────────────────────────────
  if (authLoading || !user) {
    return (
      <div style={{ ...s.root, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={s.glow1} />
        <div style={s.glow2} />
        <div style={{ ...s.card, position: "relative", zIndex: 5, maxWidth: 420, width: "100%", textAlign: "center", padding: 28, marginBottom: 0 }}>
          <div style={{ fontSize: 56, filter: `drop-shadow(0 6px 16px ${t.accent}88)` }}>💸</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.text, margin: "10px 0 4px", letterSpacing: "-0.02em" }}>Money Transfer Tracker</h1>
          <p style={{ color: t.muted, fontSize: 13, margin: "0 0 22px" }}>
            {authLoading ? "Checking your session…" : "Sign in with Google to sync your records and notes across all your devices."}
          </p>
          {!authLoading && (
            <>
              <button
                onClick={signIn}
                disabled={signingIn}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10, width: "100%",
                  padding: "13px 18px", borderRadius: 12, border: `1px solid ${t.surfaceBorder}`,
                  background: "#ffffff", color: "#1f2937", fontWeight: 700, fontSize: 15,
                  cursor: signingIn ? "wait" : "pointer", opacity: signingIn ? 0.7 : 1,
                  boxShadow: `0 10px 24px ${t.accent}33`,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.2l7.8 6.1C12.2 13.3 17.6 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.7c-.6 3-2.3 5.6-4.9 7.3l7.6 5.9c4.4-4.1 7.1-10.2 7.1-17.5z" />
                  <path fill="#FBBC05" d="M10.3 28.7a14.6 14.6 0 0 1 0-9.4l-7.8-6.1a24 24 0 0 0 0 21.6l7.8-6.1z" />
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.3 2.3-6.4 0-11.8-3.8-13.7-9.8l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
                </svg>
                {signingIn ? "Opening Google…" : "Continue with Google"}
              </button>
              {authError && <div style={{ ...s.formError, marginTop: 14, marginBottom: 0 }}>{authError}</div>}
            </>
          )}
          <div style={{ marginTop: 22, fontSize: 11, color: t.muted }}>Your data stays private to your account.</div>
          <Link to="/" style={{ display: "inline-block", marginTop: 10, fontSize: 12, color: t.accent, textDecoration: "none", fontWeight: 700 }}>← Back to home</Link>
        </div>
      </div>
    );
  }

  return (

    <div style={s.root}>
      <div style={s.glow1} />
      <div style={s.glow2} />

      <header style={s.header}>
        <div style={s.headerInner}>
          <div style={s.logo}>
            <span style={{
              width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 32, flexShrink: 0, filter: `drop-shadow(0 4px 12px ${t.accent}88)`,
            }}>💸</span>
            <div style={{ minWidth: 0 }}>
              <div style={s.logoTitle}>Money Transfer Tracker</div>
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
            <div
              title={syncState === "error" ? "Cloud sync failed" : syncState === "syncing" ? "Syncing to cloud…" : "All changes synced"}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999,
                background: t.surface, border: `1px solid ${t.surfaceBorder}`, fontSize: 11, fontWeight: 700,
                color: syncState === "error" ? "#f87171" : syncState === "syncing" ? t.accent : t.muted,
              }}
            >
              <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: syncState === "error" ? "#f87171" : syncState === "syncing" ? t.accent : "#4ade80",
              }} />
              {syncState === "error" ? "Sync error" : syncState === "syncing" ? "Syncing" : "Synced"}
            </div>
            <button style={s.addBtn} onClick={activeTab === "notes" ? openAddNote : openAdd}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New
            </button>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {user.avatar ? (
                <img src={user.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${t.surfaceBorder}` }} />
              ) : (
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", background: t.accentSoft, color: t.accent,
                  display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12,
                }}>{(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}</span>
              )}
              <button style={s.iconBtn} onClick={signOut} title={user.email}>Sign out</button>
            </div>

          </div>
        </div>
      </header>

      <div style={s.tabs}>
        {([
          ["dashboard", "📊 Dashboard"],
          ["records", "📋 Records"],
          ["recipients", "👥 Recipients"],
          ["notes", "📝 Notes"],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            style={{ ...s.tab, ...(activeTab === tab ? s.tabActive : {}) }}
            onClick={() => setActiveTab(tab as TabName)}
          >
            {label}
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
              <StatCard theme={t} label="Notes" value={String(notes.length)} sub="saved" accent="#f43f5e" />
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
                        <span style={{ background: m.color, color: "#fff", borderRadius: 999, padding: "1px 8px", fontSize: 11, fontWeight: 800 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {records.length === 0 && notes.length === 0 && (
              <div style={s.empty}>
                <div style={{ fontSize: 56 }}>💸</div>
                <p style={{ color: t.subtext, marginTop: 12 }}>No data yet. Add your first record or note!</p>
              </div>
            )}
          </>
        )}

        {activeTab === "records" && (
          <>
            <div style={s.toolbar}>
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍</span>
                <input
                  style={s.searchInput}
                  placeholder="Search anything (text, numbers, date)…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>}
              </div>
              <button style={s.iconBtn} onClick={() => exportRecords("xlsx")}>⬇ Excel</button>
              <button style={s.iconBtn} onClick={() => exportRecords("csv")}>⬇ CSV</button>
              <button style={s.iconBtn} onClick={() => recordsImportRef.current?.click()}>⬆ Import</button>
              <input
                ref={recordsImportRef} type="file"
                accept=".xlsx,.xls,.csv,.ods,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0]; if (f) importRecords(f);
                  e.target.value = "";
                }}
              />
            </div>

            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {([
                      ["date", "Date"],
                      ["recipientName", "Recipient"],
                      ["amountSent", "Sent"],
                      ["amountReceived", "Received"],
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
                      <td colSpan={7} style={{ textAlign: "center", padding: "44px 0", color: t.muted }}>
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
                          <td style={{ ...s.td, color: t.accent2, fontWeight: 700 }}>{fmtMoney(r.amountReceived, r.receivedCurrency ?? "BDT")}</td>
                          <td style={s.td}>
                            <span style={{
                              background: m.bg, color: m.color, border: `1.5px solid ${m.border}`,
                              borderRadius: 999, padding: "4px 10px", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap",
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

        {activeTab === "recipients" && (
          <>
            <div style={s.toolbar}>
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍</span>
                <input
                  style={s.searchInput}
                  placeholder="Search recipient name…"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                />
                {recipientSearch && <button style={s.clearBtn} onClick={() => setRecipientSearch("")}>✕</button>}
              </div>
            </div>

            {recipientTotals.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 48 }}>👥</div>
                <p style={{ color: t.subtext, marginTop: 10 }}>
                  {recipientSearch ? "No matching recipients." : "No recipients yet. Add a record first."}
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
                {recipientTotals.map((rec) => (
                  <div key={rec.name} style={{
                    background: t.surface, border: `1px solid ${t.surfaceBorder}`,
                    borderRadius: 16, padding: 16, backdropFilter: "blur(10px)",
                    borderTop: `3px solid ${t.accent2}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: "-0.01em" }}>{rec.name}</div>
                        <div style={{ fontSize: 11, color: t.muted, marginTop: 2 }}>
                          {rec.count} transfer{rec.count !== 1 ? "s" : ""} · last {fmtDate(rec.lastDate)}
                        </div>
                      </div>
                      <span style={{
                        background: t.accentSoft, color: t.accent, fontWeight: 800,
                        fontSize: 11, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap",
                      }}>{rec.count}</span>
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 700, color: t.subtext, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                      Total Received
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                      {Object.entries(rec.receivedByCurrency).map(([cur, amt]) => (
                        <div key={cur} style={{ fontSize: 18, fontWeight: 800, color: t.accent2, letterSpacing: "-0.01em" }}>
                          {fmtMoney(amt, cur)}
                        </div>
                      ))}
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 700, color: t.subtext, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                      Total Sent
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {Object.entries(rec.sentByCurrency).map(([cur, amt]) => (
                        <span key={cur} style={{
                          background: t.inputBg, border: `1px solid ${t.surfaceBorder}`,
                          borderRadius: 8, padding: "4px 10px", fontSize: 12, fontWeight: 700, color: t.text,
                        }}>
                          {fmtMoney(amt, cur)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {activeTab === "notes" && (
          <>
            <div style={s.toolbar}>
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍</span>
                <input
                  style={s.searchInput}
                  placeholder="Search notes…"
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                />
                {noteSearch && <button style={s.clearBtn} onClick={() => setNoteSearch("")}>✕</button>}
              </div>
              <button style={s.iconBtn} onClick={() => exportNotes("xlsx")}>⬇ Excel</button>
              <button style={s.iconBtn} onClick={() => exportNotes("csv")}>⬇ CSV</button>
              <button style={s.iconBtn} onClick={() => notesImportRef.current?.click()}>⬆ Import</button>
              <input
                ref={notesImportRef} type="file"
                accept=".xlsx,.xls,.csv,.ods,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0]; if (f) importNotes(f);
                  e.target.value = "";
                }}
              />
            </div>

            {filteredNotes.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 48 }}>📝</div>
                <p style={{ color: t.subtext, marginTop: 10 }}>
                  {noteSearch ? "No matching notes." : "No notes yet. Tap \"+ New\" to add one."}
                </p>
              </div>
            ) : (
              filteredNotes.map((n) => (
                <div key={n.id} style={s.noteCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 2 }}>{n.title || "(Untitled)"}</div>
                      <div style={{ fontSize: 11, color: t.muted, fontWeight: 600 }}>{fmtDate(n.date)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={s.editBtn} onClick={() => openEditNote(n)}>Edit</button>
                      <button style={s.delBtn} onClick={() => setDeleteNoteConfirm(n.id)}>Delete</button>
                    </div>
                  </div>
                  {n.body && <div style={{ color: t.subtext, fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{n.body}</div>}
                </div>
              ))
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
                <input type="text" style={s.input} value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
              </Field>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field theme={t} label={`Amount Sent (${currencyObj.code}) *`}>
                  <div style={s.amountRow}>
                    <select style={s.currencySelect} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} style={{ background: "#0a0f1e", color: "#fff" }}>{c.symbol} {c.code} — {c.label}</option>
                      ))}
                    </select>
                    <input type="number" step="0.01" min="0" style={{ ...s.input, flex: 1, minWidth: 120 }} value={form.amountSent || ""} onChange={(e) => setForm({ ...form, amountSent: parseFloat(e.target.value) || 0 })} />
                  </div>
                </Field>
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field theme={t} label={`Amount Received (${form.receivedCurrency}) *`}>
                  <div style={s.amountRow}>
                    <select style={s.currencySelect} value={form.receivedCurrency} onChange={(e) => setForm({ ...form, receivedCurrency: e.target.value })}>
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code} style={{ background: "#0a0f1e", color: "#fff" }}>{c.symbol} {c.code} — {c.label}</option>
                      ))}
                    </select>
                    <input type="number" step="0.01" min="0" style={{ ...s.input, flex: 1, minWidth: 120 }} value={form.amountReceived || ""} onChange={(e) => setForm({ ...form, amountReceived: parseFloat(e.target.value) || 0 })} />
                  </div>
                </Field>
              </div>

              <Field theme={t} label="Reference / Purpose">
                <input type="text" style={s.input} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </Field>

              <div style={{ gridColumn: "1 / -1" }}>
                <Field theme={t} label="Payment Method">
                  <div style={s.methodPicker}>
                    {PAYMENT_METHODS.map((m) => (
                      <button key={m.name} type="button" style={s.methodChip(m, form.paymentMethod === m.name)} onClick={() => setForm({ ...form, paymentMethod: m.name })}>
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
                  {(form.amountReceived / form.amountSent).toFixed(2)} {form.receivedCurrency}
                </strong> per {currencyObj.code}
              </div>
            )}
            {formError && <div style={s.formError}>⚠ {formError}</div>}

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={handleSubmit}>{editId ? "Save Changes" : "Add Record"}</button>
            </div>
          </div>
        </div>
      )}

      {showNoteForm && (
        <div style={s.overlay} onClick={() => setShowNoteForm(false)}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>{editNoteId ? "Edit Note" : "New Note"}</h2>
              <button style={s.closeBtn} onClick={() => setShowNoteForm(false)}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
              <Field theme={t} label="Date">
                <input type="date" style={s.input} value={noteForm.date} onChange={(e) => setNoteForm({ ...noteForm, date: e.target.value })} />
              </Field>
              <Field theme={t} label="Title">
                <input type="text" style={s.input} value={noteForm.title} onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })} />
              </Field>
              <Field theme={t} label="Note">
                <textarea style={s.textarea} value={noteForm.body} onChange={(e) => setNoteForm({ ...noteForm, body: e.target.value })} />
              </Field>
            </div>
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setShowNoteForm(false)}>Cancel</button>
              <button style={s.saveBtn} onClick={handleSubmitNote}>{editNoteId ? "Save Changes" : "Add Note"}</button>
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

      {deleteNoteConfirm && (
        <div style={s.overlay} onClick={() => setDeleteNoteConfirm(null)}>
          <div style={{ ...s.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>Delete Note?</h2>
              <button style={s.closeBtn} onClick={() => setDeleteNoteConfirm(null)}>✕</button>
            </div>
            <p style={{ color: t.subtext, marginBottom: 24 }}>This note will be permanently removed from your device.</p>
            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={() => setDeleteNoteConfirm(null)}>Cancel</button>
              <button style={{ ...s.saveBtn, background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff" }} onClick={() => handleDeleteNote(deleteNoteConfirm!)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div style={s.toast}>{toast}</div>}

      <footer style={{
        position: "relative", zIndex: 1, marginTop: 40, padding: "32px 16px 28px",
        borderTop: `1px solid ${t.surfaceBorder}`, textAlign: "center",
        background: isLight ? "rgba(255,255,255,0.6)" : "rgba(10,15,30,0.55)", backdropFilter: "blur(10px)",
      }}>
        <div style={{ fontSize: 11, color: t.muted, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 10 }}>
          Developed by
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 22px",
          background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
          borderRadius: 999, boxShadow: `0 10px 28px ${t.accent}55`,
        }}>
          <span style={{ fontSize: 16 }}>👨‍💻</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: isLight ? "#fff" : "#0a0f1e", letterSpacing: "0.02em" }}>
            Nasim Mahmud
          </span>
        </div>
        <div style={{ fontSize: 11, color: t.muted, marginTop: 12, opacity: 0.75 }}>
          © {new Date().getFullYear()} · All data is saved securely on your device.
        </div>
      </footer>
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
      borderRadius: 16, padding: "18px 20px", borderTop: `3px solid ${accent}`,
      backdropFilter: "blur(10px)",
    }}>
      <div style={{ fontSize: 11, color: theme.subtext, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: accent, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, color: theme.muted, marginTop: 4 }}>{sub}</div>
    </div>
  );
}
