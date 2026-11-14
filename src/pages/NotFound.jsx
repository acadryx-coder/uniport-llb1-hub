import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../lib/storage.js'

export default function NotFound() {
  useDocumentTitle('Not found')
  return (
    <div className="view">
      <div className="empty" style={{ padding: 60, fontSize: '1rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: 12 }}>404</div>
        <div style={{ marginBottom: 20 }}>This page does not exist.</div>
        <Link to="/" className="btn">Back to home</Link>
      </div>
    </div>
  )
}
