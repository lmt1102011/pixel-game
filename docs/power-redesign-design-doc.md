# Soulrift — Thiết kế lại Toàn bộ Power (Design Doc)

> Phiên bản: 1.0 (30/08/2026)
> Phạm vi: 10 power (Xích Viêm, Hàn Băng, Lôi Đình, Ám Ảnh, Huyết Hồn, Vạn Môn, Lưu Ly, Vạn Tượng, Thái Hư, Quang Âm). Mỗi power có: **nội tại (passive)**, **đòn đánh (basic)**, **Q/E/R/F**, hiệu ứng **thức tỉnh (awakened)**.
> Nguyên tắc: mỗi power có một **vòng lặp chiến đấu (combat loop)** riêng, dễ nhớ, dễ nhận diện, VFX mang đậm cá tính, không trùng pha với power khác.

---

## 1. Triết lý thiết kế chung

| Nguyên tắc | Diễn giải |
|---|---|
| **1 vòng lặp = 1 power** | Mỗi power xoay quanh đúng một cơ chế lõi (core mechanic). Q/E/R/F đều phục vụ vòng lặp đó, không nhồi nhét thêm cơ chế lạ. |
| **Nội tại là xương sống** | Passive định nghĩa "đơn vị cộng dồn" (stack) của power. Q/E/R/F nuôi hoặc tiêu stack đó. |
| **Đòn đánh luôn nuôi stack** | Basic attack luôn gắn stack lõi, để người chơi có thể bắt đầu vòng lặp ngay cả khi hết năng lượng. |
| **VFX theo chủ đề** | Mỗi power có 1 bảng màu + 1 hình khối đặc trưng lặp lại mọi nơi (icon, glyph, hit-spark, domain). |
| **Giữ cân bằng tương đối** | Tổng sát thương mỗi power trong 1 chu kỳ năng lượng ~ ngang nhau; khác biệt nằm ở *cách* gây dồn (chùm / đơn mục tiêu / vùng / khống chế), không nằm ở tổng DPS. |

### Bảng màu & hình khối đặc trưng dùng lại toàn cục (VFX identity)

| Power | Màu chính | Màu phụ | Hình khối chủ đạo |
|---|---|---|---|
| Fire | `#ff6b3a` | `#ffd166` | giọt lửa / lửa 7 cánh |
| Ice | `#83e8ff` | `#d9fbff` | tinh thể 6 cạnh / bông tuyết |
| Lightning | `#ffe45e` | `#70f6ff` | tia chớp gấp khúc |
| Shadow | `#8f72ff` | `#202335` | mũi tên bóng / boomerang |
| Blood | `#ff3f5f` | `#ffc0c8` | giọt máu / trái tim |
| Gravity | `#b28dff` | `#59ffd4` | khối vuông + vòng đàn hồi |
| Crystal | `#76ffd8` | `#ffc4f5` | hình thoi hồng / lăng kính |
| Nature | `#75e66e` | `#ffe082` | lá / mầm / rễ xoắn |
| Void | `#6a8dff` | `#f2f6ff` | khối vuông chìm + ellipse |
| Time | `#e8d17d` | `#8ff7ff` | mặt đồng hồ / kim xoay |

---

## 2. Chi tiết từng Power

---

### 2.1 XÍCH VIÊM (Fire) — "Đốt – Kích nổ"

**Nội tại «Than Hồng» (Ember)**
- Mọi đòn đánh gây sát thương đều đặt **1 Than Hồng** lên kẻ địch (tối đa 5 tầng, thời gian 4s).
- Kẻ địch đang bốc cháy (`fireStacks > 0`) nhận thêm 6% sát thương từ mọi nguồn.
- Khi nổ Than Hồng, sát thương = `8 + 6/tầng` và **làm chậm 20%** trong 1.5s (để vụ nổ có cá tính "thiêu đốt dai dẳng" chứ không chỉ là sát thương khô).

