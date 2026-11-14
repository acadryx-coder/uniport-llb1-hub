import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../lib/auth.js'
import { useDocumentTitle } from '../lib/storage.js'
import { TYPES } from '../data/seed.js'

export default function Admin() {
  useDocumentTitle('Admin Panel')
  const { user } = useAuth()
  
  const [activeTab, setActiveTab] = useState('notice')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  // Form States
  const [notice, setNotice] = useState({ title: '', body: '', tag: 'general', pinned: false })
  const [task, setTask] = useState({ title: '', course_code: '', due: '' })
  const [poll, setPoll] = useState({ question: '', options: ['', ''] })
  const [resource, setResource] = useState({ course_slug: 'law-101', type: 'Note', name: '', file_url: '', md: '' })

  const handlePostNotice = async (e) => {
    e.preventDefault()
    setLoading(true)
    const slug = notice.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
    const date = new Date().toISOString().slice(0, 10)
    const { error } = await supabase.from('notices').insert([{ slug, title: notice.title, body: notice.body, tag: notice.tag, pinned: notice.pinned, date }])
    setLoading(false)
    if (error) return setMsg('Error: ' + error.message)
    setMsg('Notice posted!')
    setNotice({ title: '', body: '', tag: 'general', pinned: false })
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    setLoading(true)
    const id = 'task-' + Date.now()
    const { error } = await supabase.from('tasks').insert([{ id, title: task.title, course_code: task.course_code, due: task.due }])
    setLoading(false)
    if (error) return setMsg('Error: ' + error.message)
    setMsg('Task added!')
    setTask({ title: '', course_code: '', due: '' })
  }

  const handleCreatePoll = async (e) => {
    e.preventDefault()
    if (poll.options.filter(o => o.trim()).length < 2) return setMsg('Need at least 2 options')
    setLoading(true)
    const slug = poll.question.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) + '-' + Date.now().toString().slice(-4)
    
    const { error: pollErr } = await supabase.from('polls').insert([{ slug, question: poll.question }])
    if (pollErr) { setLoading(false); return setMsg('Error: ' + pollErr.message) }

    const opts = poll.options.filter(o => o.trim()).map((o, i) => ({ id: `${slug}-opt-${i}`, poll_slug: slug, label: o, votes: 0 }))
    const { error: optErr } = await supabase.from('poll_options').insert(opts)
    
    setLoading(false)
    if (optErr) return setMsg('Error: ' + optErr.message)
    setMsg('Poll created!')
    setPoll({ question: '', options: ['', ''] })
  }

  const handleAddResource = async (e) => {
    e.preventDefault()
    setLoading(true)
    const slug = resource.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
    const id = `${resource.course_slug}-${slug}`
    
    // If they uploaded a file_url, use that. If they pasted markdown, store the md.
    const payload = {
      id,
      course_slug: resource.course_slug,
      slug,
      type: resource.type,
      name: resource.name,
      date: new Date().toISOString().slice(0, 10),
      file_url: resource.file_url || null,
      md: resource.md || null
    }

    const { error } = await supabase.from('resources').insert([payload])
    setLoading(false)
    if (error) return setMsg('Error: ' + error.message)
    setMsg('Resource published!')
    setResource({ ...resource, name: '', file_url: '', md: '' })
  }

  return (
    <div className="view">
      <div className="hero" style={{ paddingBottom: 20 }}>
        <h2>Admin Panel</h2>
        <p>Logged in as {user?.name || user?.email}</p>
      </div>

      {msg && <div className="card" style={{ background: 'var(--acc-soft)', color: 'var(--acc)', padding: 12, marginBottom: 16 }}>{msg}</div>}

      <div className="filters" style={{ marginBottom: 24, flexWrap: 'wrap' }}>
        <button className={activeTab === 'notice' ? 'on' : ''} onClick={() => setActiveTab('notice')}>Notice</button>
        <button className={activeTab === 'task' ? 'on' : ''} onClick={() => setActiveTab('task')}>Task</button>
        <button className={activeTab === 'poll' ? 'on' : ''} onClick={() => setActiveTab('poll')}>Poll</button>
        <button className={activeTab === 'resource' ? 'on' : ''} onClick={() => setActiveTab('resource')}>Material</button>
      </div>

      {activeTab === 'notice' && (
        <form className="card" onSubmit={handlePostNotice}>
          <h3>Post Notice</h3>
          <div className="field"><label>Title</label><input className="input" required value={notice.title} onChange={e => setNotice({...notice, title: e.target.value})} /></div>
          <div className="field"><label>Body</label><textarea className="input" rows="3" required value={notice.body} onChange={e => setNotice({...notice, body: e.target.value})} /></div>
          <div className="field"><label>Category</label>
            <select className="input" value={notice.tag} onChange={e => setNotice({...notice, tag: e.target.value})}>
              <option value="general">General</option><option value="urgent">Urgent</option><option value="academic">Academic</option><option value="event">Event</option>
            </select>
          </div>
          <label style={{ display: 'flex', gap: 8, marginBottom: 16 }}><input type="checkbox" checked={notice.pinned} onChange={e => setNotice({...notice, pinned: e.target.checked})} /> Pin to top</label>
          <button className="btn btn-gold" disabled={loading}>{loading ? 'Posting...' : 'Post Notice'}</button>
        </form>
      )}

      {activeTab === 'task' && (
        <form className="card" onSubmit={handleAddTask}>
          <h3>Add Class Deadline</h3>
          <div className="field"><label>Task Title</label><input className="input" required value={task.title} onChange={e => setTask({...task, title: e.target.value})} /></div>
          <div className="field"><label>Course Code</label><input className="input" value={task.course_code} onChange={e => setTask({...task, course_code: e.target.value})} placeholder="e.g. LAW 101" /></div>
          <div className="field"><label>Due Date</label><input type="date" className="input" required value={task.due} onChange={e => setTask({...task, due: e.target.value})} /></div>
          <button className="btn btn-gold" disabled={loading}>{loading ? 'Adding...' : 'Add Task'}</button>
        </form>
      )}

      {activeTab === 'poll' && (
        <form className="card" onSubmit={handleCreatePoll}>
          <h3>Create Poll</h3>
          <div className="field"><label>Question</label><input className="input" required value={poll.question} onChange={e => setPoll({...poll, question: e.target.value})} /></div>
          {poll.options.map((opt, i) => (
            <div className="field" key={i}>
              <label>Option {i + 1}</label>
              <input className="input" required value={opt} onChange={e => {
                const newOpts = [...poll.options]; newOpts[i] = e.target.value; setPoll({...poll, options: newOpts});
              }} />
            </div>
          ))}
          <button type="button" className="btn ghost sm" style={{ marginBottom: 16 }} onClick={() => setPoll({...poll, options: [...poll.options, '']})}>+ Add Option</button>
          <button className="btn btn-gold" disabled={loading}>{loading ? 'Creating...' : 'Create Poll'}</button>
        </form>
      )}

      {activeTab === 'resource' && (
        <form className="card" onSubmit={handleAddResource}>
          <h3>Publish Material</h3>
          <div className="field">
            <label>Course</label>
            <select className="input" value={resource.course_slug} onChange={e => setResource({...resource, course_slug: e.target.value})}>
              <option value="law-101">LAW 101 - Legal Methods</option>
              <option value="ges-111">GES 111 - Communication</option>
              <option value="phc-105">PHC 105 - Philosophy</option>
              <option value="pol-101">POL 101 - Political Science</option>
              <option value="psy-101">PSY 101 - Psychology</option>
            </select>
          </div>
          <div className="field">
            <label>Material Type</label>
            <select className="input" value={resource.type} onChange={e => setResource({...resource, type: e.target.value})}>
              {TYPES.filter(t => t.key !== 'all').map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
          <div className="field"><label>Title</label><input className="input" required value={resource.name} onChange={e => setResource({...resource, name: e.target.value})} /></div>
          
          <div className="field">
            <label>File URL (for PDFs in public/pdfs/)</label>
            <input className="input" value={resource.file_url} onChange={e => setResource({...resource, file_url: e.target.value})} placeholder="e.g. /pdfs/legal-methods-guide.pdf" />
          </div>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--mute)', margin: '-4px 0 12px' }}>— OR —</div>
          <div className="field">
            <label>LegalMD Text (for in-app reading)</label>
            <textarea className="input" rows="4" value={resource.md} onChange={e => setResource({...resource, md: e.target.value})} placeholder="# Title&#10;:: Lead paragraph..." />
          </div>

          <button className="btn btn-gold" disabled={loading}>{loading ? 'Publishing...' : 'Publish Material'}</button>
        </form>
      )}
    </div>
  )
}
