# 🎮 CỜ CARO (GOMOKU) - SOCKET ONLINE & GITHUB PAGES

> Trò chơi Cờ Caro 15×15 hoàn chỉnh, hiện đại, hỗ trợ chơi 2 người trên cùng thiết bị, đấu với máy (AI) 3 cấp độ, và **chơi Online qua mạng thời gian thực (Socket P2P)** hoạt động trực tiếp trên **GitHub Pages**.

---

## 🌟 1. Tính năng nổi bật

- ✅ **Chuẩn Gomoku 15×15**: Luật 5 quân liên tiếp (ngang, dọc, chéo chính `\`, chéo phụ `/`).
- ✅ **Kiểm tra thắng/thua/hòa tuyệt đối chính xác**: Kiểm tra đầy đủ 4 hướng, góc bàn cờ và biên.
- ✅ **Chơi Online thời gian thực (Socket P2P)**:
  - Tạo phòng & Nhập mã phòng nhanh (`CARO-XXXX`).
  - Sử dụng WebRTC Data Socket (PeerJS) & BroadcastChannel — **hoạt động ngay trên GitHub Pages mà không cần thuê máy chủ backend!**
  - Đồng bộ nước đi, yêu cầu chơi lại và khung chat trực tiếp giữa 2 người chơi.
- ✅ **Chơi với Máy (AI)** với 3 cấp độ:
  - *Dễ*: Đánh ngẫu nhiên quanh các vị trí có sẵn.
  - *Trung bình*: Tấn công và chặn nước thắng của người chơi.
  - *Khó*: Áp dụng đánh giá hàm lượng giá (Heuristic Evaluation & Threat Assessment), phát hiện chuỗi đe dọa 4 hở 2 đầu.
- ✅ **Hiệu ứng đồ họa mượt mà**:
  - Xuất hiện quân với animation Pop nhẹ (`scale 0 → 1`).
  - Vòng phát sáng đánh dấu nước đi gần nhất.
  - Nhấp nháy chuỗi 5 quân chiến thắng.
  - Ghost preview quân cờ khi hover chuột.
- ✅ **Hệ thống âm thanh Web Audio API**: Tự tạo âm thanh gõ cờ, chiến thắng, hòa và click nút trực tiếp trong trình duyệt — 100% không lo lỗi file âm thanh hay CORS.
- ✅ **Đầy đủ Dark Mode / Light Mode**: Tự động lưu cấu hình và thống kê tỉ số vào `localStorage`.
- ✅ **Hoàn tác (Undo)**, **Chơi lại (Replay)**, **Chơi mới (New Game)** có hộp thoại xác nhận.
- ✅ **Responsive hoàn hảo**: Chơi tốt trên PC, Laptop, Tablet và Smartphone (cảm ứng).

---

## 📁 2. Cấu trúc thư mục dự án

```text
Caro-Socket-Game/
├── index.html              # Trang chủ giao diện game (chuẩn bị sẵn cho GitHub Pages)
├── README.md               # Tài liệu hướng dẫn chi tiết
│
├── .github/
│   └── workflows/
│       └── deploy.yml      # Tự động deploy lên GitHub Pages khi push code
│
├── css/
│   ├── style.css           # Hệ màu, biến CSS, bàn cờ, quân cờ, modals, animation
│   └── responsive.css      # Tối ưu giao diện cho màn hình di động, máy tính bảng
│
├── js/
│   ├── rules.js            # Kiểm tra luật 4 hướng, độ dài thắng, phát hiện hòa
│   ├── game.js             # Game Engine (State Machine, Undo, Snapshot độc lập với UI)
│   ├── board.js            # Renderer bàn cờ, bắt sự kiện click, ghost preview
│   ├── ai.js               # Động cơ AI (Dễ, Vừa, Khó)
│   ├── sound.js            # Trình phát âm thanh Web Audio API
│   ├── storage.js          # Quản lý LocalStorage (cài đặt, theme, lịch sử tỉ số)
│   ├── socket.js           # Quản lý kết nối Socket P2P / WebRTC cho GitHub Pages
│   ├── ui.js               # Điều khiển Modal, Banner thông báo, Toast, Thẻ lượt
│   └── main.js             # Bootstrap kết nối toàn bộ module
│
└── server/                 # (Tùy chọn) Server WebSocket cho ai muốn tự chạy backend
    ├── server.js           # Server WebSocket Node.js
    └── package.json
```

---

## 🚀 3. Hướng dẫn đưa game lên GitHub & Bật GitHub Pages

### Cách 1: Tải trực tiếp qua trình duyệt web (Dễ nhất, không cần cài phần mềm)
1. Truy cập [github.com](https://github.com/) và đăng nhập tài khoản của bạn.
2. Bấm vào nút **"New"** (hoặc dấu `+` ở góc trên bên phải) để tạo một Repository mới (ví dụ đặt tên là `co-caro`).
3. Chọn chế độ **Public** rồi nhấn **"Create repository"**.
4. Trên trang vừa tạo, nhấn vào liên kết **"uploading an existing file"**.
5. Kéo thả toàn bộ các file và thư mục trong thư mục `Caro-Socket-Game` vào trình duyệt.
6. Nhấn **"Commit changes"**.
7. **Bật GitHub Pages để chơi online**:
   - Vào tab **Settings** của repository -> Chọn mục **Pages** ở thanh bên trái.
   - Tại mục **Build and deployment** -> **Branch**: Chọn `main` (hoặc `master`) và thư mục `/(root)` -> Nhấn **Save**.
   - Chờ khoảng 1-2 phút, GitHub sẽ cung cấp cho bạn một đường link trang web dạng:
     `https://<ten-tai-khoan>.github.io/<ten-repo>/`
   - Bạn có thể gửi link này cho bạn bè trên toàn thế giới cùng vào chơi!

### Cách 2: Sử dụng Git Command Line (Nếu máy đã cài Git)
```bash
cd c:/Users/Acer/Pictures/Screenshots/Caro-Socket-Game
git init
git add .
git commit -m "Khoi tao game Co Caro Socket tren GitHub Pages"
git branch -M main
git remote add origin https://github.com/<tai-khoan-cua-ban>/co-caro.git
git push -u origin main
```

---

## 💻 4. Cách chạy game trên máy tính cục bộ

### Chạy trực tiếp trên trình duyệt
Vì toàn bộ game được viết theo chuẩn **ES Modules** và tĩnh, bạn có thể:
1. Mở bằng extension **Live Server** trong VS Code: Chuột phải vào `index.html` -> Chọn **"Open with Live Server"**.
2. Hoặc nếu có Python:
   ```bash
   python -m http.server 8000
   ```
   Sau đó mở trình duyệt tại: `http://localhost:8000`

---

## 🛠️ 5. Hướng dẫn tùy chỉnh mã nguồn

### 5.1. Thay đổi kích thước bàn cờ
Mở file `js/rules.js`:
```javascript
export const DEFAULT_BOARD_SIZE = 15; // Đổi thành 11, 19 hoặc kích thước tùy ý
```
Ngoài ra, người chơi cũng có thể chọn kích thước 11×11, 15×15, 19×19 trực tiếp trong menu **Cài đặt (⚙️)** trên giao diện mà không cần sửa code.

### 5.2. Thay đổi luật thắng (Ví dụ 4 quân hoặc 6 quân thắng)
Mở file `js/rules.js`:
```javascript
export const DEFAULT_WIN_LENGTH = 5; // Đổi thành 4, 6...
```

### 5.3. Thay đổi màu sắc quân cờ và giao diện
Mở file `css/style.css`:
```css
:root {
  --color-x: #38bdf8; /* Đổi màu quân X (mặc định: xanh cyan) */
  --color-o: #f43f5e; /* Đổi màu quân O (mặc định: đỏ hồng) */
  --accent:  #6366f1; /* Màu nút bấm chính (tím chàm) */
  --win-color: #eab308; /* Màu highlight 5 quân thắng (vàng ánh kim) */
}
```

### 5.4. Tùy chỉnh âm thanh
Mở file `js/sound.js`. Mọi âm thanh đều được tạo bởi Web Audio API:
- `playMove()`: Điều chỉnh tần số `frequency` để có tiếng gõ trầm hoặc bổng hơn.
- `playWin()`: Thay đổi mảng nốt nhạc `notes` để đổi bài nhạc chiến thắng.

---

## 🧠 6. Kiến trúc hệ thống & Khả năng mở rộng

### 6.1. Tách biệt hoàn toàn giữa Logic và UI
- **`game.js` & `rules.js`**: Đóng vai trò là Game Engine thuần túy, không chứa bất kỳ thẻ HTML hay `document.querySelector` nào. Trạng thái được cập nhật qua cơ chế Observer/Subscription (`game.subscribe(listener)`).
- **`board.js` & `ui.js`**: Nhận bản chụp trạng thái (`snapshot`) từ game engine để vẽ lên DOM và áp dụng CSS animation.
- Điều này cho phép bạn dễ dàng thay thế giao diện bằng Canvas, WebGL, Pixi.js hoặc React mà không cần viết lại luật chơi.

### 6.2. Mở rộng AI (Chơi với máy)
Trong file `js/ai.js`, hàm `getBestMove()` đã được tổ chức theo cấu trúc module:
- Cấp độ *Dễ*: Lấy ô ngẫu nhiên trong bán kính lân cận.
- Cấp độ *Trung bình*: Phát hiện nước thắng trong 1 bước của bản thân hoặc đối thủ để kết thúc hoặc chặn.
- Cấp độ *Khó*: Quét toàn bộ các chuỗi đe dọa (Open 4, Blocked 4, Open 3...) theo trọng số heuristic.
- *Để phát triển thêm cấp độ Siêu Khó (Master)*: Bạn có thể tích hợp thuật toán **Minimax kết hợp cắt tỉa Alpha-Beta** với độ sâu 3-5 bước.

### 6.3. Mở rộng Multiplayer (Socket)
Module `js/socket.js` được thiết kế linh hoạt:
- Mặc định sử dụng **WebRTC Peer Data Channel** qua PeerJS, cho phép kết nối ngang hàng P2P không độ trễ, không tốn tài nguyên server.
- Tự động fallback sang `BroadcastChannel` khi mở 2 tab trên cùng 1 máy tính để test nhanh.
- Nếu muốn dựng máy chủ riêng, thư mục `server/` đã có sẵn file `server.js` chạy trên nền WebSocket chuẩn.