**Đòn đánh «Xích Viêm Chú»**
- Quét hình nón bằng lưỡi lửa, đặt 1 Than Hồng lên mọi mục tiêu trúng.
- Combo đòn đánh thứ 3 (hoặc awakened): nón gấp đôi, nổ ngay 1 tầng Than Hồng.

**Q «Liệt Hỏa Trận»**
- Quét nón lửa dài trước mặt (chuẩn bị 0.25s), đặt 2 Than Hồng, để lại **Tro tàn** (glow-floor) làm chậm kẻ bước vào.
- *Awakened:* tro tàn còn tự bốc cháy nhẹ mỗi 0.5s.

**E «Hỏa Luyện Ngục»**
- **Kích nổ**: đốt cháy toàn bộ Than Hồng trên kẻ địch quanh người (bán kính 220), mỗi tầng nổ thành một chùm tia lửa bay ra.
- Mỗi mục tiêu nổ làm giảm E tối đa... (cooldown 1.2s/vật).
- *Awakened:* tăng nửa bán kính; mục tiêu nổ để lại 1 Than Hồng mới.

**R «Lưu Tinh Vẫn Thạch»**
- Dựng **tường dung nham** chặn đạn (giật giật lửa), thiêu mục tiêu đi qua mỗi 0.3s và đặt 1 Than Hồng.
- Tường tồn tại ~4s, có thể cùng lúc 2 bức.
- *Awakened:* vỡ thành 6 mảnh lưu tinh gây nổ nhỏ khi hết hạn.

**F «Tro Tàn Viễn Cổ»**
- **Lãnh địa Hỏa Sơn**: nền lửa cuộn, mọi kẻ địch trong vùng liên tục nhận 6 Than Hồng/1.2s và chịu nóng; phòng thủ giảm 12%.
- Mỗi 2s tự **kích nổ toàn vùng** theo chu kỳ, xoáy lửa bay hướng vào tâm.
- *Awakened:* vùng F tăng 25% kích thước và Chu kỳ nổ rút ngắn.

**Vòng lặp**: Đánh thường để đốt → Q/R đốt thêm & làm chậm → E nổ cả cụm → lặp. Cảm giác: *"chất đống rồi đốt pháo"*.

---

### 2.2 HÀN BĂNG (Ice) — "Đóng băng – Phá vỡ"

**Nội tại «Ấn Sương» (Sigil)**
- Mỗi đòn đánh tích **1 Ấn Sương** (tối đa 3). Đủ 3 ấn → **Đóng băng** mục tiêu (stun, bán kính đón đỡ ưu tiên).
- Mục tiêu bị Đóng băng chịu mọi sát thương thêm +15% (`shatter`).

**Đòn đánh «Tuyết Nhai Ấn»**
- Khối băng xuyên hàng (tuyến tính), tích 1 Ấn Sương, làm chậm nhẹ.
- Đòn đánh lên mục tiêu đang Đóng băng → **vỡ** (shatter), gây thêm sát thương và hất các mảnh băng ra.

**Q «Hàn Băng Xung»**
- Đóng băng tức thì toàn bộ mục tiêu quanh người trong 1s (stun).
- Mục tiêu đã Đóng băng → **vỡ ngay**, trả năng lượng.
- *Awakened:* vỡ lan sang mục tiêu gần.

**E «Tuyết Tinh Kết Giới»**
- Đặt **Bẫy băng** (delay 1.4s, telegraph rõ) → nổ làm Đóng băng vùng nhỏ 1.4s.
- Bẫy hấp dẫn kẻ thù bởi tiếng kêu (kéo nhẹ về tâm trước khi nổ).
- *Awakened:* 2 bẫy cùng quẫy nếu giữ phím.

**R «Lãnh Cực Tam Tuyến»**
- Ba khe băng xuyên thẳng (tam giác), làm chậm mạnh + đặt 3 Ấn Sương lên mọi kẻ trúng → gần như Đóng băng ngay.
- *Awakened:* đường giữa làn băng gai rộng hơn.

