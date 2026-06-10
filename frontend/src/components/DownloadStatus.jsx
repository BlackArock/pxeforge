import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

function formatSpeed(bytesPerSec) {
  if (!bytesPerSec) return '0 B/s'
  if (bytesPerSec >= 1_000_000) return `${(bytesPerSec / 1_000_000).toFixed(1)} MB/s`
  if (bytesPerSec >= 1_000) return `${(bytesPerSec / 1_000).toFixed(0)} KB/s`
  return `${bytesPerSec} B/s`
}

function formatETA(sec) {
  if (sec == null) return '--'
  if (sec < 60) return `${sec}s`
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`
}

function formatBytes(bytes) {
  if (!bytes) return '0'
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(1)} TB`
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(2)} GB`
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(1)} MB`
  return `${Math.round(bytes / 1e3)} KB`
}

const xStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--text-dim)',
  cursor: 'pointer',
  padding: '0 0.25rem',
  fontSize: '1rem',
  lineHeight: 1,
  borderRadius: '50%',
  width: 20,
  height: 20,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
}

export default function DownloadStatus() {
  const [downloads, setDownloads] = useState([])
  const [minimized, setMinimized] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.getDownloads()
      setDownloads(data)
    } catch (_) {}
  }, [])

  useEffect(() => {
    load()
    const id = setInterval(load, 2000)
    return () => clearInterval(id)
  }, [load])

  const active = downloads.filter(d => d.status === 'downloading' || d.status === 'starting')
  const recent = downloads.filter(d => d.status === 'completed' || d.status === 'error').slice(0, 10)
  const showClear = recent.some(d => d.status === 'completed' || d.status === 'error')

  if (active.length === 0 && recent.length === 0) return null

  const hasActive = active.length > 0

  async function handleDelete(id) {
    try { await api.deleteDownload(id) } catch (_) {}
  }

  async function handleClear() {
    try { await api.clearDownloads() } catch (_) {}
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      zIndex: 100,
      fontSize: '0.8125rem',
    }}>
      <div
        onClick={() => setMinimized(!minimized)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.375rem 1rem',
          cursor: 'pointer',
          borderBottom: minimized ? 'none' : '1px solid var(--border)',
          userSelect: 'none',
        }}
      >
        <div className="flex items-center gap-1">
          <span style={{ fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Downloads
          </span>
          {hasActive && (
            <span className="pulse" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)' }} />
          )}
          <span className="text-dim text-sm">({active.length} active{recent.length > 0 ? `, ${recent.length} recent` : ''})</span>
        </div>
        <div className="flex items-center" style={{ gap: '0.5rem' }}>
          {showClear && (
            <button
              className="btn-ghost btn-sm"
              onClick={e => { e.stopPropagation(); handleClear() }}
              style={{ fontSize: '0.7rem' }}
            >Clear history</button>
          )}
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            {minimized ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {!minimized && (
        <div style={{ maxHeight: 280, overflowY: 'auto', padding: '0.375rem 0.75rem' }}>
          {active.map(d => {
            const pct = d.total_length > 0 ? Math.min(100, (d.completed_length / d.total_length) * 100) : 0
            return (
              <div key={d.id} style={{ marginBottom: '0.5rem', padding: '0.375rem 0' }}>
                <div className="flex justify-between items-center" style={{ marginBottom: '0.25rem' }}>
                  <div className="flex items-center" style={{ flex: 1, gap: '0.375rem', minWidth: 0 }}>
                    <span className="truncate">{d.filename}</span>
                  </div>
                  <div className="flex items-center" style={{ gap: '0.375rem', flexShrink: 0 }}>
                    <span className="text-dim" style={{ whiteSpace: 'nowrap' }}>
                      {formatBytes(d.completed_length)} / {formatBytes(d.total_length)} ({Math.round(pct)}%)
                    </span>
                    <button style={xStyle} onClick={() => handleDelete(d.id)} title="Remove">×</button>
                  </div>
                </div>
                <div className="progress-bar" style={{ height: 4, marginBottom: '0.25rem' }}>
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex gap-2 text-dim" style={{ fontSize: '0.75rem' }}>
                  <span>↓ {formatSpeed(d.download_speed)}</span>
                  {d.upload_speed > 0 && <span>↑ {formatSpeed(d.upload_speed)}</span>}
                  {d.num_peers > 0 && <span>Peers: {d.num_peers}</span>}
                  {d.num_seeders > 0 && <span>Seeds: {d.num_seeders}</span>}
                  {d.eta_seconds != null && <span>ETA: {formatETA(d.eta_seconds)}</span>}
                </div>
              </div>
            )
          })}

          {recent.length > 0 && (
            <>
              <div style={{
                borderTop: '1px solid var(--border)',
                margin: '0.125rem 0',
                padding: '0.25rem 0',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-dim)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>Recent</span>
              </div>
              {recent.map(d => (
                <div key={d.id} className="flex justify-between items-center" style={{ padding: '0.125rem 0' }}>
                  <div className="flex items-center" style={{ flex: 1, gap: '0.375rem', minWidth: 0 }}>
                    <span className="truncate text-dim" style={{ flex: 1 }}>{d.filename}</span>
                    {d.status === 'completed'
                      ? <span className="badge badge-success">Done</span>
                      : <span className="badge badge-danger" title={d.error_message || ''}>Error</span>
                    }
                  </div>
                  <button style={xStyle} onClick={() => handleDelete(d.id)} title="Remove">×</button>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
