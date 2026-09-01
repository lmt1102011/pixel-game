# Soulrift — Redesign Toàn Bộ Hệ Thống Kỹ Năng Q / E / R / F (Design Doc v2)

> Phiên bản: 2.0 (01/09/2026)
> Phạm vi: **9 power** — 🔥 Lửa, ❄️ Băng, ⚡ Sét, 🌑 Bóng tối, 🩸 Máu, 🪐 Trọng lực, 🌿 Cây, 🕳️ Hư không, ⏳ Thời gian. (Power thứ 10 "Quang Âm / Crystal" tạm giữ nguyên — nằm ngoài phạm vi, xử lý sau.)
> Nguyên tắc tối thượng: **IDENTITY > GAMEPLAY > FEEDBACK > VFX > PERFORMANCE.**

---

## 0. Tiêu chuẩn bắt buộc (mọi skill phải đạt)

1. **Tắt màu vẫn phân biệt được** — silhouette, shape, motion riêng; màu chỉ là chi tiết, không phải chủ thể.
2. **Tắt particle vẫn còn vóc dáng** — từ primitive lớn + đường nét + chuyển động, không phụ thuộc hạt.
3. **Cấm "hình khối generic" làm thiết kế chính** — sphere/cube/ring/beam/laser/glowing ball chỉ làm *khung*, **phải bị cắt/bẻ/vỡ/thủng** bởi shape đặc trưng.
4. **1 skill = 1 câu "nó chỉ có thể thuộc power này"** — test: che màu xong nếu còn nghi ngờ thì redesign.
5. **F = Lãnh địa** — đổi ít nhất: background, lighting, particles, movement/enemy behavior, gameplay rule. Không được chỉ là "vòng tròn lớn + damage area".

---

## 1. Visual DNA — 9 Power

| Power | Shape | Motion | Particle | Texture | Impact |
|---|---|---|---|---|---|
| 🔥 Lửa | lưỡi lửa bất đối xứng, khe nứt, tro gãy | bùng lên, liếm, xoáy, lan truyền | ember, tro, khói, nhiệt | nóng đỏ-sậm, crackle | thermal burst lệch tâm + cháy lan |
| ❄️ Băng | mũi nhọn dài, fracture góc cạnh, hoa băng mọc | đông kết, mọc lớp, nứt-tan | mảnh băng, tuyết mịn, sương | băng mờ dày dần, frost | shatter vỡ vụn, đóng băng cơ thể |
| ⚡ Sét | đường gãy khúc, nhánh cành cây, tia flicker | phân nhánh, nhảy target, nảy | spark, ion hóa | plasma lõi-trắng | shock mark + chain snap |
| 🌑 Bóng tối | móng vuốt lởm chởm, khối đen vỡ, xúc tu | vươn rồi siết, rách-khâu | mảnh khói, pixel tối, điểm sáng | vùng tối "ăn" ánh sáng | nuốt, kéo, mất nhận thức |
| 🩸 Máu | gai máu organic, mạch rung, giọt | co bóp, tìm mạch, quấn-rút | giọt máu, huyết vụn, màng | màng máu nhớt, mạch nổi | bleed dai + hút dịch |
| 🪐 Trọng lực | quỹ đạo cong, điểm kéo lệch, mảnh vỡ | bẻ cong quỹ đạo, hút-ném | mảnh metal, pixel quay orbit | không gian uốn | ground deformation + nghiền |
| 🌿 Cây | dây leo gai, rễ bò, lá-lông | mọc-thòi như sinh vật, quấn | lá rơi, spore, mảnh gỗ | vỏ cây, gai, lá gân | khóa-rễ + trỗi dậy tập thể |
| 🕳️ Hư không | vết cắt không gian méo, mảnh nền vỡ | xé-rách, biến mất, hút ngược | mảnh nền vỡ, tia méo | vùng "không có gì" thủng | xóa sổ, hút, méo vị trí |
| ⏳ Thời gian | afterimage, bóng ma thân, vết nứt chuyển động | đảo ngược, đóng băng chức năng | tia quay ngược, bụi thời gian | lớp mờ phai | trả trạng thái, đóng băng tất cả |

**Sound DNA** (không dùng chung explosion): Lửa = crackle/rạp; Băng = nứt tinh thể giòn; Sét = snap điện/thunder; Bóng tối = low + thì thầm; Máu = impact nhớt ướt; Trọng lực = rầm trầm; Cây = gỗ kẹt + mọc; Hư không = im lặng/vacuum tonal lạ; Thời gian = audio đảo ngược + tick méo.

---

## 2. Quick Reference — 36 kỹ năng

