import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', textAlign:'center', padding:24 }}>
      <div>
        <div style={{ fontSize:80, marginBottom:16 }}>🥬</div>
        <h1 style={{ fontSize:32, fontWeight:700, color:'#14532d', margin:'0 0 8px' }}>Page not found</h1>
        <p style={{ color:'#6b7280', fontSize:16, margin:'0 0 24px' }}>This page has gone fresh — it doesn't exist!</p>
        <Link href="/" style={{ background:'#14532d', color:'white', padding:'12px 28px', borderRadius:14, textDecoration:'none', fontSize:15, fontWeight:600 }}>
          Back to Shop
        </Link>
      </div>
    </div>
  )
}
