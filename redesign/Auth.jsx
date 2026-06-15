// Auth + Onboarding screens
(function () {

  function AuthScreen({ onEnter }) {
    const [stage, setStage] = React.useState('email');
    const [email, setEmail] = React.useState('');
    const [code, setCode] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    const handleSend = (e) => {
      e.preventDefault();
      setLoading(true);
      setTimeout(() => { setLoading(false); setStage('otp'); }, 800);
    };
    const handleVerify = (e) => {
      e.preventDefault();
      setLoading(true);
      setTimeout(() => { setLoading(false); onEnter(); }, 700);
    };

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)', padding: 24, position: 'relative', overflow: 'hidden',
      }}>
        {/* Ambient glow orbs — behind content */}
        <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', top:'10%', left:'20%', pointerEvents:'none', zIndex:0 }} />
        <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)', bottom:'15%', right:'15%', pointerEvents:'none', zIndex:0 }} />

        <div style={{ width:'100%', maxWidth:420, animation:'fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both', position:'relative', zIndex:1 }}>
          {/* Logo */}
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{
              display:'inline-flex', alignItems:'center', justifyContent:'center',
              width:64, height:64, borderRadius:'var(--r-lg)', background:'var(--accent)',
              boxShadow:'var(--accent-glow)', marginBottom:20,
            }}>
              <Ico.Compass size={30} style={{ color:'#fff' }} />
            </div>
            <h1 style={{ fontFamily:'Neuton, serif', fontSize:36, fontWeight:700, color:'var(--text-1)', letterSpacing:'-1px', marginBottom:8 }}>Goal Tracker</h1>
            <p style={{ fontSize:14, color:'var(--text-2)', lineHeight:1.5 }}>Track habits, log time, reach your goals.</p>
          </div>

          {/* Form */}
          <div style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'var(--r-lg)', padding:32 }}>
            {stage === 'email' ? (
              <form onSubmit={handleSend} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.6px' }}>Email</label>
                  <input type="email" required placeholder="you@example.com" value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{ padding:'12px 14px', borderRadius:'var(--r-sm)', border:'1px solid var(--border-strong)', background:'var(--bg-input)', color:'var(--text-1)', fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color var(--dur-fast) ease' }}
                    onFocus={e => e.target.style.borderColor='var(--accent)'}
                    onBlur={e => e.target.style.borderColor='var(--border-strong)'}
                  />
                </div>
                <button type="submit" disabled={loading} style={{
                  padding:'13px', borderRadius:'var(--r-sm)', border:'none', background:'var(--accent)',
                  color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
                  opacity: loading ? 0.7 : 1, transition:'opacity var(--dur-fast) ease, transform 0.1s ease',
                }}
                  onMouseDown={e => { e.currentTarget.style.transform='scale(0.98)'; }}
                  onMouseUp={e => { e.currentTarget.style.transform='scale(1)'; }}
                >{loading ? 'Sending…' : 'Send Code'}</button>
                <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text-3)', fontSize:12 }}>
                  <div style={{ flex:1, height:1, background:'var(--border)' }} /><span>or</span><div style={{ flex:1, height:1, background:'var(--border)' }} />
                </div>
                <button type="button" onClick={onEnter} style={{ padding:'12px', borderRadius:'var(--r-sm)', border:'1px solid var(--border-strong)', background:'transparent', color:'var(--text-2)', fontSize:14, fontWeight:500, cursor:'pointer', fontFamily:'inherit' }}>
                  Continue as Guest
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerify} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div style={{ padding:'12px 14px', borderRadius:'var(--r-sm)', background:'var(--accent-wash)', border:'1px solid rgba(124,58,237,0.25)', fontSize:13, color:'var(--accent-text)' }}>
                  Code sent to {email || 'your email'}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  <label style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'0.6px' }}>6-Digit Code</label>
                  <input type="text" placeholder="123456" maxLength={6} value={code}
                    onChange={e => setCode(e.target.value)} autoFocus
                    style={{ padding:'12px 14px', borderRadius:'var(--r-sm)', border:'1px solid var(--border-strong)', background:'var(--bg-input)', color:'var(--text-1)', fontSize:22, fontFamily:'monospace', fontWeight:700, letterSpacing:'8px', textAlign:'center', outline:'none', transition:'border-color var(--dur-fast) ease' }}
                    onFocus={e => e.target.style.borderColor='var(--accent)'}
                    onBlur={e => e.target.style.borderColor='var(--border-strong)'}
                  />
                </div>
                <button type="submit" disabled={loading} style={{ padding:'13px', borderRadius:'var(--r-sm)', border:'none', background:'var(--accent)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', opacity: loading ? 0.7 : 1 }}>
                  {loading ? 'Verifying…' : 'Verify & Enter'}
                </button>
                <button type="button" onClick={() => setStage('email')} style={{ background:'none', border:'none', color:'var(--text-3)', cursor:'pointer', fontSize:13, fontFamily:'inherit' }}>← Back</button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  function OnboardingScreen({ onComplete }) {
    const [step, setStep] = React.useState(0);
    const [name, setName] = React.useState('');
    const [focuses, setFocuses] = React.useState([]);
    const opts = [
      { id:'habits', icon:'CheckSquare', label:'Build habits', sub:'Track daily routines' },
      { id:'time', icon:'Clock', label:'Log time', sub:'Focus session tracker' },
      { id:'goals', icon:'Target', label:'Reach goals', sub:'Objectives & milestones' },
    ];
    const toggle = (id) => setFocuses(f => f.includes(id) ? f.filter(x=>x!==id) : [...f,id]);

    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-base)', padding:24 }}>
        <div style={{ width:'100%', maxWidth:480, animation:'fade-up var(--dur-base) var(--ease-out) both' }}>
          {/* Progress */}
          <div style={{ display:'flex', gap:6, marginBottom:32, justifyContent:'center' }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ height:3, borderRadius:9999, background: i <= step ? 'var(--accent)' : 'var(--border-strong)', flex: i === step ? 2 : 1, transition:'all var(--dur-base) var(--ease-out)' }} />
            ))}
          </div>

          {step === 0 && (
            <div style={{ textAlign:'center', display:'flex', flexDirection:'column', gap:24, animation:'fade-up var(--dur-base) var(--ease-out) both' }}>
              <div>
                <h2 style={{ fontFamily:'Neuton, serif', fontSize:32, fontWeight:700, color:'var(--text-1)', marginBottom:10 }}>Welcome aboard</h2>
                <p style={{ color:'var(--text-2)', fontSize:15 }}>What's your name?</p>
              </div>
              <input type="text" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} autoFocus
                style={{ padding:'14px 18px', borderRadius:'var(--r-md)', border:'1px solid var(--border-strong)', background:'var(--bg-input)', color:'var(--text-1)', fontSize:18, fontFamily:'Neuton, serif', fontWeight:400, outline:'none', textAlign:'center', transition:'border-color var(--dur-fast) ease' }}
                onFocus={e=>e.target.style.borderColor='var(--accent)'}
                onBlur={e=>e.target.style.borderColor='var(--border-strong)'}
              />
              <button onClick={()=>setStep(1)} disabled={!name.trim()} style={{ padding:'14px', borderRadius:'var(--r-sm)', border:'none', background:'var(--accent)', color:'#fff', fontSize:15, fontWeight:600, cursor: name.trim()?'pointer':'not-allowed', opacity:name.trim()?1:0.5, fontFamily:'inherit' }}>Continue →</button>
            </div>
          )}

          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:24, animation:'fade-up var(--dur-base) var(--ease-out) both' }}>
              <div style={{ textAlign:'center' }}>
                <h2 style={{ fontFamily:'Neuton, serif', fontSize:30, fontWeight:700, color:'var(--text-1)', marginBottom:8 }}>What brings you here?</h2>
                <p style={{ color:'var(--text-2)', fontSize:14 }}>Pick everything that applies</p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {opts.map(o => {
                  const OIco = Ico[o.icon];
                  const active = focuses.includes(o.id);
                  return (
                    <button key={o.id} onClick={() => toggle(o.id)} style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', borderRadius:'var(--r-md)', border:`1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'var(--accent-wash)' : 'var(--bg-card)', color:'var(--text-1)', cursor:'pointer', fontFamily:'inherit', transition:'all var(--dur-fast) var(--ease-smooth)', textAlign:'left' }}>
                      <div style={{ width:40, height:40, borderRadius:'var(--r-sm)', background: active ? 'var(--accent)' : 'var(--bg-input)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color: active ? '#fff' : 'var(--text-2)', transition:'all var(--dur-fast) ease' }}>
                        <OIco size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:15 }}>{o.label}</div>
                        <div style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>{o.sub}</div>
                      </div>
                      {active && <Ico.Check size={18} style={{ color:'var(--accent)', marginLeft:'auto', flexShrink:0 }} />}
                    </button>
                  );
                })}
              </div>
              <button onClick={()=>setStep(2)} disabled={focuses.length===0} style={{ padding:'14px', borderRadius:'var(--r-sm)', border:'none', background:'var(--accent)', color:'#fff', fontSize:15, fontWeight:600, cursor:focuses.length?'pointer':'not-allowed', opacity:focuses.length?1:0.5, fontFamily:'inherit' }}>Continue →</button>
            </div>
          )}

          {step === 2 && (
            <div style={{ textAlign:'center', display:'flex', flexDirection:'column', gap:28, animation:'fade-up var(--dur-base) var(--ease-out) both' }}>
              <div style={{ width:72, height:72, borderRadius:'50%', background:'var(--accent)', boxShadow:'var(--accent-glow)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto' }}>
                <Ico.Zap size={32} style={{ color:'#fff' }} />
              </div>
              <div>
                <h2 style={{ fontFamily:'Neuton, serif', fontSize:32, fontWeight:700, color:'var(--text-1)', marginBottom:10 }}>You're all set, {name}.</h2>
                <p style={{ color:'var(--text-2)', fontSize:15, lineHeight:1.6 }}>Your dashboard is ready. Start building streaks, one day at a time.</p>
              </div>
              <button onClick={onComplete} style={{ padding:'15px', borderRadius:'var(--r-sm)', border:'none', background:'var(--accent)', color:'#fff', fontSize:15, fontWeight:600, cursor:'pointer', fontFamily:'inherit', boxShadow:'var(--accent-glow)' }}>
                Open Dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  window.RAuthScreen = AuthScreen;
  window.ROnboardingScreen = OnboardingScreen;
})();
