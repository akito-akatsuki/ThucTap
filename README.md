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
git clone https://github.com/akito-akatsuki/ThucTap
cd  folder name
```

Cài đặt thư viện

```bash
npm install
```

---

# 🔑 Cấu Hình Environment

Tạo file `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=xxxxxxxxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxxxxxxx

ZALO_ACCESS_TOKEN=xxxxx
ZALO_USER_ID=xxxxx

GROQ_API_KEY=xxxxxxxxx

EMAIL_USER=xxxxxxxxxx
EMAIL_PASS=xxxxxxxxxx

GOOGLE_CLIENT_ID=xxxxxxxxxx
GOOGLE_CLIENT_SECRET=xxxxxxxxxx
```

---

# ▶️ Chạy Project

```bash
npm run dev
```

Mở trình duyệt tại:

```
https://thuc-tap-cn.vercel.app
```

---

# 📂 Cấu Trúc Thư Mục

```
app/
│
├── api/                     # API routes (Next.js server functions)
│   ├── ai/                  # AI prediction API
│   ├── checkout/            # Checkout / bán hàng
│   ├── import/              # Nhập kho
│   ├── log/                 # Ghi log hoạt động
│   ├── low-stock/           # Kiểm tra tồn kho thấp
│   ├── products/            # CRUD sản phẩm
│   ├── scan/                # Quét barcode / QR
│   └── users/               # Lấy role và thông tin user
│
├── checkout/                # Trang bán hàng
├── dashboard/               # Trang dashboard quản lý kho
├── employees/               # Trang quản lý nhân viên
├── logs/                    # Trang xem lịch sử hoạt động
├── scan/                    # Trang quét QR / barcode
│
├── favicon.ico
├── globals.css
├── layout.tsx               # Layout toàn app
└── page.tsx                 # Trang Home
│
components/                  # React components
│
├── AIBot.js                 # Chatbot AI hỗ trợ
├── ConfirmModal.jsx         # Modal xác nhận (delete)
├── InputModal.jsx           # Modal nhập dữ liệu (edit / import)
├── Navbar.js                # Thanh điều hướng
├── SaleChart.js             # Biểu đồ doanh số
└── Scanner.js               # Component quét QR / barcode
│
lib/
└── supabase.js              # Cấu hình Supabase client
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
- Node.js version 18+

---

# 👨‍💻 Tác Giả

Developed by **Pham Hoan** **QuangThien**

Internship Project – Smart Inventory System
