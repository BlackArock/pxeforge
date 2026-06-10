import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try { setClients(await api.getClients()) } catch (_) {}
    setLoading(false)
  }, [])

  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id) }, [load])

  return (
    <>
      <div className="page-header"><h1>PXE Clients</h1></div>
      <div className="card">
        {loading ? (
          <p className="text-dim">Loading...</p>
        ) : clients.length === 0 ? (
          <div className="empty-state"><p>No clients seen yet</p><p className="text-sm">Clients will appear here when they PXE boot into iVentoy</p></div>
        ) : (
          <table>
            <thead><tr><th>MAC Address</th><th>IP Address</th><th>Hostname</th><th>Last Seen</th></tr></thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{c.mac_address}</td>
                  <td>{c.ip_address || '-'}</td>
                  <td>{c.hostname || '-'}</td>
                  <td className="text-dim text-sm">{c.last_seen ? new Date(c.last_seen).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
