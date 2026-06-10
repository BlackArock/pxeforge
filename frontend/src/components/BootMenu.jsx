import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

export default function BootMenu() {
  const [isos, setISOs] = useState([])
  const [dirty, setDirty] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.getISOs()
      setISOs(data.sort((a, b) => a.display_order - b.display_order))
    } catch (_) {}
  }, [])

  useEffect(() => { load() }, [load])

  function moveUp(idx) {
    if (idx === 0) return
    const next = [...isos]
    const tmp = next[idx - 1].display_order
    next[idx - 1].display_order = next[idx].display_order
    next[idx].display_order = tmp
    const a = next.splice(idx - 1, 1)
    next.splice(idx, 0, a[0])
    setISOs(next)
    setDirty(true)
  }

  function moveDown(idx) {
    if (idx === isos.length - 1) return
    const next = [...isos]
    const tmp = next[idx + 1].display_order
    next[idx + 1].display_order = next[idx].display_order
    next[idx].display_order = tmp
    const a = next.splice(idx + 1, 1)
    next.splice(idx, 0, a[0])
    setISOs(next)
    setDirty(true)
  }

  async function handleToggle(iso) {
    try {
      const res = await api.toggleISO(iso.id)
      setISOs(isos.map(i => i.id === iso.id ? { ...i, enabled: res.enabled } : i))
    } catch (_) {}
  }

  async function handleSave() {
    try {
      const items = isos.map((iso, i) => ({ id: iso.id, display_order: i }))
      await api.reorderISOs(items)
      setDirty(false)
    } catch (_) {}
  }

  return (
    <>
      <div className="page-header">
        <h1>Boot Menu</h1>
        <div className="page-header-actions">
          {dirty && <button className="btn-primary btn-sm" onClick={handleSave}>Save Order</button>}
        </div>
      </div>
      <div className="card">
        <p className="text-sm text-dim mb-2">
          Manage which ISOs appear in the PXE boot menu and their order.
          Disabled ISOs are moved to <code>_disabled/</code> so iVentoy won't show them.
          Click <strong>Save Order</strong> after reordering to persist changes.
        </p>
        {isos.length === 0 ? (
          <p className="text-dim text-sm">No ISOs registered</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 60 }}>Order</th>
                <th>Filename</th>
                <th>Size</th>
                <th style={{ width: 100 }}>Visible</th>
              </tr>
            </thead>
            <tbody>
              {isos.map((iso, idx) => (
                <tr key={iso.id} style={{ opacity: iso.enabled ? 1 : 0.45 }}>
                  <td>
                    <div className="flex items-center" style={{ gap: '0.25rem' }}>
                      <span className="text-dim">{idx + 1}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <button className="btn-ghost btn-sm" style={{ fontSize: '0.6rem', padding: '0 0.25rem', lineHeight: 1.2 }} onClick={() => moveUp(idx)} disabled={idx === 0}>▲</button>
                        <button className="btn-ghost btn-sm" style={{ fontSize: '0.6rem', padding: '0 0.25rem', lineHeight: 1.2 }} onClick={() => moveDown(idx)} disabled={idx === isos.length - 1}>▼</button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-sm">{iso.filename}</div>
                    {iso.os_name && <div className="text-dim text-sm">{iso.os_name}</div>}
                  </td>
                  <td className="text-dim text-sm">{iso.size_bytes ? `${(iso.size_bytes / 1e9).toFixed(1)} GB` : '-'}</td>
                  <td>
                    <label className="toggle-switch">
                      <input type="checkbox" checked={!!iso.enabled} onChange={() => handleToggle(iso)} />
                      <span className="toggle-slider" />
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
}