| Power | Q (cơ bản) | E (đặc trưng/combo) | R (signature) | F (Lãnh địa) |
|---|---|---|---|---|
| 🔥 Lửa | Ember Fang — nanh lửa wobble | Blazing Step — dash + thermal plume | Inferno Molt — nứt vỏ + bão ember | **Pyre of the End** |
| ❄️ Băng | Frost Needle — mũi băng mảnh dài | Crystal Break — mọc→co→nứt→vỡ | Winter Grave — quan tài băng bò lên | **Absolute Zero** |
| ⚡ Sét | Thunder Needle — tia phân nhánh | Arc Hunt — điện nhảy target | Storm Hunt — mây điện săn mục tiêu | **Thunder Kingdom** |
| 🌑 Bóng tối | Black Talon — móng vuốt rách | Shadow Rend — vết xé không gian | Abyssal Grasp — xúc tu siết kéo | **Abyss** |
| 🩸 Máu | Blood Spike — gai máu co bóp | Vein Snap — mạch máu bò quấn | Red Harvest — blood field đổi charge | **Blood Cathedral** |
| 🪐 Trọng lực | Gravity Crush — kéo lệch tâm | Orbit Throw — bẻ quỹ đạo ném | Singular Impact — nhảy đập uốn nền | **Event Horizon** |
| 🌿 Cây | Thorn Hunt — dây leo gai bò | Root Burst — rễ mọc quấn gai | Verdant Behemoth — sinh vật cây | **World Tree** |
| 🕳️ Hư không | Void Cut — vết cắt thủng nền | Void Step — bước qua khe rách | Null Object — vùng xóa | **Zero Space** |
| ⏳ Thời gian | Time Needle — mũi thời gian | Delay — trả lại damage tụ | Time Rewind — quay ngược trạng thái | **Eternal Moment** |

---

## 3. Đặc tả 36 kỹ năng (chi tiết)

> Format mỗi kỹ năng: **Gameplay | Cast | Travel | Hit | VFX | Particle | Môi trường | Sound | Camera | Screen | Combo | Dur/CD | Perf.**

---

### 🔥 FIRE

#### Q — EMBER FANG
- **Gameplay:** projectile "mũi nanh lửa", bay **cong vện (wobble)** như lửa thật; combo stack nhen nhóm. CD ngắn, dùng thường xuyên.
- **Cast:** player khẽ nhún, một lưỡi lửa bật khỏi tay theo hướng ngắm.
- **Travel:** đầu nanh lệch quanh trục sin → quỹ đạo lượn; đuôi kéo tro gãy khúc + ember tàn.
- **Hit:** nổ **lệch tâm** (không tròn đều) — lửa lật về một phía, ember bắn lệch, cháy sót trên đất.
- **VFX:** mũi lửa bất đối xứng, lõi trắng-đỏ, đuôi tro; không phải quả cầu đỏ.
- **Particle:** ember (loại `ember`), tro, vài tia nhiệt.
- **Sound:** phụt lửa ngắn + tí tách.
- **Camera:** rung nhẹ (≤3). **Screen:** viền nhiệt nhòe nhẹ thoáng qua.
- **Combo:** mỗi hit +1 than hồng; đủ 3 → nhen (ignite). **Dur 0.4s / CD 1.2s.**
- **Perf:** pooling projectile + ember, không spam.

#### E — BLAZING STEP
- **Gameplay:** dash ngắn phủ lửa; để lại dải lửa xé trên đất **theo hướng dash** đốt kẻ đi qua; kết thúc bùng **thermal plume**.
- **Cast:** thân bọc lửa, lao về trước ~180px.
- **Travel:** sau lưng để lại các đoạn lửa bị xé rách (không phải vòng).
- **Hit cuối:** plume hình **cánh lửa hai bên** → hất kẻ địch, không phải shockwave tròn.
- **VFX:** thân rách theo chuyển động; vết lửa đọng trên đất vài giây.
- **Sound:** rót lửa dash + bùng nhiệt cuối. **Camera:** medium (5-7), đẩy theo hướng dash.
- **Combo:** nhen những vết lửa đã để lại. **Dur 0.5s / CD 5s.**
- **Perf:** dùng vết lửa dùng lại trail; giới hạn số vết.

#### R — INFERNO MOLT
- **Gameplay:** ành lớp hỏa diễm quanh thân, **nạp** → vỏ lửa **nứt** → bắn ember nhiều hướng → bùng **bão lửa plume** quanh player.
- **Cast:** Player phồng lên trong 0.4s, vỏ lửa xuất hiện (charge).
- **Hit:** đẩy bật + stack cháy; thiêu rụi kẻ đang nhen.
- **VFX:** vỏ lửa (charge) → vết nứt đỏ sáng → mảnh ember tản → plume lửa cao.
- **Sound:** phào tụ lửa → rắc vỡ vỏ → gầm nổ. **Camera:** mạnh (10-13).
- **Perf:** plume dùng mesh reuse, ember có pool.

#### F — PYRE OF THE END *(Lãnh địa — chi tiết §4)*
- Mặt đất **nứt đỏ**, lửa **mọc từ khe**, ember **bay ngược lên**, nhiệt làm méo không khí, nền nhuộm ánh nóng; các cột lửa **bùng không đều**.
- **Rule:** Fire Dominance — ở lâu càng burn/ignite/DOT/giảm hồi. **Cuối:** Inferno Judgement — toàn bộ vùng lửa bùng chain reaction.
- **Camera:** nhiệt-pulse dồn dập (không phải shake đều).

---

### ❄️ ICE

