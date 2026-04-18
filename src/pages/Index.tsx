import { useState, useEffect, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Transfer {
  id: string;
  date: string;
  recipientName: string;
  amountSentGBP: number;
  amountReceivedBDT: number;
  paymentMethod: string;
  reference: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STORAGE_KEY = "money_transfer_records";
const PAYMENT_METHODS = [
  "Bkash Transfer",
  "Nagad Transfer",
  "Bank Transfer",
  "Western Union",
  "Wise",
  "Remitly",
  "Other",
];
const EMPTY_FORM: Omit<Transfer, "id"> = {
  date: new Date().toISOString().split("T")[0],
  recipientName: "",
  amountSentGBP: 0,
  amountReceivedBDT: 0,
  paymentMethod: "Bkash Transfer",
  reference: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const fmt = (n: number, currency: string) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(n);
const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// ─── App ──────────────────────────────────────────────────────────────────────
export default function Index() {
  const [records, setRecords] = useState<Transfer[]>([]);
  const [form, setForm] = useState<Omit<Transfer, "id">>(EMPTY_FORM);
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
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...records]
      .filter(
        (r) =>
          r.recipientName.toLowerCase().includes(q) ||
          r.reference.toLowerCase().includes(q) ||
          r.paymentMethod.toLowerCase().includes(q) ||
          r.date.includes(q)
      )
      .sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
  }, [records, search, sortField, sortDir]);

  const stats = useMemo(() => {
    const totalGBP = records.reduce((s, r) => s + r.amountSentGBP, 0);
    const totalBDT = records.reduce((s, r) => s + r.amountReceivedBDT, 0);
    const avgRate = totalGBP > 0 ? totalBDT / totalGBP : 0;
    const thisMonth = records.filter((r) => {
      const now = new Date();
      const d = new Date(r.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const monthlyGBP = thisMonth.reduce((s, r) => s + r.amountSentGBP, 0);
    const byYear: Record<string, number> = {};
    records.forEach((r) => {
      const yr = r.date.slice(0, 4);
      byYear[yr] = (byYear[yr] || 0) + r.amountSentGBP;
    });
    const byMethod: Record<string, number> = {};
    records.forEach((r) => {
      byMethod[r.paymentMethod] = (byMethod[r.paymentMethod] || 0) + 1;
    });
    return { totalGBP, totalBDT, avgRate, monthlyGBP, count: records.length, byYear, byMethod, thisMonthCount: thisMonth.length };
  }, [records]);

  function handleSort(field: keyof Transfer) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }
  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormError("");
    setShowForm(true);
  }
  function openEdit(r: Transfer) {
    setForm({ date: r.date, recipientName: r.recipientName, amountSentGBP: r.amountSentGBP, amountReceivedBDT: r.amountReceivedBDT, paymentMethod: r.paymentMethod, reference: r.reference });
    setEditId(r.id);
    setFormError("");
    setShowForm(true);
  }
  function handleSubmit() {
    if (!form.date) return setFormError("Date is required.");
    if (!form.recipientName.trim()) return setFormError("Recipient name is required.");
    if (!form.amountSentGBP || form.amountSentGBP <= 0) return setFormError("Amount sent must be greater than 0.");
    if (!form.amountReceivedBDT || form.amountReceivedBDT <= 0) return setFormError("Amount received must be greater than 0.");
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

  const maxYearGBP = Math.max(...Object.values(stats.byYear), 1);

  return (
    <div style={styles.root}>
      <div style={styles.noiseOverlay} />
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>₿</span>
            <div>
              <div style={styles.logoTitle}>RemitTrack</div>
              <div style={styles.logoSub}>London → Bangladesh</div>
            </div>
          </div>
          <button style={styles.addBtn} onClick={openAdd}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Transfer
          </button>
        </div>
      </header>

      <div style={styles.tabs}>
        {(["dashboard", "records"] as const).map((t) => (
          <button
            key={t}
            style={{ ...styles.tab, ...(activeTab === t ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(t)}
          >
            {t === "dashboard" ? "📊 Dashboard" : "📋 Records"}
          </button>
        ))}
      </div>

      <main style={styles.main}>
        {activeTab === "dashboard" && (
          <>
            <div style={styles.statsGrid}>
              <StatCard label="Total Sent" value={fmt(stats.totalGBP, "GBP")} sub={`${stats.count} transfers`} accent="#4ade80" />
              <StatCard label="Total Received" value={`৳ ${stats.totalBDT.toLocaleString("en-BD", { maximumFractionDigits: 0 })}`} sub="BDT" accent="#60a5fa" />
              <StatCard label="Avg. Exchange Rate" value={`৳ ${stats.avgRate.toFixed(2)}`} sub="per GBP" accent="#f59e0b" />
              <StatCard label="This Month" value={fmt(stats.monthlyGBP, "GBP")} sub={`${stats.thisMonthCount} transfer${stats.thisMonthCount !== 1 ? "s" : ""}`} accent="#c084fc" />
            </div>

            {Object.keys(stats.byYear).length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>Yearly Sent (GBP)</div>
                <div style={styles.chartWrap}>
                  {Object.entries(stats.byYear)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([yr, gbp]) => (
                      <div key={yr} style={styles.barGroup}>
                        <div style={styles.barLabelTop}>{fmt(gbp, "GBP")}</div>
                        <div style={styles.barTrack}>
                          <div
                            style={{
                              ...styles.bar,
                              height: `${Math.max(8, (gbp / maxYearGBP) * 100)}%`,
                              background: "linear-gradient(to top, #4ade80, #22d3ee)",
                            }}
                          />
                        </div>
                        <div style={styles.barLabel}>{yr}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {Object.keys(stats.byMethod).length > 0 && (
              <div style={styles.card}>
                <div style={styles.cardTitle}>Payment Methods</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                  {Object.entries(stats.byMethod).map(([method, count]) => (
                    <div key={method} style={styles.methodPill}>
                      <span style={styles.methodDot} />
                      <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{method}</span>
                      <span style={styles.methodCount}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {records.length === 0 && (
              <div style={styles.empty}>
                <div style={{ fontSize: 48 }}>💸</div>
                <p style={{ color: "#94a3b8", marginTop: 12 }}>No transfers yet. Add your first record!</p>
              </div>
            )}
          </>
        )}

        {activeTab === "records" && (
          <>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                style={styles.searchInput}
                placeholder="Search by name, reference, method or date…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button style={styles.clearBtn} onClick={() => setSearch("")}>✕</button>
              )}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {([
                      ["date", "Date"],
                      ["recipientName", "Recipient"],
                      ["amountSentGBP", "Sent (GBP)"],
                      ["amountReceivedBDT", "Received (BDT)"],
                      ["paymentMethod", "Method"],
                      ["reference", "Reference"],
                    ] as [keyof Transfer, string][]).map(([field, label]) => (
                      <th key={field} style={styles.th} onClick={() => handleSort(field)}>
                        {label}
                        {sortField === field && (
                          <span style={{ marginLeft: 4, opacity: 0.7 }}>
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </th>
                    ))}
                    <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "48px 0", color: "#64748b" }}>
                        {search ? "No matching records found." : "No records yet. Click \"+ New Transfer\" to get started."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, i) => (
                      <tr key={r.id} style={{ ...styles.tr, background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                        <td style={styles.td}>{fmtDate(r.date)}</td>
                        <td style={{ ...styles.td, fontWeight: 600, color: "#e2e8f0" }}>{r.recipientName}</td>
                        <td style={{ ...styles.td, color: "#4ade80", fontWeight: 700 }}>{fmt(r.amountSentGBP, "GBP")}</td>
                        <td style={{ ...styles.td, color: "#60a5fa", fontWeight: 700 }}>৳ {r.amountReceivedBDT.toLocaleString("en-BD", { maximumFractionDigits: 2 })}</td>
                        <td style={styles.td}>
                          <span style={styles.badge}>{r.paymentMethod}</span>
                        </td>
                        <td style={{ ...styles.td, color: "#94a3b8" }}>{r.reference}</td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <button style={styles.editBtn} onClick={() => openEdit(r)}>Edit</button>
                          <button style={styles.delBtn} onClick={() => setDeleteConfirm(r.id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filtered.length > 0 && (
              <div style={styles.tableFooter}>
                Showing {filtered.length} of {records.length} record{records.length !== 1 ? "s" : ""}
              </div>
            )}
          </>
        )}
      </main>

      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editId ? "Edit Transfer" : "New Transfer"}</h2>
              <button style={styles.closeBtn} onClick={() => setShowForm(false)}>✕</button>
            </div>
            <div style={styles.formGrid}>
              <Field label="Date *">
                <input type="date" style={styles.input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
              <Field label="Recipient Name *">
                <input type="text" style={styles.input} placeholder="e.g. Noyon Moni" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
              </Field>
              <Field label="Amount Sent (GBP) *">
                <input type="number" step="0.01" min="0" style={styles.input} placeholder="0.00" value={form.amountSentGBP || ""} onChange={(e) => setForm({ ...form, amountSentGBP: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="Amount Received (BDT) *">
                <input type="number" step="0.01" min="0" style={styles.input} placeholder="0.00" value={form.amountReceivedBDT || ""} onChange={(e) => setForm({ ...form, amountReceivedBDT: parseFloat(e.target.value) || 0 })} />
              </Field>
              <Field label="Payment Method">
                <select style={styles.input} value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Reference / Purpose">
                <input type="text" style={styles.input} placeholder="e.g. Monthly support" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
              </Field>
            </div>

            {form.amountSentGBP > 0 && form.amountReceivedBDT > 0 && (
              <div style={styles.ratePreview}>
                Exchange rate preview: <strong style={{ color: "#4ade80" }}>
                  ৳ {(form.amountReceivedBDT / form.amountSentGBP).toFixed(2)}
                </strong> per GBP
              </div>
            )}
            {formError && <div style={styles.formError}>⚠ {formError}</div>}

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
              <button style={styles.saveBtn} onClick={handleSubmit}>
                {editId ? "Save Changes" : "Add Record"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div style={styles.overlay} onClick={() => setDeleteConfirm(null)}>
          <div style={{ ...styles.modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Delete Record?</h2>
              <button style={styles.closeBtn} onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ color: "#94a3b8", marginBottom: 24 }}>
              This action cannot be undone. The transfer record will be permanently removed from your device.
            </p>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button style={{ ...styles.saveBtn, background: "linear-gradient(135deg, #ef4444, #dc2626)" }} onClick={() => handleDelete(deleteConfirm!)}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div style={{ ...styles.card, borderTop: `3px solid ${accent}`, padding: "20px 24px" }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent, letterSpacing: "-0.02em", lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: { minHeight: "100vh", background: "#0a0f1e", fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", color: "#e2e8f0", position: "relative", overflow: "hidden" },
  noiseOverlay: { position: "fixed", inset: 0, backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`, pointerEvents: "none", zIndex: 0 },
  header: { position: "relative", zIndex: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,15,30,0.95)", backdropFilter: "blur(20px)", padding: "0 24px" },
  headerInner: { maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { width: 40, height: 40, background: "linear-gradient(135deg, #4ade80, #22d3ee)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 },
  logoTitle: { fontSize: 18, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", lineHeight: 1.2 },
  logoSub: { fontSize: 11, color: "#4ade80", fontWeight: 600, letterSpacing: "0.04em" },
  addBtn: { display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "linear-gradient(135deg, #4ade80, #22d3ee)", border: "none", borderRadius: 10, color: "#0a0f1e", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: "0.02em" },
  tabs: { position: "relative", zIndex: 10, display: "flex", gap: 0, padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10,15,30,0.9)", maxWidth: "100%", overflowX: "auto" },
  tab: { padding: "14px 24px", background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#475569", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" },
  tabActive: { color: "#4ade80", borderBottom: "2px solid #4ade80" },
  main: { position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "32px 24px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 },
  card: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px", marginBottom: 24 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 },
  chartWrap: { display: "flex", alignItems: "flex-end", gap: 16, height: 140, paddingBottom: 4 },
  barGroup: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1, minWidth: 60, height: "100%" },
  barLabelTop: { fontSize: 10, color: "#64748b", fontWeight: 600, textAlign: "center", whiteSpace: "nowrap" },
  barTrack: { flex: 1, width: "60%", background: "rgba(255,255,255,0.05)", borderRadius: 6, display: "flex", alignItems: "flex-end", overflow: "hidden", minWidth: 32 },
  bar: { width: "100%", borderRadius: 6, transition: "height 0.5s ease" },
  barLabel: { fontSize: 12, color: "#475569", fontWeight: 700 },
  methodPill: { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px 14px" },
  methodDot: { width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #4ade80, #22d3ee)", flexShrink: 0 },
  methodCount: { marginLeft: 4, background: "rgba(74,222,128,0.15)", color: "#4ade80", borderRadius: 6, padding: "1px 8px", fontSize: 12, fontWeight: 700 },
  empty: { textAlign: "center", padding: "64px 0" },
  searchWrap: { position: "relative", marginBottom: 20, display: "flex", alignItems: "center" },
  searchIcon: { position: "absolute", left: 14, fontSize: 16, pointerEvents: "none" },
  searchInput: { width: "100%", padding: "12px 40px 12px 42px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box" },
  clearBtn: { position: "absolute", right: 14, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16, padding: 0 },
  tableWrap: { overflowX: "auto", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { padding: "14px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.07)", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" },
  tr: { transition: "background 0.15s" },
  td: { padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle", color: "#cbd5e1", whiteSpace: "nowrap" },
  badge: { background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600 },
  editBtn: { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, color: "#e2e8f0", padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600, marginRight: 6 },
  delBtn: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 7, color: "#f87171", padding: "5px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 },
  tableFooter: { padding: "12px 4px", color: "#475569", fontSize: 13, textAlign: "right" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 },
  modal: { background: "#111827", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, maxWidth: 560, width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em", margin: 0 },
  closeBtn: { background: "rgba(255,255,255,0.07)", border: "none", borderRadius: 8, color: "#94a3b8", width: 32, height: 32, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 },
  input: { padding: "11px 14px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  ratePreview: { background: "rgba(74,222,128,0.07)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#94a3b8", marginBottom: 16 },
  formError: { background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "10px 16px", color: "#f87171", fontSize: 13, marginBottom: 16 },
  modalFooter: { display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 },
  cancelBtn: { padding: "11px 22px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#94a3b8", fontWeight: 600, fontSize: 14, cursor: "pointer" },
  saveBtn: { padding: "11px 24px", background: "linear-gradient(135deg, #4ade80, #22d3ee)", border: "none", borderRadius: 10, color: "#0a0f1e", fontWeight: 700, fontSize: 14, cursor: "pointer" },
};
