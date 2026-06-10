import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

function formatBytes(bytes) {
  if (!bytes) return '-'
  const mb = bytes / (1024 ** 2)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${bytes} B`
}

export default function Backups() {
  const [backups, setBackups] = useState([])
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    try { setBackups(await api.getBackups()) } catch (_) {}
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate() {
    setCreating(true)
    try { await api.createBackup(); load() } catch (_) {}
    setCreating(false)
  }

  async function handleDelete(id) {
    if (!confirm('Delete this backup?')) return
    try { await api.deleteBackup(id); load() } catch (_) {}
  }

  return (
    <>
      <div className="page-header">
        <h1>Backups</h1>
        <button className="btn-primary" onClick={handleCreate} disabled={creating}>
          {creating ? 'Generating...' : 'Generate Backup'}
        </button>
      </div>
      <div className="card">
        {backups.length === 0 ? (
          <div className="empty-state">
            <p>No backups yet</p>
            <p className="text-sm">Generate a ZIP backup with all configurations, database, and ISO metadata</p>
          </div>
        ) : (
          <table>
            <thead><tr><th>Filename</th><th>Size</th><th>Created</th><th></th></tr></thead>
            <tbody>
              {backups.map(b => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{b.filename}</td>
                  <td className="text-dim text-sm">{formatBytes(b.size_bytes)}</td>
                  <td className="text-dim text-sm">{new Date(b.created_at).toLocaleString()}</td>
                  <td><button className="btn-danger btn-sm" onClick={() => handleDelete(b.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}