#### Q — FROST NEEDLE
- **Gameplay:** mũi băng **rất dài, mảnh, sắc**; trúng → enemy *đóng băng từng phần* (buildup). CD ngắn.
- **Travel:** mũi thẳng vững, đuôi tuyết mịn + tia nhỏ băng.
- **Hit:** buildup đóng băng, mảnh băng bắn nhẹ.
- **VFX:** hình **mũi nhọn tam giác thon dài** (không phải khối hộp/crystal cube), bề mặt mờ dần.
- **Sound:** vụt lạnh sắc. **Camera:** nhẹ (2-3). **Combo:** đông 3 phần → vỡ tan. **Dur 0.45s / CD 1.3s.**

#### E — CRYSTAL BREAK
- **Gameplay:** mảng băng dưới chân mục tiêu **mọc theo lớp** → co → **fracture → shatter**.
- **Animation bắt buộc (4 pha rõ rệt):** **Growth → Tension → Fracture → Shatter**.
- **VFX:** mảnh băng dựng dần, sợi căng trắng, rồi nổ vụn nhiều hướng.
- **Sound:** kẽo mọc → căng → giòn vỡ lớn. **Camera:** medium + dừng khung ngắn (brief freeze-frame).
- **Combo:** shatter → thêm chill/freeze. **Dur 0.9s / CD 5s.**

#### R — WINTER GRAVE
- **Gameplay:** quan tài băng **tự hình thành** quanh target theo pha: chân → bò lên → khóa tay/chân → đóng thân → crystal hóa → **vỡ**.
- **VFX:** băng vây theo pha (không xuất hiện ngay cả khối), bề mặt tỏa sương.
- **Hit vỡ:** văng mảnh + đóng băng lâu.
- **Sound:** đông kết dần → rạn → vỡ lớn. **Camera:** mạnh + dừng khung. **Dur 1.6s / CD 10s.**

#### F — ABSOLUTE ZERO *(Lãnh địa §4)*
- Nhiệt độ hạ: tuyết mịn rơi, sương lạnh, frost phủ môi trường, bề mặt đóng băng, crystal mọc ngẫu nhiên.
- **Rule:** enemy trong domain: slow → freeze buildup → full freeze; **mỗi hành động enemy để lại vết nứt băng**.
- **Cuối:** **Zero Fracture** — toàn bộ lớp băng domain đồng loạt nứt vỡ.
- **Camera:** dừng khung / sharp impact từng đợt.

---

### ⚡ LIGHTNING

#### Q — THUNDER NEEDLE
- **Gameplay:** tia điện cực nhanh **nhưng không thẳng** — phân nhánh, đổi hướng, flicker, branch. Gây **Shock Mark**. CD ngắn.
- **VFX:** đường gãy khúc + nhiều nhánh ngắn, lõi trắng sáng nhấp nháy (không phải laser thẳng vàng).
- **Sound:** snap + tách điện. **Camera:** nhẹ + flash nháy. **Combo:** Mark 2 → kích nổ. **Dur 0.2s / CD 1.1s.**

#### E — ARC HUNT
- **Gameplay:** bắn điện target đầu → **điện nhảy** sang các target khác; mỗi jump: **branch → snap → flash → residual sparks**.
- **VFX:** mỗi chặng một tia phân nhánh khác (không lặp hình); đốm tàn điện ở nút nối.
- **Sound:** chuỗi snap nối tiếp. **Camera:** medium, nháy theo từng jump. **Combo:** tàn Mark trên kẻ đã trúng. **Dur 0.5s / CD 5s.**

#### R — STORM HUNT
- **Gameplay:** đám mây điện **di chuyển theo player**, liên tục đánh sét xuống enemy — **không đánh trùng vị trí**, AI chọn mục tiêu rải đều tạo cảm giác sét "săn".
- **VFX:** mây tối treo trên đầu player kèm tia nội, tia đánh xuống mỗi target khác nhau.
- **Sound:** ì ầm + sét. **Camera:** mạnh + flash nhiều đợt. **Dur 4s / CD 12s.**

#### F — THUNDER KINGDOM *(Lãnh địa §4)*
- Toàn bầu trời hóa bão: cloud layer, flash, sét phân nhánh, ion hóa, gió bão. Player là tâm storm.
- **Rule:** mọi enemy nhận **Static Mark**; càng nhiều Mark → chain lightning càng mạnh.
- **Cuối:** **Heaven Break** — chuỗi sét khổng lồ xuống nhiều hướng. **Camera:** flash bão + rung nhịp sét.

---

### 🌑 DARKNESS

#### Q — BLACK TALON
- **Gameplay:** móng vuốt bóng tối xé về phía enemy (không phải bóng cầu). Silhouette góc cạnh, mảnh khói, đuôi tối. CD ngắn.
- **Travel:** vọt lên rồi xé xuống như quắp. **Hit:** rách + mê man nhẹ.
- **VFX:** khối đen không đều + khói mảnh đứt đoạn. **Sound:** tiếng xé thấp + thì thầm. **Camera:** nhẹ. **Combo:** cộng mark. **Dur 0.45s / CD 1.4s.**

