import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import ISOs from './components/ISOs'
import BootMenu from './components/BootMenu'
import Clients from './components/Clients'
import Backups from './components/Backups'
import Logs from './components/Logs'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="isos" element={<ISOs />} />
        <Route path="boot-menu" element={<BootMenu />} />
        <Route path="clients" element={<Clients />} />
        <Route path="backups" element={<Backups />} />
        <Route path="logs" element={<Logs />} />
      </Route>
    </Routes>
  )
}
