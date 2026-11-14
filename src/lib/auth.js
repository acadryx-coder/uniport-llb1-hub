import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const REDIRECT_KEY = 'llb1.redirectAfterLogin'

export function setPendingRedirect(path) {
  try { sessionStorage.setItem(REDIRECT_KEY, path) } catch {}
}
export function peekPendingRedirect() {
  try { return sessionStorage.getItem(REDIRECT_KEY) } catch { return null }
}
export function consumePendingRedirect() {
  try {
    const p = sessionStorage.getItem(REDIRECT_KEY)
    if (p) sessionStorage.removeItem(REDIRECT_KEY)
    return p
  } catch { return null }
}

export async function signIn({ email, code }) {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password: code.trim()
  })
  if (authErr) throw new Error(authErr.message)

  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('role, full_name, avatar_url, matric_number, level, phone, bio')
    .eq('id', authData.user.id)
    .single()
  if (profErr) throw new Error('Could not fetch user profile.')

  return {
    email: authData.user.email,
    role: profile.role,
    name: profile.full_name,
    avatar: profile.avatar_url,
    matric: profile.matric_number,
    level: profile.level,
    phone: profile.phone,
    bio: profile.bio
  }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) fetchProfile(session.user)
      else { setUser(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (authUser) => {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name, avatar_url, matric_number, level, phone, bio')
      .eq('id', authUser.id)
      .single()
    setUser({
      email: authUser.email,
      role: data?.role || 'student',
      name: data?.full_name,
      avatar: data?.avatar_url,
      matric: data?.matric_number,
      level: data?.level,
      phone: data?.phone,
      bio: data?.bio
    })
    setLoading(false)
  }

  const updateProfile = async (updates) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authUser.id)
    if (error) throw error
    setUser(prev => ({ ...prev, ...updates }))
  }

  const uploadAvatar = async (file) => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const fileExt = file.name.split('.').pop()
    const filePath = `${authUser.id}/avatar_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: true })
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    await updateProfile({ avatar_url: publicUrl })
    return publicUrl
  }

  return { user, loading, signIn, signOut, updateProfile, uploadAvatar }
}

export const REP_CONTACTS = [
  { role: 'Acting Course Rep', name: 'Simeon', phone: '2340000000000' },
  { role: 'Asst. Acting Course Rep', name: 'To be confirmed', phone: '2340000000001' }
]

export const WHATSAPP_ICON_PATH = 'M12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.44 1.27 4.89L2 22l5.11-1.27C8.56 21.54 10.23 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.63 0-3.15-.47-4.44-1.28l-3.11.77.77-3.11C4.47 15.15 4 13.63 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8zm3.5-5.5c-.19-.09-1.12-.55-1.29-.61-.17-.06-.29-.09-.41.09-.12.18-.47.61-.58.73-.11.12-.21.13-.4.04-1.08-.53-1.79-1.24-2.1-1.8-.15-.26-.02-.4.11-.53.12-.12.27-.31.4-.46.13-.15.17-.26.25-.44.08-.18.04-.34-.04-.46-.08-.12-.47-1.13-.64-1.54-.17-.41-.34-.35-.47-.36h-.4c-.13 0-.34.05-.52.24-.18.19-.69.67-.69 1.64 0 .97.71 1.9.81 2.03.1.13 1.4 2.14 3.39 3 .47.2.84.32 1.13.41.47.15.9.13 1.24.08.38-.06 1.12-.46 1.28-.9.16-.44.16-.82.11-.9-.05-.08-.17-.13-.36-.22z'