#### E — SHADOW REND
- **Gameplay:** **vết xé không gian** — đường rách bóng tối xuất hiện; enemy trên đó bị slash + mảnh tối + xê dịch ngắn.
- **VFX:** vết "khâu lại" gãy khúc, hai mép răng cưa (asymmetrical).
- **Sound:** xé vải tối. **Camera:** medium, hơi tối vignette. **Combo:** làm lộ điểm yếu. **Dur 0.6s / CD 5s.**

#### R — ABYSSAL GRASP
- **Gameplay:** xúc tu từ vùng tối quanh enemy: **khóa → kéo về tâm → siết lại**.
- **VFX:** tay bóng tối mảnh vươn lên co giật (sinh vật, không phải đường thẳng).
- **Sound:** rắn + giãy. **Camera:** mạnh. **Combo:** siết → dồn damage. **Dur 1.4s / CD 11s.**

#### F — ABYSS *(Lãnh địa §4)*
- **KHÔNG tối đen toàn màn hình.** Background **desaturate**, ambient giảm, bóng sâu, hạt tối, vài điểm mắt sáng lấp lánh.
- **Rule:** player tăng di chuyển; enemy giảm sight/awareness (chậm phản ứng).
- **Cuối:** **Abyssal Collapse** — không gian quanh enemy bị "nuốt" vào tối. **Camera:** vignette + light suppression.

---

### 🩸 BLOOD

#### Q — BLOOD SPIKE
- **Gameplay:** máu từ player/enemy tạo mũi nhọn **organic** — co bóp, biến dạng, nhỏ máu, không phải spear sạch. CD ngắn.
- **Hit:** xuyên + **bleed**. **VFX:** gai máu rung + giọt máu rớt. **Sound:** impact nhớt ướt. **Camera:** rung nhẹ (subtle pulse). **Combo:** fed bleed stack. **Dur 0.5s / CD 1.3s.**

#### E — VEIN SNAP
- **Gameplay:** **mạch máu chạy dưới đất** tìm enemy → quấn lấy chân → kéo → spike bật lên.
- **VFX:** đường mạch nổi rung (path tìm kiếm), rồi quấn + gai bật. **Sound:** trượt nhớt → giựt mạch. **Camera:** medium. **Combo:** thu blood charge khi trúng. **Dur 0.8s / CD 5s.**

#### R — RED HARVEST
- **Gameplay:** vùng **blood field**; mỗi lần enemy nhận damage → máu hút về player → chuyển thành **Blood Charge** (tăng damage/heal).
- **VFX:** giọt máu bay ngược về player; field là mạng lưới mạch (không phải vòng).
- **Sound:** hút dịch ùng ục. **Camera:** medium + nhịp đập theo charge. **Dur 5s / CD 12s.**

#### F — BLOOD CATHEDRAL *(Lãnh địa §4)*
- Mặt đất **vein patterns**; các "động mạch" liên tục co bóp; enemy trong domain: đánh dấu + **blood drain** + giảm hồi. Player hấp thụ máu tăng sức mạnh.
- **Cuối:** **Mass Circulation** — toàn bộ vein đồng loạt co bóp và hút máu từ tất cả enemy. **Camera:** pulse theo nhịp tim.

---

### 🪐 GRAVITY

#### Q — GRAVITY CRUSH
- **Gameplay:** không phải projectile — tạo vùng trọng lực bất ổn **kéo enemy về điểm lệch tâm**; vật thể gần cũng bị kéo. CD ngắn.
- **VFX:** tia uốn cong về điểm kéo lệch (bent trajectories), không phải vòng. **Sound:** rầm trầm + hút. **Camera:** nhẹ, kéo nhẹ về điểm. **Combo:** dồn để đập. **Dur 0.6s / CD 1.4s.**

#### E — ORBIT THROW
- **Gameplay:** bẻ quỹ đạo vật thể/enemy: **kéo vào orbit → quay quanh player → ném cực mạnh**.
- **VFX:** object xoay quanh player theo quỹ đạo rồi bị bắn đi (trajectory curve). **Sound:** quy tròn → vụt ném. **Camera:** medium, quay nhẹ. **Combo:** ném vào đám đông. **Dur 0.7s / CD 5s.**

#### R — SINGULAR IMPACT
- **Gameplay:** player **nhảy lên** → toàn thân thành khối "gravity mass" → **đập xuống**: ground deformation + radial debris displacement + gravitational distortion (không shockwave tròn).
- **VFX:** chỗ đập lún đất + mảnh vỡ văng lệch + tia quy. **Sound:** rầm nặng kéo dài. **Camera:** mạnh + hạ xuống theo cảm giác nặng. **Dur 1.2s / CD 10s.**

#### F — EVENT HORIZON *(Lãnh địa §4)*
- Vật thể kéo lệch, debris orbit, enemy mất trọng lượng rồi rơi, projectile bẻ cong, particles quay quỹ đạo. Player **kiểm soát vector trọng lực** (đẩy/kéo/đổi hướng).
- **Cuối:** **Singularity Collapse** — mọi thứ kéo về vùng cực nhỏ rồi gravity release. **Camera:** camera pull về tâm.

---

### 🌿 NATURE / PLANT

