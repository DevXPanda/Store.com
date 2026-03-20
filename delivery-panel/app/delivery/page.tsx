"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin, Phone, CheckCircle, Navigation, Truck,
  BarChart3, User, X, Loader2, ChevronRight,
  IndianRupee, Package, Clock, RefreshCw, LogOut,
  Star
} from "lucide-react";

type OrderStatus = "assigned"|"picked_up"|"out_for_delivery"|"delivered"|"cancelled";

const STEPS=[
  {key:"assigned",        label:"Assigned",         icon:"📋",color:"#3b82f6"},
  {key:"picked_up",       label:"Picked Up",        icon:"📦",color:"#f97316"},
  {key:"out_for_delivery",label:"Out for Delivery",  icon:"🛵",color:"#0ea5e9"},
  {key:"delivered",       label:"Delivered",         icon:"✅",color:"#22c55e"},
];

const NEXT:Partial<Record<OrderStatus,OrderStatus>>={
  assigned:"picked_up",picked_up:"out_for_delivery",out_for_delivery:"delivered"
};
const NEXT_LABEL:Partial<Record<OrderStatus,string>>={
  assigned:"Mark Picked Up",picked_up:"Start Delivery",out_for_delivery:"Confirm Delivered"
};

const CURL=process.env.NEXT_PUBLIC_CONVEX_URL||"";

async function cq(path:string,args:object={}){
  if(!CURL) return null;
  try{const r=await fetch(`${CURL}/api/query`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path,args})});return(await r.json()).value;}catch{return null;}
}
async function cm(path:string,args:object={}){
  if(!CURL) return null;
  const r=await fetch(`${CURL}/api/mutation`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({path,args})});
  if(!r.ok) throw new Error(await r.text());
  return(await r.json()).value;
}

function fmt(ts:number){
  const d=Date.now()-ts;
  if(d<60000) return "just now";
  if(d<3600000) return `${Math.floor(d/60000)}m ago`;
  return `${Math.floor(d/3600000)}h ago`;
}

