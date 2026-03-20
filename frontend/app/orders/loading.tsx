export default function Loading() {
  return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', paddingTop:80 }}>
      <div style={{ maxWidth:800, margin:'0 auto', padding:'32px 20px' }}>
        <div style={{ height:28, background:'#f3f4f6', borderRadius:8, width:80, marginBottom:28, animation:'pulse 1.5s infinite' }}/>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[1,2,3].map(i => <div key={i} style={{ background:'white', borderRadius:20, height:80, border:'1px solid #f3f4f6', animation:'pulse 1.5s infinite', opacity:0.4+i*0.2 }}/>)}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )
}
