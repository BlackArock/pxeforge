import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

export default function Logs() {
  const [logs, setLogs] = useState([])

  const load = useCallback(async () => {
    try { setLogs(await api.getLogs()) } catch (_) {}
  }, [])

  useEffect(() => { load(); const id = setInterval(load, 5000); return () => clearInterval(id) }, [load])

  return (
    <>
      <div className="page-header"><h1>Audit Logs</h1></div>
      <div className="card">
        {logs.length === 0 ? (
          <p className="text-dim">No logs yet</p>
        ) : (
          <table>
            <thead><tr><th>Action</th><th>User</th><th>Details</th><th>IP</th><th>Time</th></tr></thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={i}>
                  <td><span className="badge badge-info">{log.action}</span></td>
                  <td>{log.username}</td>
                  <td className="text-dim">{log.details || '-'}</td>
                  <td className="text-dim text-sm" style={{ fontFamily: 'monospace' }}>{log.ip_address || '-'}</td>
                  <td className="text-dim text-sm">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
