// Routines screen — confetti on check, streak glow, heatmap
(function () {
  const HABITS = [
    { id:1, title:'Morning run',     cat:'Fitness',  streak:23, best:41, color:'#ef4444' },
    { id:2, title:'Meditate 10 min', cat:'Mindset',  streak:8,  best:30, color:'var(--accent)' },
    { id:3, title:'Read 20 pages',   cat:'Learning', streak:12, best:19, color:'#f59e0b' },
    { id:4, title:'Drink 2L water',  cat:'Health',   streak:5,  best:14, color:'#10b981' },
    { id:5, title:'Inbox zero',      cat:'Work',     streak:3,  best:9,  color:'var(--info)' },
  ];
  const CAT_STYLE = {
    Fitness: { bg:'rgba(239,68,68,0.12)', fg:'#fca5a5' },
    Mindset: { bg:'var(--accent-wash)', fg:'var(--accent-text)' },
    Learning:{ bg:'rgba(245,158,11,0.12)', fg:'#fcd34d' },
    Health:  { bg:'rgba(16,185,129,0.12)', fg:'#6ee7b7' },
    Work:    { bg:'rgba(255,255,255,0.07)', fg:'var(--text-2)' },
  };
  const HEAT = [2,3,4,1,0,2,3,4,4,2,1,3,2,4,3,0,1,2,4,3,2,1,3,4,2,3,4,1,2,4];
  const HCOL = ['rgba(255,255,255,0.06)','rgba(124,58,237,0.2)','rgba(124,58,237,0.4)','rgba(124,58,237,0.65)','rgba(124,58,237,0.9)'];

  function spawnConfetti(anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ['#7c3aed','#10b981','#f59e0b','#ef4444','#06b6d4','#f97316','#c4b5fd','#6ee7b7'];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const dist = 36 + Math.random() * 28;
      const dot = document.createElement('div');
      dot.className = 'confetti-dot';
      dot.style.cssText = `left:${cx}px;top:${cy}px;background:${colors[i%colors.length]};--tx:${Math.cos(angle)*dist}px;--ty:${Math.sin(angle)*dist}px;width:${5+Math.random()*4}px;height:${5+Math.random()*4}px;`;
      document.body.appendChild(dot);
      setTimeout(()=>dot.remove(), 750);
    }
  }

  function HabitRow({ habit, idx }) {
    const [done, setDone] = React.useState(idx % 2 === 0);
    const [streak, setStreak] = React.useState(habit.streak);
    const checkRef = React.useRef(null);
    const cat = CAT_STYLE[habit.cat] || CAT_STYLE.Work;

    const toggle = () => {
      const next = !done;
      setDone(next);
      if (next) {
        setStreak(s => s + 1);
        if (checkRef.current) spawnConfetti(checkRef.current);
      } else {
        setStreak(s => Math.max(0, s - 1));
      }
    };

    return (
      <div className="stagger-item" style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background: done ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)', transition:'background var(--dur-base) ease' }}>
        {/* Checkbox */}
        <button ref={checkRef} onClick={toggle} style={{ width:28, height:28, borderRadius:'50%', border:`2px solid ${done ? 'var(--success)' : 'var(--border-strong)'}`, background: done ? 'var(--success)' : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0, transition:'all var(--dur-base) var(--ease-spring)', animation: done ? 'check-spring var(--dur-base) var(--ease-spring)' : 'none', boxShadow: done ? '0 0 12px rgba(16,185,129,0.4)' : 'none' }}>
          {done && <Ico.Check size={14} style={{ color:'#fff' }} />}
        </button>
        {/* Content */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:500, color: done ? 'var(--text-3)' : 'var(--text-1)', textDecoration: done ? 'line-through' : 'none', transition:'all var(--dur-base) ease', marginBottom:4 }}>{habit.title}</div>
          <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:'var(--r-full)', background:cat.bg, color:cat.fg, textTransform:'uppercase', letterSpacing:0.5 }}>{habit.cat}</span>
        </div>
        {/* Streak */}
        <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
          <Ico.Flame size={18} style={{ color:'var(--streak)', animation: streak > 5 ? 'flame-pulse 2s ease-in-out infinite' : 'none' }} />
          <span style={{ fontSize:15, fontWeight:700, color:'var(--text-1)', minWidth:24, textAlign:'right' }}>{streak}</span>
          <span style={{ fontSize:11, color:'var(--text-3)', marginLeft:2 }}>/ {habit.best}</span>
        </div>
      </div>
    );
  }

  function RoutinesScreen() {
    const [mode, setMode] = React.useState('today');
    return (
      <div style={{ height:'100%', overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:22 }}>
        <header style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'Neuton, serif', fontSize:28, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.5px', marginBottom:4 }}>Daily Routines</h1>
            <p style={{ fontSize:14, color:'var(--text-2)' }}>2 of 5 habits done today — keep your streak alive.</p>
          </div>
          <div style={{ display:'inline-flex', gap:2, padding:4, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-full)' }}>
            {['today','all'].map(m => (
              <button key={m} onClick={()=>setMode(m)} style={{ padding:'7px 16px', borderRadius:'var(--r-full)', border:'none', background: mode===m ? 'var(--accent)' : 'transparent', color: mode===m ? '#fff' : 'var(--text-2)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all var(--dur-fast) ease' }}>
                {m==='today'?'Today':'All'}
              </button>
            ))}
          </div>
        </header>

        {/* Heatmap */}
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'20px 22px' }}>
          <div style={{ fontSize:13, fontWeight:600, color:'var(--text-2)', marginBottom:14 }}>Activity — last 30 days</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(30,1fr)', gap:5 }}>
            {HEAT.map((v,i)=>(
              <div key={i} style={{ aspectRatio:1, borderRadius:3, background:HCOL[v], transition:'transform var(--dur-fast) ease', cursor:'default' }}
                onMouseEnter={e=>e.currentTarget.style.transform='scale(1.3)'}
                onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'} />
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:12, fontSize:11, color:'var(--text-3)' }}>
            <span>Less</span>
            {HCOL.map((c,i)=><span key={i} style={{width:10,height:10,borderRadius:2,background:c}}/>)}
            <span>More</span>
          </div>
        </div>

        <button style={{ alignSelf:'flex-start', display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:'var(--r-full)', border:'1px solid var(--border-strong)', background:'transparent', color:'var(--text-2)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all var(--dur-fast) ease' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-strong)';e.currentTarget.style.color='var(--text-2)';}}>
          <Ico.Plus size={14}/>Add Habit
        </button>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {HABITS.map((h,i)=><HabitRow key={h.id} habit={h} idx={i}/>)}
        </div>
      </div>
    );
  }

  window.RRoutinesScreen = RoutinesScreen;
})();
