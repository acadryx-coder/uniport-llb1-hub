import { Link, NavLink, Outlet } from 'react-router-dom'
import ThemeToggle from './ThemeToggle.jsx'
import { useAuth } from '../lib/auth.js'

const TABS = [
  { to: '/', label: 'Home', end: true },
  { to: '/timetable', label: 'Timetable' },
  { to: '/materials', label: 'Materials' },
  { to: '/notices', label: 'Notices' },
  { to: '/vote', label: 'Vote' },
  { to: '/tools', label: 'Tools' },
  { to: '/contacts', label: 'Contacts' },
  { to: '/profile', label: 'Profile' }
]

export default function Layout() {
  const { user } = useAuth()
  const tabs = [...TABS]
  if (user?.role === 'admin') tabs.push({ to: '/admin', label: 'Admin' })

  return (
    <>
      <header className="site-head">
        <div className="head-inner">
          <div className="brand">
            <div className="crest">⚖</div>
            <div>
              <h1>LLB 1 Hub</h1>
              <div className="sub">Faculty of Law · UNIPORT</div>
            </div>
          </div>
          
          <div className="head-actions">
            <ThemeToggle />
            <Link to="/profile" className="header-avatar" aria-label="My profile">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--acc-soft)', display: 'grid', placeItems: 'center', color: 'var(--acc)', fontWeight: 700, fontSize: '0.85rem' }}>
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
                </div>
              )}
            </Link>
          </div>
        </div>
      </header>
      
      <nav aria-label="Sections">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => (isActive ? 'on' : '')}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      
      <main>
        <Outlet />
      </main>
      
      <footer>
        <strong>LLB 1 Hub</strong> · 2026/27 Session<br />
        <div style={{ marginTop: 6, lineHeight: 1.6 }}>
          Built by the <strong>Simeon & Divine (Grandly Dee)</strong> Administration<br />
          Acting Course Rep & Asst. Course Rep · Faculty of Law, UNIPORT
        </div>
        <span style={{ opacity: 0.65, display: 'block', marginTop: 12, fontSize: '0.7rem' }}>
          Private hub for LLB 1, Faculty of Law, UNIPORT. Non-members: kindly close this tab.
        </span>
      </footer>
    </>
  )
}
