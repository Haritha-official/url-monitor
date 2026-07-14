import { useState, useEffect, useMemo } from "react"
import { Activity, Plus, RefreshCw, Trash2, X, Globe2, Clock3, Radio } from "lucide-react"

const BASE_URL = "http://localhost:8080"

function timeAgo(iso) {
  if (!iso) return "Never"
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const s = Math.floor(diff / 1000)
  if (s < 5) return "Just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function speedTier(ms) {
  if (ms == null) return null
  if (ms < 200) return "fast"
  if (ms < 800) return "ok"
  return "slow"
}

function StatusDot({ status }) {
  return (
    <span className={`dot dot--${status}`} aria-hidden="true">
      <span className="dot__core" />
      {status === "online" && <span className="dot__ring" />}
    </span>
  )
}

function StatChip({ label, value, tone }) {
  return (
    <div className={`chip chip--${tone}`}>
      <span className="chip__value">{value}</span>
      <span className="chip__label">{label}</span>
    </div>
  )
}

export default function App() {
  const [monitors, setMonitors] = useState([])
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [checkingIds, setCheckingIds] = useState({})
  const [loaded, setLoaded] = useState(false)

  const fetchMonitors = async () => {
    try {
      const response = await fetch(`${BASE_URL}/monitors`)
      const result = await response.json()
      setMonitors(result.monitors)
    } catch (error) {
      console.error(error)
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    fetchMonitors()
  }, [])

  useEffect(() => {
    const interval = setInterval(fetchMonitors, 30000)
    return () => clearInterval(interval)
  }, [])

  const addMonitor = async (e) => {
    e.preventDefault()
    if (!name.trim() || !url.trim()) return

    try {
      await fetch(`${BASE_URL}/monitors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url }),
      })
      setName("")
      setUrl("")
      setFormOpen(false)
      fetchMonitors()
    } catch (error) {
      console.error(error)
    }
  }

  const deleteMonitor = async (id) => {
    try {
      await fetch(`${BASE_URL}/monitors/${id}`, { method: "DELETE" })
      fetchMonitors()
    } catch (error) {
      console.error(error)
    }
  }

  const checkMonitor = async (id) => {
    setCheckingIds((prev) => ({ ...prev, [id]: true }))
    try {
      await fetch(`${BASE_URL}/monitors/${id}/check`, { method: "GET" })
      await fetchMonitors()
    } catch (error) {
      console.error(error)
    } finally {
      setCheckingIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const stats = useMemo(() => {
    const online = monitors.filter((m) => m.status === "online").length
    const offline = monitors.filter((m) => m.status === "offline").length
    const pending = monitors.filter((m) => m.status === "pending").length
    return { total: monitors.length, online, offline, pending }
  }, [monitors])

  const overallTone = stats.offline > 0 ? "offline" : stats.pending > 0 ? "pending" : "online"

  return (
    <div className="dash">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');

        .dash {
          --bg: #0a0e1a;
          --bg-soft: #0d1220;
          --panel: #121a2e;
          --panel-hover: #16203a;
          --border: #232c48;
          --border-soft: #1a2238;
          --text: #e8ecf6;
          --text-dim: #8d98b8;
          --text-faint: #5b6584;
          --online: #34e0b0;
          --online-dim: #1c6b57;
          --pending: #f5b860;
          --pending-dim: #7a5b28;
          --offline: #fb5f73;
          --offline-dim: #7a2c37;
          --brand: #7c93ff;

          min-height: 100vh;
          background:
            radial-gradient(ellipse 900px 500px at 15% -10%, rgba(124,147,255,0.10), transparent 60%),
            radial-gradient(ellipse 700px 500px at 100% 0%, rgba(52,224,176,0.06), transparent 55%),
            var(--bg);
          color: var(--text);
          font-family: 'Inter', system-ui, sans-serif;
          padding: 40px 24px 80px;
          box-sizing: border-box;
        }
        .dash * { box-sizing: border-box; }

        .shell { max-width: 1080px; margin: 0 auto; }

        /* ---------- Header ---------- */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 22px;
        }
        .brand { display: flex; align-items: center; gap: 12px; }
        .brand__mark {
          width: 40px; height: 40px;
          border-radius: 11px;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(145deg, rgba(124,147,255,0.18), rgba(52,224,176,0.10));
          border: 1px solid var(--border);
          color: var(--brand);
        }
        .brand h1 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 22px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .brand p {
          margin: 2px 0 0;
          font-size: 12.5px;
          color: var(--text-faint);
          font-family: 'JetBrains Mono', monospace;
        }

        .chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .chip {
          background: var(--panel);
          border: 1px solid var(--border-soft);
          border-radius: 10px;
          padding: 7px 12px;
          display: flex; flex-direction: column; align-items: flex-start;
          min-width: 64px;
        }
        .chip__value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.1;
        }
        .chip__label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-faint);
          margin-top: 2px;
        }
        .chip--online .chip__value { color: var(--online); }
        .chip--pending .chip__value { color: var(--pending); }
        .chip--offline .chip__value { color: var(--offline); }
        .chip--total .chip__value { color: var(--text); }

        /* Scan line signature */
        .scanline {
          position: relative;
          height: 2px;
          border-radius: 2px;
          margin-bottom: 32px;
          background: var(--border-soft);
          overflow: hidden;
        }
        .scanline::after {
          content: '';
          position: absolute;
          top: 0; left: -30%;
          width: 30%; height: 100%;
          background: linear-gradient(90deg, transparent,
            ${'var(--' + overallTone + ')'}, transparent);
          animation: scan 2.6s ease-in-out infinite;
        }
        @keyframes scan {
          0% { left: -30%; }
          100% { left: 100%; }
        }

        /* ---------- Add monitor ---------- */
        .add-row { margin-bottom: 26px; }
        .add-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--panel);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: 'Inter', sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          padding: 10px 16px;
          border-radius: 10px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .add-btn:hover { background: var(--panel-hover); border-color: var(--brand); }

        .add-panel {
          margin-top: 12px;
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .field { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px; }
        .field label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-faint);
        }
        .field input {
          background: var(--bg-soft);
          border: 1px solid var(--border);
          color: var(--text);
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
          padding: 10px 12px;
          border-radius: 8px;
          outline: none;
          transition: border-color 0.15s;
        }
        .field input:focus { border-color: var(--brand); }
        .field input::placeholder { color: var(--text-faint); }

        .form-actions { display: flex; gap: 8px; align-self: flex-end; }
        .btn-primary, .btn-ghost {
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          padding: 10px 16px;
          cursor: pointer;
          border: 1px solid transparent;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .btn-primary {
          background: var(--brand);
          color: #0a0e1a;
          border-color: var(--brand);
        }
        .btn-primary:hover { filter: brightness(1.08); }
        .btn-ghost {
          background: transparent;
          border-color: var(--border);
          color: var(--text-dim);
        }
        .btn-ghost:hover { color: var(--text); border-color: var(--text-faint); }

        /* ---------- Grid ---------- */
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        }

        .card {
          background: var(--panel);
          border: 1px solid var(--border-soft);
          border-radius: 14px;
          padding: 16px 16px 14px;
          transition: border-color 0.15s, transform 0.15s;
        }
        .card:hover { border-color: var(--border); transform: translateY(-1px); }

        .card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
        .card__name {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 15.5px;
          font-weight: 600;
          margin: 0 0 4px;
        }
        .card__url {
          display: flex; align-items: center; gap: 5px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px;
          color: var(--text-dim);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .status-tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 8px 4px 6px;
          border-radius: 999px;
          border: 1px solid;
          white-space: nowrap;
        }
        .status-tag--online { color: var(--online); border-color: var(--online-dim); background: rgba(52,224,176,0.06); }
        .status-tag--pending { color: var(--pending); border-color: var(--pending-dim); background: rgba(245,184,96,0.06); }
        .status-tag--offline { color: var(--offline); border-color: var(--offline-dim); background: rgba(251,95,115,0.06); }

        .dot { position: relative; width: 8px; height: 8px; display: inline-flex; align-items: center; justify-content: center; }
        .dot__core { width: 6px; height: 6px; border-radius: 50%; }
        .dot--online .dot__core { background: var(--online); }
        .dot--pending .dot__core { background: var(--pending); animation: fade 1.6s ease-in-out infinite; }
        .dot--offline .dot__core { background: var(--offline); }
        .dot__ring {
          position: absolute; inset: -4px;
          border-radius: 50%;
          border: 1px solid var(--online);
          animation: ring 1.8s ease-out infinite;
        }
        @keyframes ring {
          0% { transform: scale(0.4); opacity: 0.9; }
          100% { transform: scale(2.1); opacity: 0; }
        }
        @keyframes fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }

        .card__metrics {
          display: flex;
          gap: 18px;
          margin: 14px 0 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-soft);
        }
        .metric { display: flex; flex-direction: column; gap: 3px; }
        .metric__label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-faint);
          display: flex; align-items: center; gap: 4px;
        }
        .metric__value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 13px;
        }
        .metric__value--fast { color: var(--online); }
        .metric__value--ok { color: var(--pending); }
        .metric__value--slow { color: var(--offline); }
        .metric__value--muted { color: var(--text-faint); }

        .card__actions { display: flex; gap: 8px; }
        .icon-btn {
          flex: 1;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          background: var(--bg-soft);
          border: 1px solid var(--border);
          color: var(--text-dim);
          font-size: 12px;
          font-family: 'Inter', sans-serif;
          font-weight: 500;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .icon-btn:hover { color: var(--text); border-color: var(--brand); }
        .icon-btn.danger:hover { color: var(--offline); border-color: var(--offline-dim); }
        .icon-btn svg.spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ---------- Empty state ---------- */
        .empty {
          border: 1px dashed var(--border);
          border-radius: 16px;
          padding: 56px 20px;
          text-align: center;
          color: var(--text-dim);
        }
        .empty__icon {
          width: 44px; height: 44px;
          border-radius: 12px;
          margin: 0 auto 14px;
          display: flex; align-items: center; justify-content: center;
          background: var(--panel);
          border: 1px solid var(--border);
          color: var(--brand);
        }
        .empty h3 {
          font-family: 'Space Grotesk', sans-serif;
          font-size: 16px;
          color: var(--text);
          margin: 0 0 4px;
        }
        .empty p { font-size: 13px; margin: 0 0 18px; color: var(--text-faint); }
      `}</style>

      <div className="shell">
        <div className="header">
          <div className="brand">
            <div className="brand__mark"><Radio size={19} /></div>
            <div>
              <h1>Pulse</h1>
              <p>uptime, watched live</p>
            </div>
          </div>

          <div className="chips">
            <StatChip label="Total" value={stats.total} tone="total" />
            <StatChip label="Online" value={stats.online} tone="online" />
            <StatChip label="Pending" value={stats.pending} tone="pending" />
            <StatChip label="Offline" value={stats.offline} tone="offline" />
          </div>
        </div>

        <div className="scanline" />

        <div className="add-row">
          {!formOpen && (
            <button className="add-btn" onClick={() => setFormOpen(true)}>
              <Plus size={15} /> Add monitor
            </button>
          )}

          {formOpen && (
            <form className="add-panel" onSubmit={addMonitor}>
              <div className="field">
                <label htmlFor="m-name">Name</label>
                <input
                  id="m-name"
                  type="text"
                  placeholder="API — production"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="field">
                <label htmlFor="m-url">URL</label>
                <input
                  id="m-url"
                  type="text"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  <Plus size={14} /> Add
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => { setFormOpen(false); setName(""); setUrl("") }}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {loaded && monitors.length === 0 && (
          <div className="empty">
            <div className="empty__icon"><Globe2 size={20} /></div>
            <h3>No monitors yet</h3>
            <p>Add a URL to start tracking its status and response time.</p>
            <button className="add-btn" onClick={() => setFormOpen(true)}>
              <Plus size={15} /> Add your first monitor
            </button>
          </div>
        )}

        <div className="grid">
          {monitors.map((monitor) => {
            const tier = speedTier(monitor.responseTime)
            const isChecking = !!checkingIds[monitor.id]
            return (
              <div className="card" key={monitor.id}>
                <div className="card__top">
                  <div style={{ minWidth: 0 }}>
                    <h3 className="card__name">{monitor.name}</h3>
                    <div className="card__url">
                      <Globe2 size={12} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{monitor.url}</span>
                    </div>
                  </div>
                  <span className={`status-tag status-tag--${monitor.status}`}>
                    <StatusDot status={monitor.status} />
                    {monitor.status}
                  </span>
                </div>

                <div className="card__metrics">
                  <div className="metric">
                    <span className="metric__label">Response</span>
                    <span className={`metric__value ${tier ? `metric__value--${tier}` : "metric__value--muted"}`}>
                      {monitor.responseTime != null ? `${monitor.responseTime} ms` : "—"}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="metric__label"><Clock3 size={10} /> Last checked</span>
                    <span className="metric__value metric__value--muted">{timeAgo(monitor.lastChecked)}</span>
                  </div>
                </div>

                <div className="card__actions">
                  <button className="icon-btn" onClick={() => checkMonitor(monitor.id)} disabled={isChecking}>
                    <RefreshCw size={13} className={isChecking ? "spin" : ""} />
                    {isChecking ? "Checking" : "Check now"}
                  </button>
                  <button className="icon-btn danger" onClick={() => deleteMonitor(monitor.id)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}