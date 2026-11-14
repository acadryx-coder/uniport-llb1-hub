import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth.js'
import { useDocumentTitle } from '../lib/storage.js'
import ThemeToggle from '../components/ThemeToggle.jsx'

export default function Profile() {
  useDocumentTitle('My Profile')
  const { user, updateProfile, uploadAvatar, signOut } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    full_name: user?.name || '',
    matric_number: user?.matric || '',
    level: user?.level || '',
    phone: user?.phone || '',
    bio: user?.bio || ''
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputRef = useRef(null)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setMsg('')
    try {
      await uploadAvatar(file)
      setMsg('Avatar updated successfully!')
    } catch (err) {
      setMsg('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true); setMsg('')
    try {
      await updateProfile(form)
      setMsg('Profile saved!')
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = () => {
    if (window.confirm('Sign out of LLB 1 Hub?')) {
      signOut()
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="view">
      <h3 className="section-title" style={{ marginTop: 4 }}>My Profile</h3>

      <div className="profile-card">
        <div className="profile-avatar-wrap" onClick={handleAvatarClick}>
          {user?.avatar ? (
            <img src={user.avatar} alt="Avatar" className="profile-avatar-img" />
          ) : (
            <div className="profile-avatar-placeholder">
              {user?.name?.charAt(0) || user?.email?.charAt(0) || '?'}
            </div>
          )}
          <div className="profile-avatar-overlay">{uploading ? '...' : 'Edit'}</div>
        </div>
        <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" style={{ display: 'none' }} />
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name || 'Student'}</div>
          <div className="mute-2">{user?.email}</div>
        </div>
      </div>

      {msg && <div className="card" style={{ background: 'var(--acc-soft)', color: 'var(--acc)', padding: 12, marginBottom: 16 }}>{msg}</div>}

      <form className="card" onSubmit={handleSubmit}>
        <div className="field"><label>Full Name</label><input className="input" name="full_name" value={form.full_name} onChange={handleChange} required /></div>
        <div className="field"><label>Matric Number</label><input className="input" name="matric_number" value={form.matric_number} onChange={handleChange} placeholder="e.g. 2026/LAW/001" /></div>
        <div className="field">
          <label>Level</label>
          <select className="input" name="level" value={form.level} onChange={handleChange}>
            <option value="">Select level</option>
            <option value="100L">100 Level</option>
            <option value="200L">200 Level</option>
            <option value="300L">300 Level</option>
            <option value="400L">400 Level</option>
            <option value="500L">500 Level</option>
          </select>
        </div>
        <div className="field"><label>Phone Number</label><input className="input" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+234..." /></div>
        <div className="field"><label>Bio / About</label><textarea className="input" name="bio" rows="3" value={form.bio} onChange={handleChange} placeholder="A short description about you…" /></div>
        <button type="submit" className="btn btn-gold" style={{ width: '100%' }} disabled={saving}>
          {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      <h3 className="section-title">Settings</h3>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontWeight: 600 }}>Appearance</div>
          <div className="mute-2">Toggle light and dark mode.</div>
        </div>
        <ThemeToggle />
      </div>

      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderColor: 'var(--danger-line)' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--danger)' }}>Sign Out</div>
          <div className="mute-2">Log out of this device.</div>
        </div>
        <button className="btn btn-danger sm" onClick={handleSignOut}>Log out</button>
      </div>
    </div>
  )
}