**F «Kỷ Băng Hà Thức»**
- **Lãnh địa Băng Hà**: nền tuyết, mọi kẻ thù chậm 40%, liên tục tích Ấn Sương.
- Mỗi 1.5s: **Đóng băng toàn vùng 0.8s** theo nhịp, tạo nhịp "đông cứng – tan – đông cứng".
- *Awakened:* nhịp nhanh hơn, thời gian đóng băng dài hơn.

**Vòng lặp**: Tích ấn → đóng băng → dùng Q/R hoặc đòn đánh để phá vỡ + lan. Tạo nhịp *"đóng băng – vỡ tan – đóng băng"*.

---

### 2.3 LÔI ĐÌNH (Lightning) — "Điện tích – Xả điện"

**Nội tại «Điện Tích» (Charge)**
- Đòn đánh tích **1 Điện Tích** (tối đa 10, lưu trên người người chơi, không trên kẻ địch — khác biệt so với các power khác).
- Mỗi 1 điện tích tăng 3% tốc độ đánh & tốc chạy.
- Hết 10 tích tự **Xả**: sét đánh toàn vùng nhỏ quanh người.

**Đòn đánh «Tịch Lôi Kích»**
- Tia điện xuyên đội hình (tuyến dài), tích 1 Điện Tích; có 15% mỗi lần nối sang kẻ địch gần nhất (chi mini-chain).

**Q «Thiên Lôi Cửu Chuyển»**
- Vòng xoáy sét quanh người (360°), nối mọi kẻ địch trúng bằng **dây điện**; mỗi dây tích Điện Tích.
- Càng nhiều dây càng nhiều tích (khuyến khích đứng giữa đám).
- *Awakened:* dây điện lan sang 1 mục tiêu phụ mỗi sợi.

**E «Lôi Độn Ảnh»**
- **Lướt** theo hướng ngắm (tốc tức thì), để lại vệt sét, làm choáng nhẹ điểm đáp.
- **Xả toàn bộ Điện Tích** tại điểm đáp: mỗi tích = 1 tia sét bổ xuống mục tiêu gần.
- *Awakened:* sau khi Xả để lại một cột sét 0.6s hút yếu.

**R «Cửu Tiên Lôi Phạt»**
- Gọi **9 cột sét** sinh ra ngẫu nhiên trong vùng chọn, mỗi cột sau 0.9s đánh xuống (stun nhẹ).
- Mỗi cột tích Điện Tích khi trúng kẻ địch.
- *Awakened:* cột thứ 5+ có bán kính lớn hơn.

**F «Hỗn Nguyên Lôi Kiếp»**
- **Lãnh địa Bão Điện**: sét đánh liên hoàn ngẫu nhiên trong vùng; mọi kẻ địch luôn nằm trong trạng thái "nhiễm điện" (chain nối không đứt).
- Tích Điện Tích tăng gấp đôi trong lãnh địa.
- *Awakened:* giảm tiếng nổ, sét dày hơn.

**Vòng lặp**: Đánh / Q để tích điện → E lướt & xả điện làm nổ lớn → R dồn thêm. Cảm giác *"tăng tốc, trút cơn bão vào chỗ đáp"*.

---

### 2.4 ÁM ẢNH (Shadow) — "Săn dấu – Kết liễu"

**Nội tại «Dấu Săn» (Hunt Mark)**
- Đòn đánh / lướt đặt **1 Dấu Săn** lên kẻ địch (tối đa 3, 4s). Mục tiêu mang dấu bị **truy vết** (hiện hồn bóng mờ chỉ với người chơi).
- Kẻ địch bị blind nhận sát thương thêm 20% (khuếch đại truy sát).

**Đòn đánh «Ám Sát Thức»**
- Nhát cắt ngắn, **đánh sau lưng** (hoặc khi blind) gây +50% và đặt 2 Dấu Săn.
- Không vào sau lưng → 1 Dấu Săn.

**Q «Huyễn Ảnh Bộ»**
- Lướt xuyên qua mục tiêu, để lại **mồi nhử bóng** (decoy) đứng yên làm đổi hướng đạn kẻ thù trong 1.2s.
- Đặt 1 Dấu Săn lên mọi mục tiêu xuyên qua.
- *Awakened:* decoy nổ bóng gây mù khi bị phá.

