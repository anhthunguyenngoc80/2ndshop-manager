# Shop Manager – Quản lý sản phẩm, đơn hàng, thống kê

React + Vite (JavaScript) · Tailwind CSS · React Router · Recharts · Supabase (Postgres, Auth, Storage, RLS).

## 1. Cài đặt
```bash
npm install
cp .env.example .env      # điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm run dev
```

## 2. Thiết lập Supabase
1. Tạo project tại supabase.com.
2. **Storage**: tạo bucket `product-media` (chọn *Public*).
3. **SQL Editor**: chạy toàn bộ `supabase/schema.sql` (bảng, RLS, trigger tồn kho, policy Storage).
4. **Authentication**: bật Email. Khi thử nghiệm có thể tắt "Confirm email".
5. Lấy URL và anon key ở *Project Settings → API* và điền vào `.env`.

## 3. Triển khai
- **Vercel**: import repo, thêm 2 biến môi trường, Build `npm run build`, Output `dist` (đã có `vercel.json`).
- **Netlify**: tương tự (đã có `public/_redirects`).

## 4. Kiến trúc
`Page → features/hooks → services (nghiệp vụ) → repositories (Supabase)`
- `src/repositories`: chỉ truy vấn dữ liệu. `src/services`: nghiệp vụ (tổng tiền, trạng thái thanh toán, thống kê – `statsService.computeStats` là hàm thuần).
- `src/lib/errors.js`: xử lý lỗi/thông báo tập trung. `src/utils/constants.js`: nhãn trạng thái, danh mục mặc định.

## 5. Quy tắc nghiệp vụ
- Tạo đơn **không** đổi trạng thái sản phẩm. Khi đơn chuyển sang *Đã giao*, trigger trừ kho đúng 1 lần (`orders.inventory_applied`); hết hàng thì sản phẩm thành *Đã bán*.
- *Hoàn hàng / Hủy* sau khi đã giao sẽ cộng lại kho. Đơn đã giao chỉ chuyển được sang *Hoàn hàng*.
- Giá bán và giá vốn được lưu vào `order_items` tại thời điểm tạo đơn.
- Doanh thu thực tế tính theo đơn *Đã giao* (theo `delivered_at`). Lợi nhuận thực tế = doanh thu − giá vốn hàng đã bán − chi phí vận hành đã phát sinh. Khoản chi loại **"Giá nhập"** chỉ để theo dõi tiền nhập hàng, không trừ lần nữa vào lợi nhuận.
- Chi phí có 2 trạng thái: *Đã phát sinh* và *Dự kiến* (dự kiến chỉ dùng cho lợi nhuận dự kiến).

## 6. Ghi chú
- UI viết bằng Tailwind theo phong cách shadcn/ui (Button, Modal, Badge… ở `src/components/ui.jsx`). Có thể chạy `npx shadcn@latest init` để thay thế bằng bản chính thức.
- Hộp thoại xác nhận xóa dùng `confirmDelete` (`src/utils/format.js`), dễ thay bằng AlertDialog.
