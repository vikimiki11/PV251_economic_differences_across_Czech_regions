import { useEffect, useState } from 'react'
import App from './App'
import Dashboard from './pages/Dashboard'

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return hash
}

export default function Router() {
  const hash = useHashRoute()
  const isDashboard = hash.startsWith('#/dashboard')

  useEffect(() => {
    document.getElementById('root')?.classList.toggle('dashboard', isDashboard)
  }, [isDashboard])

  return isDashboard ? <Dashboard /> : <App />
}