**E «Vô Minh Tỏa»**
- Phóng **dây bóng** khóa mục tiêu ưu tiên mang Dấu Săn, **kéo tít về** gần người chơi.
- **Tiêu toàn bộ Dấu Săn**: mỗi dấu = 1 vết cắt bóng dồn mạnh; làm mù ngắn.
- *Awakened:* kéo đồng thời 2 mục tiêu.

**R «Dạ Hành Quyết»**
- **Màn đêm** lóe quanh người (vùng bóng), làm mù toàn bộ trong 1.5s; mọi sát thương trong vòng 2s đều coi là "sau lưng".
- Nuôi 2 Dấu Săn lên những mục tiêu bạn đánh trong lúc màn đêm.
- *Awakened:* màn đêm lâu hơn + hút nhẹ.

**F «Vô Tận Hắc Dạ»**
- **Lãnh địa Săn Đêm**: toàn vùng chìm trong bóng tối, mọi kẻ địch đều mang 1 Dấu Săn và trạng thái "con mồi".
- Nội tại truy sát kích hoạt liên tục; mỗi giây kẻ địch bên trong nhận dồn dấu.
- *Awakened:* mồi nhử bóng xuất hiện liên tục.

**Vòng lặp**: Đánh sau lưng để gắn dấu → Q/E di chuyển & gắn thêm → E/đòn kết liễu tiêu dấu → R tạo khoảng lặng mù. Cảm giác *"thợ săn bóng đêm ám sát kẻ bị đánh dấu"*.

---

### 2.5 HUYẾT HỒN (Blood) — "Hiến máu – Hút máu"

**Nội tại «Huyết Nguyệt»**
- Kỹ năng gây sát thương sẽ **hiến HP** (một phần) để tăng công theo % máu đã mất (tối đa +30%).
- Mọi sát thương gây ra **Chảy Máu** (bleed 3s, dồn được).
- Hút máu = 8% sát thương gây ra.

**Đòn đánh «Huyết Nguyệt Trảm»**
- Vòng cung máu quét quanh, gây Chảy Máu, hồi máu theo 2% sát thương × số mục tiêu.

**Q «Tế Huyết Vũ»**
- **Hiến** 8% máu hiện tại → phóng **mưa lưỡi máu** (nón nhiều nhát, nhát xoay ngẫu nhiên như đang tế lễ).
- Máu càng thấp (tự động, không cần bấm) mưa càng dày & sát thương càng cao (nội tại kích hoạt).
- *Awakened:* mưa máu nhuộm đỏ vùng sàn, làm chậm.

**E «Huyết Khấp Tỏa»**
- Móc **mồi ưu tiên** (mang bleed nhiều nhất) kéo về gần, gây Chảy Máu chồng.
- Hút lại HP theo số vết Chảy Máu trên mọi kẻ địch quanh.
- *Awakened:* móc 2 mục tiêu.

**R «Luyện Huyết Trận»**
- **Nghi thức** quanh người 1.2s (telegraph vòng tròn): trong lúc đó mọi đòn chí mạng đều rút máu kẻ địch sang người chơi.
- Kết thúc: **bùng nổ** theo tổng máu đã cướp được + gây Chảy Máu toàn vùng.
- *Awakened:* nghi thức hút kẻ địch vào tâm dần.

**F «Huyết Hải Hàng Lâm»**
- **Lãnh địa Tế Lễ Huyết Hải**: sàn đỏ ngập, mọi kẻ địch trong vùng chảy máu liên tục; hồi máu = 1.5% / giây / kẻ địch chảy máu.
- *Awakened:* kẻ địch chảy máu nhận +15% sát thương.

**Vòng lặp**: Đánh để tích bleed & hồi → Q hiến máu càng nguy hiểm càng mạnh → E móc & hút ngược → R nghi thức cướp máu. Cảm giác *"liều mạng ở ngưỡng máu thấp để quật ngã đám đông"*.

---

### 2.6 VẠN MÔN (Gravity) — "Kéo – Đảo cực"