#### Q — THORN HUNT
- **Gameplay:** dây leo có gai **lao theo enemy như sinh vật sống** (uốn lượn tìm mục tiêu), không phải đường thẳng. CD ngắn.
- **VFX:** dây leo bò gợn sóng + mũi gai. **Sound:** vút + gai cắt. **Camera:** nhẹ. **Combo:** cộng stack root. **Dur 0.45s / CD 1.3s.**

#### E — ROOT BURST
- **Gameplay:** rễ từ dưới đất **mọc tìm enemy → quấn chân → khóa**; rồi gai mọc ra từ chính rễ.
- **VFX:** rễ thò lên (organic), quấn theo đường tròn quanh chân, gai đâm ra (không phải vòng đất). **Sound:** rạn đất + gỗ kẹt. **Camera:** medium. **Combo:** khóa → damage gai. **Dur 0.9s / CD 5s.**

#### R — VERDANT BEHEMOTH
- **Gameplay:** triệu hồi **sinh vật thực vật khổng lồ** hỗ trợ player — organic movement, mouth, vines, thorns, leaves; tấn công enemy tự động.
- **VFX:** quái cây thò ra từ đất, chuyển động nhịp thở, lá rụng. **Sound:** gỗ vỡ + gầm trầm. **Camera:** mạnh, hơi hướng lên (camera upward). **Dur 8s / CD 20s.**

#### F — WORLD TREE *(Lãnh địa §4)*
- Battlefield bị thiên nhiên nuốt: giant roots, vines, leaves, flowers, spores, branches. **Cây thế giới khổng lồ mọc phía sau battlefield**.
- **Rule:** hồi HP player, tăng sức mạnh plant skill, root enemy, spawn autonomous vines. **Cuối:** **Forest Revolution** — toàn bộ rễ trỗi dậy nghiền nát chiến trường. **Camera:** upward sweep.

---

### 🕳️ VOID

#### Q — VOID CUT
- **Gameplay:** tạo **vết cắt trong không gian** — background phía sau biến mất/méo đi (không phải slash texture). CD ngắn.
- **VFX:** vết cắt thủng nền (réfill méo), mảnh nền vỡ méo. **Sound:** im lặng + tonal lạ. **Camera:** nhẹ + méo nhẹ perspective. **Combo:** cộng mark xóa. **Dur 0.3s / CD 1.2s.**

#### E — VOID STEP
- **Gameplay:** bước vào khe nứt không gian → **biến mất** → xuất hiện vị trí khác; khi xuất hiện **không gian bị rách + debris/particles hút ngược vào**.
- **VFX:** khe rách để lại ở chỗ cũ + điểm xuất hiện hút ngược. **Sound:** vút tắt → ùng hút. **Camera:** medium + méo. **Combo:** né → đánh lén. **Dur 0.4s / CD 5s.**

#### R — NULL OBJECT
- **Gameplay:** vùng nơi **projectile + particles + enemy effects bị xóa** — như chúng chưa từng tồn tại.
- **VFX:** khối "không có gì" méo, biên mảnh nền vỡ; không phải hố đen tròn. **Sound:** im bặt. **Camera:** mạnh, perspective hút. **Dur 1.2s / CD 12s.**

#### F — ZERO SPACE *(Lãnh địa §4)*
- Không gian **bẻ gãy**: fragmented space, floating pieces, missing regions, distorted perspective.
- **Rule:** Void Override — xóa một số projectile, vô hiệu một số attack, **bóp méo khoảng cách/vị trí**. **Cuối:** **Reality Erase** — một phần battlefield bị xóa khỏi không gian (rất ngắn). **Camera:** perspective distortion.

---

### ⏳ TIME

#### Q — TIME NEEDLE
- **Gameplay:** bắn mũi năng lượng thời gian; enemy bị **Time Mark**. CD ngắn, không giảm tốc bằng chill thường.
- **VFX:** mũi năng lượng "phai/đảo" theo thời gian, afterimage nhẹ. **Sound:** tick + phóng méo. **Camera:** nhẹ. **Combo:** nạp mark; E/R/F hưởng. **Dur 0.35s / CD 1.1s.**

#### E — DELAY
- **Gameplay:** không gây damage ngay — **ghi lại trạng thái + damage tụ** lên target; sau vài giây **trả lại toàn bộ cùng lúc**.
- **VFX:** afterimage của enemy hiện ra; số damage đang tụ treo (temporal trail). **Sound:** audio thu lại → bùng trả cùng lúc. **Camera:** medium + dừng khung khi trả. **Combo:** dồn càng nhiều trước khi nổ càng tốt. **Dur 3s / CD 6s.**

#### R — TIME REWIND
- **Gameplay:** quay ngược trạng thái của **player** vài giây (position/HP/velocity) — **không reset cooldown** (tránh exploit).
- **VFX:** afterimages + reversed particles + reverse animation. **Sound:** audio chạy ngược. **Camera:** giật lùi nhẹ. **Perf:** ghi snapshot ngắn (ring buffer). **Dur 1s / CD 14s.**

