# Soulrift Pixel Game

Web game canvas tĩnh, viết bằng HTML/CSS/JavaScript thuần.

## Chạy local

Mở trực tiếp `index.html` trong trình duyệt, hoặc chạy một server tĩnh tại thư mục này:

```bash
python -m http.server 5173
```

Sau đó mở:

```text
http://127.0.0.1:5173/
```

## Deploy GitHub Pages

Repo có thể deploy trực tiếp từ branch `main`, thư mục root:

- `index.html`
- `styles.css`
- `src/game.js`

Không cần bước build.

## Bật server một lần

Nếu chỉ muốn người chơi mở game mà không cần bật server local mỗi lần, hãy deploy bản static này lên GitHub Pages, Firebase Hosting, Netlify hoặc Vercel. Sau khi cấu hình hosting một lần, người chơi chỉ cần vào URL hoặc cài PWA là có thể chơi.

Lệnh `python -m http.server` chỉ dùng để test trên máy của bạn. Chế độ nhiều người hiện tại dùng WebRTC/PeerJS kết hợp relay/Firebase nên không cần bạn bật một game server riêng cho từng phòng. Nếu sau này muốn chống gian lận và đồng bộ mạnh hơn, hãy deploy thêm một backend WebSocket authoritative chạy 24/7; backend đó cũng chỉ cần bật/deploy một lần.
