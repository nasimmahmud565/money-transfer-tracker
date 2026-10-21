import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: "📊", title: "Live Dashboard", body: "Total sent, received and monthly charts — your remittance story at a glance.", big: true },
  { icon: "💱", title: "13 Currencies", body: "SAR, USD, GBP, EUR, BDT and more, side by side." },
  { icon: "🎨", title: "9 Payment Methods", body: "Bkash, Nagad, Taptap Send, Wise, Remitly and more." },
  { icon: "👥", title: "Recipient Totals", body: "Every person's total received, count and last transfer." },
  { icon: "📈", title: "Excel Import & Export", body: "XLSX, CSV and ODS — move data in and out in one click." },
  { icon: "🛡️", title: "Admin Panel", body: "Oversee every account, transfer volume and activity from one screen.", big: true },
  { icon: "☁️", title: "Cloud Sync", body: "Every change syncs across all devices instantly." },
  { icon: "🌙", title: "4 Themes", body: "Midnight, Aurora, Sunset and Paper — desktop & mobile." },
];

const FAQ = [
  ["Do I need an account to try it?", "No. Use the one-click demo buttons to explore the User or Admin side instantly."],
  ["Is my data private?", "Yes. Each account's records are isolated and protected in the cloud."],
  ["Does it work on mobile?", "Fully responsive — it fits phones, tablets and desktops."],
  ["Can I buy and use it for my business?", "Yes — contact the developer to license it with your own branding."],
];