**Nội tại «Trọng Áp» (Weight)**
- Đòn đánh gắn **1 Trọng Áp** (tối đa 4). Kẻ địch càng mang nhiều Trọng Áp càng bị **kéo về tâm** các kỹ năng E/Q mạnh hơn (độ bám tăng).
- Trọng Áp làm tăng 5%/tầng thời gian chịu khống chế.

**Đòn đánh «Trầm Địa Ấn»**
- Sóng nặng ngắn (động đất nhỏ), đẩy nhẹ, gắn 1 Trọng Áp.

**Q «Vạn Dẫn Điểm»**
- Tạo **tâm điểm hút** (rút quái vào giữa theo cường độ tăng dần 1.6s) → khi tâm sáng rực, **nghiền nát lõi** (nổ vùng trung tâm, sát thương theo số kẻ trong đó).
- *Awakened:* tâm điểm để lại vùng nén làm chậm 2s.

**E «Phá Cực Thức»**
- **Đảo cực**: với tới mục tiêu (hoặc hướng ngắm) và **hất văng** toàn bộ kẻ địch quanh điểm đáp (tán loạn, có đẩy vật lý).
- Đối với kẻ mang nhiều Trọng Áp, đẩy yếu hơn nhưng làm chậm lâu.
- *Awakened:* hất 2 vòng liên tiếp.

**R «Thiên Địa Nghịch Chuyển»**
- **Vô trọng lực** toàn vùng chọn: kẻ địch bị nhấc khỏi mặt đất (không di chuyển, không tấn công) trong 1.2s → **thả rơi** gây sát thương diện rộng + làm choáng.
- *Awakened:* sau khi rơi để lại vùng nén ngắn.

**F «Hỗn Độn Điểm»**
- **Lãnh địa Kỳ Điểm** giữa phòng: một tâm điểm cực mạnh kéo mọi kẻ địch, phòng thủ giảm dần theo thời gian.
- Mỗi 2s xung nén đẩy sóng chấn động.
- *Awakened:* thêm một vệ tinh đảo cực quay quanh kéo nhẹ.

**Vòng lặp**: Gắn Trọng Áp → Q/R gom nhóm rồi nghiền → E tán hoặc đảo cực → lặp. Cảm giác *"điều khiển thế trận, gom hết rồi bóp nát"*.

---

### 2.7 LƯU LY (Crystal) — "Tạo mảnh – Phản xạ"

**Nội tại «Mảnh Vỡ Pha Lê» (Shard)**
- Đòn đánh gắn **1 Mảnh Vỡ** (tối đa 6). Mảnh Vỡ tăng 8%/mảnh sát thương bạn gây lên kẻ đó.
- Khi kẻ địch mang mảnh chết, vỡ ra bắn các mảnh nhỏ sang kẻ lân cận.

**Đòn đánh «Lưu Ly Thứ»**
- Lăng kính xuyên hàng, để lại **bẫy mảnh** tại điểm cuối (vỡ khi bị dẫm), gắn 1 Mảnh Vỡ.

**Q «Tam Cực Tinh Thương»**
- Bắn **3 tia lăng kính** mở góc, xuyên qua nhiều mục tiêu, gắn 2 Mảnh Vỡ mỗi tia.
- *Awakened:* tia giữa bật phản xạ 1 lần ở tường.

**E «Huyễn Cảnh Kính»**
- Dựng **gương pha lê** quanh người (vòng), tại vị trí ưu tiên: tạo khiên pha lê hấp thụ 1 đòn.
- Gương **phản kích**: đạn kẻ thù bắn vào bị phản chiếu ngược về nguồn.
- *Awakened:* 2 gương.

**R «Vẫn Lưu Ly Bạo»**
- **Mưa lăng kính** xuống vùng, sau mỗi đợt **kích nổ toàn bộ Mảnh Vỡ**: mỗi mảnh nổ thành phản ứng dây chuyền khi kẻ mang mảnh đứng gần nhau.
- *Awakened:* thêm 1 đợt mưa (3 thay vì 2).

