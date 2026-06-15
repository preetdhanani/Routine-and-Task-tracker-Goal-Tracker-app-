// Tasks screen — always-visible timer bar, task cards with priority stripes
(function () {
  const TASKS = [
    { id:1, title:'Ship analytics dashboard', priority:'HIGH', due:'Jun 18', logged:'6h 12m', status:'In Progress', desc:'Wire the segmented bar and per-task charts to the live Zustand store.', subs:[{t:'Charts component',done:true},{t:'Date filters',done:true},{t:'Empty states',done:false}] },
    { id:2, title:'Write database sync tests', priority:'CRITICAL', due:'Today', logged:'1h 40m', status:'In Progress', desc:'Cover the offline queue + conflict resolution paths.', subs:[{t:'Queue flush',done:false},{t:'Conflict merge',done:false}] },
    { id:3, title:'Design onboarding illustrations', priority:'MEDIUM', due:'Jun 21', logged:'45m', status:'Todo', desc:'', subs:[] },
    { id:4, title:'Reply to user feedback', priority:'LOW', due:'—', logged:'20m', status:'Todo', desc:'', subs:[] },
  ];
  const PCOLOR = { HIGH:'#f59e0b', CRITICAL:'#ef4444', MEDIUM:'var(--accent)', LOW:'rgba(255,255,255,0.15)' };
  const PTONE  = { HIGH:'#fef3c7', CRITICAL:'#fee2e2', MEDIUM:'var(--accent-wash)', LOW:'rgba(255,255,255,0.05)' };
  const PFORE  = { HIGH:'#92400e', CRITICAL:'#991b1b', MEDIUM:'var(--accent-text)', LOW:'var(--text-3)' };

  function TimerBar({ taskTitle, startedAt, onStop, onDiscard }) {
    const [secs, setSecs] = React.useState(0);
    React.useEffect(() => {
      const tick = () => setSecs(Math.round((Date.now() - startedAt) / 1000));
      tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
    }, [startedAt]);
    const fmt = t => [Math.floor(t/3600),Math.floor((t%3600)/60),t%60].map(v=>String(v).padStart(2,'0')).join(':');
    return (
      <div style={{ display:'flex', alignItems:'center', gap:16, padding:'0 20px', height:52, background:'var(--accent)', overflow:'hidden', animation:'timer-in var(--dur-base) var(--ease-out) forwards', flexShrink:0 }}>
        <div style={{ width:8, height:8, borderRadius:'50%', background:'rgba(255,255,255,0.5)', animation:'spin-slow 2s linear infinite', boxShadow:'0 0 6px rgba(255,255,255,0.6)' }} />
        <span style={{ fontSize:13, fontWeight:500, color:'rgba(255,255,255,0.85)', flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{taskTitle}</span>
        <span style={{ fontFamily:'monospace', fontSize:16, fontWeight:700, color:'#fff', letterSpacing:1, flexShrink:0 }}>{fmt(secs)}</span>
        <button onClick={onStop} style={{ padding:'7px 14px', borderRadius:'var(--r-sm)', background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.3)', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>Stop & Log</button>
        <button onClick={onDiscard} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', cursor:'pointer', fontSize:12, fontFamily:'inherit', padding:0, flexShrink:0 }}>Discard</button>
      </div>
    );
  }

  function SubCheck({ done:initDone }) {
    const [done, setDone] = React.useState(initDone);
    return React.createElement('span', {
      onClick:()=>setDone(!done),
      style:{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:16, height:16, borderRadius:4, border:`1.5px solid ${done?'var(--success)':'var(--border-strong)'}`, background:done?'var(--success)':'transparent', cursor:'pointer', flexShrink:0, transition:'all var(--dur-fast) var(--ease-spring)' }
    }, done ? React.createElement(Ico.Check, { size:10, style:{color:'#fff'} }) : null);
  }

  function TaskCard({ task, running, onToggle }) {
    const [open, setOpen] = React.useState(task.id===1);
    const [hovered, setHovered] = React.useState(false);
    return (
      <div className="stagger-item" style={{ position:'relative', borderRadius:'var(--r-md)', border:`1px solid ${running ? 'var(--accent)' : 'var(--border)'}`, background: hovered ? 'var(--bg-card-hover)' : 'var(--bg-card)', transition:'all var(--dur-base) var(--ease-smooth)', boxShadow: running ? 'var(--accent-glow)' : hovered ? 'var(--shadow-md)' : 'none', overflow:'hidden' }}
        onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>setHovered(false)}>
        {/* Priority stripe */}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background:PCOLOR[task.priority], borderRadius:'var(--r-md) 0 0 var(--r-md)' }} />
        <div style={{ padding:'16px 18px 16px 22px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={()=>setOpen(!open)}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <span style={{ fontSize:15, fontWeight:600, color:'var(--text-1)', lineHeight:1.3 }}>{task.title}</span>
                <span style={{ fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:'var(--r-full)', background:PTONE[task.priority], color:PFORE[task.priority], textTransform:'uppercase', letterSpacing:0.5, flexShrink:0 }}>{task.priority}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:6, fontSize:12, color:'var(--text-3)' }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:4 }}><Ico.Calendar size={12}/>{task.due}</span>
                <span style={{ fontFamily:'monospace', color:'var(--text-2)', fontWeight:600 }}>{task.logged}</span>
                <span>{task.status}</span>
              </div>
            </div>
            <button onClick={()=>onToggle(task.id)} title={running?'Stop timer':'Start timer'} style={{ width:36, height:36, borderRadius:'50%', border:'none', background: running ? 'rgba(239,68,68,0.15)' : 'var(--accent-wash)', color: running ? 'var(--danger)' : 'var(--accent)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all var(--dur-fast) ease' }}>
              {running ? <Ico.Stop size={14}/> : <Ico.Play size={14}/>}
            </button>
          </div>
          {/* Expanded details */}
          {open && (
            <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)', display:'flex', flexDirection:'column', gap:12, animation:'slide-down var(--dur-base) var(--ease-out) both' }}>
              {task.desc && <p style={{ fontSize:13, color:'var(--text-2)', lineHeight:1.6, background:'rgba(255,255,255,0.03)', padding:'10px 14px', borderRadius:'var(--r-sm)', margin:0 }}>{task.desc}</p>}
              {task.subs.length > 0 && (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:0.5 }}>Subtasks</span>
                  {task.subs.map((s,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, fontSize:13 }}>
                      <SubCheck done={s.done}/>
                      <span style={{ color:s.done?'var(--text-3)':'var(--text-2)', textDecoration:s.done?'line-through':'none' }}>{s.t}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function TasksScreen({ runningId, startedAt, onToggle }) {
    const runTask = TASKS.find(t=>t.id===runningId);
    return (
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
        {runningId && <TimerBar taskTitle={runTask?.title||''} startedAt={startedAt} onStop={()=>onToggle(null)} onDiscard={()=>onToggle(null)} />}
        <div style={{ flex:1, overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:22 }}>
          <header>
            <h1 style={{ fontFamily:'Neuton, serif', fontSize:28, fontWeight:700, color:'var(--text-1)', letterSpacing:'-0.5px', marginBottom:4 }}>Task Timer</h1>
            <p style={{ fontSize:14, color:'var(--text-2)' }}>Log focused time on the work that moves the needle.</p>
          </header>
          {/* Goals */}
          <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <span style={{ fontSize:14, fontWeight:600, color:'var(--text-1)', display:'flex', alignItems:'center', gap:8 }}><Ico.Target size={16} style={{color:'var(--accent)'}}/> Active Objectives</span>
              <button style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:'var(--r-full)', border:'1px solid var(--border-strong)', background:'transparent', color:'var(--accent)', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}><Ico.Plus size={12}/>Add</button>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 }}>
              {[['Ship v1.0','Launch on App Store','Jun 30'],['Read 12 books','7 of 12 done','Dec 31']].map(([t,d,w])=>(
                <div key={t} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'12px 14px' }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text-1)', marginBottom:4 }}>{t}</div>
                  <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:8 }}>{d}</div>
                  <div style={{ fontSize:11, fontWeight:600, color:'var(--text-3)' }}>Due {w}</div>
                </div>
              ))}
            </div>
          </div>
          <button style={{ alignSelf:'flex-start', display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', borderRadius:'var(--r-full)', border:'1px solid var(--border-strong)', background:'transparent', color:'var(--text-2)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all var(--dur-fast) ease' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.color='var(--accent)';}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border-strong)';e.currentTarget.style.color='var(--text-2)';}}>
            <Ico.Plus size={14}/>New Task
          </button>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {TASKS.map(t=><TaskCard key={t.id} task={t} running={runningId===t.id} onToggle={onToggle}/>)}
          </div>
        </div>
      </div>
    );
  }

  window.RTasksScreen = TasksScreen;
})();
