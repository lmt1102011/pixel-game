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

## Asset frame

Xuất lại toàn bộ frame PNG:

```bash
node tools/export-assets.js
```

Xuất lại một nhóm frame để sửa nhanh mà không xóa các asset khác:

```bash
node tools/export-assets.js --category monster --kind shadowGoblin --state idle --frame 0-1 --keep
```

Kiểm tra frame thiếu, sai kích thước hoặc PNG hỏng:

```bash
node tools/verify-exported-assets.js
```

Kiểm tra decode bằng Chrome/Edge cho frame đã chọn hoặc toàn bộ frame:

```bash
node tools/verify-exported-assets.js --browser-decode --limit 220
node tools/verify-exported-assets.js --browser-decode --limit 1000
```

Smoke test FPS/preload trong phòng huấn luyện:

```bash
node tools/perf-smoke.js
node tools/perf-smoke.js --mobile
node tools/perf-smoke.js --mobile --strict-preload
```

## Bật server một lần

Nếu chỉ muốn người chơi mở game mà không cần bật server local mỗi lần, hãy deploy bản static này lên GitHub Pages, Firebase Hosting, Netlify hoặc Vercel. Sau khi cấu hình hosting một lần, người chơi chỉ cần vào URL hoặc cài PWA là có thể chơi.

Lệnh `python -m http.server` chỉ dùng để test trên máy của bạn. Chế độ nhiều người hiện tại dùng WebRTC/PeerJS kết hợp relay/Firebase nên không cần bạn bật một game server riêng cho từng phòng. Nếu sau này muốn chống gian lận và đồng bộ mạnh hơn, hãy deploy thêm một backend WebSocket authoritative chạy 24/7; backend đó cũng chỉ cần bật/deploy một lần.

## Chơi khác mạng

Khi hai máy cùng Wi-Fi, WebRTC thường nối P2P trực tiếp nên rất mượt. Khi hai máy dùng mạng khác nhau, một số modem/NAT có thể chặn P2P; lúc đó game chỉ còn relay HTTP công khai để cứu kết nối, đủ cho tìm phòng nhưng không đủ mượt cho combat realtime. Muốn ổn định như game online thật, hãy cấu hình TURN server hoặc deploy backend WebSocket riêng chạy 24/7.

Game đã có sẵn nhiều STUN server và có thể nhận TURN server tùy chọn qua `window.SOULRIFT_ICE_SERVERS` hoặc `localStorage.setItem("soulrift-ice-servers", JSON.stringify([...]))`. TURN nên dùng credential ngắn hạn từ nhà cung cấp/server riêng vì credential đặt thẳng trong frontend có thể bị người khác xem được.

## Hướng dẫn tối ưu hóa đồ họa (voxel / low-poly — phong cách Minecraft)

Tóm tắt các bước kỹ thuật cần làm và cách tích hợp nhanh vào project:

1. Chunking
   - Chia terrain thành chunk 16^3 (cấu hình trong version.json -> graphics.chunkSize).
   - Chỉ rebuild mesh cho chunk thay đổi; dùng frustum/backface culling.

2. Greedy meshing & material batching
   - Thực hiện greedy meshing để gộp các mặt phẳng cùng vật liệu thành quads.
   - UV mỗi face trỏ vào một texture atlas. Xây atlas (assets/exported-atlas) và danh sách trong atlas-manifest.json.

3. Palette & textures
   - Dùng palette giới hạn (16–64 màu). Lưu palette JSON ở `assets/exported-atlas/palette.json`.
   - Texture resolution: 16×16 hoặc 32×32 (version.json -> graphics.textureRes).
   - Render với nearest filtering (ctx.imageSmoothingEnabled = false; WebGL: set NEAREST).

4. Lighting / shading
   - Dùng discrete light levels (lightLevels trong version.json).
   - Vertex light + baked per-vertex AO khi xây chunk (cheap, rẻ).
   - Dynamic lights (torch, lava) bằng local light propagation (voxel LPPV) hoặc cập nhật lightmap chunk cục bộ.

5. LOD & instancing
   - Ở xa, hợp nhất block thành voxels lớn hơn (mip-chunks).
   - Dùng GPU instancing cho props (cây, đá) nếu không thể meshing.

6. Pipeline & memory
   - Pack vertex attributes (pos 16-bit if possible, normal 8-bit, uv 16-bit, light 8-bit).
   - Batching: 1 draw-call per-chunk-per-material.
   - Dùng texture compression / mipmaps cho atlas khi có (BCn/ASTC) trên nền tảng hỗ trợ.

7. Triển khai nhanh (next steps)
   - đọc version.json.graphics để lấy chunkSize/palette/textureRes.
   - trong `src/game.js`:
     - tắt image smoothing trên canvas,
     - load palette (palette.json) và atlas-manifest,
     - implement greedy-mesher module (input: voxel grid per chunk -> output: vertex buffer + uv),
     - implement simple vertex AO bake on chunk build,
     - implement light propagation (per-chunk updates).

Thực thi nhanh — checklist:
- [ ] Đặt `graphics.chunkSize` trong version.json (đã có).
- [ ] Xuất atlas + palette (assets/exported-atlas/*).
- [ ] Tắt smoothing và map UV đúng tâm texel (game loader).
- [ ] Implement greedy mesher trong src/game.js, dùng manifest để map UVs.
- [ ] Baked vertex AO + discrete lightLevels (16).

Ghi chú: service-worker đã cập nhật để runtime cache atlas/texture theo chiến lược stale-while-revalidate; tránh prefetch toàn bộ sprites để giữ nhỏ gói cài đặt.
