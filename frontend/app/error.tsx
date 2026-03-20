'use client'
import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('App error:', error) }, [error])
  return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', textAlign:'center', padding:24 }}>
      <div>
        <div style={{ fontSize:60, marginBottom:16 }}>🌿</div>
        <h2 style={{ fontSize:24, fontWeight:700, color:'#14532d', margin:'0 0 8px' }}>Something went wrong</h2>
        <p style={{ color:'#6b7280', margin:'0 0 20px' }}>{error.message || 'An unexpected error occurred'}</p>
        <button onClick={reset} style={{ background:'#14532d', color:'white', border:'none', padding:'12px 28px', borderRadius:14, fontSize:15, fontWeight:600, cursor:'pointer' }}>
          Try again
        </button>
      </div>
    </div>
  )
}
