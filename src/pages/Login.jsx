import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, consumePendingRedirect, peekPendingRedirect, REP_CONTACTS, WHATSAPP_ICON_PATH } from '../lib/auth.js'
import { findCourse, findResource, findNotice, findPoll } from '../data/seed.js'
import { useDocumentTitle } from '../lib/storage.js'

function describeTarget(path) {
  if (!path || path === '/') return { headline: 'the LLB 1 Hub', detail: 'your dashboard for lectures, materials, and class decisions.' }
  if (path === '/timetable') return { headline: 'the lecture timetable', detail: "the full week's schedule." }
  if (path === '/materials') return { headline: 'the materials library', detail: 'notes, textbooks, and past questions.' }
  let m = path.match(/^\/materials\/([^/]+)\/([^/]+)$/)
  if (m) {
    const found = findResource(m[1], m[2])
    if (found) return { headline: `the ${found.resource.type.toLowerCase()} — ${found.resource.name}`, detail: `under ${found.course.code}.` }
  }
  m = path.match(/^\/materials\/([^/]+)$/)
  if (m) {
    const course = findCourse(m[1])
    if (course) return { headline: `the ${course.code} materials`, detail: `${course.title}.` }
  }
  if (path === '/notices') return { headline: 'the notice board', detail: 'announcements from the course rep.' }
  if (path === '/vote') return { headline: 'class polls', detail: 'where the class decides together.' }
  return { headline: 'the LLB 1 Hub', detail: 'the course hub for LLB 1.' }
}

function WhatsAppButton({ contact, className = '' }) {
  const text = `Hi ${contact.name}, I need login details for the LLB 1 Hub. My name is ____.`
  return (
    <a href={`https://wa.me/${contact.phone}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" className={`rep-btn ${className}`}>
      <svg viewBox="0 0 24 24" fill="currentColor"><path d={WHATSAPP_ICON_PATH} /></svg>
      Message {contact.role}
    </a>
  )
}

export default function Login() {
  useDocumentTitle('Sign in')
  const { user, signIn } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [target] = useState(() => location.state?.from || peekPendingRedirect() || '/')
  const context = describeTarget(target)

  if (user) {
    consumePendingRedirect()
    return <Navigate to={target} replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn({ email, code })
      consumePendingRedirect()
      navigate(target, { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed.')
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-head">
          <div className="login-crest">⚖</div>
          <h1>LLB 1 Hub</h1>
          <p>Faculty of Law · University of Port Harcourt</p>
        </div>

        <div className="login-target">
          You're trying to open <strong>{context.headline}</strong> — {context.detail}
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}
          <div className="field">
            <label>Email</label>
            <input type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="field">
            <label>Access code</label>
            <input type="password" className="input" placeholder="Your password" value={code} onChange={(e) => setCode(e.target.value)} required />
          </div>
          <button type="submit" className="btn" style={{ width: '100%', marginTop: 4 }} disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-reps">
          <div className="login-reps-title">Don't have a code?</div>
          {REP_CONTACTS.map((c, i) => <WhatsAppButton key={c.role} contact={c} className={i > 0 ? 'secondary' : ''} />)}
        </div>

        <div className="login-legal">
          <strong>Private hub.</strong> LLB 1 Hub belongs solely to LLB 1, Faculty of Law, UNIPORT.
        </div>
      </div>
    </div>
  )
}