**F «Lưu Ly Cung Thức»**
- **Lãnh địa Cung Điện Pha Lê**: mọi kẻ địch trong vùng luôn được "gắn mảnh"; đạn cứng bắn vào đều phản xạ về nguồn.
- Kẻ địch gắn đủ 6 Mảnh Vỡ tự vỡ dây chuyền.

**Vòng lặp**: Gắn mảnh → dựng gương thủ → R kích nổ dây chuyền → lặp. Cảm giác *"xây thế trận gương & mảnh, rồi đập vỡ cả bàn cờ"*.

---

### 2.8 VẠN TƯỢNG (Nature) — "Gieo mầm – Nở hoa"

**Nội tại «Mầm Độc» (Seed)**
- Đòn đánh gieo **1 Mầm Độc** (tối đa 3). Đủ 3 mầm → **trói rễ** (root 1.5s) và nở hoa tại chân.
- Sát thương độc dồn theo thời gian.

**Đòn đánh «Khô Mộc Thứ»**
- Mũi gai xuyên hàng, gieo độc + 1 Mầm Độc; làm chậm mặt đất thành bụi mầm.

**Q «Phệ Huyết Chủng»**
- Ném **hạt săn mồi** (rơi xuống điểm, telegraph): kẻ địch bước vào vùng sẽ bị **rễ trói** và hút một phần máu trả về người chơi.
- Đặt 1 Mầm Độc.
- *Awakened:* hạt mọc thành 2 cây săn mồi.

**E «Bách Trảo Mộc»**
- Dựng **hàng gai dài** chặn địa hình, làm chậm + đầu độc + chặn lối.
- Gai xuất hiện thành 3 đợt ngắn (1.2s/đợt).
- *Awakened:* gai gây chảy máu thay vì chậm.

**R «Vạn Tượng Sinh Mầm»**
- Gieo **vườn bào tử** (vùng): mọi kẻ địch bị nhiễm độc nặng theo thời gian.
- Kẻ địch đang trúng độc mỗi 0.8s **nở hoa** (bloom): nổ độc lan sang kẻ gần + trói rễ ngắn.
- *Awakened:* vườn rộng hơn, bloom lan xa hơn.

**F «Thần Thụ Tế Lễ»**
- **Lãnh địa Cổ Thụ**: một thân cây lớn mọc giữa vùng, hút sinh lực mọi kẻ địch để hồi máu + năng lượng cho người chơi liên tục.
- Kẻ địch bên trong luôn nhiễm độc; đất đầy rễ bẫy.
- *Awakened:* cổ thụ bắn hạt nở hoa quanh.

**Vòng lặp**: Gieo mầm bằng đòn đánh → trói rễ → Q/E chặn địa hình & độc → R nở hoa lan. Cảm giác *"biến chiến trường thành một khu vườn ăn thịt"*.

---

### 2.9 THÁI HƯ (Void) — "Xóa bỏ – Sụp đổ"

**Nội tại «Bào Mòn» (Erosion) & «Vết Rạn»**
- Đòn đánh xóa **khiên kẻ địch**, đặt **Vết Rạn** (crack, tối đa 4) và **Bào Mòn** lên mục tiêu.
- Mục tiêu **di chuyển** (địch di chuyển/đuổi theo) sẽ mất thêm HP theo khoảng cách đi (Bào Mòn). Hệ thống "trừng phạt kẻ chạy".

**Đòn đánh «Thái Hư Rạn»**
- Vết rạn không gian xuyên hàng, xóa khiên, đặt 1 Vết Rạn + Bào Mòn.

**Q «Hư Vô Tỏa»**
- Mở **khe hư không** hình chữ nhật trước mặt: **hút** kẻ địch về giữa, đặt nhiều Vết Rạn, **im lặng** kỹ năng 1s.
- *Awakened:* khe rộng hơn, hút mạnh hơn.

