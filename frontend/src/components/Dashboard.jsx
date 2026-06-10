import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

function truncate(str, n = 70) {
  if (!str || str.length <= n) return str
  return str.slice(0, n) + '…'
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [showAllLogs, setShowAllLogs] = useState(false)

  const load = useCallback(async () => {
    try {
      setData(await api.getDashboard())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id) }, [load])

  if (error) return <div className="card"><p style={{ color: 'var(--danger)' }}>{error}</p></div>
  if (!data) return <div className="card"><p className="text-dim">Loading...</p></div>

  const statusBadge = data.iventoy_status === 'running'
    ? <span className="badge badge-success">Running</span>
    : <span className="badge badge-danger">{data.iventoy_status}</span>

  const diskColor = data.disk_percent > 90 ? 'var(--danger)' : data.disk_percent > 70 ? 'var(--warning)' : 'var(--success)'

  const logs = data.recent_logs
  const displayedLogs = showAllLogs ? logs : logs.slice(0, 10)

  return (
    <>
      <div className="page-header"><h1>Dashboard</h1></div>
      <div className="card-grid">
        <div className="stat-card">
          <div className="label">iVentoy Status</div>
          <div className="value">{statusBadge}</div>
        </div>
        <div className="stat-card">
          <div className="label">ISO Images</div>
          <div className="value">{data.total_isos}</div>
        </div>
        <div className="stat-card">
          <div className="label">Active Clients</div>
          <div className="value">{data.active_clients}</div>
        </div>
        <div className="stat-card">
          <div className="label">Disk Usage</div>
          <div className="value" style={{ color: diskColor }}>{data.disk_used_gb} GB</div>
          <div className="text-sm text-dim">{data.disk_percent}% of {data.disk_total_gb} GB</div>
          <div className="progress-bar mt-2"><div className="progress-fill" style={{ width: `${data.disk_percent}%`, background: diskColor }} /></div>
        </div>
      </div>
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <h2 style={{ margin: 0 }}>Recent Activity</h2>
          {logs.length > 0 && (
            <button className="btn-ghost btn-sm" style={{ fontSize: '0.75rem', color: 'var(--danger)' }} onClick={async () => {
              if (confirm('Clear all activity logs?')) {
                try { await api.clearLogs(); load() } catch (_) {}
              }
            }}>Clear</button>
          )}
        </div>
        {logs.length === 0 ? (
          <p className="text-dim text-sm">No activity yet</p>
        ) : (
          <>
            <table>
              <thead><tr><th>Action</th><th>User</th><th>Details</th><th>Time</th></tr></thead>
              <tbody>
                {displayedLogs.map((log, i) => (
                  <tr key={i}>
                    <td><span className="badge badge-info">{log.action}</span></td>
                    <td>{log.username}</td>
                    <td className="text-dim" title={log.details || ''}>{truncate(log.details) || '-'}</td>
                    <td className="text-dim text-sm">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length > 10 && (
              <button
                className="btn-ghost btn-sm mt-2"
                onClick={() => setShowAllLogs(!showAllLogs)}
                style={{ fontSize: '0.75rem', width: '100%', textAlign: 'center' }}
              >
                {showAllLogs ? 'Show less' : `Ver más (${logs.length} total)`}
              </button>
            )}
          </>
        )}
      </div>
    </>
  )
}
