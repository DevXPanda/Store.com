export default function Loading() {
  return (
    <div style={{ minHeight:'100vh', background:'#FEFAE0', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:12, animation:'bounce 1s infinite' }}>🌿</div>
        <div style={{ fontSize:14, color:'#16a34a', fontWeight:500 }}>Loading fresh produce...</div>
        <style>{`@keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}`}</style>
      </div>
    </div>
  )
}
