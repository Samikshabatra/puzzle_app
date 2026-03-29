import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Zap } from 'lucide-react';
import { UserSession } from '../types';

interface Props { onLogin: (s: UserSession) => void; }

const COLORS = ['#2563EB', '#7C3AED', '#E11D48', '#059669', '#D97706', '#0891B2'];

function uid() { return `user_${Math.random().toString(36).slice(2, 10)}`; }

type Tab = 'login' | 'signup';

const BluestockLogo = () => (
  <svg viewBox="0 0 400 320" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="200" width="45" height="100" rx="15" fill="#5E35B1" transform="skewX(-10)" />
    <rect x="85" y="140" width="55" height="160" rx="20" fill="#673AB7" transform="skewX(-10)" />
    <rect x="160" y="80" width="65" height="220" rx="25" fill="#7E57C2" transform="skewX(-10)" />
    <path d="M40 280 Q 200 240 320 80" stroke="white" strokeWidth="4" strokeLinecap="round" />
    <circle cx="320" cy="80" r="15" fill="#F05537" />
    <circle cx="320" cy="80" r="25" fill="#F05537" fillOpacity="0.2" />
  </svg>
);

export default function LoginScreen({ onLogin }: Props) {
  const [tab,     setTab]     = useState<Tab>('login');
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [color,   setColor]   = useState(COLORS[0]);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const strength = pw.length === 0 ? 0 : pw.length < 6 ? 1 : pw.length < 10 ? 2 : 3;
  const sColors  = ['', '#E11D48', '#D97706', '#059669'];
  const sLabels  = ['', 'Weak', 'Decent', 'Strong'];

  const field = 'w-full bg-white border border-brand-soft rounded-xl px-4 py-3 text-sm text-brand-deep placeholder-brand-deep/30 focus:outline-none focus:border-brand-primary/60 transition-colors';

  const handleGuest = () =>
    onLogin({ userId: uid(), displayName: `Neural_${Math.random().toString(36).slice(2,6).toUpperCase()}`, email: '', isGuest: true, avatarColor: COLORS[Math.floor(Math.random()*COLORS.length)] });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 350));

    if (tab === 'signup') {
      if (!name.trim())         { setError('Display name required'); setLoading(false); return; }
      if (!email.includes('@')) { setError('Valid email required');  setLoading(false); return; }
      if (pw.length < 6)        { setError('Min 6 characters');      setLoading(false); return; }
      if (pw !== confirm)       { setError('Passwords do not match'); setLoading(false); return; }
      const session: UserSession = { userId: uid(), displayName: name.trim(), email, isGuest: false, avatarColor: color };
      localStorage.setItem(`bs_${email}`, JSON.stringify(session));
      onLogin(session);
    } else {
      if (!email || !pw) { setError('Fill in all fields'); setLoading(false); return; }
      const saved = localStorage.getItem(`bs_${email}`);
      if (!saved) { setError('No account found — sign up first'); setLoading(false); return; }
      onLogin(JSON.parse(saved));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-brand-primary/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-brand-secondary/5 blur-[80px] rounded-full pointer-events-none" />

      <motion.div initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5, ease:[0.16,1,0.3,1] }} className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BluestockLogo />
            <div>
              <p className="text-xl font-black tracking-tighter text-brand-deep">BLUESTOCK</p>
              <p className="text-[10px] text-brand-deep/40 font-bold tracking-widest uppercase">.in</p>
            </div>
          </div>
          <p className="text-brand-deep/50 text-xs mt-2 font-medium">Daily Neural Puzzle Platform</p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white rounded-2xl p-1 mb-5 border border-brand-soft shadow-premium">
          {(['login','signup'] as Tab[]).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${tab===t ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-deep/40 hover:text-brand-deep'}`}>
              {t === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <AnimatePresence mode="wait">
          <motion.form key={tab} initial={{ opacity:0, x: tab==='login'?-12:12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}
            onSubmit={handleSubmit} className="space-y-3">

            {tab === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/30" />
                <input type="text" placeholder="Display name" value={name} onChange={e=>setName(e.target.value)} className={`${field} pl-9`} />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/30" />
              <input type="email" placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} className={`${field} pl-9`} />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/30" />
              <input type={showPw?'text':'password'} placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)} className={`${field} pl-9 pr-10`} />
              <button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-deep/30 hover:text-brand-deep/60">
                {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>

            {tab==='signup' && pw.length>0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1,2,3].map(i=>(
                    <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" style={{ background: i<=strength ? sColors[strength] : '#E2E8F0' }} />
                  ))}
                </div>
                <p className="text-[11px] font-semibold" style={{ color: sColors[strength] }}>{sLabels[strength]}</p>
              </div>
            )}

            {tab === 'signup' && (
              <>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-deep/30" />
                  <input type="password" placeholder="Confirm password" value={confirm} onChange={e=>setConfirm(e.target.value)} className={`${field} pl-9`} />
                </div>
                <div>
                  <p className="text-[10px] text-brand-deep/40 font-bold uppercase tracking-widest mb-2">Avatar Colour</p>
                  <div className="flex gap-2">
                    {COLORS.map(c=>(
                      <button key={c} type="button" onClick={()=>setColor(c)}
                        className="w-7 h-7 rounded-full border-2 transition-all duration-150"
                        style={{ background:c, borderColor: color===c ? '#090E17':'transparent', transform: color===c?'scale(1.25)':'scale(1)' }} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {error && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-brand-accent text-xs font-semibold px-1">{error}</motion.p>}

            <motion.button type="submit" disabled={loading} whileTap={{scale:0.97}}
              className="w-full bg-brand-primary text-white font-black text-xs uppercase tracking-widest rounded-xl py-3.5 flex items-center justify-center gap-2 shadow-glass disabled:opacity-50 mt-1">
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <>{tab==='login'?'Enter the Matrix':'Create Account'}<ArrowRight className="w-4 h-4"/></>}
            </motion.button>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-brand-soft" />
          <span className="text-brand-deep/30 text-xs font-bold">or</span>
          <div className="flex-1 h-px bg-brand-soft" />
        </div>

        <motion.button whileTap={{scale:0.97}} onClick={handleGuest}
          className="w-full border border-brand-soft bg-white text-brand-deep font-bold text-xs uppercase tracking-widest rounded-xl py-3.5 flex items-center justify-center gap-2 hover:border-brand-primary/40 transition-colors shadow-premium">
          <Zap className="w-4 h-4 text-brand-primary"/>
          Play as Guest
        </motion.button>

        <p className="text-center text-brand-deep/30 text-[11px] mt-5">Guest progress is saved locally only</p>
      </motion.div>
    </div>
  );
}
