// Analytics screen — progress rings, segmented bar, per-task chart
(function () {
  function Ring({ pct, color, size=72, stroke=7 }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (Math.min(100,Math.max(0,pct)) / 100) * circ;
    return (
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset} style={{transition:'stroke-dashoffset 1s var(--ease-out)'}}/>
      </svg>
    );
  }

  function StatTile({ label, value, sub, pct, color }) {
    return (
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          <span style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:0.6 }}>{label}</span>
          <span style={{ fontFamily:'Neuton, serif', fontSize:30, fontWeight:700, color:'var(--text-1)', lineHeight:1 }}>{value}</span>
          {sub && <span style={{ fontSize:11, color:'var(--text-3)', lineHeight:1.3 }}>{sub}</span>}
        </div>
        <div style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Ring pct={pct} color={color}/>
          <span style={{ position:'absolute', fontFamily:'DM Sans, sans-serif', fontSize:12, fontWeight:700, color }}>{Math.round(pct)}%</span>
        </div>
      </div>
    );
  }

  const TASKS = [
    { name:'Analytics dashboard', hours:6.2, color:'var(--accent)' },
    { name:'DB sync tests',        hours:3.4, color:'#06b6d4' },
    { name:'Onboarding design',    hours:2.1, color:'#10b981' },
    { name:'User feedback',        hours:1.0, color:'#f59e0b' },
  ];
  const MAX = 6.2;
  const SEGMENTS = [
    { label:'Deep work', pct:48, color:'var(--accent)' },
    { label:'Meetings',  pct:22, color:'#06b6d4' },
    { label:'Admin',     pct:18, color:'#f59e0b' },
    { label:'Breaks',    pct:12, color:'#10b981' },
  ];
  const LOGS = [
    ['Analytics dashboard','Wired the segmented chart','Today','2h 10m'],
    ['DB sync tests','Covered offline queue flush','Today','1h 05m'],
    ['Morning run','5.2km easy pace','Yesterday','38m'],
    ['Onboarding design','Sketched illustration concepts','Yesterday','1h 20m'],
  ];

  function AnalyticsScreen() {
    const [range, setRange] = React.useState('Week');
    return (
      <div style={{ height:'100%', overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:22 }}>
        <header style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div>
            <h1 style={{ fontFamily:'Neuton, serif', fontSize:28, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.5px', marginBottom:4 }}>Analytics</h1>
            <p style={{ fontSize:14, color:'var(--text-2)' }}>Where your hours and habits actually went.</p>
          </div>
          <div style={{ display:'inline-flex', gap:2, padding:4, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-full)' }}>
            {['Today','Week','Month','All'].map(r=>(
              <button key={r} onClick={()=>setRange(r)} style={{ padding:'7px 14px', borderRadius:'var(--r-full)', border:'none', background:range===r?'var(--accent)':'transparent', color:range===r?'#fff':'var(--text-2)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all var(--dur-fast) ease' }}>{r}</button>
            ))}
          </div>
        </header>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
          <StatTile label="Completion" value="82%" sub="14 of 17 habits" pct={82} color="#10b981"/>
          <StatTile label="Best Streak" value="23 days" sub="Morning run" pct={64} color="#f97316"/>
          <StatTile label="Time Logged" value="12h 42m" sub="This week" pct={71} color="var(--accent)"/>
        </div>

        {/* Segmented bar */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'20px' }}>
          <span style={{ fontSize:14, fontWeight:600, color:'var(--text-1)', display:'block', marginBottom:14 }}>Time by category</span>
          <div style={{ display:'flex', height:12, borderRadius:'var(--r-full)', overflow:'hidden', background:'rgba(255,255,255,0.04)' }}>
            {SEGMENTS.map(s=><div key={s.label} style={{width:s.pct+'%',height:'100%',background:s.color}}/>)}
          </div>
          <div style={{ display:'flex', gap:'8px 18px', flexWrap:'wrap', marginTop:12 }}>
            {SEGMENTS.map(s=>(
              <span key={s.label} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-2)' }}>
                <span style={{width:8,height:8,borderRadius:2,background:s.color,flexShrink:0}}/>{s.label} · {s.pct}%
              </span>
            ))}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 3fr', gap:14 }}>
          {/* Bar chart */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'20px' }}>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--text-1)', display:'block', marginBottom:16 }}>Hours by task</span>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {TASKS.map(t=>(
                <div key={t.name}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                    <span style={{ fontWeight:600, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%' }}>{t.name}</span>
                    <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--text-2)' }}>{t.hours}h</span>
                  </div>
                  <div style={{ height:7, background:'rgba(255,255,255,0.05)', borderRadius:'var(--r-full)', overflow:'hidden' }}>
                    <div style={{ width:(t.hours/MAX*100)+'%', height:'100%', background:t.color, borderRadius:'var(--r-full)', transition:'width 1s var(--ease-out)' }}/>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Logs */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'20px' }}>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--text-1)', display:'block', marginBottom:16 }}>Recent logs</span>
            <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
              {LOGS.map(([title,note,date,dur],i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:'var(--r-sm)', background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:'var(--text-1)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
                    <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{note}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                    <span style={{ fontSize:11, color:'var(--text-3)' }}>{date}</span>
                    <span style={{ fontFamily:'monospace', fontSize:12, fontWeight:700, color:'var(--text-2)', background:'rgba(255,255,255,0.06)', padding:'4px 9px', borderRadius:'var(--r-xs)' }}>{dur}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  window.RAnalyticsScreen = AnalyticsScreen;
})();
