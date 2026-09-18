import { Link } from 'react-router-dom'

export function AppHeader() {
  return (
    <header className="app-header">
      <Link className="wordmark" to="/" aria-label="My Firsts home">
        <span>MY</span><strong>FIRSTS</strong>
      </Link>
      <Link className="header-link" to="/settings">Settings</Link>
    </header>
  )
}
