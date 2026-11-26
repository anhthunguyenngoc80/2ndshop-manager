import { useEffect, useRef, useState } from 'react'
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'

const MIN = 1, MAX = 5
const clamp = (s) => Math.min(MAX, Math.max(MIN, s))

/** Xem ảnh toàn màn hình: phóng to/thu nhỏ bằng nút, cuộn chuột, chụm 2 ngón, nhấp đúp; kéo để di chuyển khi đã phóng. */
export default function ImageViewer({ items, index, onChange, onClose }) {
  const [scale, setScale] = useState(1), [pos, setPos] = useState({ x: 0, y: 0 })
  const pointers = useRef(new Map()), lastDist = useRef(0), lastPos = useRef({ x: 0, y: 0 })
  const item = items[index], n = items.length, isImage = item?.type !== 'video'

  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }) }
  const zoom = (d) => { const s = clamp(scale + d); setScale(s); if (s === MIN) setPos({ x: 0, y: 0 }) }
  const go = (d) => onChange((index + d + n) % n)

  useEffect(reset, [index])
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft' && n > 1) go(-1)
      else if (e.key === 'ArrowRight' && n > 1) go(1)
      else if (e.key === '+' || e.key === '=') zoom(0.5)
      else if (e.key === '-') zoom(-0.5)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const dist = () => { const [a, b] = [...pointers.current.values()]; return Math.hypot(a.x - b.x, a.y - b.y) }
  const down = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    lastPos.current = { x: e.clientX, y: e.clientY }
    if (pointers.current.size === 2) lastDist.current = dist()
  }
  const move = (e) => {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 2) {
      const d = dist(); const ratio = d / (lastDist.current || d); lastDist.current = d
      setScale((s) => clamp(s * ratio))
    } else if (scale > 1) {
      const dx = e.clientX - lastPos.current.x, dy = e.clientY - lastPos.current.y
      lastPos.current = { x: e.clientX, y: e.clientY }
      setPos((p) => ({ x: p.x + dx, y: p.y + dy }))
    }
  }
  const up = (e) => { pointers.current.delete(e.pointerId); if (scale <= 1) setPos({ x: 0, y: 0 }) }

  if (!item) return null
  const btn = 'rounded-full bg-white/15 p-2 text-white hover:bg-white/30'
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/95">
      <div className="flex items-center justify-between p-3 text-white">
        <span className="text-sm">{n > 1 ? `${index + 1} / ${n}` : ''}</span>
        <button className={btn} onClick={onClose} aria-label="Đóng"><X size={20} /></button>
      </div>
      <div className="relative flex-1 overflow-hidden" style={{ touchAction: 'none' }}
        onPointerDown={isImage ? down : undefined} onPointerMove={isImage ? move : undefined} onPointerUp={up} onPointerCancel={up}
        onWheel={isImage ? (e) => zoom(e.deltaY < 0 ? 0.4 : -0.4) : undefined} onDoubleClick={isImage ? () => (scale > 1 ? reset() : setScale(2.5)) : undefined}>
        <div className="flex h-full w-full items-center justify-center">
          {isImage
            ? <img src={item.url} alt="" draggable={false} className="max-h-full max-w-full select-none object-contain" style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`, cursor: scale > 1 ? 'grab' : 'zoom-in' }} />
            : <video src={item.url} controls autoPlay className="max-h-full max-w-full" />}
        </div>
        {n > 1 && <>
          <button className={`${btn} absolute left-3 top-1/2 -translate-y-1/2`} onClick={() => go(-1)} aria-label="Trước"><ChevronLeft /></button>
          <button className={`${btn} absolute right-3 top-1/2 -translate-y-1/2`} onClick={() => go(1)} aria-label="Sau"><ChevronRight /></button>
        </>}
      </div>
      {isImage && (
        <div className="flex items-center justify-center gap-3 p-3 text-white">
          <button className={btn} onClick={() => zoom(-0.5)} disabled={scale <= MIN} aria-label="Thu nhỏ"><ZoomOut size={20} /></button>
          <span className="w-12 text-center text-sm">{Math.round(scale * 100)}%</span>
          <button className={btn} onClick={() => zoom(0.5)} disabled={scale >= MAX} aria-label="Phóng to"><ZoomIn size={20} /></button>
          <button className={btn} onClick={reset} aria-label="Đặt lại"><RotateCcw size={20} /></button>
        </div>)}
    </div>
  )
}
