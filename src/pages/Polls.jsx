import { Link } from 'react-router-dom'
import { usePolls } from '../lib/hooks.js'
import { useDocumentTitle } from '../lib/storage.js'

export default function Polls() {
  useDocumentTitle('Vote')
  const { polls, loading } = usePolls()

  if (loading) return <div className="view"><div className="empty">Loading polls…</div></div>

  return (
    <div className="view">
      <h3 className="section-title" style={{ marginTop: 4 }}>Class polls</h3>
      {polls.map((p) => {
        const total = p.poll_options.reduce((s, o) => s + o.votes, 0)
        return (
          <Link key={p.slug} to={`/vote/${p.slug}`} className="card" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
            <div className="eyebrow">Poll</div>
            <h3>{p.question}</h3>
            <div className="mute-2" style={{ marginTop: 4 }}>{p.poll_options.length} options · {total} votes</div>
            <div style={{ marginTop: 12 }} className="btn ghost sm">Open poll →</div>
          </Link>
        )
      })}
    </div>
  )
}