export default function Landing() {
  const navigate = useNavigate();
  const go = () => navigate("/app");

  return (
    <div className="lp">
      <style>{CSS}</style>
      <div className="lp-grid-bg" />
      <div className="lp-orb lp-orb1" /><div className="lp-orb lp-orb2" />

      <header className="lp-nav">
        <div className="lp-wrap lp-nav-in">
          <div className="lp-logo"><span className="lp-logo-ic">💸</span><b>Money Transfer Tracker</b></div>
          <nav className="lp-links"><a href="#features">Features</a><a href="#demo">Demo</a><a href="#faq">FAQ</a></nav>
          <button className="lp-btn lp-btn-sm" onClick={go}>Live Demo</button>
        </div>
      </header>

      <section className="lp-wrap lp-hero">
        <div className="lp-hero-copy">
          <div className="lp-badge"><span className="lp-dot" /> Remittance tracking, reimagined</div>
          <h1>Every riyal you send.<br /><span className="lp-grad">Tracked beautifully.</span></h1>
          <p>A private, cloud-synced ledger for the money you send home — with live dashboards, recipient totals, notes, Excel export and a full admin panel.</p>
          <div className="lp-cta-row">
            <button className="lp-btn lp-btn-lg" onClick={go}>Launch Live Demo →</button>
            <a className="lp-ghost" href="#features">Explore features</a>
          </div>
          <div className="lp-trust">✓ No sign-up needed &nbsp; ✓ User & Admin demo &nbsp; ✓ Mobile ready</div>
        </div>

        <div className="lp-mock-wrap">
          <div className="lp-mock">
            <div className="lp-mock-top"><i /><i /><i /><span>Dashboard</span></div>
            <div className="lp-mock-stats">
              {[["Total Received", "৳ 4,82,300", "+12%"], ["Transfers", "38", "6 this month"], ["Total Sent", "SAR 15,020", "+8%"]].map(([l, v, s]) => (
                <div key={l} className="lp-mstat"><small>{l}</small><b>{v}</b><em>{s}</em></div>
              ))}
            </div>
            <div className="lp-bars">
              {[40, 62, 48, 80, 55, 92, 70, 85, 60, 96, 74, 88].map((h, i) => (
                <div key={i} style={{ height: `${h}%`, animationDelay: `${i * 0.06}s` }} />
              ))}
            </div>
            <div className="lp-rows">
              {[["Rahim Uddin", "Bkash", "SAR 850"], ["Fatema Begum", "Taptap Send", "SAR 1,200"], ["Karim Ahmed", "Nagad", "SAR 640"]].map(([n, m, a]) => (
                <div key={n} className="lp-row"><span className="lp-av">{n[0]}</span><span>{n}</span><span className="lp-chip">{m}</span><b>{a}</b></div>
              ))}
            </div>
          </div>
          <div className="lp-float lp-float1">✅ Synced to cloud</div>
          <div className="lp-float lp-float2">💱 SAR → BDT</div>
        </div>
      </section>

      <section className="lp-wrap lp-stats">
        {[["13", "Currencies"], ["9", "Payment methods"], ["4", "Themes"], ["100%", "Cloud synced"]].map(([v, l]) => (
          <div key={l}><b className="lp-grad">{v}</b><span>{l}</span></div>
        ))}
      </section>

      <section id="features" className="lp-wrap lp-sec">
        <div className="lp-eyebrow">Features</div>
        <h2>Everything you need to stay on top of your money</h2>
        <div className="lp-bento">
          {FEATURES.map((f) => (
            <div key={f.title} className={`lp-card ${f.big ? "lp-big" : ""}`}>
              <div className="lp-ic">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="demo" className="lp-wrap lp-sec">
        <div className="lp-demo">
          <div className="lp-eyebrow">Try it now</div>
          <h2>Explore both sides — in one click</h2>
          <p className="lp-sub">No Google account needed. Jump straight in with ready-made sample data.</p>
          <div className="lp-demo-grid">
            <div className="lp-dcard">
              <div className="lp-ic">👤</div><h3>User Demo</h3>
              <p>Add transfers, view dashboards, recipient totals, notes and export to Excel.</p>
              <button className="lp-btn" onClick={go}>Open User Demo →</button>
            </div>
            <div className="lp-dcard">
              <div className="lp-ic">🛡️</div><h3>Admin Demo</h3>
              <p>See the admin panel with all accounts, transfer volumes and activity.</p>
              <button className="lp-btn" onClick={go}>Open Admin Demo →</button>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="lp-wrap lp-sec lp-faq">
        <div className="lp-eyebrow">FAQ</div>
        <h2>Questions, answered</h2>
        {FAQ.map(([q, a]) => (
          <details key={q} className="lp-q"><summary>{q}</summary><p>{a}</p></details>
        ))}
      </section>

      <section className="lp-wrap lp-sec">
        <div className="lp-final">
          <h2>Like what you see?</h2>
          <p className="lp-sub">Try the live demo now and get it for your own business.</p>
          <button className="lp-btn lp-btn-lg" onClick={go}>Launch Live Demo →</button>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-wrap lp-foot-in">
          <span>© {new Date().getFullYear()} Money Transfer Tracker</span>
          <span>Developed by <b className="lp-grad">Nasim Mahmud</b></span>
        </div>
      </footer>
    </div>
  );
}

const CSS = `
.lp{--a:#a78bfa;--b:#22d3ee;--t:#e2e8f0;--s:#94a3b8;--m:#64748b;--line:rgba(255,255,255,.08);--card:rgba(255,255,255,.035);
min-height:100vh;background:#050816;color:var(--t);position:relative;overflow:hidden;font-family:inherit}
.lp *{box-sizing:border-box}
.lp-wrap{max-width:1160px;margin:0 auto;padding:0 22px;position:relative;z-index:2}
.lp-grid-bg{position:absolute;inset:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:56px 56px;mask-image:radial-gradient(ellipse at 50% 0%,#000 20%,transparent 70%);opacity:.5}
.lp-orb{position:absolute;border-radius:50%;filter:blur(90px);opacity:.45;z-index:0}
.lp-orb1{width:520px;height:520px;background:#7c3aed;top:-200px;left:-120px}
.lp-orb2{width:480px;height:480px;background:#0891b2;top:200px;right:-160px}
.lp-grad{background:linear-gradient(135deg,var(--a),var(--b));-webkit-background-clip:text;background-clip:text;color:transparent}
.lp-nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(14px);background:rgba(5,8,22,.6);border-bottom:1px solid var(--line)}
.lp-nav-in{display:flex;align-items:center;justify-content:space-between;height:66px;gap:12px}
.lp-logo{display:flex;align-items:center;gap:10px;font-size:16px;letter-spacing:-.02em;white-space:nowrap}
.lp-logo-ic{font-size:26px;filter:drop-shadow(0 4px 12px #a78bfa99)}
.lp-links{display:flex;gap:28px}.lp-links a{color:var(--s);text-decoration:none;font-size:14px;font-weight:600}.lp-links a:hover{color:var(--t)}
.lp-btn{border:none;cursor:pointer;font-weight:800;font-size:15px;padding:13px 24px;border-radius:12px;color:#0a0f1e;background:linear-gradient(135deg,var(--a),var(--b));box-shadow:0 10px 30px -6px #a78bfa88;transition:transform .15s,box-shadow .15s}
.lp-btn:hover{transform:translateY(-2px);box-shadow:0 16px 40px -6px #a78bfaaa}
.lp-btn-sm{padding:9px 18px;font-size:14px;border-radius:999px}
.lp-btn-lg{padding:17px 34px;font-size:17px;border-radius:14px}
.lp-ghost{color:var(--t);text-decoration:none;font-weight:700;padding:16px 26px;border-radius:14px;border:1px solid var(--line);background:var(--card)}
.lp-hero{display:grid;grid-template-columns:1.05fr 1fr;gap:48px;align-items:center;padding-top:80px;padding-bottom:60px}
.lp-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;border:1px solid #a78bfa55;background:#a78bfa18;color:#c4b5fd;font-size:13px;font-weight:700;margin-bottom:22px}
.lp-dot{width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 10px #4ade80}
.lp-hero h1{font-size:clamp(36px,5.6vw,64px);line-height:1.04;letter-spacing:-.04em;font-weight:900;margin:0 0 20px}
.lp-hero p{color:var(--s);font-size:clamp(15px,1.7vw,18px);line-height:1.65;margin:0 0 30px;max-width:540px}
.lp-cta-row{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.lp-trust{margin-top:22px;color:var(--m);font-size:13px;font-weight:600}
.lp-mock-wrap{position:relative;animation:lpFloat 6s ease-in-out infinite}
.lp-mock{background:linear-gradient(180deg,rgba(30,27,75,.85),rgba(10,15,30,.9));border:1px solid rgba(167,139,250,.25);border-radius:22px;padding:18px;box-shadow:0 40px 100px -20px #7c3aed66;transform:perspective(1200px) rotateY(-8deg) rotateX(4deg)}
.lp-mock-top{display:flex;gap:6px;align-items:center;margin-bottom:14px}.lp-mock-top i{width:10px;height:10px;border-radius:50%;background:#334155}.lp-mock-top i:first-child{background:#f43f5e}.lp-mock-top i:nth-child(2){background:#fb923c}.lp-mock-top i:nth-child(3){background:#4ade80}
.lp-mock-top span{margin-left:8px;font-size:12px;color:var(--m);font-weight:700}
.lp-mock-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.lp-mstat{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:12px;padding:10px}
.lp-mstat small{display:block;font-size:10px;color:var(--m)}.lp-mstat b{display:block;font-size:15px;margin:3px 0}.lp-mstat em{font-style:normal;font-size:10px;color:#4ade80}
.lp-bars{display:flex;align-items:flex-end;gap:6px;height:110px;margin:16px 0;padding:10px;border-radius:12px;background:rgba(255,255,255,.03)}
.lp-bars div{flex:1;border-radius:5px 5px 2px 2px;background:linear-gradient(180deg,var(--b),var(--a));transform-origin:bottom;animation:lpGrow .8s ease-out backwards}
.lp-rows{display:grid;gap:8px}
.lp-row{display:grid;grid-template-columns:28px 1fr auto auto;gap:10px;align-items:center;font-size:12px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.03)}
.lp-av{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:#a78bfa33;color:#c4b5fd;font-weight:800}
.lp-chip{font-size:10px;padding:3px 8px;border-radius:999px;background:#22d3ee22;color:#67e8f9;font-weight:700}
.lp-float{position:absolute;padding:10px 14px;border-radius:12px;font-size:12px;font-weight:800;background:rgba(15,23,42,.9);border:1px solid var(--line);backdrop-filter:blur(8px);box-shadow:0 16px 40px -10px #000}
.lp-float1{top:-16px;right:10px}.lp-float2{bottom:-14px;left:-14px}
.lp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding-bottom:30px}
.lp-stats div{text-align:center;padding:22px;border:1px solid var(--line);border-radius:16px;background:var(--card)}
.lp-stats b{display:block;font-size:32px;font-weight:900}.lp-stats span{color:var(--m);font-size:13px}
.lp-sec{padding-top:70px;padding-bottom:30px;text-align:center}
.lp-eyebrow{color:var(--b);font-size:13px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:10px}
.lp-sec h2{font-size:clamp(26px,4vw,42px);letter-spacing:-.03em;font-weight:900;margin:0 0 14px}
.lp-sub{color:var(--s);font-size:16px;margin:0 auto 34px;max-width:560px;line-height:1.6}
.lp-bento{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:36px;text-align:left}
.lp-card{padding:24px;border-radius:18px;border:1px solid var(--line);background:var(--card);transition:border-color .2s,transform .2s}
.lp-card:hover{border-color:#a78bfa66;transform:translateY(-3px)}
.lp-big{grid-column:span 2;background:linear-gradient(135deg,rgba(124,58,237,.18),rgba(8,145,178,.1))}
.lp-ic{font-size:28px;width:52px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:14px;background:rgba(255,255,255,.05);border:1px solid var(--line);margin-bottom:14px}
.lp-card h3,.lp-dcard h3{margin:0 0 6px;font-size:17px;font-weight:800}
.lp-card p,.lp-dcard p{margin:0;color:var(--s);font-size:14px;line-height:1.6}
.lp-demo{padding:50px 26px;border-radius:28px;border:1px solid #a78bfa44;background:radial-gradient(ellipse at top,rgba(124,58,237,.25),rgba(5,8,22,.4))}
.lp-demo-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:760px;margin:0 auto}
.lp-dcard{text-align:left;padding:26px;border-radius:20px;background:rgba(5,8,22,.6);border:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
.lp-dcard .lp-btn{margin-top:16px;align-self:flex-start}
.lp-faq{max-width:760px}
.lp-q{text-align:left;border:1px solid var(--line);background:var(--card);border-radius:14px;padding:16px 20px;margin-top:10px}
.lp-q summary{cursor:pointer;font-weight:800;font-size:15px}.lp-q p{color:var(--s);margin:10px 0 0;font-size:14px;line-height:1.6}
.lp-final{padding:56px 24px;border-radius:28px;background:linear-gradient(135deg,rgba(124,58,237,.35),rgba(8,145,178,.25));border:1px solid #a78bfa55}
.lp-foot{border-top:1px solid var(--line);margin-top:60px;padding:26px 0;position:relative;z-index:2}
.lp-foot-in{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;color:var(--m);font-size:13px}.lp-foot b{font-size:15px}
@keyframes lpFloat{0%,100%{translate:0 0}50%{translate:0 -10px}}
@keyframes lpGrow{from{transform:scaleY(0)}}
@media (max-width:900px){.lp-hero{grid-template-columns:1fr;padding-top:50px}.lp-mock{transform:none}.lp-bento{grid-template-columns:1fr 1fr}.lp-links{display:none}}
@media (max-width:560px){.lp-stats{grid-template-columns:1fr 1fr}.lp-bento{grid-template-columns:1fr}.lp-big{grid-column:auto}.lp-demo-grid{grid-template-columns:1fr}.lp-logo b{font-size:14px}.lp-float2{left:0}}
`;
