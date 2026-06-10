const API = '/api'

function token() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const headers = { ...options.headers }
  const t = token()
  if (t) headers['Authorization'] = `Bearer ${t}`

  const res = await fetch(`${API}${path}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail || 'Request failed')
    return data
  }

  if (!res.ok) throw new Error('Request failed')
  return res
}

export const api = {
  async login(username, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    localStorage.setItem('token', data.access_token)
    return data
  },

  async getDashboard() {
    return request('/dashboard')
  },

  async getISOs() {
    return request('/isos')
  },

  async getPreloaded() {
    return request('/isos/preloaded')
  },

  async deleteISO(id) {
    return request(`/isos/${id}`, { method: 'DELETE' })
  },

  async uploadISO(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${API}/isos/upload`)
      xhr.setRequestHeader('Authorization', `Bearer ${token()}`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total)
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText))
        else reject(new Error('Upload failed'))
      }
      xhr.onerror = () => reject(new Error('Upload failed'))
      const fd = new FormData()
      fd.append('file', file)
      xhr.send(fd)
    })
  },

  downloadISO(id) {
    const t = token()
    window.open(`${API}/isos/${id}/download?token=${t}`, '_blank')
  },

  async downloadISOUrl(url, filename) {
    const params = new URLSearchParams({ url })
    if (filename) params.set('filename', filename)
    return request(`/isos/download?${params}`, { method: 'POST' })
  },

  async downloadTorrent(magnet) {
    return request(`/isos/download-torrent?magnet=${encodeURIComponent(magnet)}`, { method: 'POST' })
  },

  async downloadPreloaded(name) {
    return request(`/isos/download-preloaded?name=${encodeURIComponent(name)}`, { method: 'POST' })
  },

  async getDownloads() {
    return request('/isos/downloads')
  },

  async deleteDownload(id) {
    return request(`/isos/downloads/${id}`, { method: 'DELETE' })
  },

  async clearDownloads() {
    return request('/isos/downloads', { method: 'DELETE' })
  },

  async getClients() {
    return request('/clients')
  },

  async getBackups() {
    return request('/backups')
  },

  async createBackup() {
    return request('/backups', { method: 'POST' })
  },

  async deleteBackup(id) {
    return request(`/backups/${id}`, { method: 'DELETE' })
  },

  async toggleISO(id) {
    return request(`/isos/${id}/toggle`, { method: 'PUT' })
  },

  async reorderISOs(items) {
    return request('/isos/reorder', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items }) })
  },

  async getLogs() {
    return request('/logs')
  },

  async clearLogs() {
    return request('/logs', { method: 'DELETE' })
  },
}
