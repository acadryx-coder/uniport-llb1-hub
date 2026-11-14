import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { useLocalStorage, relDate, useDocumentTitle } from '../lib/storage.js'

const TAG_LABEL = { urgent: 'Urgent', academic: 'Academic', event: 'Event', general: 'General' }

export default function NoticeDetail() {
  const { noticeSlug } = useParams()
  const [notice, setNotice] = useState(null)
  const [loading, setLoading] = useState(true)
  const [readNotices, setReadNotices] = useLocalStorage('llb1.read_notices', [])

  useDocumentTitle(notice ? notice.title : 'Notice')

  useEffect(() => {
    supabase.from('notices').select('*').eq('slug', noticeSlug).single().then(({ data }) => {
      if (data) {
        setNotice(data)
        const list = Array.isArray(readNotices) ? readNotices : []
        if (!list.includes(data.slug)) setReadNotices([...list, data.slug])
      }
      setLoading(false)
    })
  }, [noticeSlug])

  if (loading) return <div className="view"><div className="empty">Loading…</div></div>
  if (!notice) return <div className="view"><Link to="/notices" className="back-btn">← All notices</Link><div className="empty">Notice not found.</div></div>

  return (
    <div className="view">
      <Link to="/notices" className="back-btn">← All notices</Link>
      <article className={`notice ${notice.tag} ${notice.pinned ? 'pinned' : ''}`} style={{ padding: '20px 22px' }}>
        <div className="notice-top">
          <span className={`tg ${notice.tag}`}>{TAG_LABEL[notice.tag] || 'General'}</span>
          {notice.pinned && <span className="tg pinned">Pinned</span>}
          <span className="notice-date">{relDate(notice.date)}</span>
        </div>
        <h2 style={{ fontSize: '1.35rem', margin: '8px 0' }}>{notice.title}</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.65 }}>{notice.body}</p>
      </article>
    </div>
  )
}
