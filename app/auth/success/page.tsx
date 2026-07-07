'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getRedirectCookie, clearRedirectCookie } from '@/lib/utils'

export default function AuthSuccess() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthSuccess = async () => {
      try {
        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          router.push('/signin?error=session_failed')
          return
        }

        if (session) {
          console.log('User authenticated:', session.user.email)
          
          // Check for redirect cookie
          const redirectPath = getRedirectCookie()
          if (redirectPath) {
            console.log('Redirecting to:', redirectPath)
            clearRedirectCookie()
            router.push(redirectPath)
          } else {
            router.push('/')
          }
        } else {
          // Try to get session from URL hash (for implicit flow)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          
          if (accessToken) {
            // Set the session manually
            const { error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || ''
            })
            
            if (setError) {
              console.error('Set session error:', setError)
              router.push('/signin?error=session_set_failed')
            } else {
              // Check for redirect cookie
              const redirectPath = getRedirectCookie()
              if (redirectPath) {
                console.log('Redirecting to:', redirectPath)
                clearRedirectCookie()
                router.push(redirectPath)
              } else {
                router.push('/')
              }
            }
          } else {
            router.push('/signin?error=no_session')
          }
        }
      } catch (error) {
        console.error('Auth success error:', error)
        router.push('/signin?error=unexpected')
      }
    }

    handleAuthSuccess()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <div className="text-center">
        <span className="inline-flex items-center justify-center font-bold tracking-widest text-2xl text-[#E50914]">
  <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
  <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
</span>
        <p className="text-white">Completing authentication...</p>
      </div>
    </div>
  )
}

