export default function Loading() {
  return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', paddingTop:80 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:40 }}>
        <div style={{ borderRadius:24, background:'white', border:'1px solid #e5e7eb', aspectRatio:'1', animation:'pulse 1.5s infinite' }}/>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ height:32, background:'#f3f4f6', borderRadius:8, width:'60%', animation:'pulse 1.5s infinite' }}/>
          <div style={{ height:64, background:'#f3f4f6', borderRadius:8, animation:'pulse 1.5s infinite' }}/>
          <div style={{ height:80, background:'#f0fdf4', borderRadius:16, animation:'pulse 1.5s infinite' }}/>
          <div style={{ height:52, background:'#14532d', borderRadius:14, animation:'pulse 1.5s infinite', opacity:0.3 }}/>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}
