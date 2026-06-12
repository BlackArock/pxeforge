import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'

function formatBytes(bytes) {
  if (!bytes) return '-'
  const gb = bytes / (1024 ** 3)
  if (gb >= 1) return `${gb.toFixed(2)} GB`
  const mb = bytes / (1024 ** 2)
  return `${mb.toFixed(0)} MB`
}

export default function ISOs({ category, title }) {
  const [isos, setISOs] = useState([])
  const [preloaded, setPreloaded] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [showTorrent, setShowTorrent] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [url, setUrl] = useState('')
  const [magnet, setMagnet] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [editingISO, setEditingISO] = useState(null)
  const [editNotes, setEditNotes] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const fileRef = useRef()

  const load = useCallback(async () => {
    try {
      setISOs(await api.getISOs(category))
      setPreloaded(await api.getPreloaded())
    } catch (_) {}
  }, [category])

  useEffect(() => { load() }, [load])

  async function handleDelete(id) {
    if (!confirm('Delete this ISO?')) return
    try { await api.deleteISO(id); load() } catch (_) {}
  }

  async function handleDownloadURL() {
    if (!url) return
    setDownloading('url')
    try { await api.downloadISOUrl(url); setUrl(''); setShowAdd(false) } catch (_) {}
    setDownloading(null)
  }

  async function handleDownloadTorrent() {
    if (!magnet) return
    setDownloading('torrent')
    try { await api.downloadTorrent(magnet); setMagnet(''); setShowTorrent(false) } catch (_) {}
    setDownloading(null)
  }

  async function handlePreloaded(name) {
    setDownloading(name)
    try { await api.downloadPreloaded(name) } catch (_) {}
    setDownloading(null)
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadProgress(0)
    try {
      await api.uploadISO(file, p => setUploadProgress(p))
      setShowUpload(false)
      load()
    } catch (_) {}
    setUploading(false)
  }

  function openEdit(iso) {
    setEditingISO(iso)
    setEditNotes(iso.notes || '')
    setEditCategory(iso.category || 'os')
  }

  async function handleSaveEdit() {
    if (!editingISO) return
    try {
      await api.updateISO(editingISO.id, { notes: editNotes, category: editCategory })
      setEditingISO(null)
      load()
    } catch (_) {}
  }

  return (
    <>
      <div className="page-header">
        <h1>{title || 'ISO Images'}</h1>
        <div className="page-header-actions">
          <button className="btn-ghost" onClick={() => setShowUpload(true)}>Upload</button>
          <button className="btn-ghost" onClick={() => setShowAdd(true)}>Add URL</button>
          <button className="btn-ghost" onClick={() => setShowTorrent(true)}>Add Torrent</button>
        </div>
      </div>

      <div className="card">
        {isos.length === 0 ? (
          <div className="empty-state">
            <p>{title ? `No ${title.toLowerCase()} yet` : 'No ISO images yet'}</p>
          </div>
        ) : (
          <table>
            <thead><tr><th>Filename</th><th>Size</th><th>Status</th><th>Category</th><th>Added</th><th></th></tr></thead>
            <tbody>
              {isos.map(iso => (
                <tr key={iso.id}>
                  <td>
                    <div className="text-sm">{iso.filename}</div>
                    {iso.os_name && <div className="text-dim text-sm">{iso.os_name}{iso.version ? ` ${iso.version}` : ''}</div>}
                    {iso.notes && <div className="text-dim text-xs" style={{ marginTop: '0.25rem', fontStyle: 'italic' }}>{iso.notes}</div>}
                  </td>
                  <td className="text-dim text-sm">{formatBytes(iso.size_bytes)}</td>
                  <td><span className={`badge badge-${iso.status === 'available' ? 'success' : iso.status === 'downloading' ? 'warning' : 'danger'}`}>{iso.status}</span></td>
                  <td>
                    <span className={`badge ${iso.category === 'tool' ? 'badge-info' : 'badge-neutral'}`}>{iso.category || 'os'}</span>
                  </td>
                  <td className="text-dim text-sm">{new Date(iso.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(iso)}>Edit</button>
                      <button className="btn-ghost btn-sm" onClick={() => api.downloadISO(iso.id)}>Download</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(iso.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!category && preloaded.length > 0 && isos.length > 0 && (
        <div className="card mt-2">
          <h2 className="mb-2">Quick Add</h2>
          <div className="flex gap-1" style={{ flexWrap: 'wrap' }}>
            {preloaded.map(p => (
              <button key={p.name} className="btn-primary btn-sm" disabled={downloading === p.name} onClick={() => handlePreloaded(p.name)}>
                {downloading === p.name ? 'Downloading...' : `Add ${p.name}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Download from URL</h2>
            <div className="form-group">
              <label>ISO URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." autoFocus />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleDownloadURL} disabled={!url || downloading === 'url'}>
                {downloading === 'url' ? 'Starting...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTorrent && (
        <div className="modal-overlay" onClick={() => setShowTorrent(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Add Torrent</h2>
            <div className="form-group">
              <label>Magnet Link</label>
              <input value={magnet} onChange={e => setMagnet(e.target.value)} placeholder="magnet:?xt=urn:btih:..." autoFocus />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowTorrent(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleDownloadTorrent} disabled={!magnet || downloading === 'torrent'}>
                {downloading === 'torrent' ? 'Starting...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Upload ISO</h2>
            <div className="form-group">
              <label>ISO File</label>
              <input type="file" ref={fileRef} accept=".iso" />
            </div>
            {uploading && (
              <div className="mb-2">
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress * 100}%` }} /></div>
                <div className="text-sm text-dim text-center mt-1">{Math.round(uploadProgress * 100)}%</div>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowUpload(false)} disabled={uploading}>Cancel</button>
              <button className="btn-primary" onClick={handleUpload} disabled={uploading}>Upload</button>
            </div>
          </div>
        </div>
      )}

      {editingISO && (
        <div className="modal-overlay" onClick={() => setEditingISO(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit — {editingISO.filename}</h2>
            <div className="form-group">
              <label>Category</label>
              <select value={editCategory} onChange={e => setEditCategory(e.target.value)}>
                <option value="os">OS</option>
                <option value="tool">Tool</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={editNotes}
                onChange={e => setEditNotes(e.target.value)}
                rows={4}
                placeholder="eg: Boot without internet, skip online account setup..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setEditingISO(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
