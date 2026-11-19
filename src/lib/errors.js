import { toast } from 'sonner'
export function handleError(e) { console.error(e); toast.error(e?.message || 'Đã xảy ra lỗi') }
/** Chạy một thao tác với thông báo thành công/lỗi tập trung. Trả về true nếu thành công. */
export async function run(fn, successMsg) {
  try { await fn(); if (successMsg) toast.success(successMsg); return true } catch (e) { handleError(e); return false }
}
