import { useEffect, useState } from 'react';
import { Users, Copy, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import {
  createPairing, joinPairing, pollPairing, consumePairing,
} from '@/services/pairing/PairingService';
import type { DeviceRole } from '@/types';

type Mode = 'parent' | 'child';

export default function PairingScreen({ onDone }: { onDone: () => void }) {
  const { deviceId, role, setPairing } = useAppStore();
  const [mode, setMode] = useState<Mode>(role === 'parent' ? 'parent' : 'child');
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'waiting' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  // Parent: create code and poll
  useEffect(() => {
    if (mode !== 'parent' || !deviceId || code) return;
    (async () => {
      try {
        const s = await createPairing(deviceId, role as DeviceRole);
        setCode(s.code);
        setStatus('waiting');
      } catch (e: any) {
        setStatus('error');
        setMsg(e.message ?? 'فشل الإنشاء');
      }
    })();
  }, [mode, deviceId, role, code]);

  // Parent: poll for child joining
  useEffect(() => {
    if (mode !== 'parent' || !code || status !== 'waiting') return;
    const id = setInterval(async () => {
      const r = await pollPairing(code);
      if (r.peerDeviceId && r.peerPublicKey) {
        setPairing({ peerDeviceId: r.peerDeviceId, peerPublicKey: r.peerPublicKey });
        await consumePairing(code);
        setStatus('ok');
        clearInterval(id);
        setTimeout(onDone, 1200);
      }
    }, 2500);
    return () => clearInterval(id);
  }, [mode, code, status, setPairing, onDone]);

  const handleJoin = async () => {
    if (!deviceId || input.length !== 6) return;
    try {
      setStatus('waiting');
      const s = await joinPairing(input, deviceId, role === 'vehicle' ? 'vehicle' : 'child');
      if (s.peerDeviceId && s.peerPublicKey) {
        setPairing({ peerDeviceId: s.peerDeviceId, peerPublicKey: s.peerPublicKey });
        setStatus('ok');
        setTimeout(onDone, 1000);
      } else {
        throw new Error('لم يتم العثور على معلومات الوالد');
      }
    } catch (e: any) {
      setStatus('error');
      setMsg(e.message ?? 'فشل الاقتران');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface-dark">
      <div className="glass rounded-3xl p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <h2 className="font-bold">اقتران الأجهزة</h2>
            <p className="text-[11px] text-slate-500">ربط آمن ومشفر</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6 p-1 rounded-xl bg-white/5">
          <button
            onClick={() => { setMode('parent'); setCode(''); setStatus('idle'); }}
            className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'parent' ? 'bg-primary-600 text-white' : 'text-slate-400'
            }`}
          >
            أنا الوالد
          </button>
          <button
            onClick={() => { setMode('child'); setInput(''); setStatus('idle'); }}
            className={`py-2.5 rounded-lg text-sm font-medium transition-all ${
              mode === 'child' ? 'bg-primary-600 text-white' : 'text-slate-400'
            }`}
          >
            أنا الطفل
          </button>
        </div>

        {mode === 'parent' && (
          <>
            <p className="text-sm text-slate-400 mb-3 text-center">
              أعطِ هذا الرمز لطفلك
            </p>
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-center mb-4">
              <div className="text-4xl font-black tracking-[0.4em] font-mono">
                {code || '••••••'}
              </div>
            </div>
            <button
              onClick={() => code && navigator.clipboard.writeText(code)}
              className="btn-ghost w-full flex items-center justify-center gap-2 mb-4"
            >
              <Copy size={16} /> نسخ الرمز
            </button>

            {status === 'waiting' && (
              <div className="flex items-center justify-center gap-2 text-sm text-primary-400">
                <RefreshCw size={14} className="animate-spin" />
                في انتظار انضمام الطفل...
              </div>
            )}
          </>
        )}

        {mode === 'child' && (
          <>
            <p className="text-sm text-slate-400 mb-3 text-center">
              أدخل الرمز الذي أعطاك إياه والدك
            </p>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-center text-3xl font-mono tracking-[0.3em] mb-4 focus:outline-none focus:border-primary-500"
            />
            <button
              onClick={handleJoin}
              disabled={input.length !== 6}
              className="btn-primary w-full disabled:opacity-40"
            >
              اقتران
            </button>
          </>
        )}

        {status === 'ok' && (
          <div className="mt-4 p-3 rounded-xl bg-success-500/10 border border-success-500/30 flex items-center gap-2 text-sm text-success-400">
            <CheckCircle2 size={16} /> تم الاقتران بنجاح
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4 p-3 rounded-xl bg-danger-500/10 border border-danger-500/30 flex items-center gap-2 text-sm text-danger-400">
            <AlertCircle size={16} /> {msg}
          </div>
        )}

        <div className="mt-6 text-[10px] text-slate-500 text-center leading-relaxed">
          الاقتران يستخدم تشفير X25519. المفاتيح الخاصة لا تترك الجهاز أبداً.
        </div>
      </div>
    </div>
  );
}