export default function DeliveryApp(){
  const router=useRouter();
  const [tab,setTab]=useState<"active"|"history"|"stats"|"profile">("active");
  const [orders,setOrders]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [online,setOnline]=useState(true);
  const [confirmOrder,setConfirmOrder]=useState<any>(null);
  const [selectedOrder,setSelectedOrder]=useState<any>(null);
  const [updating,setUpdating]=useState<string|null>(null);
  const [deliveryBoy,setDeliveryBoy]=useState({name:"Ravi Kumar",email:"ravi@vegfru.com",phone:"9876543210",rating:4.8});
  const [toast,setToast]=useState("");

  useEffect(()=>{
    const s=localStorage.getItem("vegfru_delivery_user");
    if(!s){router.replace("/login");return;}
    try{setDeliveryBoy(JSON.parse(s));}catch{}
  },[router]);

  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(""),2500);};

  const fetchOrders=useCallback(async()=>{
    const data=await cq("orders:getAllOrders",{limit:100});
    if(data){
      setOrders((data as any[]).filter(o=>["assigned","picked_up","out_for_delivery","delivered"].includes(o.status)));
    }
    setLoading(false);
  },[]);

  useEffect(()=>{fetchOrders();},[fetchOrders]);
  useEffect(()=>{const t=setInterval(fetchOrders,20000);return()=>clearInterval(t);},[fetchOrders]);

  const active=orders.filter(o=>["assigned","picked_up","out_for_delivery"].includes(o.status));
  const delivered=orders.filter(o=>o.status==="delivered");
  const todayDel=delivered.filter(o=>Date.now()-o.createdAt<86400000);
  const earnings=todayDel.length*70;

  async function updateStatus(order:any,status:OrderStatus){
    setUpdating(order._id);
    try{
      await cm("orders:updateOrderStatus",{orderId:order._id,status});
      setOrders(prev=>prev.map(o=>o._id===order._id?{...o,status}:o));
      if(selectedOrder?._id===order._id) setSelectedOrder((p:any)=>p?{...p,status}:null);
      setConfirmOrder(null);
      showToast(status==="delivered"?"Order delivered! 🎉":"Status updated");
    }catch{showToast("Failed to update");}
    setUpdating(null);
  }

  const stepIdx=(o:any)=>STEPS.findIndex(s=>s.key===o.status);

  // ── Active Orders Tab ─────────────────────────────────────────
  const ActiveTab=()=>(
    <div style={{padding:"0 16px 16px"}}>
      {loading
        ?<div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:48,color:"rgba(255,255,255,0.4)"}}>
          <Loader2 size={18} style={{animation:"spin 1s linear infinite"}}/>Loading orders...
        </div>
        :active.length===0
          ?<div style={{textAlign:"center",padding:"56px 20px"}}>
            <div style={{width:80,height:80,background:"rgba(34,197,94,0.1)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:32}}>🛵</div>
            <div style={{fontSize:17,fontWeight:600,color:"rgba(255,255,255,0.8)",marginBottom:6}}>No active deliveries</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,0.35)"}}>New orders assigned from admin appear here</div>
          </div>
          :active.map((order:any)=>{
            const si=stepIdx(order);
            const step=STEPS[si];
            return(
              <div key={order._id} onClick={()=>setSelectedOrder(order)}
                style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,marginBottom:14,overflow:"hidden",cursor:"pointer",transition:"border-color 0.2s"}}
                onMouseEnter={e=>(e.currentTarget as any).style.borderColor="rgba(34,197,94,0.3)"}
                onMouseLeave={e=>(e.currentTarget as any).style.borderColor="rgba(255,255,255,0.08)"}>
                {/* Progress bar */}
                <div style={{height:3,background:"rgba(255,255,255,0.06)"}}>
                  <div style={{height:"100%",background:`linear-gradient(90deg,#15803d,${step?.color||"#22c55e"})`,width:`${((si+1)/STEPS.length)*100}%`,transition:"width 0.5s"}}/>
                </div>

                <div style={{padding:18}}>
                  {/* Header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                    <div>
                      <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{order.customerName}</div>
                      <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:2}}>#{order._id?.slice(-6).toUpperCase()} · {fmt(order.createdAt)}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:18,fontWeight:700,color:"#4ade80"}}>₹{order.total}</div>
                      {order.paymentMethod==="cod"&&<span style={{background:"rgba(245,158,11,0.2)",color:"#fbbf24",fontSize:10,padding:"2px 8px",borderRadius:10,fontWeight:700,marginTop:2,display:"inline-block"}}>COLLECT CASH</span>}
                    </div>
                  </div>

                  {/* Steps */}
                  <div style={{display:"flex",alignItems:"center",marginBottom:14}}>
                    {STEPS.filter(s=>s.key!=="delivered").map((s,i,arr)=>{
                      const done=si>i,cur=si===i;
                      return(
                        <div key={s.key} style={{display:"flex",alignItems:"center",flex:i<arr.length-1?1:0}}>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                            <div style={{
                              width:30,height:30,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",
                              background:done?"#15803d":cur?"rgba(34,197,94,0.2)":"rgba(255,255,255,0.06)",
                              border:`2px solid ${done?"#22c55e":cur?"#22c55e":"rgba(255,255,255,0.1)"}`,
                              fontSize:12,fontWeight:700,
                              color:done?"#fff":cur?"#22c55e":"rgba(255,255,255,0.3)",
                              transition:"all 0.3s",
                            }}>
                              {done?"✓":i+1}
                            </div>
                            <span style={{fontSize:9,color:done||cur?"#4ade80":"rgba(255,255,255,0.25)",fontWeight:done||cur?600:400,whiteSpace:"nowrap"}}>
                              {s.label.split(" ")[0]}
                            </span>
                          </div>
                          {i<arr.length-1&&<div style={{flex:1,height:2,background:si>i?"#22c55e":"rgba(255,255,255,0.08)",margin:"0 6px",marginBottom:14,transition:"background 0.3s"}}/>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Address */}
                  <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"flex-start",gap:10}}>
                    <MapPin size={14} color="#4ade80" style={{flexShrink:0,marginTop:1}}/>
                    <span style={{fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.4}}>{order.deliveryAddress}</span>
                  </div>

                  {/* Action buttons */}
                  <div style={{display:"flex",gap:8}} onClick={e=>e.stopPropagation()}>
                    <a href={`tel:${order.customerPhone}`}
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:12,padding:"10px 0",fontSize:13,fontWeight:500,color:"#4ade80",textDecoration:"none"}}>
                      <Phone size={14}/> Call
                    </a>
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`}
                      target="_blank" rel="noreferrer"
                      style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:12,padding:"10px 0",fontSize:13,fontWeight:500,color:"#60a5fa",textDecoration:"none"}}>
                      <Navigation size={14}/> Navigate
                    </a>
                    {NEXT[order.status as OrderStatus]&&(
                      <button onClick={()=>order.status==="out_for_delivery"?setConfirmOrder(order):updateStatus(order,NEXT[order.status as OrderStatus]!)}
                        disabled={updating===order._id}
                        style={{flex:2,display:"flex",alignItems:"center",justifyContent:"center",gap:6,background:"linear-gradient(135deg,#15803d,#166534)",border:"none",borderRadius:12,padding:"10px 0",fontSize:13,fontWeight:600,color:"#fff",cursor:"pointer",boxShadow:"0 4px 12px rgba(22,101,52,0.4)"}}>
                        {updating===order._id?<Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>:<ChevronRight size={14}/>}
                        {NEXT_LABEL[order.status as OrderStatus]}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
    </div>
  );

  // ── History Tab ───────────────────────────────────────────────
  const HistoryTab=()=>(
    <div style={{padding:"0 16px 16px"}}>
      {delivered.length===0
        ?<div style={{textAlign:"center",padding:"48px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>📋</div>
          <div style={{color:"rgba(255,255,255,0.4)",fontSize:14}}>No delivery history yet</div>
        </div>
        :delivered.map((o:any)=>(
          <div key={o._id} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(34,197,94,0.15)",borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:42,height:42,background:"rgba(34,197,94,0.15)",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>✅</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:600,color:"#fff"}}>{o.customerName}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.deliveryAddress?.split(",")[0]}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:2}}>{fmt(o.createdAt)}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontSize:15,fontWeight:700,color:"#4ade80"}}>₹{o.total}</div>
              <div style={{fontSize:11,color:"#4ade80",marginTop:2}}>+₹70 earned</div>
            </div>
          </div>
        ))}
    </div>
  );

  // ── Stats Tab ─────────────────────────────────────────────────
  const StatsTab=()=>{
    const weekDays=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const today=new Date().getDay();
    const weekData=weekDays.map((_,i)=>{
      const dayOrders=delivered.filter(o=>{
        const d=new Date(o.createdAt).getDay();
        return d===((today-6+i+7)%7);
      });
      return dayOrders.length;
    });
    const maxVal=Math.max(...weekData,1);

    return(
      <div style={{padding:"0 16px 16px"}}>
        {/* Stats grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          {[
            {label:"Total Delivered",val:delivered.length,icon:"✅",color:"#22c55e"},
            {label:"Today Delivered",val:todayDel.length,icon:"📅",color:"#3b82f6"},
            {label:"Today's Earnings",val:`₹${earnings}`,icon:"💰",color:"#f59e0b"},
            {label:"Active Now",val:active.length,icon:"🛵",color:"#a855f7"},
          ].map(({label,val,icon,color})=>(
            <div key={label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"18px 16px"}}>
              <div style={{fontSize:24,marginBottom:10}}>{icon}</div>
              <div style={{fontSize:24,fontWeight:700,color}}>{val}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:4}}>{label}</div>
            </div>
          ))}
        </div>

        {/* Weekly chart */}
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:18,marginBottom:14}}>
          <div style={{fontSize:14,fontWeight:600,color:"rgba(255,255,255,0.8)",marginBottom:16}}>Weekly Deliveries</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:8,height:80}}>
            {weekDays.map((day,i)=>{
              const pct=weekData[i]/maxVal;
              const isToday=i===6;
              return(
                <div key={day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontWeight:weekData[i]>0?600:400}}>{weekData[i]||""}</div>
                  <div style={{width:"100%",background:"rgba(255,255,255,0.06)",borderRadius:6,position:"relative",height:50}}>
                    <div style={{position:"absolute",bottom:0,left:0,right:0,background:isToday?"linear-gradient(180deg,#22c55e,#15803d)":"rgba(34,197,94,0.4)",borderRadius:6,height:`${Math.max(pct*100,4)}%`,transition:"height 0.5s"}}/>
                  </div>
                  <div style={{fontSize:10,color:isToday?"#4ade80":"rgba(255,255,255,0.3)",fontWeight:isToday?600:400}}>{day}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rating card */}
        <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:16,padding:18}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{fontSize:36,fontWeight:700,color:"#f59e0b"}}>{deliveryBoy.rating}</div>
            <div>
              <div style={{display:"flex",gap:3,marginBottom:4}}>
                {[1,2,3,4,5].map(s=><Star key={s} size={16} color="#f59e0b" fill={s<=Math.floor(deliveryBoy.rating)?"#f59e0b":"none"}/>)}
              </div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)"}}>Your delivery rating</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Profile Tab ───────────────────────────────────────────────
  const ProfileTab=()=>(
    <div style={{padding:"0 16px 16px"}}>
      {/* Profile card */}
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,padding:24,marginBottom:14,textAlign:"center"}}>
        <div style={{width:80,height:80,background:"linear-gradient(135deg,#15803d,#166534)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:28,fontWeight:700,color:"#fff",boxShadow:"0 8px 24px rgba(22,101,52,0.4)"}}>
          {deliveryBoy.name.charAt(0)}
        </div>
        <div style={{fontSize:20,fontWeight:700,color:"#fff",marginBottom:4}}>{deliveryBoy.name}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:10}}>{deliveryBoy.email}</div>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(34,197,94,0.15)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:20,padding:"5px 14px"}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:online?"#22c55e":"rgba(255,255,255,0.2)",boxShadow:online?"0 0 8px #22c55e":"none"}}/>
          <span style={{fontSize:12,color:online?"#4ade80":"rgba(255,255,255,0.4)",fontWeight:600}}>{online?"Online":"Offline"}</span>
        </div>
      </div>

      {/* Info */}
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,overflow:"hidden",marginBottom:14}}>
        {[
          {icon:Phone,label:"Phone",val:deliveryBoy.phone},
          {icon:User,label:"Email",val:deliveryBoy.email},
          {icon:Star,label:"Rating",val:`${deliveryBoy.rating}/5.0`},
          {icon:Truck,label:"Total Delivered",val:`${delivered.length} orders`},
        ].map(({icon:Icon,label,val})=>(
          <div key={label} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
            <div style={{width:36,height:36,background:"rgba(34,197,94,0.1)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              <Icon size={16} color="#4ade80"/>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginBottom:2}}>{label}</div>
              <div style={{fontSize:13,fontWeight:500,color:"#e2e8f0"}}>{val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Online toggle */}
      <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"14px 18px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:14,fontWeight:500,color:"rgba(255,255,255,0.8)"}}>Availability</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:2}}>{online?"You are visible to admin":"You won't receive new orders"}</div>
        </div>
        <button onClick={()=>setOnline(!online)}
          style={{width:50,height:28,borderRadius:20,border:"none",cursor:"pointer",position:"relative",transition:"background 0.2s",background:online?"#15803d":"rgba(255,255,255,0.1)"}}>
          <div style={{position:"absolute",top:3,width:22,height:22,background:"#fff",borderRadius:"50%",transition:"left 0.2s",left:online?24:3,boxShadow:"0 2px 4px rgba(0,0,0,0.3)"}}/>
        </button>
      </div>

      <button onClick={()=>{localStorage.removeItem("vegfru_delivery_user");router.push("/login");}}
        style={{width:"100%",display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:"rgba(239,68,68,0.1)",color:"#f87171",border:"1px solid rgba(239,68,68,0.2)",borderRadius:14,padding:"13px",fontSize:14,fontWeight:500,cursor:"pointer"}}>
        <LogOut size={16}/> Sign Out
      </button>
    </div>
  );

  return(
    <div style={{maxWidth:420,margin:"0 auto",minHeight:"100vh",background:"#0a0d14",fontFamily:"'DM Sans',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} *{box-sizing:border-box;}`}</style>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0d2818,#0f3d22)",padding:"0 20px",position:"sticky",top:0,zIndex:40,borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        {/* Top bar */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",height:60}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:38,height:38,background:"linear-gradient(135deg,#15803d,#166534)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🌿</div>
            <div>
              <div style={{fontSize:15,fontWeight:700,color:"#fff"}}>Veg<span style={{color:"#4ade80"}}>Fru</span> <span style={{fontWeight:400,color:"rgba(255,255,255,0.5)",fontSize:13}}>Delivery</span></div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <button onClick={fetchOrders} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:8,padding:"7px",cursor:"pointer",color:"rgba(255,255,255,0.5)",display:"flex"}}>
              <RefreshCw size={14} style={{animation:loading?"spin 1s linear infinite":"none"}}/>
            </button>
            <div style={{display:"flex",alignItems:"center",gap:6,background:"rgba(34,197,94,0.12)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:20,padding:"5px 10px"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:online?"#22c55e":"rgba(255,255,255,0.2)",boxShadow:online?"0 0 8px #22c55e":"none"}}/>
              <span style={{fontSize:11,color:online?"#4ade80":"rgba(255,255,255,0.4)",fontWeight:600}}>{online?"ONLINE":"OFFLINE"}</span>
              {active.length>0&&<span style={{background:"#ef4444",color:"#fff",fontSize:10,fontWeight:700,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{active.length}</span>}
            </div>
          </div>
        </div>

        {/* Today stats strip */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:1,paddingBottom:12}}>
          {[
            {label:"Active",val:active.length,color:"#f59e0b"},
            {label:"Today",val:todayDel.length,color:"#4ade80"},
            {label:"Earned",val:`₹${earnings}`,color:"#4ade80"},
          ].map(({label,val,color})=>(
            <div key={label} style={{background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"10px 12px",textAlign:"center",margin:"0 4px"}}>
              <div style={{fontSize:18,fontWeight:700,color}}>{val}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={{display:"flex",background:"#0a0d14",borderBottom:"1px solid rgba(255,255,255,0.06)",position:"sticky",top:130,zIndex:30}}>
        {([
          {id:"active",label:"Active",icon:Truck},
          {id:"history",label:"History",icon:CheckCircle},
          {id:"stats",label:"Stats",icon:BarChart3},
          {id:"profile",label:"Profile",icon:User},
        ] as {id:typeof tab;label:string;icon:any}[]).map(({id,label,icon:Icon})=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{flex:1,padding:"12px 0",border:"none",background:"none",cursor:"pointer",
              color:tab===id?"#4ade80":"rgba(255,255,255,0.3)",
              borderBottom:`2px solid ${tab===id?"#4ade80":"transparent"}`,
              fontSize:11,display:"flex",flexDirection:"column",alignItems:"center",gap:4,transition:"all 0.15s",fontWeight:tab===id?600:400}}>
            <Icon size={16}/>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:"auto",paddingTop:14}}>
        {tab==="active"&&<ActiveTab/>}
        {tab==="history"&&<HistoryTab/>}
        {tab==="stats"&&<StatsTab/>}
        {tab==="profile"&&<ProfileTab/>}
      </div>

      {/* Order detail sheet */}
      {selectedOrder&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:100,display:"flex",alignItems:"flex-end",backdropFilter:"blur(4px)"}}
          onClick={()=>setSelectedOrder(null)}>
          <div style={{background:"#111827",borderRadius:"24px 24px 0 0",width:"100%",maxHeight:"75vh",overflow:"auto",border:"1px solid rgba(255,255,255,0.1)"}}
            onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:4,background:"rgba(255,255,255,0.15)",borderRadius:20,margin:"12px auto"}}/>
            <div style={{padding:"0 24px 24px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:"#fff"}}>{selectedOrder.customerName}</div>
                  <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2}}>#{selectedOrder._id?.slice(-6).toUpperCase()} · {fmt(selectedOrder.createdAt)}</div>
                </div>
                <button onClick={()=>setSelectedOrder(null)} style={{background:"rgba(255,255,255,0.08)",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.5)"}}>
                  <X size={16}/>
                </button>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                {[["Phone",selectedOrder.customerPhone],["Total",`₹${selectedOrder.total}`],["Payment",selectedOrder.paymentMethod?.toUpperCase()],["Status",selectedOrder.paymentStatus]].map(([k,v])=>(
                  <div key={k} style={{background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"10px 14px"}}>
                    <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:3,fontFamily:"monospace"}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:500,color:"#e2e8f0"}}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"12px 14px",marginBottom:16}}>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginBottom:4,fontFamily:"monospace"}}>DELIVERY ADDRESS</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>{selectedOrder.deliveryAddress}</div>
              </div>

              {selectedOrder.paymentMethod==="cod"&&!["delivered","cancelled"].includes(selectedOrder.status)&&(
                <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
                  <IndianRupee size={16} color="#f59e0b"/>
                  <div>
                    <div style={{fontSize:13,fontWeight:600,color:"#fbbf24"}}>Collect ₹{selectedOrder.total} Cash</div>
                    <div style={{fontSize:11,color:"rgba(245,158,11,0.7)"}}>Cash on delivery — collect before confirming</div>
                  </div>
                </div>
              )}

              {NEXT[selectedOrder.status as OrderStatus]&&(
                <button onClick={()=>{
                  if(selectedOrder.status==="out_for_delivery"){setConfirmOrder(selectedOrder);setSelectedOrder(null);}
                  else{updateStatus(selectedOrder,NEXT[selectedOrder.status as OrderStatus]!);setSelectedOrder(null);}
                }}
                  style={{width:"100%",background:"linear-gradient(135deg,#15803d,#166534)",color:"#fff",border:"none",borderRadius:14,padding:"14px",fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(22,101,52,0.4)"}}>
                  {NEXT_LABEL[selectedOrder.status as OrderStatus]}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm delivery modal */}
      {confirmOrder&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:110,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#111827",borderRadius:24,padding:28,width:"100%",maxWidth:380,border:"1px solid rgba(255,255,255,0.1)"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{width:64,height:64,background:"rgba(34,197,94,0.15)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px",fontSize:28}}>✅</div>
              <div style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:6}}>Confirm Delivery</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.5)"}}>Delivered to {confirmOrder.customerName}?</div>
            </div>
            {confirmOrder.paymentMethod==="cod"&&(
              <div style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)",borderRadius:12,padding:"12px 16px",marginBottom:16,textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:700,color:"#fbbf24"}}>Collect ₹{confirmOrder.total}</div>
                <div style={{fontSize:12,color:"rgba(245,158,11,0.6)",marginTop:2}}>Cash payment — collect before confirming</div>
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setConfirmOrder(null)} style={{flex:1,background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.6)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,padding:"12px",fontSize:14,cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>updateStatus(confirmOrder,"delivered")} disabled={!!updating}
                style={{flex:2,background:"linear-gradient(135deg,#15803d,#166534)",color:"#fff",border:"none",borderRadius:12,padding:"12px",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 16px rgba(22,101,52,0.4)"}}>
                {updating?<Loader2 size={14} style={{animation:"spin 1s linear infinite"}}/>:null}
                Confirm Delivered
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#15803d",color:"#fff",padding:"10px 22px",borderRadius:12,fontSize:13,fontWeight:500,zIndex:999,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
        {toast}
      </div>}
    </div>
  );
}