**E «Đoạt Mệnh Quyết»**
- Chém tia xóa bỏ: **xóa trạng thái có lợi** của kẻ địch (lớp/khiên/buff), và **làm sạch debuff** của bản thân.
- Mỗi buff kẻ địch bị xóa → +1 Vết Rạn.
- *Awakened:* thêm sát thương theo số buff đã xóa.

**R «Vô Ngôn Cảnh»**
- Vùng **im lặng** + **phá đạn**: đạn địch đi vào vùng bị xóa; kỹ năng địch trong vùng bị khóa.
- Kẻ địch ở lâu trong vùng nhận Bào Mòn tăng dần.
- *Awakened:* vùng di chuyển theo người chơi.

**F «Thái Hư Diệt Thế»**
- **Lãnh địa Hư Vô**: buộc mọi kẻ địch vào vòng **sụp đổ** (collapse) — mỗi 1.5s cả vùng sụp đổ, gây sát thương + xóa khiên + nhấn sâu Bào Mòn.
- *Awakened:* kết thúc lãnh địa bằng một cú sụp đổ toàn vùng cực mạnh.

**Vòng lặp**: Đánh xóa khiên & đặt rạn → Q gom & im lặng → E xóa buff → R khóa & rỉ máu → F liên tục sụp đổ. Cảm giác *"đánh sập cấu trúc thế trận địch từ bên trong"*.

---

### 2.10 QUANG ÂM (Time) — "Đóng băng – Hồi âm"

**Nội tại «Hồi Âm» (Echo)**
- Mỗi đòn đánh tạo **1 Hồi Âm** (bản phản chiếu) sau 0.5s đánh lại mục tiêu (sát thương 40%).
- Đánh vào mục tiêu **đang bị dừng thời gian** (frozen-in-time) sẽ lưu lại sát thương để bùng nổ khi hết.

**Đòn đánh «Quang Âm Trảm»**
- Chém hình cung; đòn đánh lên mục tiêu đang dừng thời gian → bản ghi sát thương.

**Q «Thời Cực Ấn»**
- Đóng băng vùng phía trước: mục tiêu bị **dừng giây** 1s (không cử động), **hấp thụ** mọi sát thương bạn gây vào để... khi hết thời gian **bùng nổ** trả lại tất cả sát thương đã hấp thu (nhân đôi).
- *Awakened:* vùng rộng hơn, thời gian dài hơn.

**E «Nghịch Chuyển Mệnh»**
- **Quay về** vị trí cách đó vài giây (ghi lại vị trí/path liên tục), **hoàn máu** một phần bằng lượng máu đã mất, gỡ debuff.
- Để lại **bản sao hồi âm** túc trực tấn công trong lúc bạn đang ở vị trí mới.
- *Awakened:* bản sao gây sát thương gấp đôi.

**R «Vĩnh Hằng Cấm Địa»**
- **Giam toàn vùng** trong khoảnh khắc đứng yên (mục tiêu bị đóng băng thời gian) 1.2s: hấp thụ toàn bộ sát thương bạn gây.
- Hết hạn → **giải phóng** toàn bộ sát thương đã hấp thụ thành một cú nổ tập trung.
- *Awakened:* sau khi giải phóng mọi kẻ địch bị làm chậm nặng.

**F «Vô Chung Luân Hồi»**
- **Lãnh địa Đồng Hồ**: liên tục **dừng thời gian** mọi kẻ địch trong vùng ngắt quãng, và **hoàn hồi chiêu** nhanh hơn.
- Mỗi nhịp (2s) tự hấp thụ sát thương bạn gây và phát thả bằng một nhịp nổ.
- *Awakened:* kim đồng hồ quay nhanh hơn, nhịp ngắn hơn.

**Vòng lặp**: Đánh để tạo Hồi Âm → Q/R đóng băng thời gian & "tích sát thương" → hết hạn bùng nổ gấp bội → E quay về cứu mạng. Cảm giác *"canh nhịp, trữ sát thương rồi thả một nhịp kết thúc"*.

---

## 3. Kế hoạch Cân bằng (Rebalance Plan)

