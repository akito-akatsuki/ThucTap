# 📦 Hệ Thống Quản Lý Kho Thông Minh

Đây là hệ thống **quản lý kho hiện đại** được xây dựng bằng **Next.js, Supabase và AI dự đoán**.
Ứng dụng giúp doanh nghiệp quản lý tồn kho, theo dõi sản phẩm theo thời gian thực và dự đoán nhu cầu bán hàng trong tương lai.

---

# 🚀 Tính Năng

## 📦 Quản Lý Sản Phẩm

- Thêm / Sửa / Xóa sản phẩm
- Theo dõi tồn kho theo thời gian thực
- Nhập kho và lưu lịch sử
- Cảnh báo khi tồn kho thấp

## 📊 Thống Kê Dashboard

- Tổng số sản phẩm
- Tổng số lượng tồn kho
- Trạng thái sản phẩm:
  - 🟢 Bình thường
  - 🟡 Sắp hết hàng
  - 🔴 Hết hàng

## 🤖 AI Dự Đoán

Hệ thống AI có thể:

- Dự đoán **nhu cầu bán hàng 7 ngày tới**
- Tính **trung bình số lượng bán mỗi ngày**
- Dự đoán **số ngày còn lại trước khi hết hàng**
- Hiển thị biểu đồ trực quan

## 📡 Cập Nhật Realtime

Sử dụng **Supabase Realtime**

Dashboard sẽ tự động cập nhật khi:

- Có thay đổi sản phẩm
- Có nhập kho
- Có giao dịch bán

## 🔐 Phân Quyền Người Dùng

| Role   | Quyền                                  |
| ------ | -------------------------------------- |
| Admin  | Toàn quyền (thêm / sửa / xóa sản phẩm) |
| Seller | Chỉ được nhập kho                      |

## 📷 Hệ Thống QR Code

Mỗi sản phẩm sẽ có:

- Barcode riêng
- QR code để quét
- Có thể chia sẻ QR cho nhân viên

## 📧 Gửi Email Tự Động

Khi thêm sản phẩm mới:

- Hệ thống sẽ tự động gửi **QR code tới email của Seller**

---

# 🛠 Công Nghệ Sử Dụng

### Frontend

- **Next.js 14 (App Router)**
- React
- Recharts (biểu đồ)
- React Hot Toast (thông báo)

### Backend

- **Supabase**
- PostgreSQL
- Supabase Realtime

### AI

- API dự đoán bán hàng

### Khác

- QR Code Generator
- Nodemailer (gửi email)

---

# ⚙️ Cài Đặt

Clone repository

```bash
git clone https://github.com/your-repo/inventory-system.git
cd inventory-system
```

Cài đặt thư viện

```bash
npm install
```

---

# 🔑 Cấu Hình Environment

Tạo file `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

# ▶️ Chạy Project

```bash
npm run dev
```

Mở trình duyệt tại:

```
http://localhost:3000
```

---

# 📂 Cấu Trúc Thư Mục

```
app/
 ├ api/
 │   ├ products/
 │   ├ import/
 │   ├ ai/
 │   └ users/
 │
 ├ dashboard/
 │   └ page.jsx
 │
components/
 ├ InputModal.jsx
 ├ ConfirmModal.jsx
 └ AIBot.jsx
```

---

# 📈 Biểu Đồ Dự Đoán AI

Hệ thống AI sẽ dự đoán **7 ngày bán hàng tiếp theo** dựa trên dữ liệu bán trước đó và hiển thị bằng biểu đồ tương tác.

---

# 🔄 Tồn Kho Realtime

Nhờ Supabase Realtime:

- Tồn kho cập nhật **ngay lập tức**
- Không cần refresh trang
- Dashboard luôn hiển thị dữ liệu mới nhất

---

# 🌐 Triển Khai

Cách dễ nhất để deploy project:

**Vercel**

```bash
vercel deploy
```

Project hoạt động tốt với:

- Vercel
- Supabase
- Node.js 18+

---

# 👨‍💻 Tác Giả

Developed by **Pham Hoan** **DangHieu** **QuangThien**

Internship Project – Smart Inventory System