#### F — ETERNAL MOMENT *(Lãnh địa §4)*
- Battlefield vào trạng thái **thời gian bóp méo**: vùng nhanh / vùng chậm / vùng đứng yên (enemy chậm, projectile gần đứng yên). Player vẫn di chuyển bình thường.
- **Cuối:** **Time Zero** — mọi thứ đóng băng, camera giữ im lặng một khoảnh khắc, rồi **toàn bộ damage + sự kiện tích lũy xảy ra cùng lúc**. **Camera:** temporal freeze.

---

## 4. Đặc tả LÃNH ĐỊA (F) — nền tảng thay đổi battlefield

> Mỗi F phải đổi: background, lighting, particles, movement/enemy behavior, gameplay rule. Bảng dưới tóm tắt **5 trụ** mỗi domain để triển khai + kiểm tra (self-audit).

| F / Power | Background | Lighting | Particles | Movement & Enemy | Gameplay Rule mới |
|---|---|---|---|---|---|
| 🔥 Pyre | nứt đỏ + lửa mọc khe, nhiệt méo khí | nền nhuộm ánh nóng | ember bay ngược, tro, heat | cột lửa bùng lệch không đều | Burn/Ignite/DOT tăng dần theo thời gian; giảm hồi |
| ❄️ Absolute Zero | frost phủ + crystal mọc | ánh sáng lạnh trắng-xanh | tuyết mịn rơi, sương, mảnh băng | enemy chậm → đông → đóng băng; hành động để lại vết nứt | freeze buildup theo thời gian trong domain |
| ⚡ Thunder Kingdom | bầu trời hóa bão, cloud layer | flash liên tục, ion hóa | spark, điện tích, gió | sét săn mục tiêu (không trùng chỗ) | Static Mark tích → chain càng mạnh |
| 🌑 Abyss | desaturate, bóng sâu | giảm ambient, vignette | hạt tối, điểm mắt sáng | enemy giảm nhận thức (chậm phản ứng) | player tăng di chuyển; enemy mù/awareness kém |
| 🩸 Blood Cathedral | vein patterns trên đất | đỏ huyết, pulse nhịp tim | giọt máu, huyết vụn | mạch máu co bóp | blood drain + giảm hồi; player hấp thụ → buff |
| 🪐 Event Horizon | không gian uốn, debris | tối + mảnh vỡ | vật thể kéo lệch, debris orbit | enemy mất trọng lượng → rơi | player điều khiển vector trọng lực (đẩy/kéo/đổi hướng) |
| 🌿 World Tree | rễ/vines/lá/spores phủ, cây thế giới | ánh sáng xuyên lá | lá rơi, spore | root enemy, vine tự tấn công | hồi HP player + buff plant; summon tự động |
| 🕳️ Zero Space | fragmented space, missing regions | méo perspective | mảnh nền vỡ | khoảng cách/vị trí bị bóp méo | Void Override: xóa projectile/attack |
| ⏳ Eternal Moment | lớp mờ phai, afterimage | ánh sáng rìa thời gian | bụi thời gian, tia đảo | vùng nhanh/chậm/đứng yên | tích lũy sự kiện → trả cùng lúc |

### Nghi thức cast chung cho F (giữ hệ thống hiện có, chỉ cải visual)
- `startDomainCinematic` + `freezeEnemiesForDomain` (có sẵn) → giữ.
- Camera + screen feedback **per-kind** (xem §7).
- Domain không còn là "vòng tròn + tia" → thay bằng **signature shape per-kind** (xem §6).

---

## 5. VFX Specification — từng kỹ năng (shape / motion / particles / timing / color / blending / trail / impact / shader / camera)

> Đây là bảng chi tiết nhất — dùng cho implementation. Blending mặc định `lighter`/`screen` cho năng lượng, `source-over` cho vật chất.

### 🔥 Lửa
| Skill | Shape | Motion | Particles | Timing | Blend | Trail | Impact | Camera |
|---|---|---|---|---|---|---|---|---|
| Q | nanh lửa bất đối xứng | wobble sin | ember, tro | 0.4s | lighter | tro gãy | nổ lệch tâm + cháy đất | nhẹ |
| E | cánh plume hai bên | dash theo hướng | lửa rách, ember | 0.5s | lighter | dải lửa đọng đất | thermal plume hất | medium + đẩy |
| R | vỏ lửa nứt → bão plume | nạp → nổ tản | ember tản, tro | 1.2s | lighter | vỏ nứt đỏ | đẩy + stack cháy | mạnh |
| F | địa ngục cháy (khe + cột) | cột lửa mọc lệch | ember bay ngược | 8s | lighter + source-over đất | vết lửa | DOT chain cuối | nhiệt-pulse |

### ❄️ Băng
| Skill | Shape | Motion | Particles | Blend | Impact |
|---|---|---|---|---|---|
| Q | mũi nhọn thon dài | thẳng vững | tuyết, mảnh | screen | buildup đông |
| E | mảnh băng dựng | 4 pha g-c-t-s | mảnh vụn | screen | shatter + chill |
| R | quan tài băng vây | bò lên theo pha | sương | screen | đóng băng + vỡ |
| F | domain đóng băng | tuyết rơi + crystal | tuyết, sương | screen | freeze buildup → Zero Fracture |

