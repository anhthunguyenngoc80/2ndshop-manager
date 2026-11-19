const sod = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
const eod = (d) => { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
const p2 = (n) => String(n).padStart(2, '0')
const parse = (d) => new Date(typeof d === 'string' && d.length === 10 ? d + 'T00:00:00' : d)
export const toISODate = (d) => { const x = new Date(d); return `${x.getFullYear()}-${p2(x.getMonth() + 1)}-${p2(x.getDate())}` }
export const mondayOf = (d) => { const x = sod(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x }
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
export function getRange(key, custom = {}) {
  const now = new Date(), y = now.getFullYear(), m = now.getMonth()
  if (key === 'today') return { from: sod(now), to: eod(now) }
  if (key === '7d') return { from: sod(addDays(now, -6)), to: eod(now) }
  if (key === 'month') return { from: new Date(y, m, 1), to: eod(new Date(y, m + 1, 0)) }
  if (key === 'lastMonth') return { from: new Date(y, m - 1, 1), to: eod(new Date(y, m, 0)) }
  if (key === 'year') return { from: new Date(y, 0, 1), to: eod(new Date(y, 11, 31)) }
  return { from: sod(custom.from || now), to: eod(custom.to || now) }
}
export const inRange = (d, { from, to }) => { const t = parse(d); return t >= from && t <= to }
export function bucketKey(d, group) {
  const x = parse(d)
  if (group === 'week') return toISODate(mondayOf(x))
  if (group === 'month') return `${x.getFullYear()}-${p2(x.getMonth() + 1)}`
  if (group === 'year') return String(x.getFullYear())
  return toISODate(x)
}
