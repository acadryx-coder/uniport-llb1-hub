import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNotices } from '../lib/hooks.js'
import { relDate, useDocumentTitle } from '../lib/storage.js'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'academic', label: 'Academic' },
  { key: 'event', label: 'Events' },
  { key: 'general', label: 'General' }
]

const TAG_LABEL = { urgent: 'Urgent', academic: 'Academic', event: 'Event', general: 'General' }

export default function Notices() {
  useDocumentTitle('Notices')
  const { notices, loading } = useNotices()
  const [filter, setFilter] = useState('all')

  if (loading) return <div className="view"><div className="empty">Loading notices…</div></div>

  const list = notices.filter((n) => filter === 'all' || n.tag === filter)

  return (
    <div className="view">
      <h3 className="section-title" style={{ marginTop: 4 }}>Notice board</h3>
      <div className="filters">
        {FILTERS.map((f) => (
          <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="empty">No notices in this category.</div>
      ) : (
        list.map((n) => (
          <Link key={n.slug} to={`/notices/${n.slug}`} className={`notice ${n.tag} ${n.pinned ? 'pinned' : ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <div className="notice-top">
              <span className={`tg ${n.tag}`}>{TAG_LABEL[n.tag] || 'General'}</span>
              {n.pinned && <span className="tg pinned">Pinned</span>}
              <span className="notice-date">{relDate(n.date)}</span>
            </div>
            <h4>{n.title}</h4>
            <p>{n.body}</p>
          </Link>
        ))
      )}
    </div>
  )
}