### ⚡ Sét
| Skill | Shape | Motion | Particles | Blend | Impact |
|---|---|---|---|---|---|
| Q | tia gãy khúc + nhánh | flicker | spark | lighter | shock mark |
| E | nhiều tia nhảy | branch→snap→flash | tàn điện | lighter | chain + mark |
| R | mây điện + tia đánh | strand săn (không trùng) | spark, ion | lighter | sét nhiều đợt |
| F | bão trời + tia khổng lồ | Heaven Break đa hướng | ion, gió | lighter | chain mạnh theo mark |

### 🌑 Bóng tối
| Skill | Shape | Motion | Particles | Blend | Impact |
|---|---|---|---|---|---|
| Q | móng vuốt lởm chởm | quắp xé | khói mảnh | screen | rách + mê |
| E | vết xé răng cưa | khâu gãy | mảnh tối | screen | slash + xê dịch |
| R | xúc tu sinh vật | khóa→kéo→siết | mảnh tối | screen | siết damage |
| F | vùng tối bóng sâu | nuốt dần | hạt tối, mắt sáng | screen(dark) | Abyssal Collapse |

### 🩸 Máu
| Skill | Shape | Motion | Particles | Blend | Impact |
|---|---|---|---|---|---|
| Q | gai máu organic co bóp | dao động | giọt máu | source-over | bleed |
| E | mạch máu nổi | bò tìm → quấn | giọt | source-over | kéo + spike |
| R | mạng mạch hút | giọt bay về player | huyết vụn | source-over | blood charge |
| F | vein pattern co bóp | Mass Circulation hút | giọt, nhịp | source-over | drain + giảm hồi |

### 🪐 Trọng lực
| Skill | Shape | Motion | Particles | Blend | Impact |
|---|---|---|---|---|---|
| Q | tia uốn về điểm kéo lệch | hút lệch tâm | mảnh metal | screen | dồn về điểm |
| E | quỹ đạo cong | orbit → ném | mảnh vỡ | screen | ném cực mạnh |
| R | khối mass đập | rơi + uốn nền | radial debris | screen | đất lún + nghiền |
| F | không gian uốn + debris | vector đổi hướng | debris orbit | screen | Singularity → release |

### 🌿 Cây
| Skill | Shape | Motion | Particles | Blend | Impact |
|---|---|---|---|---|---|
| Q | dây leo gai lượn | bò sinh vật | lá | source-over | stack root |
| E | rễ thò quấn | mọc → khóa → gai | mảnh gỗ | source-over | khóa + gai |
| R | sinh vật cây | nhịp thở tấn công | lá rơi | source-over | summon đánh |
| F | cây thế giới + rễ trỗi | Forest Revolution | lá, spore | source-over | root + nghiền |

### 🕳️ Hư không
| Skill | Shape | Motion | Particles | Blend | Impact |
|---|---|---|---|---|---|
| Q | vết cắt thủng nền | xé méo | mảnh nền | screen | xóa nhỏ |
| E | khe rách + hút ngược | step → xé | debris hút ngược | screen | né → đánh lén |
| R | khối không-gì | hút vô | mảnh nền méo | screen | xóa projectile/effect |
| F | không gian bẻ gãy | Reality Erase | mảnh nền | screen | xóa 1 phần battlefield |

### ⏳ Thời gian
| Skill | Shape | Motion | Particles | Blend | Impact |
|---|---|---|---|---|---|
| Q | mũi phai afterimage | phóng méo | bụi thời gian | screen | Time Mark |
| E | afterimage enemy + số tụ | đảo ngược thu | bụi đảo | screen | trả damage tụ |
| R | afterimage player | reverse anim | reversed particles | screen | quay trạng thái |
| F | vùng nhanh/chậm/đứng yên | Time Zero freeze | bụi đảo | screen | trả mọi sự kiện |

---

## 6. Domain Rendering — bỏ "vòng tròn + tia", dùng signature shape per kind

> Thay block render generic (arc/rays) tại `drawDomainPowerSigils` và đoạn vẽ domain trong `renderEffects` bằng **shape đặc trưng**:

| Kind | Shape thay cho ring | Gợi ý triển khai (performance-aware) |
|---|---|---|
| fire | mảnh đất nứt đỏ + cột lửa mọc (không đồng đều) | vẽ kèm organic silhouette bằng path quanh biên, vài cột lửa có pool |
| ice | lớp băng dày phủ đất + crystal mọc | frost edges (path) + crystal shard từ đỉnh |
| lightning | cloud layer + tia gãy khúc | tia sinh nhiều nhánh (đã có engine bolt) |
| shadow | vùng tối méo + mắt sáng | path tối khép kín méo + chấm sáng |
| blood | vein pattern co bóp | mạng lưới mạch nổi (polyline), nhịp pulse |
| gravity | đĩa méo + mảnh vỡ orbit | debris quay (quỹ đạo) + khung uốn |
| nature | bãi cỏ/gốc/rễ + cây thế giới sau | rễ bò + vine, lá rơi |
| void | không gian bẻ gãy | mảnh nền vỡ offset méo, vùng thủng |
| time | afterimage + vùng đang phai | nhiều layer mờ + tia đảo hướng |

