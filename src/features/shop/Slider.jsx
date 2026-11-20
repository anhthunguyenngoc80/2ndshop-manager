import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
export default function Slider({ slides, onOpen }) {
  const [i, setI] = useState(0), [paused, setPaused] = useState(false), startX = useRef(0)
  const n = slides.length
  useEffect(() => { if (n < 2 || paused) return; const t = setInterval(() => setI((x) => (x + 1) % n), 3500); return () => clearInterval(t) }, [n, paused])
  useEffect(() => { if (i >= n) setI(0) }, [n, i])
  if (!n) return null
  const go = (d) => setI((x) => (x + d + n) % n)
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-200" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { startX.current = e.touches[0].clientX }} onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - startX.current; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1) }}>
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s) => (
          <button key={s.id} className="relative aspect-[4/3] w-full shrink-0 md:aspect-[16/7]" onClick={() => onOpen(s.id)}>
            <img src={s.image} alt={s.name} className="h-full w-full object-cover" />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-left text-sm font-medium text-white">{s.name}</span>
          </button>))}
      </div>
      {n > 1 && <>
        <button aria-label="Trước" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1" onClick={() => go(-1)}><ChevronLeft /></button>
        <button aria-label="Sau" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1" onClick={() => go(1)}><ChevronRight /></button>
        <div className="absolute bottom-2 right-3 flex gap-1">{slides.map((s, k) => <span key={s.id} className={`h-1.5 w-1.5 rounded-full ${k === i ? 'bg-white' : 'bg-white/50'}`} />)}</div>
      </>}
    </div>
  )
}