### 3.1 Nguyên tắc chung
- **Năng lượng (cost)** & **hồi chiêu (cooldown)** điều chỉnh theo `POWER_SKILL_TUNING` để mỗi power có "nhịp" đặc trưng nhưng tổng DPS chuẩn hóa.
- **Hệ số sát thương** được neo theo mức cơ bản: *đơn mục tiêu* > *vùng* để bù rủi ro.

### 3.2 Bảng tuning đề xuất (giữ nguyên phần lớn, tinh chỉnh nhịp)

| Power | Q cost/cd | E cost/cd | R cost/cd | F cost/cd | Nhịp |
|---|---|---|---|---|---|
| Fire | 20 / 3.0 | 26 / 5.2 | 36 / 9.0 | 0 / 1.0 | bùng nổ theo cụm |
| Ice | 18 / 3.8 | 26 / 6.2 | 36 / 9.6 | 0 / 1.0 | kháng chế đúng lúc |
| Lightning | 16 / 2.4 | 20 / 4.8 | 38 / 9.2 | 0 / 0.9 | tích nhanh, xả mạnh |
| Shadow | 16 / 2.8 | 26 / 6.0 | 34 / 8.2 | 0 / 0.9 | ám sát đơn mục tiêu |
| Blood | 20 / 3.4 | 22 / 5.8 | 38 / 9.4 | 0 / 1.0 | liều máu thấp |
| Gravity | 24 / 4.2 | 26 / 6.4 | 40 / 10.4 | 0 / 1.1 | gom – nghiền (nhịp chậm, dồn khủng) |
| Crystal | 20 / 3.2 | 28 / 6.0 | 36 / 9.0 | 0 / 1.0 | thế trận – dây chuyền |
| Nature | 18 / 3.6 | 24 / 5.6 | 34 / 8.8 | 0 / 0.9 | kiểm soát bền bỉ |
| Void | 22 / 4.0 | 20 / 5.0 | 38 / 9.6 | 0 / 1.1 | xóa bỏ – sụp đổ |
| Time | 22 / 4.2 | 26 / 6.2 | 40 / 10.2 | 0 / 1.1 | trì hoãn – bùng nổ |

> Chi tiết độ lớn (damage numbers) số hoá trong giai đoạn code với `DEFAULT_POWER_SKILL_TUNING` làm mốc, giữ tổng DPS xấp xỉ nhau theo khảo sát `perf-smoke` + test thủ công.

### 3.3 Cách kiểm chứng cân bằng
- Khảo sát mỗi power: số stack tối đa, hệ số khuếch đại, thời gian trung bình để hoàn thành "1 vòng lặp năng lượng", DPS chuẩn hóa.
- Đảm bảo power "khống chế nhiều" (ice, time, shadow) có sát thương chùm thấp hơn power "dồn sát thương" (fire, gravity, lightning).

---

## 4. Kế hoạch triển khai (Implementation)

| Giai đoạn | Việc | Nơi sửa |
|---|---|---|
| 1 | Cập nhật `POWERS` (name/identity/passive/skills/skillDetails) để khớp thiết kế mới | `src/game.js` ~117–368 |
| 2 | Cập nhật `POWER_SKILL_TUNING` theo bảng 3.2 | `src/game.js` 377–438 |
| 3 | Viết lại cơ chế Q/E/R/F theo vòng lặp mới trong `executeDesignedPowerSkill` + tinh chỉnh `performPowerBasicStrike` cho đòn đánh + nội tại mới | `src/game.js` 16260–16408, 18400–18870 |
| 4 | Cân bằng lại `applyPowerIdentity` & awakened bonus cho khớp vòng lặp | `src/game.js` 17436–17585, 18244–18340 |
| 5 | Nâng cấp VFX động in-game (drawSkillShape, drawDomainIdentityPattern, hit-spark, powerGlyph) theo bảng màu/hình khối mới | `src/game.js` 31298–33984, 30925–31153 |
| 6 | Re-export 320 skill PNG qua pipeline (`npm run export-assets` + `build-runtime-atlas`) | `tools/*`, assets |
| 7 | Verify: `node --check`, `npm run …`(perf-smoke), asset verify, commit | — |