**Nguyên tắc perf chung:** dùng path khép kín thay vì vẽ từng pixel; pool particles; reuse mesh/sprite; giới hạn số layer active; không tạo canvas/shader mới; batching; cull ngoài màn hình. Mọi domain: **tắt particle vẫn giữ được silhouette** (path đất/crystal/cloud/tia... từ primitive lớn đã cắt méo).

---

## 7. Camera & Screen Feedback — per power (không lạm dụng shake)

| Power | Kiểu camera feedback riêng | Screen feedback |
|---|---|---|
| 🔥 Lửa | **heat pulse** (rung theo đợt nhiệt tăng dần) | viền nhiệt nhòe |
| ❄️ Băng | **dừng khung ngắn / sharp impact** | flash trắng-lạnh mỏng |
| ⚡ Sét | **flash nháy theo nhịp sét** | toàn màn flash chớp |
| 🌑 Bóng tối | **vignette + light suppression** | viền tối ép dần |
| 🩸 Máu | **pulse theo nhịp tim** | hơi đỏ nhịp đập |
| 🪐 Trọng lực | **camera pull** về tâm/kéo theo vector | méo nhẹ theo trọng lực |
| 🌿 Cây | **camera upward** | rìa lá xanh thoáng |
| 🕳️ Hư không | **perspective distortion** | méo góc nhìn nhẹ |
| ⏳ Thời gian | **temporal freeze** (giữ im lặng 1 nhịp) | lớp phai đảo ngược |

Định mức shake: Q ≤3 (nhẹ), E 5-7 (medium), R 10-13 (mạnh), F theo kiểu riêng ở bảng trên. Không tăng shake bừa bãi.

---

## 8. Gameplay Metric (bảng định hướng balance — triển khai giữ tuning hiện có, chỉ chỉnh nơi cần)

> Cooldown / damage / range / duration hiện đã có trong `POWER_SKILL_TUNING`. Bảng này **định hướng** (target), không override đã cân bằng. Mỗi skill: **damage | range | duration | status | combo**.

| Power | Q (dmg/range/status/combo) | E | R | F |
|---|---|---|---|---|
| fire | 100% / cone / than-hồng → nhen | 140% / dash / cháy đất | 180% / self / bão + stack | DOT chain + giảm hồi |
| ice | 100% / xa / freeze-building → đóng băng | 150% / target / 4-pha shatter | 170% / target / đóng băng lâu | freeze buildup → Zero Fracture |
| lightning | 105% / xa / shock mark → kích nổ | 120% chain / multi / tàn mark | 160% strand / multi / săn mục tiêu | static mark → chain mạnh |
| shadow | 95% / cone / mark → nuốt | 130% / line / xê dịch | 150% / target / siết | awareness giảm + nuốt |
| blood | 100% / xa / bleed → hút | 135% / path / quấn + gai | 145% field / charge buff | drain + giảm hồi |
| gravity | 90% / vùng / kéo lệch | 130% / object / ném | 170% / self / đất lún | vector điều khiển → collapse |
| nature | 100% / xa / root stack | 135% / target / khóa + gai | summon 8s | root + nghiền + hồi |
| void | 95% / line / mark → xóa | 120% / step / né | 160% / vùng / xóa projectile | xóa 1 phần battlefield |
| time | 100% / xa / time mark | tụ dmg → trả tất | quay trạng thái player | tích sự kiện → Time Zero |

---

## 9. Self-Audit (tiêu chuẩn cuối — kiểm trước khi giao)

1. **Che toàn bộ màu → còn phân biệt được 9 power không?** Phải ĐƯỢC — vì shape/motion riêng (nanh-sét-bóng tip mảnh-vòng cong-... ). Nếu nghi ngờ → redesign shape.
2. **Nhìn F → có cảm giác mỗi power tạo một thế giới riêng không?** Mỗi domain đổi background/lighting/particles/movement/rule → ĐƯỢC.
3. **Tắt particle → còn silhouette + motion đặc trưng không?** ĐƯỢC — domain giữ path đất/crystal/cloud/tối/mảnh...
4. **Có skill nào chỉ mô tả được bằng "hình tròn/cầu/beam phát sáng" không?** KHÔNG — mọi chủ thể đã là shape đặc trưng bị cắt méo.
5. **Ưu tiên IDENTITY > GAMEPLAY > FEEDBACK > VFX > PERFORMANCE?** Đúng.

---

## 10. Scope triển khai vào project (đợt hoá)

- **Đợt 1 — F Lãnh địa thật sự:** thay `drawDomainPowerSigils` + đoạn vẽ domain ring trong `renderEffects` bằng **signature shape per kind**; thêm per-kind particles/camera vào `updatePowerDomain`/`updatePowerDomainIdentity`. (Đây là thay đổi rủi ro cao — làm cẩn thận + chụp smoke.)
- **Đợt 2 — Per-power camera & screen feedback:** hook theo §7.
- **Đợt 3 (nếu cần) — tinh chỉnh shape Q/E/R/VFX art** (gradient theo `drawSkillShape`), không phá balance.
- Mỗi đợt: `node --check` → perf-smoke → commit → push riêng.