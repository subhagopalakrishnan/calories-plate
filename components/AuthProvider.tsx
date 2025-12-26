'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { Profile } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Cache profile in localStorage for faster loading
const PROFILE_CACHE_KEY = 'calories_plate_profile'

function getCachedProfile(): Profile | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

function setCachedProfile(profile: Profile | null) {
  if (typeof window === 'undefined') return
  try {
    if (profile) {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile))
    } else {
      localStorage.removeItem(PROFILE_CACHE_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(getCachedProfile())
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session - show UI immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      // If we have a cached profile for this user, use it immediately
      const cached = getCachedProfile()
      if (session?.user && cached && cached.id === session.user.id) {
        setProfile(cached)
        setLoading(false)
        // Still refresh in background
        fetchProfile(session.user.id, true)
      } else if (session?.user) {
        // Create temporary profile from user metadata for instant display
        const tempProfile: Profile = {
          id: session.user.id,
          email: session.user.email || '',
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
          avatar_url: session.user.user_metadata?.avatar_url || null,
          daily_calorie_goal: 2000,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at,
        }
        setProfile(tempProfile)
        setLoading(false)
        // Fetch real profile in background
        fetchProfile(session.user.id, true)
      } else {
        setProfile(null)
        setCachedProfile(null)
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Quick update with user metadata
          const tempProfile: Profile = {
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            avatar_url: session.user.user_metadata?.avatar_url || null,
            daily_calorie_goal: 2000,
            created_at: session.user.created_at,
            updated_at: session.user.updated_at || session.user.created_at,
          }
          setProfile(tempProfile)
          setLoading(false)
          // Fetch full profile in background
          fetchProfile(session.user.id, true)
        } else {
          setProfile(null)
          setCachedProfile(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string, isBackground = false) {
    if (!isBackground) setLoading(true)
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data)
        setCachedProfile(data)
      }
    } catch (e) {
      console.log('Profile fetch error (non-critical):', e)
    }
    
    if (!isBackground) setLoading(false)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  async function signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })

    // Profile creation is optional - trigger handles it
    if (!error && data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          daily_calorie_goal: 2000,
        }, { onConflict: 'id' })
      } catch (e) {
        console.log('Profile creation skipped')
      }
    }

    return { error }
  }

  async function signOut() {
    setCachedProfile(null)
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setSession(null)
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!user) return { error: new Error('No user logged in') }

    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (!error) {
      const newProfile = profile ? { ...profile, ...updates } : null
      setProfile(newProfile)
      setCachedProfile(newProfile)
    }

    return { error }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
