import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import DownloadStatus from './DownloadStatus'

export default function Layout() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <>
      <nav className="nav">
        <span className="nav-brand" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="4,10 7,3 10,9"/>
            <polygon points="20,10 17,3 14,9"/>
            <path d="M3 12a9 9 0 0018 0"/>
            <path d="M6 14a3 3 0 003-3"/>
            <path d="M18 14a3 3 0 00-3-3"/>
            <circle cx="9" cy="13" r="1" fill="currentColor" stroke="none"/>
            <circle cx="15" cy="13" r="1" fill="currentColor" stroke="none"/>
            <path d="M10 16a2 2 0 004 0" fill="none"/>
          </svg>
          PXEForge
        </span>
        <div className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/isos">ISOs</NavLink>
          <NavLink to="/boot-menu">Boot Menu</NavLink>
          <NavLink to="/clients">Clients</NavLink>
          <NavLink to="/backups">Backups</NavLink>
          <NavLink to="/logs">Logs</NavLink>
        </div>
        <div className="nav-right">
          <button className="btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>
      <div className="container" style={{ paddingBottom: '6rem' }}>
        <Outlet />
      </div>
      <DownloadStatus />
    </>
  )
}
