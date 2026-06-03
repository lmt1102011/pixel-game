(() => {
  "use strict";

  const TAU = Math.PI * 2;
  const WORLD_W = 1840;
  const WORLD_H = 1160;
  const ROOM_PAD = 86;
  const SAVE_KEY = "soulrift-save-v1";
  const SIGNAL_RELAY_URLS = ["https://ntfy.envs.net", "https://ntfy.mzte.de", "https://ntfy.adminforge.de", "https://ntfy.sh"];
  const APP_VERSION = "20260603-update-loop-fix-41";
  const VERSION_CHECK_INTERVAL = 15000;
  const UPDATE_ATTEMPT_KEY = "soulrift-update-attempt-v1";
  const DOOR_ENTER_TIME = 1.5;
  const DIRECTORY_TOPIC = "soulrift-directory-v2";
  const ROOM_CODE_RE = /^[A-Z0-9]{4,12}$/;
  const ROOM_TTL_MS = 45000;
  const SIGNAL_HISTORY = "2m";
  const DIRECTORY_HISTORY = "75s";
  const RUN_ITEM_LIMIT = 10;
  const RUN_EQUIP_LIMIT = 6;

  const RARITY = {
    common: { label: "Thường", color: "#d4d7df", rate: 1 },
    rare: { label: "Hiếm", color: "#50a4ff", rate: 0.9 },
    epic: { label: "Sử Thi", color: "#a169ff", rate: 0.75 },
    legendary: { label: "Huyền Thoại", color: "#ffb84f", rate: 0.5 },
    mythic: { label: "Thần Thoại", color: "#ff4d76", rate: 0.3 },
    divine: { label: "Thần Thánh", color: "#82ffd3", rate: 0.15 }
  };

  const POWERS = [
    {
      id: "fire",
      name: "Lửa",
      icon: "LỬA",
      color: "#ff6b3a",
      accent: "#ffd166",
      rarity: "rare",
      passive: "Đòn đánh thiêu đốt và cộng dồn sát thương nóng chảy.",
      skills: {
        basic: "Chém Tro Tàn",
        q: "Quạt Lửa",
        e: "Khiên Dung Nham",
        r: "Dấu Thiên Thạch",
        f: "Vương Miện Hỏa Ngục"
      }
    },
    {
      id: "ice",
      name: "Băng",
      icon: "BĂNG",
      color: "#83e8ff",
      accent: "#d9fbff",
      rarity: "rare",
      passive: "Kẻ địch bị làm lạnh sẽ chậm lại rồi vỡ vụn.",
      skills: {
        basic: "Lưỡi Băng Hà",
        q: "Vòng Băng",
        e: "Hộ Vệ Gương",
        r: "Trường Vỡ Băng",
        f: "Không Độ Tuyệt Đối"
      }
    },
    {
      id: "lightning",
      name: "Sấm Sét",
      icon: "SÉT",
      color: "#ffe45e",
      accent: "#70f6ff",
      rarity: "epic",
      passive: "Đòn chí mạng phóng sét lan sang mục tiêu gần đó.",
      skills: {
        basic: "Lưỡi Volt",
        q: "Bước Bão",
        e: "Drone Ion",
        r: "Lồng Sấm",
        f: "Phá Thiên"
      }
    },
    {
      id: "shadow",
      name: "Bóng Tối",
      icon: "BÓNG",
      color: "#8f72ff",
      accent: "#202335",
      rarity: "epic",
      passive: "Lướt xuyên mục tiêu sẽ đánh dấu chúng để kết liễu.",
      skills: {
        basic: "Chém U Ảnh",
        q: "Nở Bóng",
        e: "Màn Che",
        r: "Song Hồn",
        f: "Nhật Thực"
      }
    },
    {
      id: "blood",
      name: "Máu",
      icon: "MÁU",
      color: "#ff3f5f",
      accent: "#ffc0c8",
      rarity: "epic",
      passive: "Một phần sát thương gây ra hồi lại máu.",
      skills: {
        basic: "Huyết Trảm",
        q: "Nứt Mạch",
        e: "Khế Ước Máu",
        r: "Quỹ Đạo Hút Máu",
        f: "Lời Thề Đỏ"
      }
    },
    {
      id: "gravity",
      name: "Trọng Lực",
      icon: "LỰC",
      color: "#b28dff",
      accent: "#59ffd4",
      rarity: "legendary",
      passive: "Đòn nặng kéo lệch thăng bằng của kẻ địch.",
      skills: {
        basic: "Vết Cắt Khối Lượng",
        q: "Sóng Nghiền",
        e: "Khiên Quỹ Đạo",
        r: "Mỏ Neo Đen",
        f: "Chân Trời Sự Kiện"
      }
    },
    {
      id: "crystal",
      name: "Pha Lê",
      icon: "PHA",
      color: "#76ffd8",
      accent: "#ffc4f5",
      rarity: "rare",
      passive: "Mỗi đòn thứ ba tạo mảnh pha lê bay quanh người.",
      skills: {
        basic: "Kiếm Mảnh Pha Lê",
        q: "Nón Mảnh Vỡ",
        e: "Vỏ Pha Lê",
        r: "Mưa Ngọc",
        f: "Thánh Đường Lăng Kính"
      }
    },
    {
      id: "nature",
      name: "Thiên Nhiên",
      icon: "CÂY",
      color: "#75e66e",
      accent: "#ffe082",
      rarity: "rare",
      passive: "Cây dại định kỳ hồi máu và trói chân kẻ địch.",
      skills: {
        basic: "Chém Gai",
        q: "Bẫy Dây Leo",
        e: "Nở Hoa",
        r: "Cọc Gai",
        f: "Rễ Thế Giới"
      }
    },
    {
      id: "void",
      name: "Hư Không",
      icon: "HƯ",
      color: "#6a8dff",
      accent: "#f2f6ff",
      rarity: "mythic",
      passive: "Dấu hư không sụp đổ sau nhiều lần trúng đòn.",
      skills: {
        basic: "Lưỡi Hư Vô",
        q: "Kéo Khe Nứt",
        e: "Vỏ Dịch Chuyển",
        r: "Giếng Hư Không",
        f: "Cổng Không Sao"
      }
    },
    {
      id: "time",
      name: "Thời Gian",
      icon: "GIỜ",
      color: "#e8d17d",
      accent: "#8ff7ff",
      rarity: "mythic",
      passive: "Né hoàn hảo hoàn trả hồi chiêu.",
      skills: {
        basic: "Kim Giây",
        q: "Vòng Ngưng Đọng",
        e: "Tua Ngược",
        r: "Dư Ảnh",
        f: "Đổ Đồng Hồ Cát"
      }
    }
  ];

  const BIOMES = [
    {
      id: "forest",
      name: "Rừng Mục Rữa",
      floor: "#182119",
      wall: "#36462e",
      accent: "#78d36f",
      haze: "rgba(45, 110, 66, 0.18)",
      music: [110, 146.83, 164.81, 196],
      hazards: ["thorn"],
      enemies: ["thornReaver", "rotArcher", "mossKnight", "thornSkirmisher", "rotBomber"],
      boss: "Hộ Vệ Vương Miện Rễ"
    },
    {
      id: "frozen",
      name: "Tàn Tích Băng Giá",
      floor: "#17222f",
      wall: "#445e72",
      accent: "#8feaff",
      haze: "rgba(80, 180, 230, 0.15)",
      music: [82.41, 123.47, 164.81, 220],
      hazards: ["ice"],
      enemies: ["frostDuelist", "graveMarksman", "iceBulwark", "frostSkirmisher", "graveShaman"],
      boss: "Thánh Đen Mùa Đông"
    },
    {
      id: "lava",
      name: "Đáy Dung Nham",
      floor: "#2d1714",
      wall: "#693124",
      accent: "#ff944d",
      haze: "rgba(210, 70, 25, 0.15)",
      music: [98, 130.81, 185, 246.94],
      hazards: ["lava"],
      enemies: ["emberButcher", "slagCaster", "chainBrute", "emberBomber", "ashSkirmisher"],
      boss: "Varkul, Bạo Chúa Lò Lửa"
    },
    {
      id: "neon",
      name: "Vực Neon",
      floor: "#11162b",
      wall: "#29376a",
      accent: "#fd57ff",
      haze: "rgba(80, 80, 220, 0.16)",
      music: [123.47, 155.56, 207.65, 311.13],
      hazards: ["voltage"],
      enemies: ["riftRonin", "pulseAcolyte", "chromeOgre", "pulseBomber", "riftSkirmisher"],
      boss: "Tín Hiệu Săn Mồi"
    },
    {
      id: "temple",
      name: "Đền Cổ",
      floor: "#262318",
      wall: "#675b3e",
      accent: "#f4d26f",
      haze: "rgba(210, 180, 85, 0.14)",
      music: [73.42, 110, 146.83, 196],
      hazards: ["blade"],
      enemies: ["sunWarden", "idolSeer", "obsidianGuard", "sunShaman", "obsidianSkirmisher"],
      boss: "Astrax, Thần Tượng Cuối"
    }
  ];

  const ROOM_TYPES = [
    { id: "normal", label: "Phòng Thường", icon: "X", weight: 35, color: "#c9d0db" },
    { id: "elite", label: "Phòng Tinh Anh", icon: "!!", weight: 12, color: "#ffbd5e" },
    { id: "treasure", label: "Kho Báu", icon: "$", weight: 9, color: "#f2bf63" },
    { id: "healing", label: "Hồi Phục", icon: "+", weight: 8, color: "#70e083" },
    { id: "merchant", label: "Thương Nhân", icon: "M", weight: 7, color: "#35d6c9" },
    { id: "challenge", label: "Thử Thách", icon: "*", weight: 9, color: "#ff8d3d" },
    { id: "curse", label: "Nguyền Rủa", icon: "?", weight: 8, color: "#a169ff" },
    { id: "secret", label: "Bí Mật", icon: "#", weight: 4, color: "#82ffd3" }
  ];

  const DIFFICULTIES = [
    { id: "easy", label: "Dễ", text: "Quái yếu hơn, phù hợp để thử nhân vật và power.", enemyHp: 0.82, enemyDamage: 0.84, countBonus: -1, rewardBonus: -0.06 },
    { id: "normal", label: "Thường", text: "Nhịp chuẩn của Soulrift.", enemyHp: 1, enemyDamage: 1, countBonus: 0, rewardBonus: 0 },
    { id: "hard", label: "Khó", text: "Quái dai và đau hơn, đổi lại rương, tiền và nguyên liệu tốt hơn.", enemyHp: 1.22, enemyDamage: 1.16, countBonus: 1, rewardBonus: 0.12 }
  ];

  const CURSES = [
    { id: "doubleDamage", name: "Sát Thương Kép", text: "Bạn và quái đều gây gấp đôi sát thương.", color: "#ff4b55" },
    { id: "halfHp", name: "Nửa Sinh Lực", text: "Máu tối đa bị giảm một nửa trong phòng này.", color: "#a169ff" },
    { id: "explosive", name: "Đòn Nổ", text: "Mỗi đòn thứ năm phát nổ.", color: "#ff8d3d" },
    { id: "teleport", name: "Dịch Chuyển Loạn", text: "Không gian trượt đi khi chịu áp lực.", color: "#64a8ff" },
    { id: "lifesteal", name: "Hút Máu", text: "Mọi sinh vật đều hồi máu khi đánh trúng.", color: "#ff3f5f" },
    { id: "chaos", name: "Hỗn Loạn", text: "Đạn phân tách và bẫy dao động mạnh hơn.", color: "#f2bf63" },
    { id: "glassMight", name: "Cuồng Nộ Kính", text: "Tăng sát thương nhưng mất một phần máu tối đa trong phòng.", color: "#ffd166" },
    { id: "ironPulse", name: "Nhịp Thép", text: "Tăng chịu đòn nhưng đánh thường chậm hơn trong phòng.", color: "#c9d0db" },
    { id: "manaDebt", name: "Nợ Năng Lượng", text: "Kĩ năng gây mạnh hơn nhưng năng lượng hồi chậm hơn.", color: "#35d6c9" }
  ];

  const ITEMS = [
    {
      id: "swiftBoots",
      name: "Giày Gió Lệch",
      slot: "Assist",
      rarity: "rare",
      icon: "GIÀY",
      text: "Tăng mạnh tốc độ chạy nhưng giảm năng lượng tối đa trong lượt."
    },
    {
      id: "focusGloves",
      name: "Găng Tụ Lực",
      slot: "Assist",
      rarity: "rare",
      icon: "GĂNG",
      text: "Đòn thường đau hơn nhưng nhịp đánh chậm hơn một chút."
    },
    {
      id: "amberTonic",
      name: "Thuốc Hổ Phách",
      slot: "Assist",
      rarity: "rare",
      icon: "MÁU",
      text: "Tăng máu tối đa, đổi lại di chuyển nặng hơn nhẹ."
    },
    {
      id: "sparkNeedle",
      name: "Kim Sét",
      slot: "Assist",
      rarity: "epic",
      icon: "SÉT",
      text: "Tăng chí mạng, thỉnh thoảng chí mạng lan sét sang mục tiêu gần."
    },
    {
      id: "droneCore",
      name: "Drone Phụ Trợ",
      slot: "Assist",
      rarity: "epic",
      icon: "DR",
      text: "Gọi một drone bắn hỗ trợ, nhưng hồi năng lượng chậm hơn."
    },
    {
      id: "fractureBell",
      name: "Chuông Băng Nứt",
      slot: "Assist",
      rarity: "legendary",
      icon: "BĂNG",
      text: "Kẻ địch đang lạnh vỡ thành mảnh xuyên thấu khi bị hạ."
    },
    {
      id: "bloodVial",
      name: "Ống Máu Nóng",
      slot: "Assist",
      rarity: "epic",
      icon: "HÚT",
      text: "Hút máu nhẹ theo sát thương, nhưng giảm một phần máu tối đa."
    },
    {
      id: "gravityDice",
      name: "Xúc Xắc Trọng Lực",
      slot: "Assist",
      rarity: "mythic",
      icon: "LỰC",
      text: "Tạo dị thường trọng lực trong trận, có lợi khi kéo quái tụ lại."
    },
    {
      id: "luckyCharm",
      name: "Bùa Nhặt Đồ",
      slot: "Assist",
      rarity: "rare",
      icon: "MAY",
      text: "Tăng may mắn phần thưởng và phạm vi hút rương, nhưng giảm sát thương nhẹ."
    },
    {
      id: "guardPlate",
      name: "Mảnh Hộ Tâm",
      slot: "Assist",
      rarity: "epic",
      icon: "ĐỠ",
      text: "Có thêm khiên và giảm sát thương nhận vào, đổi lại chạy chậm hơn."
    },
    {
      id: "merchantEdge",
      name: "Dầu Mài Khe Nứt",
      slot: "Assist",
      rarity: "epic",
      icon: "DẦU",
      merchantOnly: true,
      text: "Hàng thương nhân: tăng sát thương và chí mạng trong lượt."
    },
    {
      id: "riftLedger",
      name: "La Bàn Khe Nứt",
      slot: "Assist",
      rarity: "legendary",
      icon: "LA",
      merchantOnly: true,
      text: "Hàng thương nhân: tăng tiền rơi và độ hiếm phần thưởng."
    },
    {
      id: "azurePermit",
      name: "Pin Lam",
      slot: "Assist",
      rarity: "mythic",
      icon: "PIN",
      merchantOnly: true,
      text: "Hàng thương nhân: tăng năng lượng tối đa và tốc độ hồi năng lượng."
    },
    {
      id: "divineSigil",
      name: "Ấn Bùng Nổ",
      slot: "Assist",
      rarity: "divine",
      icon: "ẤN",
      merchantOnly: true,
      text: "Hàng hiếm: dùng tuyệt kỹ sẽ kích hoạt nội tại bùng nổ trong mười giây."
    }
  ];

  const SLOT_NAMES = ["Weapon", "Armor", "Relic 1", "Relic 2", "Charm"];

  const CHARACTER_TYPES = [
    {
      id: "swordsman",
      name: "Kiếm Sĩ",
      icon: "KIẾM",
      color: "#f2bf63",
      attackName: "Chém kiếm",
      attackText: "Chém hình quạt rộng trước mặt.",
      stats: { hp: 145, energy: 95, speed: 235, damage: 14, crit: 0.12, attackCd: 0.78 }
    },
    {
      id: "guardian",
      name: "Hộ Vệ",
      icon: "KHIÊN",
      color: "#70e083",
      attackName: "Lao khiên",
      attackText: "Lao ngắn về phía trước, hất lùi và làm choáng kẻ địch.",
      stats: { hp: 195, energy: 75, speed: 195, damage: 11, crit: 0.06, attackCd: 1.1 }
    },
    {
      id: "mage",
      name: "Pháp Sư",
      icon: "PHÉP",
      color: "#83e8ff",
      attackName: "Cầu năng lượng",
      attackText: "Ném cầu năng lượng tầm xa.",
      stats: { hp: 105, energy: 145, speed: 215, damage: 12, crit: 0.14, attackCd: 0.9 }
    },
    {
      id: "ranger",
      name: "Xạ Thủ",
      icon: "NỎ",
      color: "#ff9f43",
      attackName: "Mũi tên xuyên",
      attackText: "Bắn một mũi tên nhanh có thể xuyên mục tiêu.",
      stats: { hp: 120, energy: 115, speed: 260, damage: 12, crit: 0.18, attackCd: 1.05 }
    },
    {
      id: "assassin",
      name: "Sát Thủ",
      icon: "DAO",
      color: "#b8b7ff",
      attackName: "Song dao chữ X",
      attackText: "Chém hai dao ngắn tạo dấu X, đánh nhanh nhưng máu và sát thương thấp.",
      stats: { hp: 88, energy: 105, speed: 285, damage: 8, crit: 0.2, attackCd: 0.62 }
    }
  ];

  const SLOT_LABELS = {
    Assist: "Phụ Trợ",
    Weapon: "Vũ Khí",
    Armor: "Giáp",
    "Relic 1": "Di Vật 1",
    "Relic 2": "Di Vật 2",
    Charm: "Bùa"
  };

  const MATERIAL_LABELS = {
    emberGlass: "Kính Than Hồng",
    frostCore: "Lõi Băng",
    stormThread: "Chỉ Bão",
    bloodAmber: "Hổ Phách Máu",
    gold: "Tiền",
    bossCore: "Lõi Trùm",
    divineSpark: "Tia Thần"
  };

  const UPGRADE_LABELS = {
    damage: "Sát Thương",
    hp: "Sinh Lực",
    energy: "Năng Lượng",
    crit: "Chí Mạng",
    skill: "Kỹ Năng"
  };

  const STAT_POINT_UPGRADES = [
    { id: "hp", label: "Máu", text: "+6 máu tối đa mỗi điểm", amount: 6 },
    { id: "energy", label: "Năng lượng", text: "+4 năng lượng tối đa mỗi điểm", amount: 4 },
    { id: "damage", label: "Sát thương", text: "Tăng sát thương nhẹ, càng cao càng tăng chậm", amount: 0.38 },
    { id: "speed", label: "Tốc độ", text: "Tăng tốc độ nhẹ, càng cao càng tăng chậm", amount: 1.35 },
    { id: "crit", label: "Chí mạng", text: "Tăng chí mạng nhẹ, càng cao càng tăng chậm", amount: 0.0035 }
  ];

  const CUSTOM_LABELS = {
    eyes: "Mắt",
    mouth: "Miệng",
    aura: "Hào Quang",
    accessory: "Phụ Kiện",
    trail: "Vệt Lướt",
    ember: "Than Hồng",
    void: "Hư Không",
    frost: "Băng Giá",
    focus: "Tập Trung",
    scar: "Sẹo",
    mask: "Mặt Nạ",
    smirk: "Cười Nhẹ",
    grim: "Lạnh Lùng",
    gold: "Vàng",
    crimson: "Đỏ Thẫm",
    teal: "Ngọc Lam",
    violet: "Tím",
    cape: "Áo Choàng",
    horns: "Sừng",
    halo: "Vầng Sáng",
    scarf: "Khăn Choàng",
    sparks: "Tia Lửa",
    smoke: "Khói",
    runes: "Cổ Ngữ",
    shards: "Mảnh Vỡ"
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randi(min, max) {
    return Math.floor(rand(min, max + 1));
  }

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function chance(value) {
    return Math.random() < value;
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function angleTo(a, b) {
    return Math.atan2(b.y - a.y, b.x - a.x);
  }

  function angleDelta(a, b) {
    let d = (a - b + Math.PI) % TAU - Math.PI;
    if (d < -Math.PI) d += TAU;
    return d;
  }

  function weighted(list) {
    const total = list.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    for (const item of list) {
      roll -= item.weight;
      if (roll <= 0) return item;
    }
    return list[list.length - 1];
  }

  function uid(prefix = "id") {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function title(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function slotLabel(slot) {
    return SLOT_LABELS[slot] || slot;
  }

  function materialLabel(material) {
    return MATERIAL_LABELS[material] || title(material);
  }

  function upgradeLabel(stat) {
    return UPGRADE_LABELS[stat] || title(stat);
  }

  function customLabel(value) {
    return CUSTOM_LABELS[value] || title(value);
  }

  function characterById(id) {
    return CHARACTER_TYPES.find((character) => character.id === id) || CHARACTER_TYPES[0];
  }

  function powerById(id) {
    return POWERS.find((power) => power.id === id) || POWERS[0];
  }

  function itemById(id) {
    return ITEMS.find((item) => item.id === id) || null;
  }

  function accountKey(username) {
    return (username || "").trim().toLowerCase();
  }

  function hashText(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function passwordHash(username, password) {
    return hashText(`${accountKey(username)}:${password}`);
  }

  function cloneData(value) {
    return typeof structuredClone === "function" ? structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function defaultProfile(username = "") {
    return {
      account: {
        created: Boolean(username),
        username,
        createdAt: username ? new Date().toISOString() : "",
        powerSpins: 5,
        ownedPowers: [],
        selectedPower: "",
        selectedCharacter: "swordsman",
        lastSpin: ""
      },
      settings: {
        music: true,
        sfx: true,
        screenShake: 0.3,
        particles: 1.5,
        damageNumbers: true
      },
      customization: {
        color: "#d8b46a",
        eyes: "ember",
        mouth: "scar",
        aura: "gold",
        accessory: "cape",
        trail: "sparks"
      },
      inventory: [],
      equipped: {
        Weapon: "",
        Armor: "",
        "Relic 1": "",
        "Relic 2": "",
        Charm: ""
      },
      powers: Object.fromEntries(
        POWERS.map((power) => [
          power.id,
          {
            level: 1,
            awakened: false,
            mastery: 0,
            rarity: power.rarity,
            unlocked: false
          }
        ])
      ),
      materials: {
        emberGlass: 0,
        frostCore: 0,
        stormThread: 0,
        bloodAmber: 0,
        gold: 0,
        bossCore: 0,
        divineSpark: 0
      },
      achievements: {
        firstRift: false,
        bossBreaker: false,
        flawlessRoom: false
      },
      progression: {
        level: 1,
        xp: 0,
        totalXp: 0,
        bestStage: 0,
        bossesDefeated: 0,
        roomsCleared: 0,
        runs: 0,
        statPoints: 0,
        statUpgrades: Object.fromEntries(STAT_POINT_UPGRADES.map((upgrade) => [upgrade.id, 0]))
      }
    };
  }

  function defaultSave() {
    const profile = defaultProfile("");
    return {
      version: 2,
      auth: {
        currentUser: "",
        accounts: {}
      },
      ...profile
    };
  }

  function mergeSave(base, loaded) {
    if (!loaded || typeof loaded !== "object") return base;
    const merged = typeof structuredClone === "function" ? structuredClone(base) : JSON.parse(JSON.stringify(base));
    const walk = (target, source) => {
      for (const [key, value] of Object.entries(source)) {
        if (value && typeof value === "object" && !Array.isArray(value) && target[key]) {
          walk(target[key], value);
        } else {
          target[key] = value;
        }
      }
    };
    walk(merged, loaded);
    return merged;
  }

  class SaveStore {
    constructor() {
      this.db = null;
      this.failed = false;
    }

    async open() {
      if (!("indexedDB" in window)) {
        this.failed = true;
        return null;
      }
      return new Promise((resolve) => {
        const request = indexedDB.open("soulrift", 1);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("state")) db.createObjectStore("state");
        };
        request.onsuccess = () => {
          this.db = request.result;
          resolve(this.db);
        };
        request.onerror = () => {
          this.failed = true;
          resolve(null);
        };
      });
    }

    async load() {
      await this.open();
      if (!this.db) return this.loadLocal();
      return new Promise((resolve) => {
        const tx = this.db.transaction("state", "readonly");
        const request = tx.objectStore("state").get("save");
        request.onsuccess = () => resolve(request.result || this.loadLocal());
        request.onerror = () => resolve(this.loadLocal());
      });
    }

    save(data) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      if (!this.db) return;
      const tx = this.db.transaction("state", "readwrite");
      tx.objectStore("state").put(data, "save");
    }

    loadLocal() {
      try {
        const raw = localStorage.getItem(SAVE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }
  }

  class AudioEngine {
    constructor(game) {
      this.game = game;
      this.ctx = null;
      this.master = null;
      this.timer = 0;
      this.step = 0;
      this.biome = BIOMES[0];
      this.enabled = true;
    }

    start() {
      if (this.ctx || !this.game.save.settings.music) return;
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.045;
      this.master.connect(this.ctx.destination);
    }

    setBiome(biome) {
      this.biome = biome;
    }

    update(dt) {
      if (!this.ctx || !this.game.save.settings.music) return;
      this.timer -= dt;
      if (this.timer > 0) return;
      this.timer = this.game.run?.currentRoom?.type === "boss" ? 0.22 : 0.34;
      const notes = this.biome.music;
      const freq = notes[this.step % notes.length] * (this.step % 7 === 0 ? 0.5 : 1);
      this.step++;
      this.note(freq, 0.12, this.game.run?.currentRoom?.type === "boss" ? "sawtooth" : "triangle");
      if (this.step % 4 === 0) this.note(freq / 2, 0.2, "sine", 0.45);
    }

    note(freq, length = 0.08, type = "square", gain = 1) {
      if (!this.ctx || !this.game.save.settings.music) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      env.gain.value = 0;
      osc.connect(env);
      env.connect(this.master);
      const now = this.ctx.currentTime;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.5 * gain, now + 0.01);
      env.gain.exponentialRampToValueAtTime(0.001, now + length);
      osc.start(now);
      osc.stop(now + length + 0.02);
    }

    sfx(freq, type = "square", length = 0.05, volume = 0.12) {
      if (!this.ctx || !this.game.save.settings.sfx) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      env.gain.value = 0;
      osc.connect(env);
      env.connect(this.ctx.destination);
      const now = this.ctx.currentTime;
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(volume, now + 0.006);
      env.gain.exponentialRampToValueAtTime(0.001, now + length);
      osc.start(now);
      osc.stop(now + length + 0.02);
    }
  }

  class PeerLobby {
    constructor(game) {
      this.game = game;
      this.id = uid("peer");
      this.code = "";
      this.host = false;
      this.ready = false;
      this.joinPending = false;
      this.joinStartedAt = 0;
      this.mapVote = "forest";
      this.difficultyVote = "normal";
      this.signal = null;
      this.remoteSignal = null;
      this.remoteSignals = [];
      this.signalTopic = "";
      this.signalSince = 0;
      this.remotePollSince = 0;
      this.remotePollTimer = 0;
      this.remotePollBusy = false;
      this.presenceTimer = 0;
      this.directoryTimer = 0;
      this.lastLobbyAt = 0;
      this.emptySince = 0;
      this.seenSignals = new Set();
      this.peers = new Map();
      this.peerJs = null;
      this.peerJsRoomId = "";
      this.joinRetryTimers = [];
      this.readyRetryTimers = [];
      this.startRetryTimers = [];
      this.lastStartMessage = null;
      this.lastStartAt = 0;
      this.roomSession = "";
      this.slots = [{ ...this.playerProfile(), ready: false, vote: this.mapVote, host: true }];
    }

    playerName() {
      const name = String(this.game.save?.account?.username || "").trim();
      return name || "Bạn";
    }

    playerProfile() {
      return {
        id: this.id,
        name: this.playerName(),
        powerId: this.game.save?.account?.selectedPower || "",
        characterId: this.game.save?.account?.selectedCharacter || "swordsman"
      };
    }

    syncOwnSlot() {
      this.upsertSlot({ ...this.playerProfile(), ready: this.ready, vote: this.mapVote, host: this.host });
    }

    slotName(slot, fallback = "Người chơi") {
      const name = String(slot?.name || "").trim();
      return name || fallback;
    }

    makeCode() {
      const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
      return code;
    }

    roomPeerId(code = this.code) {
      return `soulrift-${String(code || "").trim().toLowerCase()}`;
    }

    create() {
      this.close();
      this.host = true;
      this.code = this.makeCode();
      this.roomSession = uid("room");
      this.ready = false;
      this.joinPending = false;
      this.presenceTimer = 0;
      this.emptySince = Date.now();
      this.lastLobbyAt = Date.now();
      this.slots = [{ ...this.playerProfile(), ready: true, vote: this.mapVote, host: true }];
      this.openSignal();
      this.openPeerJsHost();
      this.game.rememberRoomCode(this.code);
      this.game.toast(`Đã tạo phòng ${this.code}`);
      this.game.renderLobby();
      this.publishDirectoryPresence(true);
    }

    join(code) {
      const normalized = (code || "").trim().toUpperCase();
      if (this.joinPending) {
        this.game.toast(`Đang tìm phòng ${this.code}`);
        this.game.showRoomFinder(false);
        return;
      }
      if (!normalized) {
        this.game.toast("Nhập mã phòng");
        return;
      }
      if (!ROOM_CODE_RE.test(normalized)) {
        this.game.toast("ID phòng không hợp lệ");
        return;
      }
      this.close();
      this.host = false;
      this.code = normalized;
      this.roomSession = "";
      this.ready = false;
      this.joinPending = true;
      this.joinStartedAt = Date.now();
      this.presenceTimer = 0;
      this.lastLobbyAt = 0;
      this.slots = [{ ...this.playerProfile(), ready: false, vote: this.mapVote, host: false }];
      this.openSignal();
      this.openPeerJsClient();
      this.announceJoin();
      this.game.toast(`Đang vào phòng ${this.code}`);
      this.game.showRoomFinder(false);
    }

    openPeerJsHost() {
      if (!window.Peer || !this.host || !this.code) return;
      this.peerJsRoomId = this.roomPeerId();
      try {
        this.peerJs = new Peer(this.peerJsRoomId, { debug: 0 });
        this.peerJs.on("open", () => {
          this.game.toast(`Phòng ${this.code} đã sẵn sàng`);
          this.publishDirectoryPresence(true);
        });
        this.peerJs.on("connection", (conn) => this.bindPeerJsConnection(conn));
        this.peerJs.on("error", (error) => {
          if (/unavailable-id|taken/i.test(String(error?.type || error?.message || ""))) this.game.toast("Mã phòng bị trùng, hãy tạo lại phòng");
        });
      } catch {
        // Relay signaling remains available when PeerJS cannot start.
      }
    }

    openPeerJsClient() {
      if (!window.Peer || this.host || !this.code) return;
      try {
        this.peerJs = new Peer(undefined, { debug: 0 });
        this.peerJs.on("open", () => {
          this.connectPeerJsRoom();
          for (const delay of [350, 800, 1600, 2800, 4600, 7000]) {
            this.joinRetryTimers.push(setTimeout(() => this.connectPeerJsRoom(), delay));
          }
        });
      } catch {
        // Relay signaling remains available when PeerJS cannot start.
      }
    }

    connectPeerJsRoom() {
      if (!this.peerJs || this.host || !this.code || this.hasOpenPeers()) return;
      try {
        const conn = this.peerJs.connect(this.roomPeerId(), { reliable: true });
        this.bindPeerJsConnection(conn);
      } catch {
        // Retry timers and relay signaling continue.
      }
    }

    announceJoin() {
      const hello = () => {
        if (!this.host && this.code) this.sendSignal({ type: "hello", ...this.playerProfile(), ready: this.ready, vote: this.mapVote });
      };
      hello();
      this.joinRetryTimers.push(
        setTimeout(hello, 120),
        setTimeout(hello, 320),
        setTimeout(hello, 650),
        setTimeout(hello, 1100),
        setTimeout(hello, 1800),
        setTimeout(hello, 3000),
        setTimeout(hello, 4800),
        setTimeout(hello, 7200)
      );
    }

    close() {
      if (this.host && this.code) this.publishDirectoryPresence(false);
      for (const peer of this.peers.values()) {
        peer.channel?.close();
        peer.pc?.close();
      }
      for (const timer of this.joinRetryTimers) clearTimeout(timer);
      this.joinRetryTimers = [];
      for (const timer of this.readyRetryTimers) clearTimeout(timer);
      this.readyRetryTimers = [];
      for (const timer of this.startRetryTimers) clearTimeout(timer);
      this.startRetryTimers = [];
      this.lastStartMessage = null;
      this.lastStartAt = 0;
      this.roomSession = "";
      this.peers.clear();
      if (this.peerJs) {
        try {
          this.peerJs.destroy();
        } catch {
          // PeerJS cleanup is best-effort.
        }
      }
      this.peerJs = null;
      this.peerJsRoomId = "";
      if (this.signal) this.signal.close();
      this.signal = null;
      if (this.remoteSignal) this.remoteSignal.close();
      this.remoteSignal = null;
      for (const signal of this.remoteSignals || []) signal.close();
      this.remoteSignals = [];
      this.signalTopic = "";
      this.remotePollSince = 0;
      this.remotePollTimer = 0;
      this.remotePollBusy = false;
      this.presenceTimer = 0;
      this.emptySince = 0;
      this.lastLobbyAt = 0;
      this.seenSignals.clear();
    }

    leaveRoom() {
      this.close();
      this.code = "";
      this.host = false;
      this.ready = false;
      this.joinPending = false;
      this.joinStartedAt = 0;
      this.roomSession = "";
      this.slots = [{ ...this.playerProfile(), ready: false, vote: this.mapVote, host: false }];
    }

    updatePresence(dt) {
      this.updateDirectoryPresence(dt);
      this.pollRemoteSignal(dt);
      this.checkJoinTimeout();
      if (!this.code || this.game.mode !== "lobby") return;
      this.presenceTimer -= dt;
      if (this.presenceTimer > 0) return;
      this.presenceTimer = this.host ? 0.9 : 0.65;
      this.syncOwnSlot();
      if (this.host) {
        this.pruneStaleSlots();
        this.broadcastLobby();
        return;
      }
      this.sendSignal({ type: "hello", ...this.playerProfile(), ready: this.ready, vote: this.mapVote });
      this.broadcastReady();
    }

    updateDirectoryPresence(dt) {
      if (!this.host || !this.code || !window.fetch) return;
      this.directoryTimer -= dt;
      if (this.directoryTimer > 0) return;
      this.directoryTimer = 1.35;
      this.publishDirectoryPresence(this.game.mode === "lobby");
    }

    publishDirectoryPresence(open = true) {
      if (!this.host || !this.code || !window.fetch) return;
      const guests = this.guestCount();
      const now = Date.now();
      if (guests > 0) this.emptySince = 0;
      else if (!this.emptySince) this.emptySince = now;
      const payload = {
        type: "roomPresence",
        code: this.code,
        roomSession: this.roomSession || "",
        hostName: this.playerName(),
        open: Boolean(open),
        running: !open || this.game.mode === "game",
        emptySince: this.emptySince || 0,
        emptyFor: this.emptySince ? now - this.emptySince : 0,
        players: this.slots.filter(Boolean).length,
        maxPlayers: 4,
        sentAt: now,
        version: APP_VERSION
      };
      for (const relay of SIGNAL_RELAY_URLS) {
        fetch(`${relay}/${DIRECTORY_TOPIC}`, {
          method: "POST",
          body: JSON.stringify(payload)
        }).catch(() => {});
      }
    }

    checkJoinTimeout() {
      if (!this.joinPending || this.host || !this.code) return;
      if (Date.now() - this.joinStartedAt < 9500) return;
      if (this.lastLobbyAt > 0 || this.openPeerCount() > 0) {
        this.joinPending = false;
        return;
      }
      this.close();
      this.code = "";
      this.ready = false;
      this.joinPending = false;
      this.slots = [{ ...this.playerProfile(), ready: false, vote: this.mapVote, host: false }];
      this.game.toast("Không tìm thấy phòng này");
      if (this.game.mode === "lobby" || this.game.roomFinderOpen) this.game.showRoomFinder(false);
    }

    openSignal() {
      if (!("RTCPeerConnection" in window)) {
        this.game.toast("Trình duyệt không hỗ trợ chơi nhiều người");
        return;
      }
      this.signalSince = Date.now() - 15000;
      this.remotePollSince = 0;
      this.signalTopic = `soulrift-${this.code.toLowerCase()}`;
      if ("BroadcastChannel" in window) {
        this.signal = new BroadcastChannel(this.signalTopic);
        this.signal.onmessage = (event) => this.onSignal(event.data);
      }
      this.openRemoteSignal();
    }

    openRemoteSignal() {
      if (!("EventSource" in window) || !window.fetch || !this.signalTopic) return;
      const since = SIGNAL_HISTORY;
      this.remoteSignals = [];
      for (const relay of SIGNAL_RELAY_URLS) {
        try {
          const url = `${relay}/${encodeURIComponent(this.signalTopic)}/sse?since=${since}`;
          const signal = new EventSource(url);
          signal.onmessage = (event) => this.onRemoteSignal(event);
          signal.onerror = () => {
            if (this.game.mode === "lobby") this.game.renderLobby();
          };
          this.remoteSignals.push(signal);
          if (!this.remoteSignal) this.remoteSignal = signal;
        } catch {
          // Try the next relay.
        }
      }
    }

    onRemoteSignal(event) {
      try {
        this.handleRemoteEnvelope(JSON.parse(event.data)).catch(() => {});
      } catch {
        // Ignore unrelated public relay messages.
      }
    }

    async pollRemoteSignal(dt) {
      if (!window.fetch || !this.signalTopic) return;
      this.remotePollTimer -= dt;
      if (this.remotePollTimer > 0 || this.remotePollBusy) return;
      this.remotePollTimer = this.joinPending ? 0.28 : this.host ? 0.65 : 0.85;
      this.remotePollBusy = true;
      try {
        const since = this.remotePollSince ? Math.floor(this.remotePollSince / 1000) : SIGNAL_HISTORY;
        const readRelay = async (relay) => {
          const controller = "AbortController" in window ? new AbortController() : null;
          const timeout = controller ? setTimeout(() => controller.abort(), this.joinPending ? 1300 : 1800) : 0;
          try {
            const response = await fetch(`${relay}/${encodeURIComponent(this.signalTopic)}/json?poll=1&since=${since}`, { cache: "no-store", signal: controller?.signal });
            return response.ok ? await response.text() : "";
          } catch {
            return "";
          } finally {
            if (timeout) clearTimeout(timeout);
          }
        };
        const relayTexts = await Promise.all(SIGNAL_RELAY_URLS.map((relay) => readRelay(relay)));
        for (const text of relayTexts) {
          for (const line of text.split(/\r?\n/)) {
            if (!line.trim()) continue;
            try {
              await this.handleRemoteEnvelope(JSON.parse(line));
            } catch {
              // Relay polling can include stale or malformed public messages.
            }
          }
        }
      } catch {
        // SSE is still active when polling fails.
      } finally {
        this.remotePollBusy = false;
      }
    }

    async handleRemoteEnvelope(envelope) {
      try {
        if (!envelope || (envelope.event && envelope.event !== "message")) return;
        const payload = typeof envelope.message === "string" ? JSON.parse(envelope.message) : envelope.message;
        if (!payload) return;
        const relayTime = Number(envelope.time || 0) * 1000;
        this.remotePollSince = Math.max(this.remotePollSince || 0, relayTime + 1);
        await this.onSignal(payload);
      } catch {
        // Ignore unrelated public relay messages.
      }
    }

    sendSignal(message, target = "") {
      const payload = { ...message, from: this.id, target, sentAt: Date.now(), signalId: message.signalId || uid("signal"), roomSession: message.roomSession || this.roomSession || "" };
      if (this.signal) this.signal.postMessage(payload);
      if (window.fetch && this.signalTopic) {
        for (const relay of SIGNAL_RELAY_URLS) {
          fetch(`${relay}/${encodeURIComponent(this.signalTopic)}`, {
            method: "POST",
            body: JSON.stringify(payload)
          }).catch(() => {});
        }
      }
    }

    async onSignal(message) {
      if (!message || message.from === this.id) return;
      if (message.target && message.target !== this.id) return;
      if (message.signalId) {
        if (this.seenSignals.has(message.signalId)) return;
        this.seenSignals.add(message.signalId);
        if (this.seenSignals.size > 300) this.seenSignals.clear();
      }
      const scopedTypes = new Set(["state", "attack", "skill", "collect", "openChest", "dropItem", "damage", "snapshot", "needSnapshot", "chooseDoor", "leaveRun"]);
      if (message.roomSession && this.roomSession && message.roomSession !== this.roomSession && scopedTypes.has(message.type)) return;
      if (message.type === "start" && (!message.roomSession || !this.roomSession || message.roomSession !== this.roomSession)) return;

      if (message.type === "hello" && this.host) {
        this.upsertSlot({
          id: message.from,
          name: message.name || `Người chơi ${this.slots.length + 1}`,
          ready: Boolean(message.ready),
          vote: this.mapVote,
          powerId: message.powerId || "",
          characterId: message.characterId || "swordsman",
          host: false
        });
        this.renderLobbyIfVisible();
        const peer = this.ensurePeer(message.from, true);
        if (!peer.pc.localDescription && peer.pc.signalingState === "stable") {
          const offer = await peer.pc.createOffer();
          await peer.pc.setLocalDescription(offer);
          this.sendSignal({ type: "offer", sdp: offer }, message.from);
        }
        this.sendSignal({ type: "lobby", slots: this.slots, mapVote: this.mapVote, difficultyVote: this.difficultyVote }, message.from);
        this.broadcastLobby();
      }

      if (message.type === "lobby" && !this.host && Array.isArray(message.slots)) {
        if (message.roomSession) this.roomSession = message.roomSession;
        this.slots = message.slots;
        this.joinPending = false;
        this.lastLobbyAt = Date.now();
        this.game.rememberRoomCode(this.code);
        if (message.mapVote) this.mapVote = message.mapVote;
        if (message.difficultyVote) this.difficultyVote = message.difficultyVote;
        this.renderLobbyIfVisible();
      }

      if (message.type === "ready" && this.host) {
        this.upsertSlot({
          id: message.from,
          name: message.name || "Người chơi",
          ready: Boolean(message.ready),
          vote: this.mapVote,
          powerId: message.powerId || "",
          characterId: message.characterId || "swordsman",
          host: false
        });
        this.broadcastLobby();
        this.renderLobbyIfVisible();
      }

      if (message.type === "start" && !this.host) {
        this.handleStart(message);
      }

      if (message.type === "state") this.applyRemoteState(message.from, message.state);
      if (message.type === "attack" && this.host) this.game.handleRemoteAttack(message.from, message.attack);
      if (message.type === "skill" && this.host) this.game.handleRemoteSkill(message.from, message.skill);
      if (message.type === "collect" && this.host) this.game.handleRemoteCollect(message.from, message.pickupId);
      if (message.type === "openChest" && this.host) this.game.handleRemoteOpenChest(message.from, message.pickupId, message.x, message.y);
      if (message.type === "dropItem" && this.host) this.game.handleRemoteDropItem(message.from, message.itemId, message.x, message.y, message.facing);
      if (message.type === "chooseDoor" && this.host) this.game.handleRemoteDoorChoice(message.from, message.objectId, message.room);
      if (message.type === "leaveRun") this.game.handleRemoteLeaveRun(message.from);
      if (message.type === "damage" && !this.host) this.game.applyHostDamage(message.amount);
      if (message.type === "snapshot" && !this.host) this.game.applyNetworkSnapshot(message.snapshot);
      if (message.type === "needSnapshot" && this.host) this.game.sendNetworkSnapshotTo(message.from);

      if (message.type === "offer") {
        const peer = this.ensurePeer(message.from, false);
        await peer.pc.setRemoteDescription(message.sdp);
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        this.sendSignal({ type: "answer", sdp: answer }, message.from);
      }

      if (message.type === "answer") {
        const peer = this.peers.get(message.from);
        if (peer) await peer.pc.setRemoteDescription(message.sdp);
      }

      if (message.type === "ice") {
        const peer = this.peers.get(message.from);
        if (peer && message.candidate) {
          try {
            await peer.pc.addIceCandidate(message.candidate);
          } catch {
            // Candidate races are harmless in the local signaling path.
          }
        }
      }
    }

    ensurePeer(remoteId, initiator) {
      if (this.peers.has(remoteId)) return this.peers.get(remoteId);
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      const peer = { pc, channel: null, remoteId };
      pc.onicecandidate = (event) => {
        if (event.candidate) this.sendSignal({ type: "ice", candidate: event.candidate }, remoteId);
      };
      pc.ondatachannel = (event) => {
        peer.channel = event.channel;
        this.bindChannel(peer);
      };
      if (initiator) {
        peer.channel = pc.createDataChannel("soulrift");
        this.bindChannel(peer);
      }
      this.peers.set(remoteId, peer);
      return peer;
    }

    bindChannel(peer) {
      if (!peer.channel) return;
      peer.channel.onopen = () => {
        this.joinPending = false;
        if (!this.host && this.code) this.game.rememberRoomCode(this.code);
        if (this.host) {
          this.sendPeer(peer, { type: "lobby", slots: this.slots, mapVote: this.mapVote, difficultyVote: this.difficultyVote });
          if (this.lastStartMessage && Date.now() - this.lastStartAt < 15000) this.sendPeer(peer, this.lastStartMessage);
        }
        else {
          this.sendPeer(peer, { type: "hello", ...this.playerProfile(), ready: this.ready, vote: this.mapVote });
          this.sendPeer(peer, { type: "ready", ...this.playerProfile(), ready: this.ready, vote: this.mapVote });
        }
        this.game.toast("Đã kết nối người chơi");
        this.renderLobbyIfVisible();
      };
      peer.channel.onclose = () => {
        if (this.game.mode === "lobby") this.game.renderLobby();
      };
      peer.channel.onmessage = (event) => {
        try {
          this.onPeer(JSON.parse(event.data), peer);
        } catch {
          // Ignore malformed peer messages.
        }
      };
    }

    bindPeerJsConnection(conn) {
      if (!conn) return;
      const remoteId = conn.peer || uid("peerjs");
      const peer = { pc: null, channel: conn, remoteId, peerJs: true };
      this.peers.set(remoteId, peer);
      conn.on("open", () => {
        this.joinPending = false;
        if (!this.host && this.code) this.game.rememberRoomCode(this.code);
        if (this.host) {
          this.sendPeer(peer, { type: "lobby", slots: this.slots, mapVote: this.mapVote, difficultyVote: this.difficultyVote });
          if (this.lastStartMessage && Date.now() - this.lastStartAt < 15000) this.sendPeer(peer, this.lastStartMessage);
        } else {
          this.sendPeer(peer, { type: "hello", ...this.playerProfile(), ready: this.ready, vote: this.mapVote });
          this.sendPeer(peer, { type: "ready", ...this.playerProfile(), ready: this.ready, vote: this.mapVote });
        }
        this.game.toast("Đã kết nối người chơi");
        this.renderLobbyIfVisible();
      });
      conn.on("data", (data) => {
        try {
          const message = typeof data === "string" ? JSON.parse(data) : data;
          this.onPeer(message, peer);
        } catch {
          // Ignore malformed PeerJS messages.
        }
      });
      conn.on("close", () => {
        if (this.game.mode === "lobby") this.game.renderLobby();
      });
      conn.on("error", () => {
        if (this.joinPending) this.joinRetryTimers.push(setTimeout(() => this.connectPeerJsRoom(), 900));
      });
    }

    applyRemoteState(remoteId, state) {
      if (!remoteId || !state) return;
      const previous = this.game.remotePlayers.get(remoteId) || {};
      const slot = this.slots.find((entry) => entry.id === remoteId);
      const x = Number(state.x);
      const y = Number(state.y);
      const nextX = Number.isFinite(x) ? x : previous.x;
      const nextY = Number.isFinite(y) ? y : previous.y;
      const previousDisplayX = Number.isFinite(previous.displayX) ? previous.displayX : (Number.isFinite(previous.x) ? previous.x : nextX);
      const previousDisplayY = Number.isFinite(previous.displayY) ? previous.displayY : (Number.isFinite(previous.y) ? previous.y : nextY);
      const snap = !Number.isFinite(previousDisplayX) || !Number.isFinite(previousDisplayY) || Math.hypot(nextX - previousDisplayX, nextY - previousDisplayY) > 520;
      this.game.remotePlayers.set(remoteId, {
        ...previous,
        ...state,
        id: remoteId,
        name: state.name || previous.name || slot?.name || "Người chơi",
        displayX: snap ? nextX : previousDisplayX,
        displayY: snap ? nextY : previousDisplayY,
        t: performance.now()
      });
    }

    onPeer(message, peer) {
      const senderId = message?.from || message?.id || peer.remoteId;
      if (senderId && senderId !== peer.remoteId) {
        this.peers.delete(peer.remoteId);
        peer.remoteId = senderId;
        this.peers.set(senderId, peer);
      }
      const scopedTypes = new Set(["state", "attack", "skill", "collect", "openChest", "dropItem", "damage", "snapshot", "needSnapshot", "chooseDoor", "leaveRun"]);
      if (message.roomSession && this.roomSession && message.roomSession !== this.roomSession && scopedTypes.has(message.type)) return;
      if (message.type === "start" && (!message.roomSession || !this.roomSession || message.roomSession !== this.roomSession)) return;
      if (message.type === "ready") {
        this.upsertSlot({
          id: senderId,
          name: message.name || "Người chơi",
          ready: Boolean(message.ready),
          vote: this.host ? this.mapVote : (message.vote || this.mapVote),
          powerId: message.powerId || "",
          characterId: message.characterId || "swordsman",
          host: Boolean(message.host)
        });
        if (this.host) this.broadcastLobby();
        this.renderLobbyIfVisible();
      }
      if (message.type === "hello" && this.host) {
        this.upsertSlot({
          id: senderId,
          name: message.name || "Người chơi",
          ready: Boolean(message.ready),
          vote: this.mapVote,
          powerId: message.powerId || "",
          characterId: message.characterId || "swordsman",
          host: false
        });
        this.broadcastLobby();
        this.renderLobbyIfVisible();
      }
      if (message.type === "lobby" && !this.host && Array.isArray(message.slots)) {
        if (message.roomSession) this.roomSession = message.roomSession;
        this.slots = message.slots;
        this.joinPending = false;
        this.lastLobbyAt = Date.now();
        this.game.rememberRoomCode(this.code);
        if (message.mapVote) this.mapVote = message.mapVote;
        if (message.difficultyVote) this.difficultyVote = message.difficultyVote;
        this.renderLobbyIfVisible();
      }
      if (message.type === "state") {
        this.applyRemoteState(senderId, message.state);
      }
      if (message.type === "attack" && this.host) {
        this.game.handleRemoteAttack(senderId, message.attack);
      }
      if (message.type === "skill" && this.host) {
        this.game.handleRemoteSkill(senderId, message.skill);
      }
      if (message.type === "damage" && !this.host) {
        this.game.applyHostDamage(message.amount);
      }
      if (message.type === "collect" && this.host) {
        this.game.handleRemoteCollect(senderId, message.pickupId);
      }
      if (message.type === "openChest" && this.host) {
        this.game.handleRemoteOpenChest(senderId, message.pickupId, message.x, message.y);
      }
      if (message.type === "dropItem" && this.host) {
        this.game.handleRemoteDropItem(senderId, message.itemId, message.x, message.y, message.facing);
      }
      if (message.type === "chooseDoor" && this.host) {
        this.game.handleRemoteDoorChoice(senderId, message.objectId, message.room);
      }
      if (message.type === "leaveRun") {
        this.game.handleRemoteLeaveRun(senderId);
      }
      if (message.type === "snapshot" && !this.host) {
        this.game.applyNetworkSnapshot(message.snapshot);
      }
      if (message.type === "needSnapshot" && this.host) {
        this.game.sendNetworkSnapshotTo(senderId);
      }
      if (message.type === "start") {
        this.handleStart(message);
      }
    }

    handleStart(message) {
      if (this.host || !message?.seed) return;
      if (!message.roomSession || !this.roomSession || message.roomSession !== this.roomSession) return;
      if (this.game.run?.multiplayer && this.game.run.seed === message.seed) return;
      if (Array.isArray(message.slots)) this.slots = message.slots;
      this.joinPending = false;
      this.lastLobbyAt = Date.now();
      if (this.code) this.game.rememberRoomCode(this.code);
      const ownPowerId = this.game.save.account.selectedPower || message.powerId;
      const startPower = powerById(ownPowerId || message.powerId);
      if (message.difficultyId) this.difficultyVote = message.difficultyId;
      this.game.toast("Chủ phòng đã bắt đầu");
      this.game.startRun(startPower, message.biomeId, { multiplayer: true, host: false, seed: message.seed, difficulty: message.difficultyId || this.difficultyVote || "normal" });
    }

    renderLobbyIfVisible() {
      if (this.game.mode === "lobby" || this.game.roomFinderOpen) this.game.renderLobby();
    }

    upsertSlot(slot) {
      const existing = this.slots.find((entry) => entry.id === slot.id);
      const fallback = existing?.name || `Người chơi ${this.slots.length + 1}`;
      const cleanSlot = { ...slot, name: this.slotName(slot, fallback), seenAt: Date.now() };
      if (existing) {
        Object.assign(existing, cleanSlot);
      } else if (this.slots.length < 4) {
        this.slots.push(cleanSlot);
      }
    }

    pruneStaleSlots() {
      if (!this.host) return;
      const now = Date.now();
      this.slots = this.slots.filter((slot) => {
        if (!slot || slot.host) return true;
        if (this.hasOpenPeer(slot.id)) return true;
        return now - (slot.seenAt || 0) < 12000;
      });
    }

    toggleReady() {
      if (this.host) return;
      this.ready = !this.ready;
      this.syncOwnSlot();
      this.sendReadyBurst();
      this.game.renderLobby();
    }

    setVote(biomeId) {
      if (!this.host && this.code) {
        this.game.toast("Chỉ chủ phòng được chọn ải");
        return;
      }
      this.mapVote = biomeId;
      for (const slot of this.slots) slot.vote = biomeId;
      this.syncOwnSlot();
      this.broadcastReady();
      this.broadcastLobby();
      this.game.renderLobby();
    }

    setDifficulty(difficultyId) {
      const difficulty = DIFFICULTIES.find((entry) => entry.id === difficultyId);
      if (!difficulty) return;
      if (!this.host && this.code) {
        this.game.toast("Chỉ chủ phòng được chọn độ khó");
        return;
      }
      this.difficultyVote = difficulty.id;
      this.syncOwnSlot();
      this.broadcastLobby();
      this.game.renderLobby();
    }

    broadcastReady() {
      const message = { type: "ready", ...this.playerProfile(), ready: this.ready, vote: this.mapVote, host: this.host };
      if (!this.host && this.code) this.sendSignal(message);
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, message);
      }
    }

    sendReadyBurst() {
      for (const timer of this.readyRetryTimers) clearTimeout(timer);
      this.readyRetryTimers = [];
      const send = () => {
        if (this.host || !this.code) return;
        this.sendSignal({ type: "hello", ...this.playerProfile(), ready: this.ready, vote: this.mapVote });
        this.broadcastReady();
      };
      send();
      for (const delay of [120, 320, 700, 1300, 2300, 3800]) {
        this.readyRetryTimers.push(setTimeout(send, delay));
      }
    }

    broadcastLobby() {
      if (!this.host) return;
      if (this.code) this.sendSignal({ type: "lobby", slots: this.slots, mapVote: this.mapVote, difficultyVote: this.difficultyVote });
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, { type: "lobby", slots: this.slots, mapVote: this.mapVote, difficultyVote: this.difficultyVote });
      }
    }

    broadcastStart(powerId, biomeId, seed, slots = this.slots, difficultyId = this.difficultyVote) {
      for (const timer of this.startRetryTimers) clearTimeout(timer);
      this.startRetryTimers = [];
      const message = { type: "start", powerId, biomeId, seed, slots, difficultyId, roomSession: this.roomSession };
      this.lastStartMessage = message;
      this.lastStartAt = Date.now();
      const send = () => {
        if (this.code) this.sendSignal(message);
        for (const peer of this.peers.values()) this.sendPeer(peer, message);
      };
      send();
      for (const delay of [160, 360, 760, 1400, 2400, 3800, 5600]) {
        this.startRetryTimers.push(setTimeout(send, delay));
      }
    }

    hostId() {
      return this.slots.find((slot) => slot?.host)?.id || "";
    }

    guestCount() {
      return this.slots.filter((slot) => slot && !slot.host).length;
    }

    hasOpenPeer(remoteId) {
      const peer = this.peers.get(remoteId);
      return peer?.channel?.readyState === "open" || peer?.channel?.open === true;
    }

    sendState(state) {
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, { type: "state", state });
      }
      if (!this.host && !this.hasOpenPeers()) this.sendSignal({ type: "state", state }, this.hostId());
      if (this.host && this.code) {
        for (const slot of this.slots) {
          if (slot?.id && !slot.host && !this.hasOpenPeer(slot.id)) this.sendSignal({ type: "state", state }, slot.id);
        }
      }
    }

    sendAttack(attack) {
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, { type: "attack", attack });
      }
      if (!this.host && !this.hasOpenPeers()) this.sendSignal({ type: "attack", attack }, this.hostId());
    }

    sendSkill(skill) {
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, { type: "skill", skill });
      }
      if (!this.host && !this.hasOpenPeers()) this.sendSignal({ type: "skill", skill }, this.hostId());
    }

    sendDamage(remoteId, amount) {
      const peer = this.peers.get(remoteId);
      if (peer) this.sendPeer(peer, { type: "damage", amount });
      if (!this.hasOpenPeer(remoteId)) this.sendSignal({ type: "damage", amount }, remoteId);
    }

    sendCollect(pickupId) {
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, { type: "collect", pickupId });
      }
      if (!this.host && !this.hasOpenPeers()) this.sendSignal({ type: "collect", pickupId }, this.hostId());
    }

    sendOpenChest(pickupId, x, y) {
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, { type: "openChest", pickupId, x, y });
      }
      if (!this.host && !this.hasOpenPeers()) this.sendSignal({ type: "openChest", pickupId, x, y }, this.hostId());
    }

    sendDropItem(itemId, x = 0, y = 0, facing = 0) {
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, { type: "dropItem", itemId, x, y, facing });
      }
      if (!this.host && !this.hasOpenPeers()) this.sendSignal({ type: "dropItem", itemId, x, y, facing }, this.hostId());
    }

    sendDoorChoice(objectId = "", room = null) {
      const message = { type: "chooseDoor", objectId, room };
      for (const peer of this.peers.values()) this.sendPeer(peer, message);
      if (!this.host && !this.hasOpenPeers()) this.sendSignal(message, this.hostId());
    }

    sendLeaveRun() {
      const message = { type: "leaveRun" };
      for (const peer of this.peers.values()) this.sendPeer(peer, message);
      if (!this.host && !this.hasOpenPeers()) this.sendSignal(message, this.hostId());
      if (this.host && this.code) {
        for (const slot of this.slots) {
          if (slot?.id && !slot.host && !this.hasOpenPeer(slot.id)) this.sendSignal(message, slot.id);
        }
      }
    }

    requestSnapshot() {
      if (this.host || !this.code) return;
      const message = { type: "needSnapshot" };
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, message);
      }
      this.sendSignal(message, this.hostId());
    }

    sendSnapshot(remoteId, snapshot) {
      const peer = this.peers.get(remoteId);
      if (peer) this.sendPeer(peer, { type: "snapshot", snapshot });
      if (!this.hasOpenPeer(remoteId)) this.sendSignal({ type: "snapshot", snapshot }, remoteId);
    }

    broadcastSnapshot(snapshot, relaySnapshot = snapshot) {
      for (const peer of this.peers.values()) {
        this.sendPeer(peer, { type: "snapshot", snapshot });
      }
      if (this.code) {
        for (const slot of this.slots) {
          if (slot?.id && !slot.host && !this.hasOpenPeer(slot.id)) this.sendSignal({ type: "snapshot", snapshot: relaySnapshot || snapshot }, slot.id);
        }
      }
    }

    hasOpenPeers() {
      for (const peer of this.peers.values()) {
        if (peer.channel?.readyState === "open" || peer.channel?.open === true) return true;
      }
      return false;
    }

    openPeerCount() {
      let count = 0;
      for (const peer of this.peers.values()) {
        if (peer.channel?.readyState === "open" || peer.channel?.open === true) count++;
      }
      return count;
    }

    sendPeer(peer, message) {
      if (peer.channel?.readyState === "open" || peer.channel?.open === true) peer.channel.send(JSON.stringify({ from: this.id, roomSession: message.roomSession || this.roomSession || "", ...message }));
    }
  }

  class SoulriftGame {
    constructor() {
      this.canvas = document.getElementById("gameCanvas");
      this.ctx = this.canvas.getContext("2d");
      this.screen = document.getElementById("screen");
      this.hud = document.getElementById("hud");
      this.toastEl = document.getElementById("toast");
      this.quickActions = document.getElementById("quickActions");
      this.touchLayer = document.getElementById("touchLayer");
      this.mobileGate = document.getElementById("mobileGate");
      this.mobileGateButton = document.getElementById("mobileGateButton");
      this.pointerQuery = matchMedia("(hover: none), (pointer: coarse)");
      this.store = new SaveStore();
      this.audio = new AudioEngine(this);
      this.lobby = new PeerLobby(this);
      this.save = defaultSave();
      this.run = null;
      this.mode = "loading";
      this.last = 0;
      this.camera = { x: 0, y: 0, shake: 0, shakeX: 0, shakeY: 0 };
      this.input = {
        keys: new Set(),
        mouse: { x: 0, y: 0, worldX: 0, worldY: 0, left: false },
        touch: { x: 0, y: 0, rawX: 0, rawY: 0, active: false, aimX: 1, aimY: 0 },
        actions: new Set()
      };
      this.remotePlayers = new Map();
      this.publicRooms = [];
      this.roomFinderOpen = false;
      this.roomDirectoryTimer = 0;
      this.roomDirectoryBusy = false;
      this.joystickTouchId = null;
      this.menuTime = 0;
      this.networkTimer = 0;
      this.snapshotTimer = 0;
      this.resyncTimer = 0;
      this.chestOpenRequests = new Map();
      this.pauseOverlay = false;
      this.toastTimer = 0;
      this.nextHudSkillAt = 0;
      this.hudSkillMarkup = "";
      this.hudStatusMarkup = "";
      this.updateTimer = null;
      this.updateInProgress = false;
      this.perf = { avgDt: 1 / 60, quality: 1 };
      this.bindEvents();
      this.resize();
      this.updateMobileGate();
      this.init();
    }

    async init() {
      const loaded = await this.store.load();
      this.save = mergeSave(defaultSave(), loaded);
      this.normalizeSave();
      this.clearResolvedUpdateAttempt();
      this.startUpdateWatcher();
      this.mode = this.hasAccount() ? "menu" : "account";
      this.showMainMenu();
      requestAnimationFrame((time) => this.loop(time));
    }

    startUpdateWatcher() {
      this.checkForUpdate();
      if (this.updateTimer) clearInterval(this.updateTimer);
      this.updateTimer = setInterval(() => this.checkForUpdate(), VERSION_CHECK_INTERVAL);
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) this.checkForUpdate();
      });
    }

    async checkForUpdate() {
      if (this.updateInProgress || location.protocol === "file:") return;
      try {
        const response = await fetch(`version.json?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        });
        if (!response.ok) return;
        const data = await response.json();
        const latest = String(data.version || "").trim();
        if (!latest) return;
        if (latest === APP_VERSION) {
          this.clearResolvedUpdateAttempt();
          return;
        }
        if (this.shouldForceUpdate(latest)) this.forceUpdate(latest);
      } catch {
        // Silent: update checks should never interrupt play if the network is unavailable.
      }
    }

    versionRank(version) {
      const text = String(version || "");
      const date = Number((text.match(/^(\d{8})/) || [])[1] || 0);
      const build = Number((text.match(/-(\d+)$/) || [])[1] || 0);
      return date > 0 ? date * 1000 + build : 0;
    }

    shouldForceUpdate(latest) {
      const latestRank = this.versionRank(latest);
      const currentRank = this.versionRank(APP_VERSION);
      if (latestRank && currentRank && latestRank <= currentRank) return false;
      try {
        const previous = JSON.parse(sessionStorage.getItem(UPDATE_ATTEMPT_KEY) || "null");
        if (previous?.latest === latest && previous?.from === APP_VERSION) {
          if (!this.updateLoopWarned) {
            this.updateLoopWarned = true;
            this.toast("Đã thử cập nhật nhưng trình duyệt vẫn giữ bản cũ. Hãy tải lại mạnh nếu cần.");
          }
          return false;
        }
      } catch {
        sessionStorage.removeItem(UPDATE_ATTEMPT_KEY);
      }
      return true;
    }

    markUpdateAttempt(latest) {
      try {
        sessionStorage.setItem(UPDATE_ATTEMPT_KEY, JSON.stringify({ latest, from: APP_VERSION, t: Date.now() }));
      } catch {
        // Storage can be unavailable in some private modes; update still works without the loop guard.
      }
    }

    clearResolvedUpdateAttempt() {
      try {
        const previous = JSON.parse(sessionStorage.getItem(UPDATE_ATTEMPT_KEY) || "null");
        if (!previous || previous.latest === APP_VERSION) sessionStorage.removeItem(UPDATE_ATTEMPT_KEY);
      } catch {
        sessionStorage.removeItem(UPDATE_ATTEMPT_KEY);
      }
    }

    async forceUpdate(latest) {
      if (this.updateInProgress) return;
      this.updateInProgress = true;
      this.markUpdateAttempt(latest);
      this.toast(`Có bản mới ${latest}. Đang cập nhật...`);
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((reg) => reg.unregister()));
        }
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
      } catch {
        // Reload still forces the fresh index even if cache cleanup is blocked.
      }
      setTimeout(() => {
        const next = new URL(location.href);
        next.searchParams.set("update", latest);
        next.searchParams.set("t", Date.now().toString());
        location.replace(next.toString());
      }, 700);
    }

    normalizeSave() {
      this.save.auth ||= { currentUser: "", accounts: {} };
      this.save.auth.accounts ||= {};
      this.save.account ||= defaultSave().account;
      this.save.account.ownedPowers ||= [];
      this.save.account.powerSpins = Number.isFinite(this.save.account.powerSpins) ? this.save.account.powerSpins : 5;
      if (!CHARACTER_TYPES.some((character) => character.id === this.save.account.selectedCharacter)) {
        this.save.account.selectedCharacter = "swordsman";
      }
      for (const power of POWERS) {
        this.save.powers[power.id] ||= { level: 1, awakened: false, mastery: 0, rarity: power.rarity, unlocked: false };
        this.save.powers[power.id].rarity ||= power.rarity;
        this.save.powers[power.id].unlocked = this.save.account.ownedPowers.includes(power.id);
      }
      if (this.save.account.selectedPower && !this.save.account.ownedPowers.includes(this.save.account.selectedPower)) {
        this.save.account.selectedPower = this.save.account.ownedPowers[0] || "";
      }
      if (this.save.account.ownedPowers.length > 1) {
        const keep = this.save.account.selectedPower || this.save.account.ownedPowers[this.save.account.ownedPowers.length - 1];
        this.save.account.ownedPowers = keep ? [keep] : [];
        this.save.account.selectedPower = keep || "";
      }
      for (const power of POWERS) {
        this.save.powers[power.id].unlocked = this.save.account.ownedPowers.includes(power.id);
      }
      this.save.inventory = [];
      this.save.equipped = Object.fromEntries(SLOT_NAMES.map((slot) => [slot, ""]));
      this.save.materials ||= defaultProfile(this.save.account.username).materials;
      this.save.materials.gold = Math.max(0, Math.floor(Number(this.save.materials.gold || 0)));
      this.normalizeStatPoints();
      if (this.save.account.created && this.save.account.username && !this.save.auth.currentUser) {
        const key = accountKey(this.save.account.username);
        this.save.auth.currentUser = key;
        this.save.auth.accounts[key] ||= {
          username: this.save.account.username,
          passwordHash: "",
          createdAt: this.save.account.createdAt || new Date().toISOString(),
          profile: this.profileSnapshot()
        };
      }
      const active = this.save.auth.currentUser;
      if (active && this.save.auth.accounts[active]?.profile) {
        this.applyProfile(this.save.auth.accounts[active].profile);
      }
    }

    hasAccount() {
      return Boolean(this.save.auth?.currentUser && this.save.account?.created && this.save.account?.username);
    }

    profileSnapshot() {
      return cloneData({
        account: this.save.account,
        settings: this.save.settings,
        customization: this.save.customization,
        inventory: this.save.inventory,
        equipped: this.save.equipped,
        powers: this.save.powers,
        materials: this.save.materials,
        achievements: this.save.achievements,
        progression: this.save.progression
      });
    }

    applyProfile(profile) {
      const base = defaultProfile(profile?.account?.username || "");
      const merged = mergeSave(base, profile || {});
      this.save.account = merged.account;
      this.save.settings = merged.settings;
      this.save.customization = merged.customization;
      this.save.inventory = merged.inventory;
      this.save.equipped = merged.equipped;
      this.save.powers = merged.powers;
      this.save.materials = merged.materials;
      this.save.achievements = merged.achievements;
      this.save.progression = merged.progression;
      this.normalizeActiveProfile();
    }

    normalizeActiveProfile() {
      if (!CHARACTER_TYPES.some((character) => character.id === this.save.account.selectedCharacter)) {
        this.save.account.selectedCharacter = "swordsman";
      }
      this.save.account.ownedPowers ||= [];
      if (this.save.account.ownedPowers.length > 1) {
        const keep = this.save.account.selectedPower || this.save.account.ownedPowers[this.save.account.ownedPowers.length - 1];
        this.save.account.ownedPowers = keep ? [keep] : [];
        this.save.account.selectedPower = keep || "";
      }
      for (const power of POWERS) {
        this.save.powers[power.id] ||= { level: 1, awakened: false, mastery: 0, rarity: power.rarity, unlocked: false };
        this.save.powers[power.id].unlocked = this.save.account.ownedPowers.includes(power.id);
      }
      this.save.inventory = [];
      this.save.equipped = Object.fromEntries(SLOT_NAMES.map((slot) => [slot, ""]));
      this.save.materials ||= defaultProfile(this.save.account.username).materials;
      this.save.materials.gold = Math.max(0, Math.floor(Number(this.save.materials.gold || 0)));
      this.normalizeStatPoints();
    }

    normalizeStatPoints() {
      this.save.progression ||= {};
      this.save.progression.level = Math.max(1, Math.floor(Number(this.save.progression.level || 1)));
      this.save.progression.xp = Math.max(0, Number(this.save.progression.xp || 0));
      this.save.progression.totalXp = Math.max(0, Number(this.save.progression.totalXp || 0));
      this.save.progression.statPoints = Number.isFinite(this.save.progression.statPoints) ? this.save.progression.statPoints : 0;
      this.save.progression.statPoints = Math.max(0, Math.floor(this.save.progression.statPoints));
      this.save.progression.statUpgrades ||= {};
      for (const upgrade of STAT_POINT_UPGRADES) {
        const value = Number(this.save.progression.statUpgrades[upgrade.id] || 0);
        this.save.progression.statUpgrades[upgrade.id] = Math.max(0, Math.floor(value));
      }
    }

    validateAccountForm(username, password, confirm = password, registering = true) {
      if (username.length < 3 || username.length > 18) {
        this.toast("Tên tài khoản cần từ 3 đến 18 ký tự");
        return false;
      }
      if (!/^[\p{L}\p{N}_ ]+$/u.test(username)) {
        this.toast("Tên chỉ dùng chữ, số, dấu cách và dấu gạch dưới");
        return false;
      }
      if (password.length < 6) {
        this.toast("Mật khẩu cần ít nhất 6 ký tự");
        return false;
      }
      if (registering && password !== confirm) {
        this.toast("Mật khẩu xác nhận không khớp");
        return false;
      }
      return true;
    }

    registerAccount() {
      const username = (document.getElementById("registerUsername")?.value || "").trim().slice(0, 18);
      const password = document.getElementById("registerPassword")?.value || "";
      const confirm = document.getElementById("registerConfirm")?.value || "";
      if (!this.validateAccountForm(username, password, confirm, true)) return;
      const key = accountKey(username);
      if (this.save.auth.accounts[key]) {
        this.toast("Tài khoản này đã tồn tại");
        return;
      }
      const profile = defaultProfile(username);
      this.save.auth.accounts[key] = {
        username,
        passwordHash: passwordHash(username, password),
        createdAt: profile.account.createdAt,
        profile
      };
      this.save.auth.currentUser = key;
      this.applyProfile(profile);
      this.persist();
      this.toast(`Chào mừng ${username}`);
      this.showMainMenu();
    }

    loginAccount() {
      const username = (document.getElementById("loginUsername")?.value || "").trim();
      const password = document.getElementById("loginPassword")?.value || "";
      if (!this.validateAccountForm(username, password, password, false)) return;
      const key = accountKey(username);
      const account = this.save.auth.accounts[key];
      if (!account) {
        this.toast("Không tìm thấy tài khoản");
        return;
      }
      if (account.passwordHash && account.passwordHash !== passwordHash(account.username, password)) {
        this.toast("Sai mật khẩu");
        return;
      }
      if (!account.passwordHash) account.passwordHash = passwordHash(account.username, password);
      this.save.auth.currentUser = key;
      this.applyProfile(account.profile);
      this.persist();
      this.toast(`Đã đăng nhập ${account.username}`);
      this.showMainMenu();
    }

    logoutAccount() {
      this.persist();
      this.save.auth.currentUser = "";
      this.applyProfile(defaultProfile(""));
      this.store.save(this.save);
      this.toast("Đã đăng xuất");
      this.showAccountGate();
    }

    showAccountGate() {
      this.mode = "account";
      this.hud.classList.add("hidden");
      this.touchLayer.classList.add("hidden");
      const accountCount = Object.keys(this.save.auth?.accounts || {}).length;
      this.setScreen(`
        <section class="account-panel wide-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Tài Khoản</h2>
              <p class="panel-subtitle">Đăng nhập hoặc đăng ký hồ sơ cục bộ. Đã lưu ${accountCount} tài khoản trên máy này.</p>
            </div>
          </div>
          <div class="account-grid">
            <div class="account-copy">
              <div class="account-badge">5 LƯỢT QUAY SỨC MẠNH</div>
              <h3>Khởi đầu sạch</h3>
              <p>Tài khoản mới không có vật phẩm. Sức mạnh phải quay ở ngoài ải, sau đó chọn một sức mạnh để mang vào trận.</p>
            </div>
            <div class="account-form">
              <h3>Đăng Nhập</h3>
              <label>
                <span>Tên tài khoản</span>
                <input id="loginUsername" class="field" maxlength="18" placeholder="Tên đã đăng ký" autocomplete="username" />
              </label>
              <label>
                <span>Mật khẩu</span>
                <input id="loginPassword" class="field" type="password" maxlength="32" placeholder="Mật khẩu" autocomplete="current-password" />
              </label>
              <button class="btn primary" data-action="login-account">ĐĂNG NHẬP</button>
            </div>
            <div class="account-form">
              <h3>Đăng Ký</h3>
              <label>
                <span>Tên tài khoản</span>
                <input id="registerUsername" class="field" maxlength="18" placeholder="3-18 ký tự" autocomplete="username" />
              </label>
              <label>
                <span>Mật khẩu</span>
                <input id="registerPassword" class="field" type="password" maxlength="32" placeholder="Ít nhất 6 ký tự" autocomplete="new-password" />
              </label>
              <label>
                <span>Xác nhận</span>
                <input id="registerConfirm" class="field" type="password" maxlength="32" placeholder="Nhập lại mật khẩu" autocomplete="new-password" />
              </label>
              <button class="btn primary" data-action="register-account">TẠO TÀI KHOẢN</button>
            </div>
          </div>
        </section>
      `);
    }

    bindEvents() {
      window.addEventListener("resize", () => {
        this.resize();
        this.updateMobileGate();
      });
      window.addEventListener("orientationchange", () => {
        window.setTimeout(() => this.updateMobileGate(), 220);
      });
      document.addEventListener("fullscreenchange", () => this.updateMobileGate());
      document.addEventListener("webkitfullscreenchange", () => this.updateMobileGate());
      this.mobileGateButton?.addEventListener("click", () => this.enterMobilePlayMode());
      window.addEventListener("keydown", (event) => this.onKeyDown(event));
      window.addEventListener("keyup", (event) => this.input.keys.delete(event.code));
      this.canvas.addEventListener("mousemove", (event) => this.updateMouse(event));
      this.canvas.addEventListener("mousedown", (event) => {
        this.audio.start();
        this.updateMouse(event);
        if (event.button === 0) this.input.mouse.left = true;
      });
      window.addEventListener("mouseup", (event) => {
        if (event.button === 0) this.input.mouse.left = false;
      });
      this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
      this.screen.addEventListener("click", (event) => {
        const statusTarget = event.target.closest("[data-status-index]");
        if (statusTarget && this.mode === "status") {
          this.showStatusEffects(Number(statusTarget.dataset.statusIndex || 0));
          return;
        }
        const target = event.target.closest("[data-action]");
        if (target) this.handleAction(target.dataset.action, target);
      });
      this.hud.addEventListener("click", (event) => {
        const target = event.target.closest("[data-status-index]");
        if (target) this.showStatusEffects(Number(target.dataset.statusIndex || 0));
      });
      this.quickActions?.addEventListener("click", (event) => {
        const target = event.target.closest("[data-quick]");
        if (!target) return;
        event.preventDefault();
        this.triggerQuickAction(target.dataset.quick);
      });
      this.screen.addEventListener("input", (event) => this.handleInput(event));
      this.bindTouchControls();
      this.updateMobileGate();
    }

    isMobileDevice() {
      return this.pointerQuery.matches;
    }

    isLandscapeView() {
      return window.innerWidth >= window.innerHeight;
    }

    canRequestFullscreen() {
      const target = document.documentElement;
      return Boolean(target.requestFullscreen || target.webkitRequestFullscreen || this.canvas.webkitRequestFullscreen);
    }

    isFullscreenActive() {
      return Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        navigator.standalone ||
        matchMedia("(display-mode: fullscreen)").matches
      );
    }

    worldViewScale() {
      if (!this.run || !this.isMobileDevice()) return 1;
      const shortSide = Math.min(window.innerWidth, window.innerHeight);
      if (shortSide <= 380) return 0.62;
      if (shortSide <= 430) return 0.66;
      return 0.7;
    }

    worldViewWidth() {
      return this.width / this.worldViewScale();
    }

    worldViewHeight() {
      return this.height / this.worldViewScale();
    }

    mobileCameraLead(player) {
      if (!this.isMobileDevice()) return { x: 0, y: 0 };
      const moveMag = Math.hypot(this.input.touch.x, this.input.touch.y);
      let dx = 0;
      let dy = 0;
      if (moveMag > 0.2) {
        dx = this.input.touch.x / moveMag;
        dy = this.input.touch.y / moveMag;
      } else {
        dx = Math.cos(player.facing || 0);
        dy = Math.sin(player.facing || 0);
      }
      const amount = Math.min(this.worldViewWidth(), this.worldViewHeight()) * 0.075 * clamp(moveMag, 0.35, 1);
      return { x: dx * amount, y: dy * amount };
    }

    updateTouchVector(dt) {
      const touch = this.input.touch;
      const targetX = touch.active ? touch.rawX || 0 : 0;
      const targetY = touch.active ? touch.rawY || 0 : 0;
      const blend = Math.min(1, dt * (touch.active ? 10 : 18));
      touch.x += (targetX - touch.x) * blend;
      touch.y += (targetY - touch.y) * blend;
      if (!touch.active && Math.hypot(touch.x, touch.y) < 0.015) {
        touch.x = 0;
        touch.y = 0;
      }
    }

    updatePerformanceState(dt) {
      const frame = clamp(dt || 1 / 60, 1 / 120, 0.12);
      this.perf.avgDt = this.perf.avgDt * 0.94 + frame * 0.06;
      if (this.perf.avgDt > 0.024) {
        this.perf.quality = clamp(this.perf.quality - frame * 0.74, 0.42, 1);
      } else if (this.perf.avgDt < 0.0185) {
        this.perf.quality = clamp(this.perf.quality + frame * 0.2, 0.42, 1);
      }
    }

    particleSpawnChance(shape = "spark") {
      if (["crit", "plus"].includes(shape)) return 1;
      const mobileBias = this.isMobileDevice() ? 0.68 : 0.88;
      return clamp(mobileBias * (0.46 + this.perf.quality * 0.54), 0.24, 0.92);
    }

    particleLimit() {
      const base = this.isMobileDevice() ? 90 : 165;
      return Math.round(base * (0.58 + this.perf.quality * 0.42));
    }

    effectLimit() {
      const base = this.isMobileDevice() ? 44 : 78;
      return Math.round(base * (0.72 + (this.perf?.quality ?? 1) * 0.28));
    }

    glow(value) {
      const quality = this.perf?.quality ?? 1;
      if (quality < 0.56) return 0;
      return value * clamp(quality * (this.isMobileDevice() ? 0.38 : 0.62), 0.12, 0.72);
    }

    trimVisualList(list, limit) {
      if (list.length > limit) list.splice(0, list.length - limit);
    }

    trimEffectList() {
      if (!this.run) return;
      const limit = this.effectLimit();
      while (this.run.effects.length > limit) {
        const index = this.run.effects.findIndex((effect) => (
          effect.type === "attackBurst" ||
          effect.type === "hitSpark" ||
          effect.type === "castBurst" ||
          effect.type === "castCone" ||
          effect.type === "skillShape" ||
          effect.type === "powerGlyph"
        ));
        this.run.effects.splice(index >= 0 ? index : 0, 1);
      }
    }

    viewBounds(pad = 0) {
      const viewW = this.renderViewW || this.worldViewWidth();
      const viewH = this.renderViewH || this.worldViewHeight();
      return {
        left: this.camera.x - pad,
        top: this.camera.y - pad,
        right: this.camera.x + viewW + pad,
        bottom: this.camera.y + viewH + pad
      };
    }

    inView(x, y, pad = 120) {
      const viewW = this.renderViewW || this.worldViewWidth();
      const viewH = this.renderViewH || this.worldViewHeight();
      return x >= this.camera.x - pad && x <= this.camera.x + viewW + pad && y >= this.camera.y - pad && y <= this.camera.y + viewH + pad;
    }

    updateMobileGate() {
      if (!this.mobileGate) return;
      const mobile = this.isMobileDevice();
      const needsLandscape = mobile && !this.isLandscapeView();
      const needsFullscreen = mobile && this.canRequestFullscreen() && !this.isFullscreenActive();
      const visible = needsLandscape || needsFullscreen;
      this.mobileGate.classList.toggle("hidden", !visible);
      this.mobileGate.classList.toggle("portrait", needsLandscape);
      this.mobileGate.classList.toggle("fullscreen-missing", needsFullscreen);
      document.body.classList.toggle("mobile-gate-active", visible);
    }

    async enterMobilePlayMode() {
      this.audio.start();
      const target = document.documentElement;
      try {
        if (!this.isFullscreenActive()) {
          if (target.requestFullscreen) {
            try {
              await target.requestFullscreen({ navigationUI: "hide" });
            } catch {
              await target.requestFullscreen();
            }
          } else if (target.webkitRequestFullscreen) {
            target.webkitRequestFullscreen();
          } else if (this.canvas.webkitRequestFullscreen) {
            this.canvas.webkitRequestFullscreen();
          }
        }
      } catch {
        this.toast("Trình duyệt đang chặn toàn màn hình, hãy xoay ngang và thử lại");
      }
      try {
        if (screen.orientation?.lock) await screen.orientation.lock("landscape");
      } catch {
        // Some mobile browsers only allow manual rotation.
      }
      this.updateMobileGate();
    }

    bindTouchControls() {
      const stick = document.getElementById("stick");
      const nub = stick.querySelector("span");
      const placeStick = (touch) => {
        const size = stick.offsetWidth || 132;
        const half = size / 2;
        const maxX = Math.min(window.innerWidth * 0.48, window.innerWidth - half - 8);
        const x = clamp(touch.clientX, half + 8, maxX);
        const y = clamp(touch.clientY, half + 8, window.innerHeight - half - 8);
        stick.style.left = `${x - half}px`;
        stick.style.top = `${y - half}px`;
        stick.style.bottom = "auto";
      };
      const updateStick = (touch) => {
        const rect = stick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = touch.clientX - cx;
        const dy = touch.clientY - cy;
        const len = Math.hypot(dx, dy);
        const max = rect.width * 0.46;
        const nx = len > 0 ? dx / len : 0;
        const ny = len > 0 ? dy / len : 0;
        const rawMag = clamp(len / max, 0, 1);
        const deadzone = 0.18;
        const mag = rawMag <= deadzone ? 0 : Math.pow((rawMag - deadzone) / (1 - deadzone), 1.35);
        this.input.touch.rawX = nx * mag;
        this.input.touch.rawY = ny * mag;
        this.input.touch.active = true;
        stick.classList.add("active");
        if (mag > 0.16) {
          this.input.touch.aimX = nx;
          this.input.touch.aimY = ny;
        }
        nub.style.transform = `translate(${nx * rawMag * max}px, ${ny * rawMag * max}px)`;
      };
      const beginStick = (touch, floating = false) => {
        if (this.joystickTouchId !== null) return;
        this.joystickTouchId = touch.identifier;
        if (floating) placeStick(touch);
        updateStick(touch);
      };
      const touchById = (touches) => Array.from(touches).find((touch) => touch.identifier === this.joystickTouchId);
      stick.addEventListener("touchstart", (event) => {
        event.preventDefault();
        beginStick(event.changedTouches[0], false);
      }, { passive: false });
      stick.addEventListener("touchmove", (event) => {
        event.preventDefault();
        const touch = touchById(event.changedTouches) || touchById(event.touches);
        if (touch) updateStick(touch);
      }, { passive: false });
      const resetStick = () => {
        this.input.touch.x = 0;
        this.input.touch.y = 0;
        this.input.touch.rawX = 0;
        this.input.touch.rawY = 0;
        this.input.touch.active = false;
        this.joystickTouchId = null;
        stick.classList.remove("active");
        nub.style.transform = "translate(0, 0)";
      };
      const maybeResetStick = (event) => {
        if (this.joystickTouchId === null) return;
        if (touchById(event.changedTouches)) resetStick();
      };
      stick.addEventListener("touchend", maybeResetStick);
      stick.addEventListener("touchcancel", maybeResetStick);
      this.canvas.addEventListener("touchstart", (event) => {
        if (!this.run || this.mode !== "game") return;
        const touch = Array.from(event.changedTouches).find((item) => item.clientX < window.innerWidth * 0.52);
        if (!touch) return;
        event.preventDefault();
        beginStick(touch, true);
      }, { passive: false });
      this.canvas.addEventListener("touchmove", (event) => {
        const touch = touchById(event.changedTouches) || touchById(event.touches);
        if (!touch) return;
        event.preventDefault();
        updateStick(touch);
      }, { passive: false });
      this.canvas.addEventListener("touchend", maybeResetStick);
      this.canvas.addEventListener("touchcancel", maybeResetStick);
      for (const button of document.querySelectorAll("[data-touch]")) {
        button.addEventListener("touchstart", (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.audio.start();
          this.triggerTouchAction(button.dataset.touch);
        }, { passive: false });
      }
    }

    triggerTouchAction(action) {
      if (!this.run || this.mode !== "game") return;
      if (this.pauseOverlay || this.run.player.dead) return;
      if (action === "attack") this.attackBasic();
      if (action === "dash") this.dash();
      if (["q", "e", "r", "f"].includes(action)) this.useSkill(action);
      if (action === "bag") this.showRunInventory();
      if (action === "settings") this.showPause();
    }

    triggerQuickAction(action) {
      if (!this.run || this.mode !== "game") return;
      if (this.run.player.dead) {
        if (this.run.spectating && action === "cycle-spectate") this.cycleSpectateTarget();
        if (action === "exit-run") this.exitRun();
        return;
      }
      if (this.pauseOverlay) return;
      if (action === "bag") this.showRunInventory();
      if (action === "pause") this.showPause();
    }

    resize() {
      this.dpr = Math.min(window.devicePixelRatio || 1, this.isMobileDevice() ? 1 : 1.25);
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.canvas.width = Math.floor(this.width * this.dpr);
      this.canvas.height = Math.floor(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
    }

    updateMouse(event) {
      const rect = this.canvas.getBoundingClientRect();
      const scale = this.worldViewScale();
      this.input.mouse.x = event.clientX - rect.left;
      this.input.mouse.y = event.clientY - rect.top;
      this.input.mouse.worldX = this.camera.x + this.input.mouse.x / scale - this.camera.shakeX;
      this.input.mouse.worldY = this.camera.y + this.input.mouse.y / scale - this.camera.shakeY;
      if (this.run?.player) {
        const player = this.run.player;
        const dx = this.input.mouse.worldX - player.x;
        const dy = this.input.mouse.worldY - player.y;
        const len = Math.hypot(dx, dy) || 1;
        this.input.touch.aimX = dx / len;
        this.input.touch.aimY = dy / len;
      }
    }

    basicAimAngle(player) {
      if (this.isMobileDevice()) {
        const characterId = player?.characterId || this.save.account.selectedCharacter;
        if (["mage", "ranger"].includes(characterId)) {
          const target = this.nearestEnemy(player.x, player.y, 980);
          if (target) {
            const dx = target.x - player.x;
            const dy = target.y - player.y;
            const len = Math.hypot(dx, dy) || 1;
            this.input.touch.aimX = dx / len;
            this.input.touch.aimY = dy / len;
            return Math.atan2(dy, dx);
          }
        }
        const mag = Math.hypot(this.input.touch.x, this.input.touch.y);
        if (mag > 0.12) {
          const dx = this.input.touch.x / mag;
          const dy = this.input.touch.y / mag;
          this.input.touch.aimX = dx;
          this.input.touch.aimY = dy;
          return Math.atan2(dy, dx);
        }
        return Number.isFinite(player.facing) ? player.facing : Math.atan2(this.input.touch.aimY, this.input.touch.aimX);
      }
      return Math.atan2(this.input.mouse.worldY - player.y, this.input.mouse.worldX - player.x);
    }

    skillAimAngle(player) {
      return this.basicAimAngle(player);
    }

    skillTargetPoint(player, angle, distance = 230) {
      if (this.isMobileDevice()) {
        return {
          x: clamp(player.x + Math.cos(angle) * distance, ROOM_PAD, WORLD_W - ROOM_PAD),
          y: clamp(player.y + Math.sin(angle) * distance, ROOM_PAD, WORLD_H - ROOM_PAD)
        };
      }
      return {
        x: clamp(this.input.mouse.worldX, ROOM_PAD, WORLD_W - ROOM_PAD),
        y: clamp(this.input.mouse.worldY, ROOM_PAD, WORLD_H - ROOM_PAD)
      };
    }

    onKeyDown(event) {
      if (["Space", "Tab"].includes(event.code)) event.preventDefault();
      this.audio.start();
      this.input.keys.add(event.code);
      if (event.repeat) return;
      if (event.code === "Escape") {
        if (this.pauseOverlay) this.resumeGame();
        else if (this.mode === "game") this.showPause();
        else if (this.mode === "pause") this.resumeGame();
        else this.showMainMenu();
      }
      if (!this.run || this.mode !== "game" || this.pauseOverlay || this.run.player.dead) return;
      if (event.code === "Space") this.dash();
      if (event.code === "KeyQ") this.useSkill("q");
      if (event.code === "KeyE") this.useSkill("e");
      if (event.code === "KeyR") this.useSkill("r");
      if (event.code === "KeyF") this.useSkill("f");
      if (event.code === "Tab" && this.run.roomObjects?.some((object) => object.type === "nextDoor")) this.toast("Đi lên phía trên bản đồ để vào cửa tiếp theo");
    }

    loop(time) {
      const rawDt = this.last ? (time - this.last) / 1000 || 0 : 1 / 60;
      const dt = Math.min(0.033, rawDt);
      this.last = time;
      this.updatePerformanceState(rawDt || dt);
      this.menuTime += dt;
      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
        if (this.toastTimer <= 0) this.toastEl.classList.add("hidden");
      }
      this.lobby.updatePresence(dt);
      this.updateRoomDirectory(dt);
      this.updateQuickActions();
      if (this.mode === "game" && this.run) this.update(dt);
      this.audio.update(dt);
      this.render();
      requestAnimationFrame((next) => this.loop(next));
    }

    setScreen(html = "") {
      this.screen.innerHTML = html;
      this.screen.classList.toggle("hidden", !html);
    }

    captureScreenScroll() {
      const panel = this.screen.querySelector(".panel, .wide-panel");
      return {
        screen: this.screen.scrollTop || 0,
        panel: panel?.scrollTop || 0
      };
    }

    restoreScreenScroll(scroll) {
      if (!scroll) return;
      const restore = () => {
        this.screen.scrollTop = scroll.screen || 0;
        const panel = this.screen.querySelector(".panel, .wide-panel");
        if (panel) panel.scrollTop = scroll.panel || 0;
      };
      restore();
      requestAnimationFrame(restore);
    }

    updateQuickActions() {
      if (!this.quickActions) return;
      const spectating = Boolean(this.run && this.mode === "game" && this.run.player.dead && this.run.spectating);
      const visible = Boolean(this.run && this.mode === "game" && !this.pauseOverlay && (!this.run.player.dead || spectating));
      const buttons = this.quickActions.querySelectorAll("button");
      if (buttons.length >= 2) {
        if (spectating) {
          if (buttons[0].dataset.quick !== "cycle-spectate") {
            buttons[0].dataset.quick = "cycle-spectate";
            buttons[0].setAttribute("aria-label", "Đổi người xem");
            buttons[0].innerHTML = `<span class="quick-text">ĐỔI</span>`;
            buttons[1].dataset.quick = "exit-run";
            buttons[1].setAttribute("aria-label", "Thoát lượt chơi");
            buttons[1].innerHTML = `<span class="quick-text">THOÁT</span>`;
          }
          this.quickActions.classList.add("spectating");
        } else if (buttons[0].dataset.quick !== "bag") {
          buttons[0].dataset.quick = "bag";
          buttons[0].setAttribute("aria-label", "Túi");
          buttons[0].innerHTML = `<span class="touch-icon bag-icon" aria-hidden="true"></span>`;
          buttons[1].dataset.quick = "pause";
          buttons[1].setAttribute("aria-label", "Tạm dừng");
          buttons[1].innerHTML = `<span class="touch-icon pause-icon" aria-hidden="true"></span>`;
          this.quickActions.classList.remove("spectating");
        } else {
          this.quickActions.classList.remove("spectating");
        }
      }
      this.quickActions.classList.toggle("hidden", !visible);
      this.quickActions.setAttribute("aria-hidden", visible ? "false" : "true");
      if (this.touchLayer) {
        const touchVisible = Boolean(this.run && this.mode === "game" && this.isMobileDevice() && !this.run.player.dead);
        this.touchLayer.classList.toggle("hidden", !touchVisible);
      }
    }

    exitRun() {
      if (!this.run) {
        this.showMainMenu();
        return;
      }
      const spectating = this.run.player.dead && this.run.spectating;
      if (this.isMultiplayerRun()) this.lobby.sendLeaveRun();
      if (spectating) {
        const target = this.currentSpectateTarget();
        const pos = this.displayActorPosition(this.aliveActor(target) ? target : this.run.player);
        const x = pos.x + Math.cos(this.menuTime * 2.6) * 46;
        const y = pos.y - 34 + Math.sin(this.menuTime * 3.25) * 20;
        this.addShockwave(x, y, 150, "#d9fbff", 0);
        for (let i = 0; i < 22 * this.save.settings.particles; i++) {
          this.addParticle(x + rand(-12, 12), y + rand(-12, 12), i % 2 ? "#d9fbff" : "#70e083", rand(8, 24), rand(0.28, 0.78), i % 3 === 0 ? "ring" : "spark");
        }
        this.run.spectating = false;
        this.run.player.spectating = false;
        this.run.player.spectateId = "";
        this.updateQuickActions();
        const exitingRun = this.run;
        setTimeout(() => {
          if (this.run === exitingRun) this.showMainMenu();
        }, 220);
        return;
      }
      this.showMainMenu();
    }

    showMainMenu() {
      if (!this.hasAccount()) {
        this.showAccountGate();
        return;
      }
      if (this.run?.multiplayer) this.lobby.sendLeaveRun();
      if (this.run) {
        this.run = null;
        this.remotePlayers.clear();
      }
      if (this.lobby?.code || this.lobby?.joinPending) this.lobby.leaveRoom();
      this.pauseOverlay = false;
      this.mode = "menu";
      this.hud.classList.add("hidden");
      this.touchLayer.classList.add("hidden");
      this.roomFinderOpen = false;
      this.setScreen(`
        <section class="menu-only">
          ${this.navHtml("home")}
        </section>
      `);
    }

    navHtml(active) {
      const item = (id, label, primary = false) => `
        <button class="btn ${primary ? "primary" : ""} ${active === id ? "active" : ""}" data-action="${id}">${label}</button>
      `;
      if (active !== "home") {
        return `
          <nav class="main-nav back-nav">
            <div class="nav-buttons">
              <button class="btn" data-action="menu">THOÁT RA MENU</button>
            </div>
          </nav>
        `;
      }
      return `
        <nav class="main-nav">
          <div class="logo">
            <h1>SOULRIFT</h1>
            <p>Roguelike hành động thời gian thực</p>
          </div>
          <div class="account-strip">
            <b>${this.hasAccount() ? this.save.account.username : "Chưa có tài khoản"}</b>
            <span>${this.hasAccount() ? `Quay sức mạnh: ${this.save.account.powerSpins}` : "Cần tạo tài khoản"}</span>
          </div>
          <div class="nav-buttons">
            ${item("play", "CHƠI", true)}
            ${item("character", "NHÂN VẬT")}
            ${item("settings", "CÀI ĐẶT")}
            ${item("logout-account", "ĐĂNG XUẤT")}
          </div>
        </nav>
      `;
    }

    handleAction(action, target) {
      if (action === "register-account" || action === "create-account") {
        this.registerAccount();
        return;
      }
      if (action === "login-account") {
        this.loginAccount();
        return;
      }
      if (action === "logout-account") {
        this.logoutAccount();
        return;
      }
      if (!this.hasAccount()) {
        this.showAccountGate();
        if (action !== "menu") this.toast("Bạn cần tạo tài khoản trước");
        return;
      }
      if (action === "play") this.showPlayMenu();
      if (action === "play-solo") this.showSoloMenu();
      if (action === "play-multiplayer") this.showMultiplayerHub();
      if (action === "find-room") this.showRoomFinder();
      if (action === "reload-rooms") {
        this.publicRooms = [];
        this.roomDirectoryTimer = 0;
        this.toast("Đang tải lại danh sách phòng");
        this.showRoomFinder();
      }
      if (action === "create-room-from-play") {
        this.lobby.create();
        this.renderLobby();
      }
      if (action === "start-solo-difficulty") this.startSelectedRun("", { difficulty: target.dataset.difficulty || "normal" });
      if (action === "character-tab") this.showCharacterTab(target.dataset.tab || "character");
      if (action === "character") this.showCharacter();
      if (action === "inventory") {
        if (this.run && ["game", "pause", "merchant", "runInventory"].includes(this.mode)) this.showRunInventory();
        else this.showInventory();
      }
      if (action === "run-inventory") this.showRunInventory();
      if (action === "powers") this.showPowers();
      if (action === "awakening") this.showAwakening();
      if (action === "settings") this.showSettings();
      if (action === "multiplayer") this.renderLobby();
      if (action === "menu") this.showMainMenu();
      if (action === "exit-run") this.exitRun();
      if (action === "resume") this.resumeGame();
      if (action === "spectate-run") this.startSpectating();
      if (action === "cycle-spectate") this.cycleSpectateTarget();
      if (action === "restart") this.startSelectedRun();
      if (action === "choose-power") this.selectPower(target.dataset.power);
      if (action === "spin-power") this.spinPower();
      if (action === "buy-merchant-offer") this.buyMerchantOffer(target.dataset.offer);
      if (action === "merchant-tab") this.showMerchantShop(target.dataset.tab || "buy");
      if (action === "sell-run-item") this.sellRunItem(target.dataset.uid);
      if (action === "leave-merchant") this.completeMerchantRoom();
      if (action === "select-character") this.selectCharacter(target.dataset.character);
      if (action === "upgrade-stat") this.upgradeStatPoint(target.dataset.stat);
      if (action === "reset-stat-points") this.resetStatPoints();
      if (action === "choose-room") {
        if (this.isMultiplayerRun()) {
          const room = JSON.parse(decodeURIComponent(target.dataset.room));
          if (!this.isDoorLeader()) {
            this.toast("Chờ người dẫn đường chọn phòng tiếp theo");
            return;
          }
          if (this.isMultiplayerClient()) {
            this.lobby.sendDoorChoice("", room);
            this.toast("Đã gửi lựa chọn cửa cho host");
            return;
          }
          this.startRoom(room);
          return;
        }
        if (this.isMultiplayerClient()) {
          this.toast("Chỉ chủ phòng được chọn phòng tiếp theo");
          return;
        }
        this.startRoom(JSON.parse(decodeURIComponent(target.dataset.room)));
      }
      if (action === "equip-item") this.equipItem(target.dataset.item);
      if (action === "unequip-slot") this.unequipSlot(target.dataset.slot);
      if (action === "equip-run-item") this.equipRunItem(target.dataset.uid);
      if (action === "unequip-run-item") this.unequipRunItem(target.dataset.uid);
      if (action === "drop-run-item") this.dropRunItem(target.dataset.uid);
      if (action === "awaken-power") this.awakenPower(target.dataset.power);
      if (action === "create-room") this.lobby.create();
      if (action === "join-room") this.lobby.join(target.dataset.roomCode || document.getElementById("roomCodeInput")?.value);
      if (action === "ready-room") this.lobby.toggleReady();
      if (action === "vote-map") this.lobby.setVote(target.dataset.biome);
      if (action === "vote-difficulty") this.lobby.setDifficulty(target.dataset.difficulty);
      if (action === "start-room") {
        if (!this.lobby.host) {
          this.toast("Chỉ chủ phòng được bắt đầu");
          return;
        }
        this.startMultiplayerRun();
      }
      if (action === "close-map") this.resumeGame();
    }

    handleInput(event) {
      const target = event.target;
      if (target.dataset.setting) {
        const key = target.dataset.setting;
        if (target.type === "checkbox") this.save.settings[key] = target.checked;
        else this.save.settings[key] = Number(target.value);
        this.persist();
      }
      if (target.dataset.custom) {
        this.save.customization[target.dataset.custom] = target.value;
        this.persist();
        this.showCharacter(true);
      }
    }

    showPlayMenu() {
      this.mode = "play";
      this.roomFinderOpen = false;
      this.hud.classList.add("hidden");
      this.touchLayer.classList.add("hidden");
      this.setScreen(`
        <section class="shell">
          ${this.navHtml("play")}
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Chơi</h2>
                <p class="panel-subtitle">Chọn kiểu chơi trước khi vào khe nứt.</p>
              </div>
            </div>
            <div class="grid cols-2">
              <button class="choice-card" data-action="play-solo">
                <div class="card-icon">1</div>
                <h3>Chơi đơn</h3>
                <p>Chọn độ khó rồi bắt đầu bằng power đang mang.</p>
              </button>
              <button class="choice-card" data-action="play-multiplayer">
                <div class="card-icon">4</div>
                <h3>Nhiều người chơi</h3>
                <p>Tạo phòng hoặc tìm phòng bằng ID.</p>
              </button>
            </div>
          </div>
        </section>
      `);
    }

    showSoloMenu() {
      this.mode = "play";
      this.roomFinderOpen = false;
      const selected = this.save.account.selectedPower ? powerById(this.save.account.selectedPower) : null;
      const difficultyCards = DIFFICULTIES.map((difficulty) => `
        <button class="choice-card" data-action="start-solo-difficulty" data-difficulty="${difficulty.id}">
          <div class="card-icon">${difficulty.label.slice(0, 1)}</div>
          <h3>${difficulty.label}</h3>
          <p>${difficulty.text}</p>
          <p class="small">Máu quái ${Math.round(difficulty.enemyHp * 100)}% - sát thương quái ${Math.round(difficulty.enemyDamage * 100)}%</p>
        </button>
      `).join("");
      this.setScreen(`
        <section class="shell">
          ${this.navHtml("play")}
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Chơi Đơn</h2>
                <p class="panel-subtitle">${selected ? `Power: ${selected.name}` : "Hãy quay và chọn power trước khi bắt đầu."}</p>
              </div>
              <button class="btn" data-action="play">TRỞ LẠI</button>
            </div>
            <div class="grid cols-3">${difficultyCards}</div>
          </div>
        </section>
      `);
    }

    showMultiplayerHub() {
      this.mode = "play";
      this.roomFinderOpen = false;
      this.setScreen(`
        <section class="shell">
          ${this.navHtml("play")}
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Nhiều Người Chơi</h2>
                <p class="panel-subtitle">Tạo phòng mới hoặc tìm phòng bằng ID.</p>
              </div>
              <button class="btn" data-action="play">TRỞ LẠI</button>
            </div>
            <div class="grid cols-2">
              <button class="choice-card" data-action="create-room-from-play">
                <div class="card-icon">+</div>
                <h3>Tạo phòng</h3>
                <p>Bạn là chủ phòng và là người duy nhất được bắt đầu.</p>
              </button>
              <button class="choice-card" data-action="find-room">
                <div class="card-icon">ID</div>
                <h3>Tìm phòng</h3>
                <p>Xem phòng hiện có trên máy này hoặc nhập ID phòng.</p>
              </button>
            </div>
          </div>
        </section>
      `);
    }

    recentRoomCodes() {
      try {
        const raw = localStorage.getItem("soulrift-recent-rooms");
        const codes = raw ? JSON.parse(raw) : [];
        return Array.isArray(codes) ? codes.map((code) => String(code || "").trim().toUpperCase()).filter((code) => ROOM_CODE_RE.test(code)).slice(0, 6) : [];
      } catch {
        return [];
      }
    }

    rememberRoomCode(code) {
      const normalized = String(code || "").trim().toUpperCase();
      if (!ROOM_CODE_RE.test(normalized)) return;
      const next = [normalized, ...this.recentRoomCodes().filter((entry) => entry !== normalized)].slice(0, 6);
      try {
        localStorage.setItem("soulrift-recent-rooms", JSON.stringify(next));
      } catch {
        // Local room history is optional.
      }
    }

    updateRoomDirectory(dt) {
      if (!this.roomFinderOpen) {
        this.roomDirectoryTimer = 0;
        return;
      }
      this.roomDirectoryTimer -= dt;
      if (this.roomDirectoryTimer > 0) return;
      this.roomDirectoryTimer = 3.5;
      this.refreshRoomDirectory();
    }

    async refreshRoomDirectory() {
      if (!window.fetch || this.roomDirectoryBusy) return;
      this.roomDirectoryBusy = true;
      try {
        const now = Date.now();
        const rooms = new Map();
        const readRelay = async (relay) => {
          const controller = "AbortController" in window ? new AbortController() : null;
          const timeout = controller ? setTimeout(() => controller.abort(), 1800) : 0;
          try {
            const response = await fetch(`${relay}/${DIRECTORY_TOPIC}/json?poll=1&since=${DIRECTORY_HISTORY}`, { cache: "no-store", signal: controller?.signal });
            return response.ok ? await response.text() : "";
          } catch {
            return "";
          } finally {
            if (timeout) clearTimeout(timeout);
          }
        };
        const relayTexts = await Promise.all(SIGNAL_RELAY_URLS.map((relay) => readRelay(relay)));
        for (const text of relayTexts) {
          for (const line of text.split(/\r?\n/)) {
            if (!line.trim()) continue;
            let envelope = null;
            try {
              envelope = JSON.parse(line);
            } catch {
              continue;
            }
            const raw = typeof envelope.message === "string" ? envelope.message : "";
            let payload = null;
            try {
              payload = JSON.parse(raw);
            } catch {
              continue;
            }
            if (payload?.type !== "roomPresence" || !payload.code) continue;
            const code = String(payload.code || "").trim().toUpperCase();
            if (!ROOM_CODE_RE.test(code)) continue;
            const relayTime = Number(envelope.time || 0) * 1000;
            const seenAt = relayTime || Number(payload.sentAt || 0) || now;
            const previous = rooms.get(code);
            if (previous && seenAt <= Number(previous.sentAt || 0)) continue;
            if (payload.open === false || payload.running) {
              rooms.set(code, { code, closed: true, sentAt: seenAt });
              continue;
            }
            if (now - seenAt > ROOM_TTL_MS) continue;
            const players = Math.max(0, Number(payload.players) || 0);
            if (players <= 0) continue;
            const emptySince = Number(payload.emptySince || 0);
            const emptyFor = Math.max(0, Number(payload.emptyFor || 0));
            if (players <= 1 && (emptyFor > ROOM_TTL_MS || (!payload.emptyFor && emptySince && now - emptySince > ROOM_TTL_MS))) {
              rooms.delete(code);
              continue;
            }
            rooms.set(code, {
              code,
              hostName: payload.hostName || "Chủ phòng",
              players,
              maxPlayers: Number(payload.maxPlayers) || 4,
              sentAt: seenAt,
              emptySince,
              emptyFor
            });
          }
        }
        this.publicRooms = [...rooms.values()].filter((room) => !room.closed).sort((a, b) => b.sentAt - a.sentAt);
        if (this.mode === "play" && this.roomFinderOpen) this.showRoomFinder(false);
      } catch {
        // Public room discovery is optional; manual room IDs still work with validation.
      } finally {
        this.roomDirectoryBusy = false;
      }
    }

    showRoomFinder(fetchDirectory = true) {
      const scroll = this.mode === "play" && this.roomFinderOpen ? this.captureScreenScroll() : null;
      this.mode = "play";
      this.roomFinderOpen = true;
      const pendingCode = this.lobby.joinPending && this.lobby.code ? this.lobby.code : "";
      const joinedCode = this.lobby.code && !this.lobby.joinPending ? this.lobby.code : "";
      const current = joinedCode ? [joinedCode] : [];
      const now = Date.now();
      this.publicRooms = (this.publicRooms || []).filter((room) => (
        room?.code
        && !room.closed
        && !room.running
        && now - Number(room.sentAt || 0) <= ROOM_TTL_MS
        && !(Number(room.players || 0) <= 1 && Number(room.emptyFor || 0) > ROOM_TTL_MS)
      ));
      const publicCodes = this.publicRooms.map((room) => room.code).filter(Boolean);
      const rooms = [...current, ...publicCodes]
        .filter((code, index, list) => list.indexOf(code) === index)
        .slice(0, 8);
      const roomList = rooms.length ? rooms.map((code) => `
        <button class="choice-card" data-action="${code === joinedCode ? "multiplayer" : "join-room"}" data-room-code="${code}">
          <div class="card-icon">${code.slice(0, 2)}</div>
          <div>
            <h3>${code}</h3>
            <p>${code === joinedCode ? (this.lobby.host ? "Phòng bạn đang tạo" : "Phòng đang tham gia") : "Phòng online"}</p>
          </div>
        </button>
      `).join("") : `<div class="empty-state">Chưa có phòng nào được phát hiện trên máy này.</div>`;
      const pendingNotice = pendingCode ? `
        <div class="join-pending">
          <b>Đang tìm phòng ${pendingCode}</b>
          <span>Nếu ID không tồn tại, game sẽ tự hủy kết nối.</span>
        </div>
      ` : "";
      this.setScreen(`
        <section class="shell">
          ${this.navHtml("play")}
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Tìm Phòng</h2>
                <p class="panel-subtitle">Nhập ID phòng hoặc chọn phòng đang có.</p>
              </div>
              <div class="header-actions">
                <button class="btn icon-label" data-action="reload-rooms"><span class="btn-icon">↻</span> TẢI LẠI</button>
                <button class="btn" data-action="play-multiplayer">TRỞ LẠI</button>
              </div>
            </div>
            <div class="room-finder-layout">
              <div class="account-form">
                <input id="roomCodeInput" class="field" placeholder="ID PHÒNG" maxlength="12" value="${pendingCode}" ${pendingCode ? "disabled" : ""} />
                <button class="btn primary" data-action="join-room" ${pendingCode ? "disabled" : ""}>VÀO PHÒNG</button>
                ${pendingNotice}
              </div>
              <div class="room-list">${roomList}</div>
            </div>
          </div>
        </section>
      `);
      this.restoreScreenScroll(scroll);
      if (fetchDirectory) this.refreshRoomDirectory();
    }

    showStatusEffects(selectedIndex = 0) {
      if (!this.run) return;
      this.mode = "status";
      const effects = (this.run.statusEffects || []).filter((effect) => effect.time > 0);
      const cards = effects.map((effect, index) => `
        <button class="choice-card ${index === selectedIndex ? "selected" : ""}" data-status-index="${index}" style="border-color:${effect.color || "#a169ff"}">
          <div class="card-icon" style="color:${effect.color || "#a169ff"}">${effect.icon || effect.name.slice(0, 1)}</div>
          <h3>${effect.name}</h3>
          <p>${effect.text}</p>
          <p class="small">${effect.time > 900 ? "Cả lượt" : `Còn ${Math.max(0, Math.ceil(effect.time))} giây`}</p>
        </button>
      `).join("");
      this.setScreen(`
        <section class="wide-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Hiệu Ứng</h2>
              <p class="panel-subtitle">Trạng thái giữ nguyên khi qua phòng và chỉ biến mất khi hết thời gian.</p>
            </div>
            <button class="btn" data-action="resume">ĐÓNG</button>
          </div>
          <div class="grid">${cards || `<div class="empty-state">Không có hiệu ứng nào.</div>`}</div>
        </section>
      `);
    }

    startSelectedRun(forcedBiomeId = "", options = {}) {
      const powerId = this.save.account.selectedPower;
      if (!powerId || !this.save.account.ownedPowers.includes(powerId)) {
        this.toast("Hãy quay và chọn một sức mạnh trước");
        this.showPowers();
        return;
      }
      this.startRun(powerById(powerId), forcedBiomeId, options);
    }

    selectPower(powerId) {
      if (!this.save.account.ownedPowers.includes(powerId)) {
        this.toast("Bạn chưa sở hữu sức mạnh này");
        return;
      }
      this.save.account.selectedPower = powerId;
      this.persist();
      this.toast(`Đã chọn ${powerById(powerId).name}`);
      this.showPowers();
    }

    selectCharacter(characterId) {
      const character = characterById(characterId);
      this.save.account.selectedCharacter = character.id;
      this.persist();
      this.toast(`Đã chọn ${character.name}`);
      this.showCharacter(true);
    }

    spentStatPoints() {
      this.normalizeStatPoints();
      return STAT_POINT_UPGRADES.reduce((sum, upgrade) => sum + (this.save.progression.statUpgrades[upgrade.id] || 0), 0);
    }

    upgradeStatPoint(stat) {
      this.normalizeStatPoints();
      const upgrade = STAT_POINT_UPGRADES.find((entry) => entry.id === stat);
      if (!upgrade) return;
      const current = this.save.progression.statUpgrades[stat] || 0;
      if (this.save.progression.statPoints <= 0) {
        this.toast("Không còn điểm nâng");
        return;
      }
      this.save.progression.statPoints -= 1;
      this.save.progression.statUpgrades[stat] = current + 1;
      this.persist();
      this.toast(`Đã nâng ${upgrade.label}`);
      this.showCharacter(true);
    }

    resetStatPoints() {
      this.normalizeStatPoints();
      const spent = this.spentStatPoints();
      if (spent <= 0) {
        this.toast("Chưa có điểm đã cộng");
        return;
      }
      for (const upgrade of STAT_POINT_UPGRADES) this.save.progression.statUpgrades[upgrade.id] = 0;
      this.save.progression.statPoints += spent;
      this.persist();
      this.toast(`Đã hoàn ${spent} điểm nâng`);
      this.showCharacter(true);
    }

    spinPower() {
      if (this.save.account.powerSpins <= 0) {
        this.toast("Bạn đã hết lượt quay sức mạnh");
        return;
      }
      const previous = this.save.account.selectedPower;
      const pool = POWERS.filter((power) => power.id !== previous);
      const power = pick(pool);
      const meta = this.save.powers[power.id];
      this.save.account.powerSpins -= 1;
      this.save.account.lastSpin = power.id;
      for (const savedPower of Object.values(this.save.powers)) savedPower.unlocked = false;
      this.save.account.ownedPowers = [power.id];
      meta.unlocked = true;
      this.save.account.selectedPower = power.id;
      this.persist();
      this.toast(previous ? `Đã thay ${powerById(previous).name} bằng ${power.name}` : `Quay được ${power.name}`);
      this.showPowers();
    }

    showPowerDraft() {
      this.showPowers();
    }

    powerCard(power, action) {
      const meta = this.save.powers[power.id] || { level: 1, awakened: false, rarity: power.rarity };
      const owned = this.save.account?.ownedPowers?.includes(power.id);
      const selected = this.save.account?.selectedPower === power.id;
      const awakened = meta.awakened ? "Đã thức tỉnh" : RARITY[meta.rarity]?.label || title(meta.rarity);
      const tag = owned ? "button" : "div";
      const actionAttrs = owned ? `data-action="${action}" data-power="${power.id}"` : "";
      return `
        <${tag} class="choice-card power-card rarity-${meta.rarity} ${owned ? "" : "locked"} ${selected ? "selected" : ""}" ${actionAttrs}>
          ${this.powerIllustration(power)}
          <h3 style="color:${power.color}">${power.name}</h3>
          <p>${power.passive}</p>
          <p class="small">${owned ? `Cấp ${meta.level} - ${awakened}` : "Chưa sở hữu"}${selected ? " - Đang chọn" : ""}</p>
        </${tag}>
      `;
    }

    powerIllustration(power) {
      return `
        <div class="mini-ill power-ill" style="--ill:${power.color}; --ill2:${power.accent}">
          <span class="sigil-core">${power.icon}</span>
          <span class="sigil-ring"></span>
          <span class="sigil-ray one"></span>
          <span class="sigil-ray two"></span>
        </div>
      `;
    }

    itemIllustration(item) {
      const kind = item.slot === "Assist" ? "assist" : item.slot === "Weapon" ? "weapon" : item.slot === "Armor" ? "armor" : item.slot === "Charm" ? "charm" : "relic";
      return `
        <div class="mini-ill item-ill item-${kind}" style="--ill:${RARITY[item.rarity].color}">
          <span class="item-shape main"></span>
          <span class="item-shape cross"></span>
          <span class="item-shape gem"></span>
        </div>
      `;
    }

    characterTabs(active = "character") {
      const tabs = [
        ["character", "Nhân vật"],
        ["inventory", "Kho nguyên liệu"],
        ["powers", "Sức mạnh"],
        ["awakening", "Thức tỉnh"]
      ];
      return `
        <div class="tab-strip">
          ${tabs.map(([id, label]) => `<button class="btn ${active === id ? "primary" : ""}" data-action="character-tab" data-tab="${id}">${label}</button>`).join("")}
        </div>
      `;
    }

    showCharacterTab(tab = "character") {
      if (tab === "inventory") this.showInventory();
      else if (tab === "powers") this.showPowers();
      else if (tab === "awakening") this.showAwakening();
      else this.showCharacter();
    }

    roomIllustration(room) {
      return `
        <div class="mini-ill room-ill room-${room.type}" style="--ill:${room.color}">
          <span class="room-floor"></span>
          <span class="room-gate"></span>
          <span class="room-mark">${room.icon}</span>
        </div>
      `;
    }

    showCharacter(preserveScroll = false) {
      this.mode = "character";
      const scroll = preserveScroll ? this.captureScreenScroll() : null;
      const colors = ["#d8b46a", "#f06d6d", "#61d6b4", "#7fa8ff", "#f2f0e6", "#a169ff", "#ff9f43", "#202335"];
      const options = {
        eyes: ["ember", "void", "frost", "focus"],
        mouth: ["scar", "mask", "smirk", "grim"],
        aura: ["gold", "crimson", "teal", "violet"],
        accessory: ["cape", "horns", "halo", "scarf"],
        trail: ["sparks", "smoke", "runes", "shards"]
      };
      const swatches = colors.map((color) => `
        <button class="swatch ${this.save.customization.color === color ? "active" : ""}" style="--swatch:${color}" data-action="set-color" onclick="this.dispatchEvent(new Event('input', {bubbles:true}))">
          <input class="hidden" data-custom="color" value="${color}" />
        </button>
      `).join("");
      const selectedCharacter = characterById(this.save.account.selectedCharacter);
      const progress = this.save.progression;
      const xpNeed = this.xpToNextLevel(progress.level || 1);
      const characterCards = CHARACTER_TYPES.map((character) => `
        <button class="character-card ${selectedCharacter.id === character.id ? "selected" : ""}" data-action="select-character" data-character="${character.id}" style="--char:${character.color}">
          <div class="character-icon">${character.icon}</div>
          <div>
            <h3>${character.name}</h3>
            <p>${character.attackName}: ${character.attackText}</p>
            ${(() => {
              const stats = this.effectiveCharacterStats(character);
              return `<p class="small">Máu ${stats.hp} - NL ${stats.energy} - Tốc ${stats.speed} - ST ${stats.damage} - CM ${Math.round(stats.crit * 100)}%</p>`;
            })()}
          </div>
        </button>
      `).join("");
      const points = progress.statPoints || 0;
      const spent = this.spentStatPoints();
      const statRows = STAT_POINT_UPGRADES.map((upgrade) => {
        const level = progress.statUpgrades[upgrade.id] || 0;
        return `
          <div class="stat-upgrade-row">
            <div>
              <h4>${upgrade.label} <span>+${level}</span></h4>
              <p>${upgrade.text}</p>
            </div>
            <button class="btn primary" data-action="upgrade-stat" data-stat="${upgrade.id}" ${points <= 0 ? "disabled" : ""}>+</button>
          </div>
        `;
      }).join("");
      const selects = Object.entries(options).map(([key, values]) => `
        <label class="setting-row">
          <div><h3>${customLabel(key)}</h3><p>${values.map(customLabel).join(" / ")}</p></div>
          <select class="field" data-custom="${key}">
            ${values.map((value) => `<option value="${value}" ${this.save.customization[key] === value ? "selected" : ""}>${customLabel(value)}</option>`).join("")}
          </select>
        </label>
      `).join("");
      this.setScreen(`
        <section class="shell">
          ${this.navHtml("character")}
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Nhân Vật</h2>
                <p class="panel-subtitle">Màu nhân vật, khuôn mặt, hào quang, phụ kiện và vệt lướt.</p>
              </div>
            </div>
            ${this.characterTabs("character")}
            <div class="character-layout">
              ${this.characterPreviewHtml()}
              <div class="character-controls">
                <h3>Kiểu Nhân Vật</h3>
                <div class="character-card-grid">${characterCards}</div>
                <h3>Điểm Nâng</h3>
                <div class="stat-point-panel">
                  <div class="stat-point-head">
                    <div>
                      <b>Cấp ${progress.level || 1} - còn ${points} điểm</b>
                      <span>KN ${Math.floor(progress.xp || 0)}/${xpNeed}. Đã cộng ${spent} điểm, không giới hạn số lần nâng.</span>
                    </div>
                    <button class="btn" data-action="reset-stat-points" ${spent <= 0 ? "disabled" : ""}>HOÀN ĐIỂM</button>
                  </div>
                  <div class="stat-upgrade-grid">${statRows}</div>
                </div>
                <h3>Màu</h3>
                <div class="swatches">${swatches}</div>
                <div class="grid">${selects}</div>
              </div>
            </div>
          </div>
        </section>
      `);
      this.restoreScreenScroll(scroll);
      for (const swatch of this.screen.querySelectorAll(".swatch")) {
        swatch.addEventListener("click", () => {
          const input = swatch.querySelector("input");
          this.save.customization.color = input.value;
          this.persist();
          this.showCharacter(true);
        }, { once: true });
      }
    }

    characterPreviewHtml() {
      const custom = this.save.customization;
      const selected = this.save.account.selectedPower ? powerById(this.save.account.selectedPower) : powerById("fire");
      const character = characterById(this.save.account.selectedCharacter);
      const aura = { gold: "#f2bf63", crimson: "#ff4b55", teal: "#35d6c9", violet: "#a169ff" }[custom.aura] || selected.color;
      return `
        <div class="character-preview char-${character.id}" style="--hero:${custom.color}; --aura:${aura}; --power:${selected.color}; --char:${character.color}">
          <div class="preview-aura"></div>
          <div class="preview-trail preview-${custom.trail}"></div>
          <div class="preview-hero">
            <span class="preview-cloak preview-${custom.accessory}"></span>
            <span class="preview-leg left"></span>
            <span class="preview-leg right"></span>
            <span class="preview-body"></span>
            <span class="preview-armor"></span>
            <span class="preview-face"></span>
            <span class="preview-eye left preview-${custom.eyes}"></span>
            <span class="preview-eye right preview-${custom.eyes}"></span>
            <span class="preview-mouth preview-${custom.mouth}"></span>
            <span class="preview-accessory preview-${custom.accessory}"></span>
            <span class="preview-weapon"></span>
          </div>
          <div class="preview-name">
            <b>${character.name}</b>
            <span>${character.attackName} - ${selected.name}</span>
          </div>
        </div>
      `;
    }

    showInventory() {
      this.mode = "inventory";
      const mat = this.save.materials || {};
      const materialOrder = ["emberGlass", "frostCore", "stormThread", "bloodAmber", "bossCore", "divineSpark"];
      const materials = materialOrder.map((id) => `
        <div class="reward-card material-card">
          <div class="mini-ill material-ill" style="--ill:${id === "gold" ? "#f2bf63" : "#35d6c9"}"><span>${id === "gold" ? "$" : "NL"}</span></div>
          <h3>${materialLabel(id)}</h3>
          <p>${Math.floor(Number(mat[id] || 0))}</p>
          <p class="small">Được giữ lại sau khi vượt phòng.</p>
        </div>
      `).join("");
      this.setScreen(`
        <section class="shell">
          ${this.navHtml("character")}
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Kho Nguyên Liệu</h2>
                <p class="panel-subtitle">Chỉ nguyên liệu được giữ lại. Phụ trợ và tiền trong ải sẽ mất khi thoát lượt.</p>
              </div>
            </div>
            ${this.characterTabs("inventory")}
            <div class="inventory-list">${materials}</div>
          </div>
        </section>
      `);
    }

    runItemCard(entry, context = "bag") {
      const item = itemById(entry.id);
      if (!item) return "";
      const sellPrice = this.sellValueForItem(item);
      const actions = context === "sell"
        ? `<button class="btn primary" data-action="sell-run-item" data-uid="${entry.uid}">BÁN ${sellPrice} TIỀN</button>`
        : `
          <button class="btn primary" data-action="${entry.equipped ? "unequip-run-item" : "equip-run-item"}" data-uid="${entry.uid}">
            ${entry.equipped ? "THÁO" : "TRANG BỊ"}
          </button>
          <button class="btn danger" data-action="drop-run-item" data-uid="${entry.uid}">VỨT</button>
        `;
      return `
        <div class="reward-card rarity-${item.rarity}">
          ${this.itemIllustration(item)}
          <h3>${item.name}</h3>
          <p>${entry.equipped ? "Đang trang bị" : "Trong túi"} - ${RARITY[item.rarity].label}</p>
          <p class="small">${item.text}</p>
          <div class="item-actions">${actions}</div>
        </div>
      `;
    }

    showRunInventory(context = "bag") {
      if (!this.run) {
        this.showInventory();
        return;
      }
      this.mode = "runInventory";
      const items = this.run.runItems || [];
      const equipped = items.filter((entry) => entry.equipped);
      const bag = items.filter((entry) => !entry.equipped);
      const cards = [
        ...equipped.map((entry) => this.runItemCard(entry, context)),
        ...bag.map((entry) => this.runItemCard(entry, context))
      ].join("");
      const subtitle = `Trang bị ${equipped.length}/${RUN_EQUIP_LIMIT} - Mang ${items.length}/${RUN_ITEM_LIMIT} - Tiền trong ải ${Math.floor(this.run.runGold || 0)}`;
      this.setScreen(`
        <section class="wide-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Kho Trong Ải</h2>
              <p class="panel-subtitle">${subtitle}</p>
            </div>
            <button class="btn" data-action="resume">ĐÓNG</button>
          </div>
          <div class="inventory-list">${cards || `<div class="empty-state">Chưa có phụ trợ nào. Rương sẽ thêm đồ vào đây.</div>`}</div>
        </section>
      `);
    }

    showPowers() {
      this.mode = "powers";
      const ownedCount = this.save.account.ownedPowers.length;
      const selected = this.save.account.selectedPower ? powerById(this.save.account.selectedPower) : null;
      const rows = POWERS.map((power) => this.powerCard(power, "choose-power")).join("");
      this.setScreen(`
        <section class="shell">
          ${this.navHtml("character")}
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Sức Mạnh</h2>
                <p class="panel-subtitle">Đã sở hữu ${ownedCount}/${POWERS.length} - Lượt quay còn ${this.save.account.powerSpins}</p>
              </div>
              <button class="btn primary" data-action="spin-power">QUAY SỨC MẠNH</button>
            </div>
            ${this.characterTabs("powers")}
            <div class="power-summary">
              <div>
                <p class="small">Đang mang vào ải</p>
                <h3 style="color:${selected ? selected.color : "#f3ead7"}">${selected ? selected.name : "Chưa chọn"}</h3>
              </div>
              <button class="btn" data-action="play">VÀO ẢI</button>
            </div>
            <div class="grid cols-3">${rows}</div>
          </div>
        </section>
      `);
    }

    showAwakening() {
      this.mode = "awakening";
      const mat = this.save.materials;
      const rows = POWERS.map((power) => {
        const meta = this.save.powers[power.id];
        const rate = RARITY[meta.rarity].rate;
        const owned = this.save.account.ownedPowers.includes(power.id);
        return `
          <button class="power-row rarity-${meta.rarity} ${owned ? "" : "locked"}" data-action="awaken-power" data-power="${power.id}">
            <h3 style="color:${power.color}">${power.name}</h3>
            <p>${!owned ? "Chưa sở hữu sức mạnh này." : meta.awakened ? "Sức mạnh đã thức tỉnh: hào quang mới, nội tại mạnh hơn và tuyệt kỹ tiến hóa." : `Tỉ lệ thành công ${Math.round(rate * 100)}%. Cần 3 Lõi Trùm và 1 Tia Thần.`}</p>
            <p class="small">Lõi Trùm ${mat.bossCore} - Tia Thần ${mat.divineSpark}</p>
          </button>
        `;
      }).join("");
      this.setScreen(`
        <section class="shell">
          ${this.navHtml("character")}
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Thức Tỉnh</h2>
                <p class="panel-subtitle">Thường 100%, Hiếm 90%, Sử Thi 75%, Huyền Thoại 50%, Thần Thoại 30%, Thần Thánh 15%.</p>
              </div>
            </div>
            ${this.characterTabs("awakening")}
            <div class="grid">${rows}</div>
          </div>
        </section>
      `);
    }

    showSettings() {
      const inRun = Boolean(this.run && ["game", "pause", "runInventory", "merchant"].includes(this.mode));
      this.mode = "settings";
      const s = this.save.settings;
      this.setScreen(`
        <section class="${inRun ? "wide-panel" : "shell"}">
          ${inRun ? "" : this.navHtml("settings")}
          <div class="${inRun ? "" : "panel"}">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Cài Đặt</h2>
                <p class="panel-subtitle">Hiệu chỉnh khe nứt.</p>
              </div>
              ${inRun ? `<button class="btn" data-action="resume">ĐÓNG</button>` : ""}
            </div>
            <div class="grid">
              ${this.settingCheck("music", "Nhạc", s.music)}
              ${this.settingCheck("sfx", "Âm va chạm", s.sfx)}
              ${this.settingCheck("damageNumbers", "Số sát thương", s.damageNumbers)}
              ${this.settingRange("screenShake", "Rung màn hình", s.screenShake)}
              ${this.settingRange("particles", "Hạt hiệu ứng", s.particles)}
            </div>
          </div>
        </section>
      `);
    }

    settingCheck(key, label, checked) {
      return `
        <label class="setting-row">
          <div><h3>${label}</h3><p>Bật / tắt</p></div>
          <input data-setting="${key}" type="checkbox" ${checked ? "checked" : ""} />
        </label>
      `;
    }

    settingRange(key, label, value) {
      return `
        <label class="setting-row">
          <div><h3>${label}</h3><p>Mức ${Number(value).toFixed(1)}</p></div>
          <input data-setting="${key}" type="range" min="0" max="1.5" step="0.1" value="${value}" />
        </label>
      `;
    }

    renderLobby() {
      const scroll = this.mode === "lobby" ? this.captureScreenScroll() : null;
      this.mode = "lobby";
      this.hud.classList.add("hidden");
      this.roomFinderOpen = false;
      if (this.lobby.code) this.lobby.syncOwnSlot();
      const isHost = this.lobby.host;
      const slots = Array.from({ length: 4 }, (_, index) => {
        const slot = this.lobby.slots[index];
        const powerName = slot?.powerId ? powerById(slot.powerId).name : "Chưa chọn power";
        const characterName = slot?.characterId ? characterById(slot.characterId).name : "Chưa chọn nhân vật";
        const displayName = slot ? this.lobby.slotName(slot, `Người chơi ${index + 1}`) : "";
        return `
          <div class="lobby-slot">
            <h3>${slot ? `${displayName}${slot.host ? " - Chủ phòng" : ""}` : `Người chơi ${index + 1}`}</h3>
            <p>${slot ? (slot.host ? "Điều phối ải" : slot.ready ? "Sẵn sàng" : "Chưa sẵn sàng") : "Đang trống"}</p>
            <p class="small">${slot ? `${characterName} - ${powerName}` : "Hỗ trợ 2-4 người chơi"}</p>
          </div>
        `;
      }).join("");
      const votes = BIOMES.map((biome) => `
        <button class="tab ${this.lobby.mapVote === biome.id ? "active" : ""}" data-action="vote-map" data-biome="${biome.id}" ${isHost ? "" : "disabled"}>${biome.name}</button>
      `).join("");
      const difficultyVotes = DIFFICULTIES.map((difficulty) => `
        <button class="tab ${this.lobby.difficultyVote === difficulty.id ? "active" : ""}" data-action="vote-difficulty" data-difficulty="${difficulty.id}" ${isHost ? "" : "disabled"}>${difficulty.label}</button>
      `).join("");
      const allReady = this.lobby.slots.every((slot) => slot.host || slot.ready);
      const connectedPeers = this.lobby.openPeerCount();
      const hasGuest = this.lobby.slots.some((slot) => slot && !slot.host);
      const canStart = isHost && this.lobby.code && hasGuest && allReady;
      const startHint = !isHost
        ? "Chờ chủ phòng"
        : !hasGuest
          ? "Chưa có người chơi khác"
          : allReady
            ? (connectedPeers > 0 ? "Có thể bắt đầu" : "Có thể bắt đầu qua relay")
            : "Chờ mọi người sẵn sàng";
      const lobbyControls = isHost
        ? `<button class="btn primary" data-action="start-room" ${canStart ? "" : "disabled"}>BẮT ĐẦU</button>`
        : `
          <button class="btn" data-action="ready-room">${this.lobby.ready ? "BỎ SẴN SÀNG" : "SẴN SÀNG"}</button>
          <button class="btn primary" data-action="start-room" disabled>CHỜ CHỦ PHÒNG</button>
        `;
      this.setScreen(`
        <section class="shell">
          ${this.navHtml("play")}
          <div class="panel">
            <div class="panel-header">
              <div>
                <h2 class="panel-title">Nhiều Người</h2>
                <p class="panel-subtitle">${isHost ? "Chủ phòng chọn ải và bắt đầu khi mọi người sẵn sàng." : "Bạn chỉ cần sẵn sàng, chủ phòng sẽ chọn ải và bắt đầu."}</p>
              </div>
            </div>
            <div class="grid cols-2 ${this.lobby.code ? "hidden" : ""}">
              <button class="btn primary" data-action="create-room">TẠO PHÒNG</button>
              <div>
                <input id="roomCodeInput" class="field" placeholder="MÃ PHÒNG" maxlength="12" />
                <button class="btn" data-action="join-room">VÀO PHÒNG</button>
              </div>
            </div>
            <p class="code-box">${this.lobby.code || "CHƯA CÓ PHÒNG"}</p>
            <div class="grid cols-2">${slots}</div>
            <p class="small">Chủ phòng chọn khu</p>
            <div class="tabs">${votes}</div>
            <p class="small">Chủ phòng chọn độ khó ải</p>
            <div class="tabs">${difficultyVotes}</div>
            <p class="small">${startHint}</p>
            <div class="grid ${isHost ? "" : "cols-2"}">${lobbyControls}</div>
          </div>
        </section>
      `);
      this.restoreScreenScroll(scroll);
    }

    startMultiplayerRun() {
      if (!this.lobby.host) {
        this.toast("Chỉ chủ phòng được bắt đầu");
        return;
      }
      if (!this.lobby.code) {
        this.toast("Hãy tạo phòng trước");
        return;
      }
      const hasGuest = this.lobby.slots.some((slot) => slot && !slot.host);
      if (!hasGuest) {
        this.toast("Chưa có người chơi khác trong phòng");
        return;
      }
      const waiting = this.lobby.slots.find((slot) => !slot.host && !slot.ready);
      if (waiting) {
        this.toast(`${waiting.name} chưa sẵn sàng`);
        return;
      }
      const powerId = this.save.account.selectedPower;
      if (!powerId || !this.save.account.ownedPowers.includes(powerId)) {
        this.toast("Hãy chọn sức mạnh trước khi bắt đầu");
        this.showPowers();
        return;
      }
      const selectedPower = powerById(powerId);
      const biomeId = this.lobby.mapVote || "forest";
      const difficultyId = this.lobby.difficultyVote || "normal";
      const seed = Math.random();
      this.lobby.publishDirectoryPresence(false);
      this.publicRooms = (this.publicRooms || []).filter((room) => room?.code !== this.lobby.code);
      this.lobby.broadcastStart(selectedPower.id, biomeId, seed, this.lobby.slots, difficultyId);
      this.startRun(selectedPower, biomeId, { multiplayer: true, host: true, seed, difficulty: difficultyId });
    }

    equipItem(itemId) {
      const item = itemById(itemId);
      if (!item) return;
      this.toast(`${item.name} chỉ dùng khi nhặt trong trận`);
      this.showInventory();
    }

    unequipSlot(slot) {
      this.toast("Trang bị vĩnh viễn đã được thay bằng phụ trợ trong trận");
      this.showInventory();
    }

    awakenPower(powerId) {
      const meta = this.save.powers[powerId];
      if (!this.save.account.ownedPowers.includes(powerId)) {
        this.toast("Bạn chưa sở hữu sức mạnh này");
        return;
      }
      if (!meta || meta.awakened) {
        this.toast("Sức mạnh này đã thức tỉnh");
        return;
      }
      if (this.save.materials.bossCore < 3 || this.save.materials.divineSpark < 1) {
        this.toast("Cần 3 Lõi Trùm và 1 Tia Thần");
        return;
      }
      this.save.materials.bossCore -= 3;
      this.save.materials.divineSpark -= 1;
      const rate = RARITY[meta.rarity].rate;
      if (chance(rate)) {
        meta.awakened = true;
        meta.level += 2;
        this.toast(`${powerById(powerId).name} đã thức tỉnh`);
      } else {
        this.toast("Thức tỉnh thất bại. Nguyên liệu đã bị tiêu hao.");
      }
      this.persist();
      this.showAwakening();
    }

    persist() {
      const active = this.save.auth?.currentUser;
      if (active && this.save.auth.accounts?.[active] && this.save.account?.created) {
        this.save.auth.accounts[active].username = this.save.account.username;
        this.save.auth.accounts[active].profile = this.profileSnapshot();
      }
      this.store.save(this.save);
    }

    toast(message) {
      this.toastEl.textContent = message;
      this.toastEl.classList.remove("hidden");
      this.toastTimer = 2.2;
    }

    startRun(power, forcedBiomeId = "", options = {}) {
      this.audio.start();
      if (this.isMobileDevice()) this.enterMobilePlayMode();
      this.save.progression.runs += 1;
      const biomeIndex = Math.max(0, BIOMES.findIndex((biome) => biome.id === forcedBiomeId));
      const startBiome = BIOMES[biomeIndex >= 0 ? biomeIndex : 0];
      const difficulty = DIFFICULTIES.find((entry) => entry.id === options.difficulty) || DIFFICULTIES[1];
      this.chestOpenRequests.clear();
      this.pauseOverlay = false;
      this.run = {
        seed: Number.isFinite(options.seed) ? options.seed : Math.random(),
        power,
        powerMeta: this.save.powers[power.id],
        difficulty,
        stage: BIOMES.indexOf(startBiome),
        roomNumber: 0,
        roomsCleared: 0,
        multiplayer: Boolean(options.multiplayer),
        netHost: options.multiplayer ? Boolean(options.host) : true,
        flawless: true,
        biome: startBiome,
        currentRoom: null,
        nextRooms: [],
        enemies: [],
        projectiles: [],
        particles: [],
        damageTexts: [],
        slashes: [],
        hazards: [],
        pickups: [],
        drones: [],
        shockwaves: [],
        trails: [],
        effects: [],
        delayedStrikes: [],
        roomObjects: [],
        merchantOffers: [],
        statusEffects: [],
        runItems: [],
        runGold: 0,
        pendingDoor: null,
        spectating: false,
        spectateId: "",
        spectateIndex: 0,
        leaderId: this.lobby.id,
        player: this.createPlayer(),
        curse: null,
        rewardQueue: [],
        intro: 0,
        roomClearTimer: 0
      };
      this.audio.setBiome(this.run.biome);
      this.applyEquippedItems();
      if (this.run.multiplayer) this.seedRemotePlayersFromLobby();
      else this.remotePlayers.clear();
      this.mode = "game";
      this.setScreen("");
      this.hud.classList.remove("hidden");
      this.touchLayer.classList.toggle("hidden", !this.isMobileDevice());
      this.startRoom({ type: "normal", label: "Phòng Thường", icon: "X", color: "#c9d0db" });
      if (this.isMultiplayerClient()) {
        this.run.enemies = [];
        this.run.projectiles = [];
        this.run.hazards = [];
        this.run.pickups = [];
        this.run.roomClearTimer = 0;
      }
      this.persist();
    }

    isMultiplayerRun() {
      return Boolean(this.run?.multiplayer && this.lobby?.code);
    }

    isMultiplayerHost() {
      return this.isMultiplayerRun() && this.run.netHost;
    }

    isMultiplayerClient() {
      return this.isMultiplayerRun() && !this.run.netHost;
    }

    seedRemotePlayersFromLobby() {
      if (!this.isMultiplayerRun()) return;
      const slots = (this.lobby.slots || []).filter((slot) => slot?.id && slot.id !== this.lobby.id);
      const p = this.run.player;
      const offsets = [
        { x: -54, y: 34 },
        { x: 54, y: 34 },
        { x: 0, y: 76 }
      ];
      this.remotePlayers.clear();
      slots.forEach((slot, index) => {
        const character = characterById(slot.characterId || "swordsman");
        const offset = offsets[index % offsets.length];
        this.remotePlayers.set(slot.id, {
          id: slot.id,
          name: slot.name || "Người chơi",
          x: p.x + offset.x,
          y: p.y + offset.y,
          displayX: p.x + offset.x,
          displayY: p.y + offset.y,
          hp: character.stats.hp,
          maxHp: character.stats.hp,
          energy: character.stats.energy,
          maxEnergy: character.stats.energy,
          damage: character.stats.damage,
          crit: character.stats.crit,
          color: "#d8b46a",
          characterId: character.id,
          animation: "idle",
          animTime: this.menuTime,
          actionTime: 0,
          actionTotal: 0,
          power: slot.powerId || "fire",
          facing: -Math.PI / 2,
          t: performance.now()
        });
      });
    }

    networkPlayerState(id = this.lobby.id, player = this.run?.player, extra = {}) {
      if (!player) return null;
      const localState = id === this.lobby.id;
      return {
        id,
        name: extra.name || player.name || this.save.account.username || "Người chơi",
        x: player.x,
        y: player.y,
        vx: player.vx || 0,
        vy: player.vy || 0,
        hp: player.hp,
        maxHp: player.maxHp,
        energy: player.energy,
        maxEnergy: player.maxEnergy,
        damage: player.damage,
        crit: player.crit,
        color: extra.color || this.save.customization.color,
        characterId: player.characterId,
        animation: player.animation,
        animTime: player.animTime,
        actionTime: player.actionTime,
        actionTotal: player.actionTotal,
        guardianParry: player.guardianParry || 0,
        dead: Boolean(player.dead),
        spectating: Boolean(player.spectating || extra.spectating || (localState && this.run?.spectating)),
        spectateId: player.spectateId || extra.spectateId || (localState ? this.run?.spectateId : "") || "",
        power: extra.power || this.run.power.id,
        facing: player.facing,
        t: performance.now()
      };
    }

    serializableVisual(entry) {
      const clean = {};
      for (const [key, value] of Object.entries(entry)) {
        if (key === "target" || key === "hit") continue;
        if (value == null || ["number", "string", "boolean"].includes(typeof value)) clean[key] = value;
        else if (Array.isArray(value)) clean[key] = value.slice(0, 16);
        else if (["reward", "chestReward", "coinReward"].includes(key)) clean[key] = value;
      }
      return clean;
    }

    restoreShockwave(wave) {
      return { ...wave, hit: new Set(Array.isArray(wave.hit) ? wave.hit : []) };
    }

    compactFields(entry, fields) {
      const clean = {};
      for (const key of fields) {
        const value = entry?.[key];
        if (value == null) continue;
        if (["number", "string", "boolean"].includes(typeof value)) clean[key] = value;
        else if (["reward", "chestReward", "coinReward"].includes(key)) clean[key] = value;
      }
      return clean;
    }

    compactEnemy(enemy) {
      return this.compactFields(enemy, [
        "id", "kind", "x", "y", "vx", "vy", "radius", "hp", "maxHp", "speed", "damage",
        "role", "specialSkill", "ranged", "bulky", "elite", "boss", "attackCd", "skillCd", "windupType",
        "windupTime", "windupTotal", "windupAngle", "windupX", "windupY", "chargeTime",
        "chargeHit", "chargeDir", "chargeSpeed", "chargeDamage", "attackAnim", "attackDir", "facingDir",
        "launch", "flash", "stun", "burn", "chill", "mark", "phase", "phaseLock", "aiTimer"
      ]);
    }

    compactProjectile(projectile) {
      return this.compactFields(projectile, [
        "id", "owner", "x", "y", "vx", "vy", "radius", "damage", "life", "age", "color", "pierce", "kind", "visualOnly", "visualImpact"
      ]);
    }

    compactPickup(pickup) {
      return this.compactFields(pickup, [
        "id", "type", "container", "ownerId", "ownerName", "dropperId", "x", "y", "vx", "vy", "radius", "life", "age", "color", "collected", "countsForClaim", "opening", "opened", "openTimer", "stationary", "settleTime", "settleTotal", "scatterTime", "scatterTotal", "magnetDelay", "dropGrace", "noMagnet", "requiresMagnetPickup", "magnetStarted", "reward", "chestReward", "coinReward"
      ]);
    }

    compactRoomObject(object) {
      return this.compactFields(object, [
        "id", "type", "x", "y", "radius", "grow", "opened", "active", "roomType",
        "label", "icon", "color", "effect", "locked", "claimed", "opening", "openTimer", "enterProgress"
      ]);
    }

    compactStatusEffect(effect) {
      return this.compactFields(effect, [
        "id", "kind", "name", "text", "color", "icon", "time", "maxTime"
      ]);
    }

    networkEffects(compact = false) {
      const visibleTypes = new Set([
        "pull", "zone", "danger", "ultimate", "skillShape", "castBurst", "castCone",
        "powerGlyph", "attackBurst", "hitSpark", "lineTell"
      ]);
      return this.run.effects
        .filter((effect) => visibleTypes.has(effect.type))
        .slice(compact ? -30 : -52)
        .map((effect) => this.serializableVisual(effect));
    }

    mergeNetworkActors(current, incoming, snapDistance = 520) {
      const previousById = new Map();
      for (const actor of current || []) {
        if (actor?.id) previousById.set(actor.id, actor);
      }
      return incoming.map((actor) => {
        const previous = previousById.get(actor.id) || {};
        const x = Number(actor.x);
        const y = Number(actor.y);
        const nextX = Number.isFinite(x) ? x : previous.x;
        const nextY = Number.isFinite(y) ? y : previous.y;
        const previousDisplayX = Number.isFinite(previous.displayX) ? previous.displayX : (Number.isFinite(previous.x) ? previous.x : nextX);
        const previousDisplayY = Number.isFinite(previous.displayY) ? previous.displayY : (Number.isFinite(previous.y) ? previous.y : nextY);
        const snap = !Number.isFinite(previousDisplayX) || !Number.isFinite(previousDisplayY) || Math.hypot(nextX - previousDisplayX, nextY - previousDisplayY) > snapDistance;
        return {
          ...previous,
          ...actor,
          displayX: snap ? nextX : previousDisplayX,
          displayY: snap ? nextY : previousDisplayY
        };
      });
    }

    networkSnapshot(compact = false) {
      if (!this.run) return null;
      const players = [this.networkPlayerState()].filter(Boolean);
      for (const [id, state] of this.remotePlayers) {
        const slot = this.lobby.slots.find((entry) => entry.id === id);
        const playerState = this.networkPlayerState(id, state, {
          name: state.name || slot?.name,
          color: state.color,
          power: state.power
        });
        if (playerState) players.push(playerState);
      }
      return {
        stage: this.run.stage,
        roomNumber: this.run.roomNumber,
        roomsCleared: this.run.roomsCleared,
        roomClearTimer: this.run.roomClearTimer,
        biomeId: this.run.biome.id,
        seed: this.run.seed,
        leaderId: this.run.leaderId || this.lobby.id,
        curse: this.run.curse ? { ...this.run.curse } : null,
        statusEffects: this.run.statusEffects.filter((effect) => effect.kind !== "assist").map((effect) => this.compactStatusEffect(effect)),
        nextRooms: this.run.nextRooms.map((room) => ({ ...room })),
        players,
        currentRoom: this.run.currentRoom ? {
          type: this.run.currentRoom.type,
          label: this.run.currentRoom.label,
          icon: this.run.currentRoom.icon,
          color: this.run.currentRoom.color,
          started: this.run.currentRoom.started,
          cleared: this.run.currentRoom.cleared,
          intro: this.run.currentRoom.intro,
          rewardDropped: this.run.currentRoom.rewardDropped,
          rewardClaimed: this.run.currentRoom.rewardClaimed,
          nextOpened: this.run.currentRoom.nextOpened,
          bossDefeated: this.run.currentRoom.bossDefeated,
          bossExitOpened: this.run.currentRoom.bossExitOpened,
          advancing: this.run.currentRoom.advancing,
          rewardClaims: this.run.currentRoom.rewardClaims || {},
          rewardOwners: this.run.currentRoom.rewardOwners || []
        } : null,
        enemies: compact ? this.run.enemies.map((enemy) => this.compactEnemy(enemy)) : this.run.enemies.map((enemy) => ({ ...enemy })),
        hazards: this.run.hazards.map((hazard) => compact ? this.compactFields(hazard, ["type", "x", "y", "radius", "pulse", "cooldown"]) : ({ ...hazard })),
        roomObjects: this.run.roomObjects.map((object) => compact ? this.compactRoomObject(object) : this.serializableVisual(object)),
        pickups: this.run.pickups.map((pickup) => compact ? this.compactPickup(pickup) : this.serializableVisual(pickup)),
        projectiles: (compact ? this.run.projectiles.slice(-36) : this.run.projectiles).map((projectile) => compact ? this.compactProjectile(projectile) : this.serializableVisual(projectile)),
        drones: compact ? [] : this.run.drones.map((drone) => this.serializableVisual(drone)),
        slashes: (compact ? this.run.slashes.slice(-14) : this.run.slashes).map((slash) => this.serializableVisual(slash)),
        shockwaves: (compact ? this.run.shockwaves.slice(-10) : this.run.shockwaves).map((wave) => ({ ...this.serializableVisual(wave), hit: Array.from(wave.hit || []) })),
        trails: compact ? [] : this.run.trails.map((trail) => this.serializableVisual(trail)),
        effects: this.networkEffects(compact),
        damageTexts: compact ? [] : this.run.damageTexts.slice(-24).map((text) => this.serializableVisual(text)),
        t: performance.now()
      };
    }

    applyNetworkSnapshot(snapshot) {
      if (!snapshot || !this.run || this.isMultiplayerHost()) return;
      const biome = BIOMES.find((entry) => entry.id === snapshot.biomeId);
      if (biome) this.run.biome = biome;
      this.run.stage = Number.isFinite(snapshot.stage) ? snapshot.stage : this.run.stage;
      const previousRoomNumber = this.run.roomNumber;
      this.run.roomNumber = Number.isFinite(snapshot.roomNumber) ? snapshot.roomNumber : this.run.roomNumber;
      this.run.roomsCleared = Number.isFinite(snapshot.roomsCleared) ? snapshot.roomsCleared : this.run.roomsCleared;
      this.run.roomClearTimer = Number.isFinite(snapshot.roomClearTimer) ? snapshot.roomClearTimer : this.run.roomClearTimer;
      if (Number.isFinite(snapshot.seed)) this.run.seed = snapshot.seed;
      if (snapshot.leaderId != null) this.run.leaderId = snapshot.leaderId || "";
      this.run.curse = snapshot.curse ? { ...snapshot.curse } : null;
      if (Array.isArray(snapshot.statusEffects)) {
        const localAssists = (this.run.statusEffects || []).filter((effect) => effect.kind === "assist" && effect.time > 0);
        this.run.statusEffects = [...snapshot.statusEffects.map((effect) => ({ ...effect })), ...localAssists];
      }
      if (Array.isArray(snapshot.nextRooms)) this.run.nextRooms = snapshot.nextRooms.map((room) => ({ ...room }));
      if (snapshot.currentRoom) {
        this.run.currentRoom = { ...(this.run.currentRoom || {}), ...snapshot.currentRoom };
      }
      if (this.run.roomNumber !== previousRoomNumber && this.run.currentRoom && !this.run.currentRoom.cleared) {
        this.mode = "game";
        if (this.run.player.dead && this.run.spectating) this.showSpectatePanel();
        else this.setScreen("");
        this.hud.classList.remove("hidden");
      }
      if (this.run.currentRoom?.type === "healing" && (this.run.roomNumber !== previousRoomNumber || this.run.player.dead)) {
        this.revivePlayer(this.run.player, { x: WORLD_W / 2, y: WORLD_H / 2, heal: 55, local: true });
      }
      if (Array.isArray(snapshot.enemies)) this.run.enemies = this.mergeNetworkActors(this.run.enemies, snapshot.enemies, 620);
      if (Array.isArray(snapshot.hazards)) this.run.hazards = snapshot.hazards.map((hazard) => ({ ...hazard }));
      if (Array.isArray(snapshot.roomObjects)) this.run.roomObjects = snapshot.roomObjects.map((object) => ({ ...object }));
      if (Array.isArray(snapshot.pickups)) this.run.pickups = snapshot.pickups.map((pickup) => ({ ...pickup }));
      if (Array.isArray(snapshot.projectiles)) this.run.projectiles = snapshot.projectiles.map((projectile) => ({ ...projectile }));
      if (Array.isArray(snapshot.drones)) this.run.drones = snapshot.drones.map((drone) => ({ ...drone }));
      if (Array.isArray(snapshot.slashes)) this.run.slashes = snapshot.slashes.map((slash) => ({ ...slash }));
      if (Array.isArray(snapshot.shockwaves)) this.run.shockwaves = snapshot.shockwaves.map((wave) => this.restoreShockwave(wave));
      if (Array.isArray(snapshot.trails)) this.run.trails = snapshot.trails.map((trail) => ({ ...trail }));
      if (Array.isArray(snapshot.effects)) this.run.effects = snapshot.effects.map((effect) => ({ ...effect }));
      if (Array.isArray(snapshot.damageTexts)) this.run.damageTexts = snapshot.damageTexts.map((text) => ({ ...text }));
      if (Array.isArray(snapshot.players)) {
        const now = performance.now();
        const seen = new Set();
        for (const player of snapshot.players) {
          if (!player?.id || player.id === this.lobby.id) continue;
          seen.add(player.id);
          const previous = this.remotePlayers.get(player.id) || {};
          const slot = this.lobby.slots.find((entry) => entry.id === player.id);
          const x = Number(player.x);
          const y = Number(player.y);
          const nextX = Number.isFinite(x) ? x : previous.x;
          const nextY = Number.isFinite(y) ? y : previous.y;
          const previousDisplayX = Number.isFinite(previous.displayX) ? previous.displayX : (Number.isFinite(previous.x) ? previous.x : nextX);
          const previousDisplayY = Number.isFinite(previous.displayY) ? previous.displayY : (Number.isFinite(previous.y) ? previous.y : nextY);
          const snap = !Number.isFinite(previousDisplayX) || !Number.isFinite(previousDisplayY) || Math.hypot(nextX - previousDisplayX, nextY - previousDisplayY) > 520;
          this.remotePlayers.set(player.id, {
            ...previous,
            ...player,
            name: player.name || previous.name || slot?.name || "Người chơi",
            displayX: snap ? nextX : previousDisplayX,
            displayY: snap ? nextY : previousDisplayY,
            t: now
          });
        }
        const slotIds = new Set((this.lobby.slots || []).map((slot) => slot?.id).filter(Boolean));
        for (const id of this.remotePlayers.keys()) {
          if (!seen.has(id) && !slotIds.has(id)) this.remotePlayers.delete(id);
        }
      }
    }

    effectiveCharacterStats(character) {
      const upgrades = this.save.progression?.statUpgrades || {};
      const hp = upgrades.hp || 0;
      const energy = upgrades.energy || 0;
      const damage = upgrades.damage || 0;
      const speed = upgrades.speed || 0;
      const crit = upgrades.crit || 0;
      return {
        hp: Math.round(character.stats.hp + hp * 6),
        energy: Math.round(character.stats.energy + energy * 4),
        speed: Math.round(character.stats.speed + Math.sqrt(speed) * 5 + speed * 0.45),
        damage: Number((character.stats.damage + Math.sqrt(damage) * 1.15 + damage * 0.08).toFixed(1)),
        crit: Math.min(0.55, character.stats.crit + Math.sqrt(crit) * 0.006 + crit * 0.0008),
        attackCd: character.stats.attackCd
      };
    }

    defaultCombatStats() {
      return {
        lifeSteal: 0,
        burnDash: false,
        chainCrit: false,
        drones: 0,
        fracture: false,
        fatalRewind: false,
        explosionHeal: false,
        shockwaveCombo: false,
        rewardLuck: 0,
        coinBonus: 0,
        magnetBonus: 0,
        damageTakenMult: 1,
        energyRegenMult: 1,
        divineSigil: false
      };
    }

    createPlayer() {
      const character = characterById(this.save.account.selectedCharacter);
      const stats = this.effectiveCharacterStats(character);
      return {
        x: WORLD_W / 2,
        y: WORLD_H / 2,
        vx: 0,
        vy: 0,
        radius: 22,
        hp: stats.hp,
        maxHp: stats.hp,
        energy: stats.energy,
        maxEnergy: stats.energy,
        speed: stats.speed,
        damage: stats.damage,
        crit: stats.crit,
        baseStats: { ...stats },
        name: this.save.account.username || "Bạn",
        characterId: character.id,
        basicAttackCd: stats.attackCd,
        combo: 0,
        comboTimer: 0,
        invuln: 0,
        guardianParry: 0,
        energyRegenDelay: 0,
        dashTime: 0,
        dashCd: 0,
        dashVector: { x: 1, y: 0 },
        attackCd: 0,
        pendingBasicAttack: null,
        ult: 0,
        shield: 0,
        dead: false,
        deathTime: 0,
        spectating: false,
        spectateId: "",
        animation: "idle",
        animTime: 0,
        actionTime: 0,
        actionTotal: 0,
        facing: 0,
        stats: this.defaultCombatStats(),
        cooldowns: {
          q: 0,
          e: 0,
          r: 0,
          f: 0
        }
      };
    }

    applyEquippedItems() {
      const player = this.run.player;
      player.hp = player.maxHp;
      this.run.drones = [];
    }

    equippedRunItems() {
      return (this.run?.runItems || []).filter((entry) => entry.equipped);
    }

    runItemByUid(uidValue) {
      return (this.run?.runItems || []).find((entry) => entry.uid === uidValue) || null;
    }

    reapplyRunEquipment() {
      if (!this.run?.player) return;
      const player = this.run.player;
      const base = player.baseStats || this.effectiveCharacterStats(characterById(player.characterId));
      const hpRatio = player.maxHp > 0 ? clamp(player.hp / player.maxHp, 0, 1) : 1;
      const energyRatio = player.maxEnergy > 0 ? clamp(player.energy / player.maxEnergy, 0, 1) : 1;
      player.maxHp = base.hp;
      player.hp = base.hp;
      player.maxEnergy = base.energy;
      player.energy = base.energy;
      player.speed = base.speed;
      player.damage = base.damage;
      player.crit = base.crit;
      player.basicAttackCd = base.attackCd;
      player.stats = this.defaultCombatStats();
      player.shield = 0;
      this.run.drones = [];
      for (const entry of this.equippedRunItems()) {
        const item = itemById(entry.id);
        if (item) this.applyItemEffect(item, player, { rebuild: true });
      }
      player.hp = clamp(player.maxHp * hpRatio, 1, player.maxHp);
      player.energy = clamp(player.maxEnergy * energyRatio, 0, player.maxEnergy);
    }

    addRunItem(itemId, { autoEquip = true } = {}) {
      if (!this.run) return false;
      const item = itemById(itemId);
      if (!item) return false;
      this.run.runItems ||= [];
      if (this.run.runItems.length >= RUN_ITEM_LIMIT) {
        this.toast("Kho trong ải đã đầy");
        return false;
      }
      const equipped = autoEquip && this.equippedRunItems().length < RUN_EQUIP_LIMIT;
      this.run.runItems.push({ uid: uid("runitem"), id: item.id, equipped });
      this.reapplyRunEquipment();
      this.toast(equipped ? `Đã trang bị ${item.name}` : `Đã cất ${item.name} vào túi`);
      return true;
    }

    equipRunItem(uidValue) {
      const entry = this.runItemByUid(uidValue);
      if (!entry) return;
      if (entry.equipped) return;
      if (this.equippedRunItems().length >= RUN_EQUIP_LIMIT) {
        this.toast("Đã trang bị tối đa 6 món");
        return;
      }
      entry.equipped = true;
      this.reapplyRunEquipment();
      this.showRunInventory();
    }

    unequipRunItem(uidValue) {
      const entry = this.runItemByUid(uidValue);
      if (!entry) return;
      entry.equipped = false;
      this.reapplyRunEquipment();
      this.showRunInventory();
    }

    removeRunItem(uidValue) {
      const index = (this.run?.runItems || []).findIndex((entry) => entry.uid === uidValue);
      if (index < 0) return null;
      const [entry] = this.run.runItems.splice(index, 1);
      this.reapplyRunEquipment();
      return entry;
    }

    spawnDroppedRunItem(entry, x = this.run.player.x, y = this.run.player.y, ownerName = this.save.account.username || "Người chơi", options = {}) {
      const item = itemById(entry?.id);
      if (!item || !this.run) return;
      const facing = Number.isFinite(Number(options.facing)) ? Number(options.facing) : (this.run.player.facing || rand(0, TAU));
      const side = rand(-0.42, 0.42);
      const angle = facing + side;
      const startX = clamp(x + Math.cos(angle) * 38, ROOM_PAD + 28, WORLD_W - ROOM_PAD - 28);
      const startY = clamp(y + Math.sin(angle) * 38, ROOM_PAD + 28, WORLD_H - ROOM_PAD - 28);
      const burst = rand(360, 500);
      this.run.pickups.push({
        id: uid("drop"),
        x: startX,
        y: startY,
        vx: Math.cos(angle) * burst,
        vy: Math.sin(angle) * burst - 80,
        type: "reward",
        container: "looseItem",
        ownerId: "",
        ownerName,
        dropperId: options.dropperId || this.lobby.id,
        reward: { type: "item", item },
        countsForClaim: false,
        radius: 17,
        life: 80,
        age: 0,
        noMagnet: true,
        dropGrace: 0.75,
        settleTime: 0.55,
        settleTotal: 0.55,
        color: this.rewardColor({ type: "item", item })
      });
    }

    dropRunItem(uidValue) {
      const entry = this.removeRunItem(uidValue);
      if (!entry) return;
      const p = this.run.player;
      if (this.isMultiplayerClient()) this.lobby.sendDropItem(entry.id, p.x, p.y, p.facing || 0);
      else this.spawnDroppedRunItem(entry, p.x, p.y, this.save.account.username || "Người chơi", { facing: p.facing || 0, dropperId: this.lobby.id });
      this.toast("Đã vứt phụ trợ ra đất");
      this.showRunInventory();
    }

    applyItemEffect(item, player, options = {}) {
      if (!item || !player) return;
      if (item.id === "swiftBoots") {
        player.speed *= 1.18;
        player.maxEnergy = Math.max(35, player.maxEnergy - 12);
        player.energy = Math.min(player.energy, player.maxEnergy);
      }
      if (item.id === "focusGloves") {
        player.damage += 3.2;
        player.basicAttackCd *= 1.08;
      }
      if (item.id === "amberTonic") {
        player.maxHp += 34;
        player.hp += 34;
        player.speed *= 0.96;
      }
      if (item.id === "sparkNeedle") {
        player.crit += 0.07;
        player.stats.chainCrit = true;
      }
      if (item.id === "droneCore") {
        player.stats.drones += 1;
        if (this.run) this.run.drones.push({ angle: rand(0, TAU), cooldown: 0, radius: 72 });
        player.stats.energyRegenMult *= 0.9;
      }
      if (item.id === "fractureBell") player.stats.fracture = true;
      if (item.id === "bloodVial") {
        player.stats.lifeSteal += 0.045;
        player.maxHp = Math.max(45, player.maxHp - 10);
        player.hp = Math.min(player.hp, player.maxHp);
      }
      if (item.id === "gravityDice" && this.run && !this.run.effects.some((effect) => effect.type === "gravityAnomaly")) this.addEffect({ type: "gravityAnomaly", time: 999, pulse: 0 });
      if (item.id === "luckyCharm") {
        player.damage = Math.max(1, player.damage - 1);
        player.stats.magnetBonus += 160;
        player.stats.rewardLuck += 0.15;
      }
      if (item.id === "guardPlate") {
        player.shield = Math.max(player.shield || 0, 46 + this.run.stage * 6);
        player.stats.damageTakenMult *= 0.9;
        player.speed *= 0.95;
      }
      if (item.id === "merchantEdge") {
        player.damage += 5;
        player.crit += 0.05;
      }
      if (item.id === "riftLedger") {
        player.stats.rewardLuck += 0.18;
        player.stats.coinBonus += 0.28;
      }
      if (item.id === "azurePermit") {
        player.maxEnergy += 24;
        player.energy += 24;
        player.stats.energyRegenMult *= 1.18;
        player.damage += 2;
      }
      if (item.id === "divineSigil") player.stats.divineSigil = true;
    }

    startRoom(room) {
      if (!this.run) return;
      this.mode = "game";
      this.setScreen("");
      const type = room.type || room.id;
      const meta = ROOM_TYPES.find((r) => r.id === type) || room;
      this.run.currentRoom = {
        ...meta,
        type,
        cleared: false,
        started: false,
        intro: type === "boss" ? 3.0 : 1.25,
        timer: 0,
        rewardClaims: {},
        rewardOwners: []
      };
      this.run.roomNumber += 1;
      this.syncStatusEffects();
      this.run.roomClearTimer = 0;
      this.run.enemies = [];
      this.run.projectiles = [];
      this.run.particles = [];
      this.run.damageTexts = [];
      this.run.slashes = [];
      this.run.hazards = [];
      this.run.pickups = [];
      this.run.shockwaves = [];
      this.run.trails = [];
      this.run.delayedStrikes = [];
      this.run.roomObjects = [];
      this.run.merchantOffers = [];
      this.run.pendingDoor = null;
      this.run.player.x = WORLD_W / 2;
      this.run.player.y = WORLD_H / 2;
      this.run.player.invuln = 1;
      this.run.player.pendingBasicAttack = null;
      if (type === "healing") this.revivePartyForHealing();
      this.spawnHazards();
      if (type === "treasure") this.spawnTreasureChest();
      else if (type === "merchant") this.spawnMerchantStall();
      else if (type === "curse") this.spawnCurseBook();
      else if (type === "boss") {
        this.run.currentRoom.started = true;
        this.spawnBoss();
      }
      else this.spawnRoomEnemies(type);
      if (this.run.enemies.length === 0 && ["healing", "secret"].includes(type)) {
        this.run.roomClearTimer = 0.6;
      }
      this.toast(`${this.run.biome.name}: ${this.run.currentRoom.label || title(type)}`);
    }

    applyCurse(curse) {
      const status = this.addStatusEffect({
        id: curse.id,
        kind: "curse",
        name: curse.name,
        text: curse.text,
        color: curse.color,
        icon: curse.name.slice(0, 1),
        time: 95,
        maxTime: 95
      });
      this.run.curse = status;
      if (curse.id === "halfHp") {
        this.run.player.hp = Math.min(this.run.player.hp, Math.ceil(this.run.player.maxHp * 0.5));
      }
      if (curse.id === "glassMight") {
        this.run.player.hp = Math.min(this.run.player.hp, Math.ceil(this.run.player.maxHp * 0.7));
      }
      if (curse.id === "ironPulse") {
        this.run.player.shield = Math.max(this.run.player.shield || 0, 28 + this.run.stage * 6);
      }
      this.toast(`Nguyền rủa: ${curse.name}`);
    }

    addStatusEffect(effect) {
      this.run.statusEffects ||= [];
      const existing = this.run.statusEffects.find((entry) => entry.id === effect.id && entry.kind === effect.kind);
      const next = {
        ...effect,
        time: Number.isFinite(effect.time) ? effect.time : 60,
        maxTime: Number.isFinite(effect.maxTime) ? effect.maxTime : (Number.isFinite(effect.time) ? effect.time : 60)
      };
      if (existing) Object.assign(existing, next);
      else this.run.statusEffects.push(next);
      this.syncStatusEffects();
      return existing || next;
    }

    updateStatusEffects(dt) {
      if (!this.run?.statusEffects?.length) return;
      let write = 0;
      for (const effect of this.run.statusEffects) {
        effect.time -= dt;
        if (effect.time > 0) this.run.statusEffects[write++] = effect;
      }
      this.run.statusEffects.length = write;
      this.syncStatusEffects();
    }

    syncStatusEffects() {
      if (!this.run) return;
      const activeCurse = this.run.statusEffects?.find((effect) => effect.kind === "curse" && effect.time > 0);
      this.run.curse = activeCurse ? {
        id: activeCurse.id,
        name: activeCurse.name,
        text: activeCurse.text,
        color: activeCurse.color
      } : null;
    }

    spawnHazards() {
      const biome = this.run.biome;
      if (["treasure", "merchant", "curse", "healing"].includes(this.run.currentRoom.type)) return;
      const count = this.run.currentRoom.type === "boss" ? 8 : 4 + this.run.stage;
      for (let i = 0; i < count; i++) {
        this.run.hazards.push({
          type: pick(biome.hazards),
          x: rand(ROOM_PAD + 80, WORLD_W - ROOM_PAD - 80),
          y: rand(ROOM_PAD + 80, WORLD_H - ROOM_PAD - 80),
          radius: rand(26, 52),
          pulse: rand(0, TAU),
          cooldown: rand(0, 2)
        });
      }
    }

    spawnRoomEnemies(type) {
      const biome = this.run.biome;
      if (type === "boss") {
        this.spawnBoss();
        return;
      }
      let count = 5 + this.run.stage + Math.floor(this.run.roomNumber / 2);
      if (type === "elite") count += 3;
      if (type === "challenge") count += 5;
      count += this.run.difficulty?.countBonus || 0;
      if (["treasure", "healing", "merchant", "secret"].includes(type)) count = type === "secret" ? 2 : 0;
      count = Math.max(0, count);
      for (let i = 0; i < count; i++) {
        const edge = pick(["top", "bottom", "left", "right"]);
        const pos = this.edgePosition(edge);
        this.run.enemies.push(this.createEnemy(pick(biome.enemies), pos.x, pos.y, type === "elite" || chance(0.12)));
      }
    }

    addRoomObject(type, data = {}) {
      const object = {
        id: uid(type),
        type,
        x: WORLD_W / 2,
        y: ROOM_PAD + 220,
        radius: 46,
        grow: 0,
        opened: false,
        active: true,
        ...data
      };
      this.run.roomObjects.push(object);
      return object;
    }

    spawnTreasureChest() {
      this.addRoomObject("treasureChest", {
        y: ROOM_PAD + 245,
        radius: 48,
        color: "#f2bf63",
        label: "Rương Kho Báu",
        effect: "gold"
      });
    }

    spawnBossGate() {
      this.run.currentRoom.started = false;
      this.addRoomObject("bossGate", {
        y: WORLD_H / 2 - 40,
        radius: 82,
        color: this.run.biome.accent,
        label: "Cổng Trùm",
        effect: "boss"
      });
    }

    spawnBossExit(x = WORLD_W / 2, y = WORLD_H / 2 + 120) {
      this.addRoomObject("bossExit", {
        x: clamp(x + 120, ROOM_PAD + 120, WORLD_W - ROOM_PAD - 120),
        y: clamp(y, ROOM_PAD + 130, WORLD_H - ROOM_PAD - 130),
        radius: 62,
        color: "#f2bf63",
        label: "Cổng Phần Thưởng",
        effect: "gold"
      });
    }

    spawnMerchantStall() {
      this.run.merchantOffers = this.rollMerchantOffers();
      this.addRoomObject("merchantStall", {
        y: WORLD_H / 2 - 20,
        radius: 58,
        color: "#35d6c9",
        label: "Quầy Thương Nhân",
        effect: "merchant"
      });
    }

    spawnCurseBook() {
      this.addRoomObject("curseBook", {
        y: WORLD_H / 2 - 30,
        radius: 50,
        color: "#a169ff",
        label: "Sách Nguyền",
        effect: "curse"
      });
    }

    edgePosition(edge) {
      if (edge === "top") return { x: rand(180, WORLD_W - 180), y: ROOM_PAD + 70 };
      if (edge === "bottom") return { x: rand(180, WORLD_W - 180), y: WORLD_H - ROOM_PAD - 70 };
      if (edge === "left") return { x: ROOM_PAD + 70, y: rand(170, WORLD_H - 170) };
      return { x: WORLD_W - ROOM_PAD - 70, y: rand(170, WORLD_H - 170) };
    }

    enemyRole(kind, ranged, bulky) {
      if (/Bomber/.test(kind)) return "bomber";
      if (/Skirmisher/.test(kind)) return "skirmisher";
      if (/Archer|Marksman/.test(kind)) return "marksman";
      if (/Caster|Acolyte|Seer|Shaman/.test(kind)) return "caster";
      if (/Bulwark|Guard|Warden/.test(kind)) return "guard";
      if (/Brute|Ogre|Butcher/.test(kind)) return "brute";
      if (/Duelist|Ronin|Reaver/.test(kind)) return "duelist";
      if (ranged) return "marksman";
      if (bulky) return "guard";
      return "stalker";
    }

    enemySpecialSkill(role) {
      return {
        bomber: "bombZone",
        marksman: "lineShot",
        caster: "orbNova",
        skirmisher: "skirmisherDash",
        brute: "quake",
        guard: "guardSlam",
        duelist: "duelistSlash",
        stalker: "melee"
      }[role] || "melee";
    }

    createEnemy(kind, x, y, elite = false) {
      const ranged = /Archer|Marksman|Caster|Acolyte|Seer|Shaman|Bomber/.test(kind);
      const bulky = /Knight|Bulwark|Brute|Guard|Ogre|Warden/.test(kind);
      const role = this.enemyRole(kind, ranged, bulky);
      const hpBase = role === "guard" ? 104 : role === "brute" ? 94 : role === "bomber" ? 68 : role === "skirmisher" ? 64 : ranged ? 60 : 74;
      const size = bulky ? 28 : role === "bomber" ? 22 : ranged ? 20 : role === "duelist" || role === "skirmisher" ? 22 : 23;
      const speedBase = role === "skirmisher" ? 102 : role === "duelist" ? 94 : role === "bomber" ? 58 : role === "caster" ? 66 : role === "marksman" ? 72 : role === "guard" ? 56 : role === "brute" ? 64 : 84;
      const damageBase = role === "caster" ? 15 : role === "bomber" ? 17 : role === "marksman" ? 16 : role === "guard" ? 22 : role === "brute" ? 24 : role === "skirmisher" ? 17 : 19;
      return {
        id: uid("enemy"),
        kind,
        x,
        y,
        vx: 0,
        vy: 0,
        radius: elite ? size + 7 : size,
        hp: (hpBase + this.run.stage * 20) * (elite ? 2.25 : 1) * (this.run.difficulty?.enemyHp || 1),
        maxHp: (hpBase + this.run.stage * 20) * (elite ? 2.25 : 1) * (this.run.difficulty?.enemyHp || 1),
        speed: speedBase * (elite ? 1.04 : 1),
        damage: (damageBase + this.run.stage * 3.4) * (this.run.difficulty?.enemyDamage || 1),
        role,
        specialSkill: this.enemySpecialSkill(role),
        ranged,
        bulky,
        elite,
        boss: false,
        attackCd: rand(0.4, 1.4),
        skillCd: rand(1.2, 2.8),
        windupType: "",
        windupTime: 0,
        windupTotal: 0,
        windupAngle: 0,
        windupX: 0,
        windupY: 0,
        chargeTime: 0,
        chargeHit: false,
        chargeDir: 0,
        attackAnim: 0,
        attackDir: 0,
        facingDir: x < WORLD_W / 2 ? 1 : -1,
        launch: 0,
        flash: 0,
        stun: 0,
        burn: 0,
        chill: 0,
        mark: 0,
        phase: 1,
        aiTimer: rand(0, 1)
      };
    }

    spawnBoss() {
      const biome = this.run.biome;
      const hp = (1180 + this.run.stage * 360) * (this.run.difficulty?.enemyHp || 1);
      this.run.enemies.push({
        id: uid("boss"),
        kind: biome.boss,
        x: WORLD_W / 2,
        y: ROOM_PAD + 210,
        vx: 0,
        vy: 0,
        radius: 58,
        hp,
        maxHp: hp,
        speed: 62 + this.run.stage * 5,
        damage: (28 + this.run.stage * 6) * (this.run.difficulty?.enemyDamage || 1),
        ranged: true,
        bulky: true,
        elite: true,
        boss: true,
        attackCd: 1.2,
        attackAnim: 0,
        attackDir: 0,
        facingDir: 1,
        launch: 0,
        flash: 0,
        stun: 0,
        burn: 0,
        chill: 0,
        mark: 0,
        phase: 1,
        phaseLock: 0,
        aiTimer: 0
      });
      this.camera.shake = 18;
      this.addShockwave(WORLD_W / 2, ROOM_PAD + 210, 220, this.run.biome.accent);
    }

    update(dt) {
      if (!this.run) return;
      const player = this.run.player;
      if (this.isMobileDevice()) this.updateTouchVector(dt);
      this.updateCamera(dt);
      const worldDt = this.hitStop > 0 ? 0 : dt;
      this.hitStop = Math.max(0, (this.hitStop || 0) - dt);
      this.updateEffects(dt);
      this.updateParticles(dt);
      this.updateDamageTexts(dt);
      this.updateStatusEffects(dt);
      this.updateHud();
      this.updateRunLeader();
      this.updateNetwork(dt);
      this.updateNetworkInterpolation(dt);
      if (this.run.currentRoom.intro > 0) {
        this.run.currentRoom.intro -= dt;
        return;
      }
      this.updatePlayer(worldDt);
      this.updateDrones(worldDt);
      this.updateHazards(worldDt);
      this.updatePendingDoor(worldDt);
      this.updateRoomObjects(worldDt);
      this.updateDelayedStrikes(worldDt);
      if (!this.isMultiplayerClient()) this.updateEnemies(worldDt);
      this.updateProjectiles(worldDt);
      this.updateSlashes(worldDt);
      this.updateTrails(worldDt);
      this.updateShockwaves(worldDt);
      if (this.input.mouse.left && !this.pauseOverlay && !player.dead) this.attackBasic();
      if (player.comboTimer > 0) player.comboTimer -= worldDt;
      else player.combo = 0;
      if (!this.isMultiplayerClient()) this.ensureRoomClearState(worldDt);
    }

    ensureRoomClearState(dt) {
      const room = this.run?.currentRoom;
      if (!room || room.cleared || room.intro > 0 || this.run.enemies.length > 0) return;
      if (this.roomNeedsObjectInteraction(room)) return;
      if (!Number.isFinite(this.run.roomClearTimer) || this.run.roomClearTimer <= 0) this.run.roomClearTimer = 0.35;
      this.run.roomClearTimer -= Math.max(0.016, dt || 0);
      if (this.run.roomClearTimer <= 0) this.clearRoom();
    }

    roomNeedsObjectInteraction(room = this.run?.currentRoom) {
      if (!room) return false;
      if (["treasure", "merchant", "curse"].includes(room.type)) return !room.rewardClaimed && !room.nextOpened;
      if (room.type === "boss") return !room.rewardClaimed;
      return false;
    }

    updatePendingDoor(dt) {
      const pending = this.run?.pendingDoor;
      if (!pending) return;
      const object = this.run.roomObjects.find((entry) => entry.id === pending.objectId);
      if (!object || object.opened || object.type !== "nextDoor") {
        this.run.pendingDoor = null;
        return;
      }
      const p = this.run.player;
      const touchRadius = object.radius * 0.82;
      if (Math.hypot(p.x - object.x, p.y - object.y) > p.radius + touchRadius) {
        object.enterProgress = 0;
        this.run.pendingDoor = null;
        return;
      }
      pending.timer = Math.max(0, pending.timer - dt);
      const total = Number(pending.total || DOOR_ENTER_TIME);
      object.enterProgress = clamp(1 - pending.timer / total, 0, 1);
      const angle = Math.atan2(object.y - p.y, object.x - p.x);
      if (chance(dt * 26)) {
        const distToDoor = rand(18, 92);
        this.addParticle(
          object.x - Math.cos(angle) * distToDoor + rand(-12, 12),
          object.y - Math.sin(angle) * distToDoor + rand(-12, 12),
          object.color || this.run.biome.accent,
          rand(6, 15),
          rand(0.22, 0.48),
          "spark",
          angle,
          rand(80, 160)
        );
      }
      if (pending.timer <= 0) {
        object.opened = true;
        this.run.pendingDoor = null;
        if (this.isMultiplayerClient()) {
          this.lobby.sendDoorChoice(object.id);
          this.toast("Đã chọn cửa, chờ host đồng bộ");
          return;
        }
        this.startRoom({
          type: object.roomType,
          label: object.label,
          icon: object.icon,
          color: object.color
        });
      }
    }

    handleRemoteDoorChoice(remoteId, objectId = "", room = null) {
      if (!this.isMultiplayerHost() || !this.run) return;
      this.updateRunLeader();
      if (remoteId !== this.run.leaderId) return;
      let targetRoom = null;
      if (objectId) {
        const object = this.run.roomObjects.find((entry) => entry.id === objectId && entry.type === "nextDoor" && !entry.opened);
        if (!object) return;
        object.opened = true;
        targetRoom = {
          type: object.roomType,
          label: object.label,
          icon: object.icon,
          color: object.color
        };
      } else if (room?.type && this.run.nextRooms.some((entry) => entry.type === room.type && entry.label === room.label)) {
        targetRoom = room;
      }
      if (!targetRoom) return;
      this.run.pendingDoor = null;
      this.toast(`${this.leaderName(remoteId)} đã chọn ${targetRoom.label || "cửa"}`);
      this.startRoom(targetRoom);
    }

    aliveActor(actor) {
      return Boolean(actor && !actor.dead && Number(actor.hp ?? 1) > 0);
    }

    partySpawnPoint(index = 0) {
      const offsets = [
        { x: 0, y: 0 },
        { x: -58, y: 38 },
        { x: 58, y: 38 },
        { x: 0, y: 82 }
      ];
      const offset = offsets[index % offsets.length];
      return { x: WORLD_W / 2 + offset.x, y: WORLD_H / 2 + offset.y };
    }

    leaderName(id = this.run?.leaderId) {
      if (!id) return "người dẫn đường";
      if (id === this.lobby.id) return this.save.account.username || "Bạn";
      return this.remotePlayers.get(id)?.name || this.lobby.slots.find((slot) => slot.id === id)?.name || "người dẫn đường";
    }

    updateRunLeader() {
      if (!this.isMultiplayerHost() || !this.run) return;
      if (this.aliveActor(this.run.player)) {
        this.run.leaderId = this.lobby.id;
        return;
      }
      const current = this.remotePlayers.get(this.run.leaderId);
      if (this.aliveActor(current)) return;
      const alive = [...this.remotePlayers.entries()].filter(([, remote]) => this.aliveActor(remote));
      this.run.leaderId = alive.length ? pick(alive)[0] : "";
    }

    isDoorLeader() {
      if (!this.isMultiplayerRun()) return true;
      if (!this.run?.leaderId) return this.isMultiplayerHost() && this.aliveActor(this.run.player);
      return this.run.leaderId === this.lobby.id;
    }

    revivePlayer(actor, options = {}) {
      if (!actor) return;
      const wasDead = Boolean(actor.dead);
      if (Number.isFinite(options.x)) actor.x = clamp(options.x, ROOM_PAD + (actor.radius || 22), WORLD_W - ROOM_PAD - (actor.radius || 22));
      if (Number.isFinite(options.y)) actor.y = clamp(options.y, ROOM_PAD + (actor.radius || 22), WORLD_H - ROOM_PAD - (actor.radius || 22));
      actor.dead = false;
      actor.spectating = false;
      actor.spectateId = "";
      actor.deathTime = 0;
      actor.hp = wasDead ? Math.max(1, Math.ceil((actor.maxHp || 1) * 0.55)) : Math.min(actor.maxHp, (actor.hp || 0) + (options.heal || 55));
      actor.energy = Math.min(actor.maxEnergy || 0, Math.max(actor.energy || 0, Math.ceil((actor.maxEnergy || 0) * 0.62)));
      actor.invuln = Math.max(actor.invuln || 0, 1.4);
      actor.animation = "idle";
      actor.actionTime = 0;
      actor.actionTotal = 0;
      actor.vx = 0;
      actor.vy = 0;
      if (wasDead) {
        this.addShockwave(actor.x, actor.y, 145, "#70e083", 0);
        for (let i = 0; i < 16 * this.save.settings.particles; i++) {
          this.addParticle(actor.x + rand(-18, 18), actor.y + rand(-18, 18), i % 2 ? "#70e083" : "#d9fbff", rand(8, 20), rand(0.3, 0.75), i % 3 === 0 ? "ring" : "spark");
        }
      }
      if (options.local || actor === this.run?.player) {
        this.run.spectating = false;
        this.run.spectateId = "";
        this.setScreen("");
        this.updateQuickActions();
        if (this.isMultiplayerRun()) this.lobby.sendState(this.networkPlayerState(this.lobby.id, this.run.player));
      }
    }

    revivePartyForHealing() {
      if (!this.run) return;
      const localPoint = this.partySpawnPoint(0);
      this.revivePlayer(this.run.player, { ...localPoint, heal: 55, local: true });
      let index = 1;
      for (const remote of this.remotePlayers.values()) {
        const point = this.partySpawnPoint(index++);
        this.revivePlayer(remote, { ...point, heal: 55 });
      }
      this.updateRunLeader();
      this.toast("Phòng hồi phục đã kéo mọi linh hồn trở lại");
    }

    playerByNetworkId(id) {
      if (!this.run || !id) return null;
      if (id === this.lobby.id) return this.run.player;
      return this.remotePlayers.get(id) || null;
    }

    displayActorPosition(actor) {
      return {
        x: Number.isFinite(actor?.displayX) ? actor.displayX : Number(actor?.x || 0),
        y: Number.isFinite(actor?.displayY) ? actor.displayY : Number(actor?.y || 0)
      };
    }

    livingSpectateTargets() {
      if (!this.run || !this.isMultiplayerRun()) return [];
      const targets = [];
      for (const [id, remote] of this.remotePlayers) {
        if (id !== this.lobby.id && this.aliveActor(remote)) {
          targets.push({ id, name: remote.name || "Người chơi", actor: remote });
        }
      }
      return targets;
    }

    setSpectateTarget(step = 0, force = false) {
      const targets = this.livingSpectateTargets();
      if (!targets.length) {
        this.run.spectateId = "";
        this.run.player.spectateId = "";
        return null;
      }
      let index = targets.findIndex((target) => target.id === this.run.spectateId);
      if (index < 0 || force) index = clamp(this.run.spectateIndex || 0, 0, targets.length - 1);
      else index = (index + step + targets.length) % targets.length;
      this.run.spectateIndex = index;
      this.run.spectateId = targets[index].id;
      this.run.player.spectating = true;
      this.run.player.spectateId = targets[index].id;
      return targets[index];
    }

    currentSpectateTarget() {
      if (!this.run?.spectating) return null;
      const current = this.playerByNetworkId(this.run.spectateId || this.run.player.spectateId);
      if (this.aliveActor(current)) return current;
      const next = this.setSpectateTarget(0, true);
      return next?.actor || null;
    }

    cameraTargetActor() {
      if (!this.run) return null;
      if (this.run.player.dead && this.run.spectating) return this.currentSpectateTarget() || this.run.player;
      return this.run.player;
    }

    updateCamera(dt) {
      if (!this.run) {
        this.camera.x = 0;
        this.camera.y = 0;
        return;
      }
      const player = this.cameraTargetActor() || this.run.player;
      const viewW = this.worldViewWidth();
      const viewH = this.worldViewHeight();
      const lead = this.mobileCameraLead(player);
      const targetX = clamp(player.x + lead.x - viewW / 2, 0, Math.max(0, WORLD_W - viewW));
      const targetY = clamp(player.y + lead.y - viewH / 2, 0, Math.max(0, WORLD_H - viewH));
      const follow = this.isMobileDevice() ? 4.2 : 8;
      this.camera.x += (targetX - this.camera.x) * Math.min(1, dt * follow);
      this.camera.y += (targetY - this.camera.y) * Math.min(1, dt * follow);
      this.camera.shake = Math.max(0, this.camera.shake - dt * (this.isMobileDevice() ? 46 : 34));
      const shakeScale = this.isMobileDevice() ? 0.34 : 1;
      const amount = this.camera.shake * this.save.settings.screenShake * shakeScale;
      this.camera.shakeX = rand(-amount, amount);
      this.camera.shakeY = rand(-amount, amount);
    }

    updatePlayer(dt) {
      const p = this.run.player;
      p.animTime += dt;
      p.actionTime = Math.max(0, (p.actionTime || 0) - dt);
      p.invuln = Math.max(0, p.invuln - dt);
      p.guardianParry = Math.max(0, (p.guardianParry || 0) - dt);
      p.attackCd = Math.max(0, p.attackCd - dt);
      if (p.dead) {
        p.vx = 0;
        p.vy = 0;
        p.dashTime = 0;
        p.pendingBasicAttack = null;
        p.animation = "death";
        p.deathTime = (p.deathTime || 0) + dt;
        return;
      }
      this.updatePendingBasicAttack(p, dt);
      p.dashCd = Math.max(0, p.dashCd - dt);
      p.energyRegenDelay = Math.max(0, (p.energyRegenDelay || 0) - dt);
      const regenRate = ((this.run.curse?.id === "manaDebt" ? 5.9 : 8.6) + (this.run.power.id === "time" ? 1.35 : 0)) * (p.stats.energyRegenMult || 1);
      if (p.energyRegenDelay <= 0) p.energy = Math.min(p.maxEnergy, p.energy + dt * regenRate);
      for (const key of Object.keys(p.cooldowns)) p.cooldowns[key] = Math.max(0, p.cooldowns[key] - dt);

      let mx = 0;
      let my = 0;
      let keyboardMove = false;
      if (this.input.keys.has("KeyW")) my -= 1;
      if (this.input.keys.has("KeyS")) my += 1;
      if (this.input.keys.has("KeyA")) mx -= 1;
      if (this.input.keys.has("KeyD")) mx += 1;
      keyboardMove = mx !== 0 || my !== 0;
      if (this.input.touch.active) {
        mx += this.input.touch.x;
        my += this.input.touch.y;
      }
      const mag = Math.hypot(mx, my);
      let movePower = this.isMobileDevice() && !keyboardMove ? clamp(mag, 0, 1) : (mag > 0 ? 1 : 0);
      if (mag > 0) {
        mx /= mag;
        my /= mag;
        p.facing = Math.atan2(my, mx);
      }
      if (p.pendingBasicAttack) p.facing = p.pendingBasicAttack.angle;

      let speed = p.speed;
      if (this.run.power.id === "time") speed += 18;
      if (p.dashTime > 0) {
        p.dashTime -= dt;
        speed = 680;
        mx = p.dashVector.x;
        my = p.dashVector.y;
        movePower = 1;
        p.invuln = Math.max(p.invuln, 0.1);
        p.animation = "dash";
        p.actionTime = 0;
        this.leaveTrail(p.x, p.y, this.run.power.color);
        if (p.stats.burnDash || this.run.power.id === "fire") {
          this.addTrailDamage(p.x, p.y, "#ff6b3a");
        }
      } else if (p.actionTime <= 0) {
        p.animation = movePower > 0.72 ? "run" : movePower > 0.08 ? "walk" : "idle";
      }

      p.vx = mx * speed * movePower;
      p.vy = my * speed * movePower;
      p.x = clamp(p.x + p.vx * dt, ROOM_PAD + p.radius, WORLD_W - ROOM_PAD - p.radius);
      p.y = clamp(p.y + p.vy * dt, ROOM_PAD + p.radius, WORLD_H - ROOM_PAD - p.radius);

      if (this.run.power.id === "nature" && Math.floor(this.menuTime * 2) % 7 === 0 && chance(dt * 0.5)) {
        this.healPlayer(1);
        this.addParticle(p.x + rand(-14, 14), p.y + rand(-16, 8), "#75e66e", 16, 0.6, "leaf");
      }
    }

    updatePendingBasicAttack(p, dt) {
      if (!p.pendingBasicAttack) return;
      if (p.pendingBasicAttack.kind === "ranger") {
        p.pendingBasicAttack.angle = this.basicAimAngle(p);
        p.facing = p.pendingBasicAttack.angle;
      }
      p.pendingBasicAttack.time -= dt;
      if (p.pendingBasicAttack.time > 0) return;
      const pending = p.pendingBasicAttack;
      p.pendingBasicAttack = null;
      if (pending.kind === "ranger") this.fireRangerShot(p, pending.angle, pending.combo);
    }

    dash() {
      const p = this.run?.player;
      if (!p || p.dead || this.pauseOverlay || p.dashCd > 0 || p.energy < 12) return;
      let dx = 0;
      let dy = 0;
      if (this.input.keys.has("KeyW")) dy -= 1;
      if (this.input.keys.has("KeyS")) dy += 1;
      if (this.input.keys.has("KeyA")) dx -= 1;
      if (this.input.keys.has("KeyD")) dx += 1;
      if (this.input.touch.active) {
        dx += this.input.touch.x;
        dy += this.input.touch.y;
      }
      const len = Math.hypot(dx, dy);
      if (len === 0) {
        dx = this.input.touch.aimX;
        dy = this.input.touch.aimY;
      } else {
        dx /= len;
        dy /= len;
      }
      p.dashVector = { x: dx, y: dy };
      p.dashTime = 0.18;
      p.dashCd = this.run.power.id === "time" ? 0.48 : 0.7;
      p.energy -= 12;
      p.energyRegenDelay = Math.max(p.energyRegenDelay || 0, 0.65);
      p.facing = Math.atan2(dy, dx);
      this.camera.shake = Math.max(this.camera.shake, 3);
      this.audio.sfx(160, "sawtooth", 0.05, 0.08);
      if (this.run.power.id === "shadow") {
        for (const enemy of this.run.enemies) {
          if (Math.hypot(enemy.x - p.x, enemy.y - p.y) < 76) enemy.mark = Math.max(enemy.mark, 3);
        }
      }
    }

    attackBasic() {
      const p = this.run?.player;
      if (!p || p.dead || this.pauseOverlay || p.attackCd > 0 || this.run.currentRoom.intro > 0) return;
      const character = characterById(p.characterId);
      const angle = this.basicAimAngle(p);
      const mageBasicCost = 7;
      if (character.id === "mage" && p.energy < mageBasicCost) {
        this.toast("Không đủ năng lượng");
        return;
      }
      p.facing = angle;
      p.attackCd = (p.basicAttackCd || character.stats.attackCd) * (this.run.curse?.id === "ironPulse" ? 1.14 : 1);
      p.animation = "attack";
      p.actionTotal = character.id === "guardian" ? 0.7 : character.id === "mage" ? 0.6 : character.id === "ranger" ? 0.72 : character.id === "assassin" ? 0.44 : 0.58;
      p.actionTime = p.actionTotal;
      p.combo = Math.min(9, p.combo + 1);
      p.comboTimer = 1.15;
      this.addAttackDust(p.x + Math.cos(angle) * 24, p.y + Math.sin(angle) * 24, angle, character.id === "guardian");
      if (this.isMultiplayerClient() && character.id !== "ranger") this.sendBasicAttackPacket(character, p, angle);
      if (character.id === "mage") {
        p.energy = Math.max(0, p.energy - mageBasicCost);
        p.energyRegenDelay = Math.max(p.energyRegenDelay || 0, 0.78);
        this.basicMageAttack(p, angle);
        return;
      }
      if (character.id === "ranger") {
        this.basicRangerAttack(p, angle);
        return;
      }
      if (character.id === "assassin") {
        this.basicAssassinAttack(p, angle);
        return;
      }
      if (character.id === "guardian") {
        this.basicGuardianAttack(p, angle);
        return;
      }
      this.basicSwordAttack(p, angle);
    }

    basicSwordAttack(p, angle) {
      const range = 92 + Math.min(36, p.combo * 3);
      const arc = Math.PI * 0.72;
      const damage = p.damage * (1 + p.combo * 0.04);
      this.addBasicAttackBurst(p.x + Math.cos(angle) * range * 0.4, p.y + Math.sin(angle) * range * 0.4, angle, "swordsman", range);
      this.audio.sfx(220 + p.combo * 22, "sawtooth", 0.04, 0.08);
      let hits = 0;
      for (const enemy of [...this.run.enemies]) {
        const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        const a = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        if (d < range + enemy.radius && Math.abs(angleDelta(a, angle)) < arc * 0.5) {
          hits++;
          this.damageEnemy(enemy, damage, {
            x: Math.cos(angle),
            y: Math.sin(angle),
            power: true,
            combo: p.combo,
            source: "basic"
          });
        }
      }
      if (hits > 0) {
        this.hitStop = Math.max(this.hitStop || 0, 0.065);
        this.camera.shake = Math.max(this.camera.shake, 7 + hits * 1.4);
      }
      if (chance(0.2)) this.spawnPhantomBlade(p.x + Math.cos(angle) * 42, p.y + Math.sin(angle) * 42, angle, damage * 0.15, "player");
      if (p.stats.shockwaveCombo && p.combo % 3 === 0) {
        this.addShockwave(p.x + Math.cos(angle) * 70, p.y + Math.sin(angle) * 70, 170, "#f2bf63", 44);
      }
    }

    basicGuardianAttack(p, angle) {
      const lunge = 50;
      const range = 104;
      const arc = Math.PI * 0.72;
      p.x = clamp(p.x + Math.cos(angle) * lunge, ROOM_PAD + p.radius, WORLD_W - ROOM_PAD - p.radius);
      p.y = clamp(p.y + Math.sin(angle) * lunge, ROOM_PAD + p.radius, WORLD_H - ROOM_PAD - p.radius);
      p.invuln = Math.max(p.invuln, 0.12);
      p.guardianParry = Math.max(p.guardianParry || 0, 0.38);
      this.addBasicAttackBurst(p.x + Math.cos(angle) * range * 0.5, p.y + Math.sin(angle) * range * 0.5, angle, "guardian", range);
      let hits = 0;
      for (const enemy of [...this.run.enemies]) {
        const d = Math.hypot(enemy.x - p.x, enemy.y - p.y);
        const a = Math.atan2(enemy.y - p.y, enemy.x - p.x);
        if (d < enemy.radius + range && Math.abs(angleDelta(a, angle)) < arc * 0.5) {
          hits++;
          enemy.stun = Math.max(enemy.stun, enemy.boss ? 0.08 : 0.38);
          enemy.launch = Math.max(enemy.launch || 0, enemy.boss ? 0.12 : 0.45);
          this.damageEnemy(enemy, p.damage * 1.15, {
            x: Math.cos(angle) * 1.6,
            y: Math.sin(angle) * 1.6,
            source: "guardian",
            combo: p.combo
          });
        }
      }
      if (hits > 0) this.hitStop = Math.max(this.hitStop || 0, 0.075);
      this.camera.shake = Math.max(this.camera.shake, hits ? 10 : 3);
      this.audio.sfx(155, "square", 0.08, 0.1);
    }

    spawnPhantomBlade(x, y, angle, damage, owner = "player") {
      this.spawnProjectile({
        owner,
        x,
        y,
        vx: Math.cos(angle) * 920,
        vy: Math.sin(angle) * 920,
        radius: 18,
        damage,
        life: 0.52,
        color: "#e8edf7",
        pierce: 1,
        kind: "phantomSlash"
      });
      this.run.slashes.push({
        x,
        y,
        tx: x + Math.cos(angle) * 130,
        ty: y + Math.sin(angle) * 130,
        line: true,
        life: 0.14,
        maxLife: 0.14,
        color: "#e8edf7"
      });
      this.trimVisualList(this.run.slashes, this.isMobileDevice() ? 24 : 38);
      this.audio.sfx(520, "triangle", 0.035, 0.045);
    }

    basicMageAttack(p, angle) {
      const damage = p.damage * (1 + p.combo * 0.03);
      const radius = 12;
      this.addBasicAttackBurst(p.x + Math.cos(angle) * 34, p.y + Math.sin(angle) * 34, angle, "mage", radius * 3.2);
      this.spawnProjectile({
        owner: "player",
        x: p.x + Math.cos(angle) * 32,
        y: p.y + Math.sin(angle) * 32,
        vx: Math.cos(angle) * 560,
        vy: Math.sin(angle) * 560,
        radius,
        damage,
        life: 1.35,
        color: "#83e8ff",
        pierce: 0,
        kind: "mageBasic"
      });
      this.audio.sfx(420, "sine", 0.08, 0.08);
    }

    basicRangerAttack(p, angle) {
      p.pendingBasicAttack = { kind: "ranger", angle, combo: p.combo, time: 0.36 };
      this.audio.sfx(180, "triangle", 0.035, 0.12);
    }

    fireRangerShot(p, angle, combo = p.combo) {
      const damage = p.damage * (1.28 + combo * 0.045);
      const radius = 7;
      this.addBasicAttackBurst(p.x + Math.cos(angle) * 38, p.y + Math.sin(angle) * 38, angle, "ranger", radius * 7.4);
      this.spawnProjectile({
        owner: "player",
        x: p.x + Math.cos(angle) * 34,
        y: p.y + Math.sin(angle) * 34,
        vx: Math.cos(angle) * 1280,
        vy: Math.sin(angle) * 1280,
        radius,
        damage,
        life: 0.88,
        color: "#ff9f43",
        pierce: 0,
        critBonus: 0.28,
        kind: "rangerBasic"
      });
      this.camera.shake = Math.max(this.camera.shake, 4);
      this.audio.sfx(330, "triangle", 0.06, 0.075);
      if (this.isMultiplayerClient()) this.sendBasicAttackPacket(characterById("ranger"), p, angle, combo, damage);
    }

    basicAssassinAttack(p, angle) {
      const range = 88 + Math.min(24, p.combo * 2);
      const arc = Math.PI * 0.72;
      const damage = p.damage * (0.8 + p.combo * 0.025);
      const flurry = chance(0.2);
      this.audio.sfx(360 + p.combo * 18, "triangle", 0.035, 0.055);
      const hits = this.performAssassinSlash(p.x, p.y, angle, range, arc, damage, p.combo);
      if (flurry) {
        this.queueAssassinSlash(p.x, p.y, angle + 0.22, range * 0.96, arc, damage * 0.65, p.combo, 0.12);
        this.queueAssassinSlash(p.x, p.y, angle - 0.22, range * 0.96, arc, damage * 0.65, p.combo, 0.24);
      }
      if (hits > 0) {
        this.hitStop = Math.max(this.hitStop || 0, 0.045);
        this.camera.shake = Math.max(this.camera.shake, 5 + hits);
      }
    }

    performAssassinSlash(x, y, angle, range, arc, damage, combo = 1) {
      this.addBasicAttackBurst(x + Math.cos(angle) * range * 0.42, y + Math.sin(angle) * range * 0.42, angle, "assassin", range);
      this.audio.sfx(410 + combo * 12, "triangle", 0.025, 0.045);
      let hits = 0;
      for (const enemy of [...this.run.enemies]) {
        const d = Math.hypot(enemy.x - x, enemy.y - y);
        const a = Math.atan2(enemy.y - y, enemy.x - x);
        if (d < range + enemy.radius && Math.abs(angleDelta(a, angle)) < arc * 0.5) {
          hits++;
          this.damageEnemy(enemy, damage, {
            x: Math.cos(angle) * 1.15,
            y: Math.sin(angle) * 1.15,
            combo,
            source: "assassin"
          });
        }
      }
      return hits;
    }

    queueAssassinSlash(x, y, angle, range, arc, damage, combo, delay) {
      this.run.delayedStrikes ||= [];
      this.run.delayedStrikes.push({ type: "assassin", x, y, angle, range, arc, damage, combo, time: delay });
    }

    updateDelayedStrikes(dt) {
      if (!this.run?.delayedStrikes?.length) return;
      let write = 0;
      for (let i = 0; i < this.run.delayedStrikes.length; i++) {
        const strike = this.run.delayedStrikes[i];
        strike.time -= dt;
        if (strike.time > 0) {
          this.run.delayedStrikes[write++] = strike;
          continue;
        }
        if (strike.type === "assassin") {
          const hits = this.performAssassinSlash(strike.x, strike.y, strike.angle, strike.range, strike.arc, strike.damage, strike.combo);
          if (hits > 0) {
            this.hitStop = Math.max(this.hitStop || 0, 0.035);
            this.camera.shake = Math.max(this.camera.shake, 4 + hits * 0.7);
          }
        }
      }
      this.run.delayedStrikes.length = write;
    }

    sendBasicAttackPacket(character, p, angle, combo = p.combo, damage = p.damage) {
      if (!this.isMultiplayerClient()) return;
      this.lobby.sendAttack({
        characterId: character.id,
        x: p.x,
        y: p.y,
        angle,
        combo,
        damage,
        color: this.save.customization.color,
        power: this.run.power.id,
        t: performance.now()
      });
    }

    handleRemoteAttack(remoteId, attack) {
      if (!this.isMultiplayerHost() || !attack || !this.run) return;
      const character = characterById(attack.characterId);
      const x = Number(attack.x);
      const y = Number(attack.y);
      const angle = Number(attack.angle);
      if (![x, y, angle].every(Number.isFinite)) return;
      const combo = clamp(Math.floor(Number(attack.combo || 1)), 1, 12);
      const baseDamage = Math.max(1, Number(attack.damage) || character.stats.damage);
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const hitOptions = { x: dirX, y: dirY, source: "remoteBasic", kind: character.id, combo };
      if (character.id === "ranger") hitOptions.critBonus = 0.28;
      const strike = (enemy, damage) => this.damageEnemy(enemy, damage, hitOptions);
      const remote = this.remotePlayers.get(remoteId) || {};
      const slot = this.lobby.slots.find((entry) => entry.id === remoteId);
      this.remotePlayers.set(remoteId, {
        ...remote,
        id: remoteId,
        name: remote.name || slot?.name || "Người chơi",
        x,
        y,
        displayX: Number.isFinite(remote.displayX) ? remote.displayX : x,
        displayY: Number.isFinite(remote.displayY) ? remote.displayY : y,
        hp: Number.isFinite(remote.hp) ? remote.hp : character.stats.hp,
        maxHp: Number.isFinite(remote.maxHp) ? remote.maxHp : character.stats.hp,
        energy: Number.isFinite(remote.energy) ? remote.energy : character.stats.energy,
        maxEnergy: Number.isFinite(remote.maxEnergy) ? remote.maxEnergy : character.stats.energy,
        damage: Number.isFinite(remote.damage) ? remote.damage : character.stats.damage,
        crit: Number.isFinite(remote.crit) ? remote.crit : character.stats.crit,
        characterId: character.id,
        color: attack.color || remote.color || "#d8b46a",
        power: attack.power || remote.power || "fire",
        animation: "attack",
        actionTotal: character.id === "guardian" ? 0.7 : character.id === "mage" ? 0.6 : character.id === "ranger" ? 0.72 : character.id === "assassin" ? 0.44 : 0.58,
        actionTime: character.id === "guardian" ? 0.7 : character.id === "mage" ? 0.6 : character.id === "ranger" ? 0.72 : character.id === "assassin" ? 0.44 : 0.58,
        facing: angle,
        t: performance.now()
      });

      if (character.id === "mage" || character.id === "ranger") {
        const maxRange = character.id === "ranger" ? 1040 : 620;
        const width = character.id === "ranger" ? 26 : 34;
        const damage = character.id === "ranger" ? baseDamage * (1.28 + combo * 0.045) : baseDamage * (1 + combo * 0.03);
        const hits = [];
        for (const enemy of this.run.enemies) {
          const dx = enemy.x - x;
          const dy = enemy.y - y;
          const along = dx * dirX + dy * dirY;
          const side = Math.abs(dx * -dirY + dy * dirX);
          if (along > 0 && along < maxRange && side < enemy.radius + width) hits.push({ enemy, along });
        }
        hits.sort((a, b) => a.along - b.along).slice(0, 1).forEach(({ enemy }) => {
          strike(enemy, damage);
          if (character.id === "mage" && chance(0.25)) {
            this.areaDamage(enemy.x, enemy.y, 72, damage * 0.1, "#83e8ff", "mageBasic");
            this.addShockwave(enemy.x, enemy.y, 92, "#83e8ff", 0);
          }
        });
        this.addBasicAttackBurst(x + dirX * 42, y + dirY * 42, angle, character.id, character.id === "ranger" ? 64 : 40);
        this.spawnProjectile({
          owner: "ally",
          x: x + dirX * 34,
          y: y + dirY * 34,
          vx: dirX * (character.id === "ranger" ? 1280 : 560),
          vy: dirY * (character.id === "ranger" ? 1280 : 560),
          radius: character.id === "ranger" ? 7 : 12,
          damage: 0,
          life: character.id === "ranger" ? 0.88 : 1.35,
          color: character.id === "ranger" ? "#ff9f43" : "#83e8ff",
          pierce: 0,
          kind: character.id === "ranger" ? "rangerBasic" : "mageBasic",
          visualOnly: true
        });
        return;
      }

      const range = character.id === "guardian" ? 104 : character.id === "assassin" ? 88 + Math.min(24, combo * 2) : 92 + Math.min(36, combo * 3);
      const arc = character.id === "guardian" ? Math.PI * 0.72 : character.id === "assassin" ? Math.PI * 0.72 : Math.PI * 0.72;
      const damage = character.id === "guardian" ? baseDamage * 1.15 : character.id === "assassin" ? baseDamage * (0.8 + combo * 0.025) : baseDamage * (1 + combo * 0.04);
      const flurry = character.id === "assassin" && chance(0.2);
      if (character.id === "assassin") {
        this.performAssassinSlash(x, y, angle, range, arc, damage, combo);
        if (flurry) {
          this.queueAssassinSlash(x, y, angle + 0.22, range * 0.96, arc, damage * 0.65, combo, 0.12);
          this.queueAssassinSlash(x, y, angle - 0.22, range * 0.96, arc, damage * 0.65, combo, 0.24);
        }
        return;
      }
      this.addBasicAttackBurst(x + dirX * range * 0.42, y + dirY * range * 0.42, angle, character.id, range);
      for (const enemy of [...this.run.enemies]) {
        const d = Math.hypot(enemy.x - x, enemy.y - y);
        const a = Math.atan2(enemy.y - y, enemy.x - x);
        if (d < range + enemy.radius && Math.abs(angleDelta(a, angle)) < arc * 0.5) {
          if (character.id === "guardian") {
            enemy.stun = Math.max(enemy.stun, enemy.boss ? 0.08 : 0.38);
            enemy.launch = Math.max(enemy.launch || 0, enemy.boss ? 0.12 : 0.45);
          }
          strike(enemy, damage);
        }
      }
      if (character.id === "swordsman" && chance(0.2)) this.spawnPhantomBlade(x + dirX * 42, y + dirY * 42, angle, damage * 0.15, "ally");
    }

    handleRemoteSkill(remoteId, skill) {
      if (!this.isMultiplayerHost() || !skill || !this.run) return;
      const power = powerById(skill.powerId || "fire");
      const x = Number(skill.x);
      const y = Number(skill.y);
      const angle = Number(skill.angle || 0);
      const targetX = Number.isFinite(Number(skill.targetX)) ? Number(skill.targetX) : x + Math.cos(angle) * 240;
      const targetY = Number.isFinite(Number(skill.targetY)) ? Number(skill.targetY) : y + Math.sin(angle) * 240;
      const damage = Math.max(8, Number(skill.damage) || 24);
      if (![x, y, angle].every(Number.isFinite)) return;
      const remote = this.remotePlayers.get(remoteId) || {};
      const character = characterById(skill.characterId || remote.characterId || "swordsman");
      const slot = this.lobby.slots.find((entry) => entry.id === remoteId);
      this.remotePlayers.set(remoteId, {
        ...remote,
        id: remoteId,
        name: remote.name || slot?.name || "Người chơi",
        x,
        y,
        displayX: Number.isFinite(remote.displayX) ? remote.displayX : x,
        displayY: Number.isFinite(remote.displayY) ? remote.displayY : y,
        hp: Number.isFinite(remote.hp) ? remote.hp : character.stats.hp,
        maxHp: Number.isFinite(remote.maxHp) ? remote.maxHp : character.stats.hp,
        energy: Number.isFinite(remote.energy) ? remote.energy : character.stats.energy,
        maxEnergy: Number.isFinite(remote.maxEnergy) ? remote.maxEnergy : character.stats.energy,
        damage: Number.isFinite(remote.damage) ? remote.damage : character.stats.damage,
        crit: Number.isFinite(remote.crit) ? remote.crit : character.stats.crit,
        power: power.id,
        characterId: character.id,
        color: skill.color || remote.color || "#d8b46a",
        animation: skill.key === "f" ? "ultimate" : "skill",
        actionTotal: skill.key === "f" ? 0.72 : 0.42,
        actionTime: skill.key === "f" ? 0.72 : 0.42,
        facing: angle,
        t: performance.now()
      });

      this.executePowerSkill(skill.key, power, { x, y, damage }, angle, { x: targetX, y: targetY }, {
        owner: "ally",
        remote: true,
        damage,
        awakened: Boolean(skill.awakened)
      });
    }

    useSkill(key) {
      const p = this.run?.player;
      if (!p || p.dead || this.pauseOverlay) return;
      const cost = { q: 18, e: 24, r: 34, f: 0 }[key];
      const cooldown = { q: 3.2, e: 5.4, r: 8.6, f: 0.8 }[key];
      if (key !== "f" && (p.cooldowns[key] > 0 || p.energy < cost)) return;
      if (key === "f" && (p.cooldowns.f > 0 || p.ult < 100)) return;
      if (key !== "f") p.energy -= cost;
      p.energyRegenDelay = Math.max(p.energyRegenDelay || 0, key === "r" ? 1.45 : key === "e" ? 1.25 : 1.05);
      p.cooldowns[key] = cooldown;
      p.animation = key === "f" ? "ultimate" : "skill";
      p.actionTotal = key === "f" ? 0.72 : key === "r" ? 0.48 : 0.38;
      p.actionTime = p.actionTotal;
      const power = this.run.power;
      const aim = this.skillAimAngle(p);
      const target = this.skillTargetPoint(p, aim, 250);
      if (this.isMultiplayerClient()) this.sendSkillPacket(key, power, p, aim, target);
      if (key === "q") this.castSkillOne(power, aim);
      if (key === "e") this.castSkillTwo(power);
      if (key === "r") this.castSkillThree(power, aim, target);
      if (key === "f") {
        p.ult = 0;
        p.cooldowns.f = 1;
        this.castUltimate(power);
      }
    }

    sendSkillPacket(key, power, player, angle, target) {
      this.lobby.sendSkill({
        key,
        powerId: power.id,
        characterId: player.characterId,
        x: player.x,
        y: player.y,
        angle,
        targetX: target.x,
        targetY: target.y,
        damage: player.damage,
        awakened: Boolean(this.save.powers[power.id]?.awakened),
        color: this.save.customization.color,
        t: performance.now()
      });
    }

    addSkillShape(kind, variant, x, y, angle, radius, time = 0.62, extra = {}) {
      const quality = this.perf?.quality ?? 1;
      const cap = quality < 0.58 ? 2 : this.isMobileDevice() ? 3 : 5;
      const current = this.run.effects.filter((effect) => effect.type === "skillShape").length;
      if (current >= cap) {
        const index = this.run.effects.findIndex((effect) => effect.type === "skillShape");
        if (index >= 0) this.run.effects.splice(index, 1);
      }
      const visualTime = Math.max(0.18, time * (this.isMobileDevice() ? 0.72 : 0.86) * clamp(quality + 0.18, 0.58, 1));
      this.addEffect({
        type: "skillShape",
        kind,
        variant,
        x,
        y,
        angle,
        radius,
        time: visualTime,
        maxTime: visualTime,
        color: powerById(kind).color,
        accent: powerById(kind).accent,
        ...extra
      });
    }

    coneDamage(x, y, angle, range, arc, damage, color, kind) {
      for (const enemy of [...this.run.enemies]) {
        const d = Math.hypot(enemy.x - x, enemy.y - y);
        const a = Math.atan2(enemy.y - y, enemy.x - x);
        if (d < range + enemy.radius && Math.abs(angleDelta(a, angle)) < arc * 0.5) {
          this.damageEnemy(enemy, damage * Math.max(0.35, 1 - d / (range * 1.25)), {
            x: Math.cos(angle),
            y: Math.sin(angle),
            source: "skill",
            kind
          });
        }
      }
    }

    lineDamage(x, y, angle, length, width, damage, color, kind, pierce = 99) {
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      const hits = [];
      for (const enemy of this.run.enemies) {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const along = dx * dirX + dy * dirY;
        const side = Math.abs(dx * -dirY + dy * dirX);
        if (along > -enemy.radius && along < length + enemy.radius && side < width + enemy.radius) hits.push({ enemy, along });
      }
      hits.sort((a, b) => a.along - b.along).slice(0, pierce).forEach(({ enemy }) => {
        this.damageEnemy(enemy, damage, { x: dirX, y: dirY, source: "skill", kind });
      });
    }

    burstLines(x, y, color, count, radius, life = 0.18) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * TAU + rand(-0.08, 0.08);
        this.run.slashes.push({
          x,
          y,
          tx: x + Math.cos(a) * radius,
          ty: y + Math.sin(a) * radius,
          line: true,
          life,
          maxLife: life,
          color
        });
      }
      this.trimVisualList(this.run.slashes, this.isMobileDevice() ? 24 : 38);
    }

    applyAwakenedSkillBonus(key, power, caster, angle, target, damage, owner = "player", remote = false) {
      const kind = power.id;
      const x = caster.x;
      const y = caster.y;
      const tx = target?.x ?? x + Math.cos(angle) * 220;
      const ty = target?.y ?? y + Math.sin(angle) * 220;
      const pulse = key === "q" ? 0.42 : key === "e" ? 0.34 : key === "r" ? 0.58 : 0.72;
      this.addSkillShape(kind, `awakened-${key}`, key === "e" ? x : tx, key === "e" ? y : ty, angle, 135 + pulse * 130, 0.45 + pulse * 0.2);
      if (kind === "fire") {
        const px = x + Math.cos(angle) * (key === "r" ? 210 : 128);
        const py = y + Math.sin(angle) * (key === "r" ? 210 : 128);
        this.addTrailDamage(px, py, power.color);
        this.areaDamage(px, py, 78 + pulse * 72, damage * (0.28 + pulse * 0.28), power.color, kind);
      } else if (kind === "ice") {
        this.areaDamage(tx, ty, 92 + pulse * 84, damage * (0.22 + pulse * 0.22), power.color, kind);
        for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - tx, enemy.y - ty) < 150 + pulse * 100) enemy.chill = Math.max(enemy.chill, 2.2 + pulse);
        this.addShockwave(tx, ty, 120 + pulse * 80, power.color, 0);
      } else if (kind === "lightning") {
        this.burstLines(x, y, power.accent, key === "f" ? 10 : 5, 210 + pulse * 220, 0.16);
        this.lineDamage(x, y, angle, 360 + pulse * 220, 30 + pulse * 20, damage * (0.24 + pulse * 0.2), power.color, kind, 5);
      } else if (kind === "shadow") {
        for (const offset of [-0.24, 0.24]) {
          const a = angle + offset;
          this.spawnProjectile({ owner, x, y, vx: Math.cos(a) * 720, vy: Math.sin(a) * 720, radius: 8, damage: damage * (0.28 + pulse * 0.18), life: 0.78, color: power.color, pierce: 2, kind });
        }
        for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - tx, enemy.y - ty) < 170) enemy.mark += 2;
      } else if (kind === "blood") {
        this.coneDamage(x, y, angle, 170 + pulse * 120, Math.PI * 0.9, damage * (0.25 + pulse * 0.24), power.color, kind);
        if (!remote) this.healPlayer(8 + damage * 0.14);
      } else if (kind === "gravity") {
        this.addEffect({ type: "pull", x: tx, y: ty, radius: 210 + pulse * 150, time: 0.85 + pulse * 0.65, color: power.color });
        this.areaDamage(tx, ty, 95 + pulse * 60, damage * (0.24 + pulse * 0.24), power.color, kind);
      } else if (kind === "crystal") {
        for (let i = 0; i < 5; i++) {
          const a = angle + (i - 2) * 0.16;
          this.spawnProjectile({ owner, x: x + Math.cos(a) * 28, y: y + Math.sin(a) * 28, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, radius: 6, damage: damage * (0.18 + pulse * 0.16), life: 0.82, color: power.color, pierce: 1, kind });
        }
      } else if (kind === "nature") {
        this.addEffect({ type: "zone", x: tx, y: ty, radius: 115 + pulse * 80, time: 2.2, tick: 0.2, color: power.color, kind });
        if (!remote) this.healPlayer(10 + pulse * 18);
      } else if (kind === "void") {
        this.addEffect({ type: "pull", x: tx, y: ty, radius: 230 + pulse * 140, time: 1.0 + pulse * 0.55, color: power.color });
        for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - tx, enemy.y - ty) < 210 + pulse * 80) enemy.mark += 3;
      } else if (kind === "time") {
        this.areaDamage(x, y, 130 + pulse * 120, damage * (0.2 + pulse * 0.2), power.color, kind);
        for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - x, enemy.y - y) < 180 + pulse * 110) enemy.chill = Math.max(enemy.chill, 3.0 + pulse);
        if (!remote && key !== "f") caster.cooldowns[key] = Math.max(0, caster.cooldowns[key] - 0.6);
      }
      this.camera.shake = Math.max(this.camera.shake, 5 + pulse * 7);
    }

    executePowerSkill(key, power, caster, angle, target, options = {}) {
      const owner = options.owner || "player";
      const remote = Boolean(options.remote);
      const awakened = Boolean(options.awakened ?? this.save.powers[power.id]?.awakened);
      const x = caster.x;
      const y = caster.y;
      const damage = Math.max(8, options.damage || caster.damage || this.run.player.damage) * (this.run.curse?.id === "manaDebt" ? 1.18 : 1);
      const tx = target?.x ?? x + Math.cos(angle) * 240;
      const ty = target?.y ?? y + Math.sin(angle) * 240;
      const forwardX = x + Math.cos(angle) * 145;
      const forwardY = y + Math.sin(angle) * 145;
      const kind = power.id;

      if (key === "q") {
        if (kind === "fire") {
          this.addSkillShape(kind, "flameFan", x, y, angle, 230);
          this.coneDamage(x, y, angle, 235, Math.PI * 0.78, damage * 1.55, power.color, kind);
          this.addTrailDamage(x + Math.cos(angle) * 82, y + Math.sin(angle) * 82, power.color);
        } else if (kind === "ice") {
          this.addSkillShape(kind, "iceRing", x, y, angle, 175);
          this.areaDamage(x, y, 168, damage * 1.1, power.color, kind);
          for (const enemy of this.run.enemies) {
            if (Math.hypot(enemy.x - x, enemy.y - y) < 190) enemy.chill = Math.max(enemy.chill, 3.4);
          }
          this.addShockwave(x, y, 185, power.color, 18);
        } else if (kind === "lightning") {
          this.addSkillShape(kind, "boltLine", x, y, angle, 520, 0.34, { length: 540, width: 42 });
          this.lineDamage(x, y, angle, 540, 34, damage * 1.35, power.color, kind, 4);
          this.burstLines(x + Math.cos(angle) * 250, y + Math.sin(angle) * 250, power.accent, 4, 120, 0.13);
        } else if (kind === "shadow") {
          const sx = x + Math.cos(angle) * 96;
          const sy = y + Math.sin(angle) * 96;
          if (!remote) {
            caster.x = clamp(sx, ROOM_PAD + caster.radius, WORLD_W - ROOM_PAD - caster.radius);
            caster.y = clamp(sy, ROOM_PAD + caster.radius, WORLD_H - ROOM_PAD - caster.radius);
            caster.invuln = Math.max(caster.invuln, 0.28);
          }
          this.addSkillShape(kind, "shadowBloom", sx, sy, angle, 150);
          this.areaDamage(sx, sy, 145, damage * 1.12, power.color, kind);
          for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - sx, enemy.y - sy) < 165) enemy.mark += 2;
        } else if (kind === "blood") {
          this.addSkillShape(kind, "bloodArc", x, y, angle, 205);
          this.coneDamage(x, y, angle, 205, Math.PI * 1.1, damage * 1.28, power.color, kind);
          if (!remote) this.healPlayer(12 + damage * 0.22);
        } else if (kind === "gravity") {
          this.addSkillShape(kind, "gravityCrush", forwardX, forwardY, angle, 205);
          this.addEffect({ type: "pull", x: forwardX, y: forwardY, radius: 245, time: 1.05, color: power.color });
          this.areaDamage(forwardX, forwardY, 135, damage * 1.1, power.color, kind);
        } else if (kind === "crystal") {
          this.addSkillShape(kind, "crystalFan", x, y, angle, 250);
          for (let i = -3; i <= 3; i++) {
            const a = angle + i * 0.13;
            this.spawnProjectile({
              owner,
              x: x + Math.cos(a) * 26,
              y: y + Math.sin(a) * 26,
              vx: Math.cos(a) * 650,
              vy: Math.sin(a) * 650,
              radius: 7,
              damage: damage * 0.82,
              life: 0.9,
              color: power.color,
              pierce: 1,
              kind
            });
          }
        } else if (kind === "nature") {
          this.addSkillShape(kind, "vineTrap", tx, ty, angle, 165);
          this.addEffect({ type: "zone", x: tx, y: ty, radius: 145, time: 2.8, tick: 0.18, color: power.color, kind });
          for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - tx, enemy.y - ty) < 155) enemy.stun = Math.max(enemy.stun, enemy.boss ? 0.08 : 0.42);
        } else if (kind === "void") {
          this.addSkillShape(kind, "voidTear", tx, ty, angle, 210);
          this.addEffect({ type: "pull", x: tx, y: ty, radius: 280, time: 1.3, color: power.color });
          this.areaDamage(tx, ty, 130, damage * 1.25, power.color, kind);
          for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - tx, enemy.y - ty) < 220) enemy.mark += 2;
        } else if (kind === "time") {
          this.addSkillShape(kind, "timeStop", x, y, angle, 190);
          this.areaDamage(x, y, 175, damage * 0.95, power.color, kind);
          for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - x, enemy.y - y) < 190) enemy.chill = Math.max(enemy.chill, 3.6);
        }
        if (awakened) this.applyAwakenedSkillBonus(key, power, caster, angle, { x: tx, y: ty }, damage, owner, remote);
        this.camera.shake = Math.max(this.camera.shake, 7);
        this.audio.sfx(kind === "lightning" ? 520 : kind === "gravity" ? 110 : 260, kind === "fire" ? "sawtooth" : "triangle", 0.08, 0.1);
        return;
      }

      if (key === "e") {
        this.addSkillShape(kind, `${kind}Guard`, x, y, angle, 145, 0.58);
        if (kind === "fire") {
          caster.shield = Math.max(caster.shield || 0, 34 + this.run.stage * 6);
          this.addTrailDamage(x, y, power.color);
          this.areaDamage(x, y, 100, damage * 0.58, power.color, kind);
        } else if (kind === "ice") {
          caster.shield = Math.max(caster.shield || 0, 62 + this.run.stage * 8);
          this.addEffect({ type: "shield", target: caster, time: 4.2, color: power.color });
        } else if (kind === "lightning") {
          if (!remote) this.run.drones.push({ angle: rand(0, TAU), cooldown: 0, radius: 86, temporary: 8, color: power.color });
          this.burstLines(x, y, power.accent, 5, 170, 0.12);
        } else if (kind === "shadow") {
          caster.invuln = Math.max(caster.invuln || 0, 0.82);
          for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - x, enemy.y - y) < 180) enemy.mark += 2;
        } else if (kind === "blood") {
          if (!remote) caster.hp = Math.max(1, caster.hp - 8);
          caster.shield = Math.max(caster.shield || 0, 38);
          this.areaDamage(x, y, 125, damage * 0.8, power.color, kind);
          if (!remote) this.healPlayer(18);
        } else if (kind === "gravity") {
          caster.shield = Math.max(caster.shield || 0, 46);
          this.addEffect({ type: "pull", x, y, radius: 205, time: 0.9, color: power.color });
        } else if (kind === "crystal") {
          caster.shield = Math.max(caster.shield || 0, 52);
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * TAU;
            this.spawnProjectile({ owner, x, y, vx: Math.cos(a) * 430, vy: Math.sin(a) * 430, radius: 6, damage: damage * 0.45, life: 0.55, color: power.color, pierce: 0, kind });
          }
        } else if (kind === "nature") {
          if (!remote) this.healPlayer(44);
          this.areaDamage(x, y, 115, damage * 0.55, power.color, kind);
          for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - x, enemy.y - y) < 135) enemy.stun = Math.max(enemy.stun, 0.25);
        } else if (kind === "void") {
          if (!remote) {
            caster.x = clamp(x + Math.cos(angle) * 128, ROOM_PAD + caster.radius, WORLD_W - ROOM_PAD - caster.radius);
            caster.y = clamp(y + Math.sin(angle) * 128, ROOM_PAD + caster.radius, WORLD_H - ROOM_PAD - caster.radius);
            caster.invuln = Math.max(caster.invuln || 0, 0.35);
          }
          this.addShockwave(x, y, 130, power.color, 18);
        } else if (kind === "time") {
          if (!remote) {
            this.healPlayer(30);
            caster.cooldowns.q = Math.max(0, caster.cooldowns.q - 1.6);
            caster.cooldowns.r = Math.max(0, caster.cooldowns.r - 2.2);
          }
          this.addShockwave(x, y, 150, power.color, 0);
        }
        if (awakened) this.applyAwakenedSkillBonus(key, power, caster, angle, { x: tx, y: ty }, damage, owner, remote);
        this.audio.sfx(kind === "time" ? 190 : 180, "sine", 0.12, 0.08);
        return;
      }

      if (key === "r") {
        if (kind === "fire") {
          this.addSkillShape(kind, "meteor", tx, ty, angle, 210, 0.7);
          this.areaDamage(tx, ty, 165, damage * 1.8, power.color, kind);
          this.addShockwave(tx, ty, 185, power.color, 38);
        } else if (kind === "ice") {
          this.addSkillShape(kind, "frozenField", tx, ty, angle, 190, 0.85);
          this.addEffect({ type: "zone", x: tx, y: ty, radius: 180, time: 4.2, tick: 0.1, color: power.color, kind });
          for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - tx, enemy.y - ty) < 190) enemy.chill = Math.max(enemy.chill, 4);
        } else if (kind === "lightning") {
          this.addSkillShape(kind, "stormCage", tx, ty, angle, 210, 0.72);
          this.areaDamage(tx, ty, 175, damage * 1.55, power.color, kind);
          for (let i = 0; i < 7; i++) {
            const a = (i / 7) * TAU;
            this.run.slashes.push({ x: tx + Math.cos(a) * 170, y: ty + Math.sin(a) * 170, tx, ty, line: true, life: 0.18, maxLife: 0.18, color: power.accent });
          }
        } else if (kind === "shadow") {
          this.addSkillShape(kind, "twinSouls", x, y, angle, 230, 0.72);
          for (let i = -1; i <= 1; i += 2) {
            this.spawnProjectile({ owner, x: x - Math.sin(angle) * i * 36, y: y + Math.cos(angle) * i * 36, vx: Math.cos(angle) * 640, vy: Math.sin(angle) * 640, radius: 9, damage: damage * 1.08, life: 0.9, color: power.color, pierce: 2, kind });
          }
          this.lineDamage(x, y, angle, 430, 38, damage * 0.8, power.color, kind, 4);
        } else if (kind === "blood") {
          this.addSkillShape(kind, "bloodOrbit", x, y, angle, 220, 0.85);
          this.addEffect({ type: "zone", x, y, radius: 185, time: 4.0, tick: 0.08, color: power.color, kind });
          if (!remote) this.healPlayer(24);
        } else if (kind === "gravity") {
          this.addSkillShape(kind, "blackAnchor", tx, ty, angle, 235, 0.9);
          this.addEffect({ type: "pull", x: tx, y: ty, radius: 340, time: 2.4, color: power.color });
          this.addEffect({ type: "zone", x: tx, y: ty, radius: 180, time: 3.4, tick: 0.12, color: power.color, kind });
        } else if (kind === "crystal") {
          this.addSkillShape(kind, "crystalRain", tx, ty, angle, 220, 0.75);
          for (let i = 0; i < 12; i++) {
            const px = tx + rand(-150, 150);
            this.spawnProjectile({ owner, x: px, y: ty - 210, vx: rand(-60, 60), vy: 620, radius: 8, damage: damage * 0.72, life: 0.75, color: power.color, pierce: 0, kind });
          }
        } else if (kind === "nature") {
          this.addSkillShape(kind, "thornLine", x, y, angle, 260, 0.72, { length: 360 });
          for (let i = 1; i <= 5; i++) {
            const px = x + Math.cos(angle) * i * 70;
            const py = y + Math.sin(angle) * i * 70;
            this.areaDamage(px, py, 58, damage * 0.55, power.color, kind);
            this.addParticle(px, py, power.color, 18, 0.38, "leaf");
          }
        } else if (kind === "void") {
          this.addSkillShape(kind, "abyssWell", tx, ty, angle, 240, 0.95);
          this.addEffect({ type: "pull", x: tx, y: ty, radius: 360, time: 2.5, color: power.color });
          this.areaDamage(tx, ty, 190, damage * 1.25, power.color, kind);
        } else if (kind === "time") {
          this.addSkillShape(kind, "timeEcho", x, y, angle, 230, 0.82);
          for (let i = -3; i <= 3; i++) {
            const a = angle + i * 0.12;
            this.spawnProjectile({ owner, x, y, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, radius: 7, damage: damage * 0.72, life: 1.0, color: power.color, pierce: 1, kind });
          }
          for (const enemy of this.run.enemies) if (Math.hypot(enemy.x - x, enemy.y - y) < 250) enemy.chill = Math.max(enemy.chill, 2.8);
        }
        if (awakened) this.applyAwakenedSkillBonus(key, power, caster, angle, { x: tx, y: ty }, damage, owner, remote);
        this.camera.shake = Math.max(this.camera.shake, 9);
        this.audio.sfx(kind === "lightning" ? 560 : kind === "gravity" || kind === "void" ? 90 : 120, "sawtooth", 0.14, 0.1);
        return;
      }

      if (key === "f") {
        const awakened = this.save.powers[power.id]?.awakened;
        const radius = awakened ? 430 : 340;
        this.addSkillShape(kind, "ultimate", x, y, angle, radius, awakened ? 1.25 : 1.0);
        this.powerCastVfx(power, x, y, angle, radius, awakened ? 2.4 : 1.8, !remote);
        if (kind === "blood" && !remote) this.healPlayer(70);
        if (kind === "nature" && !remote) this.healPlayer(95);
        if (kind === "time" && !remote) {
          caster.cooldowns.q = 0;
          caster.cooldowns.e = 0;
          caster.cooldowns.r = 0;
        }
        if (kind === "gravity" || kind === "void") this.addEffect({ type: "pull", x, y, radius: radius + 80, time: 2.2, color: power.color });
        if (kind === "ice" || kind === "time" || kind === "nature") {
          for (const enemy of this.run.enemies) {
            if (Math.hypot(enemy.x - x, enemy.y - y) < radius + 40) enemy.chill = Math.max(enemy.chill, kind === "time" ? 5 : 3.5);
          }
        }
        if (kind === "lightning") this.burstLines(x, y, power.accent, 12, radius + 80, 0.22);
        if (kind === "crystal") {
          for (let i = 0; i < 14; i++) {
            const a = (i / 14) * TAU;
            this.spawnProjectile({ owner, x, y, vx: Math.cos(a) * 520, vy: Math.sin(a) * 520, radius: 8, damage: 38, life: 1.15, color: power.color, pierce: 2, kind });
          }
        }
        this.areaDamage(x, y, radius, awakened ? 170 : 120, power.accent, kind, true);
        this.addShockwave(x, y, radius + 80, power.accent, 64);
        this.addEffect({ type: "ultimate", x, y, radius, time: awakened ? 2.5 : 1.8, color: power.accent, kind });
        if (awakened) this.applyAwakenedSkillBonus(key, power, caster, angle, { x, y }, damage, owner, remote);
        this.camera.shake = Math.max(this.camera.shake, 24);
        this.audio.sfx(kind === "time" ? 130 : 70, "sawtooth", 0.35, 0.18);
      }
    }

    powerCastVfx(power, x, y, angle = 0, radius = 150, intensity = 1, healNature = true) {
      const kind = power.id;
      this.addEffect({
        type: "powerGlyph",
        kind,
        x,
        y,
        angle,
        radius,
        time: 0.75 + intensity * 0.18,
        maxTime: 0.75 + intensity * 0.18,
        color: power.color,
        accent: power.accent
      });
      const burstTime = 0.28 + intensity * 0.06;
      this.addEffect({
        type: "castBurst",
        kind,
        x,
        y,
        angle,
        radius: radius * 0.62,
        time: burstTime,
        maxTime: burstTime,
        color: power.color,
        accent: power.accent
      });
      this.addEffect({
        type: "castCone",
        kind,
        x,
        y,
        angle,
        radius: radius * (0.76 + intensity * 0.08),
        time: 0.22 + intensity * 0.05,
        maxTime: 0.22 + intensity * 0.05,
        color: power.color,
        accent: power.accent
      });
      const shape = {
        fire: "flame",
        ice: "snow",
        lightning: "spark",
        shadow: "shade",
        blood: "drop",
        gravity: "square",
        crystal: "shard",
        nature: "leaf",
        void: "void",
        time: "clock"
      }[kind] || "spark";
      const particleScale = clamp(this.perf?.quality ?? 1, 0.35, 1) * (this.isMobileDevice() ? 0.55 : 0.78);
      const count = Math.round((7 + intensity * 5) * this.save.settings.particles * particleScale);
      for (let i = 0; i < count; i++) {
        const directional = i % 2 === 0;
        const a = directional ? angle + rand(-0.55, 0.55) : angle + rand(-Math.PI, Math.PI);
        const spread = kind === "lightning" ? rand(20, radius * 1.2) : rand(10, radius);
        const px = x + Math.cos(a) * spread;
        const py = y + Math.sin(a) * spread;
        this.addParticle(
          px,
          py,
          i % 3 === 0 ? power.accent : power.color,
          rand(7, 22 + intensity * 4),
          rand(0.35, 0.85),
          i % 7 === 0 ? "ring" : shape,
          a + rand(-0.2, 0.2),
          rand(directional ? 130 : 35, 260 + intensity * 70)
        );
      }
      if (kind === "lightning") {
        for (let i = 0; i < 3; i++) {
          const a = angle + (i - 1) * 0.35;
          this.run.slashes.push({
            x,
            y,
            tx: x + Math.cos(a) * radius * 1.5,
            ty: y + Math.sin(a) * radius * 1.5,
            line: true,
            life: 0.18,
            maxLife: 0.18,
            color: power.accent
          });
          this.trimVisualList(this.run.slashes, this.isMobileDevice() ? 24 : 38);
        }
      }
      if (kind === "fire") this.addTrailDamage(x + Math.cos(angle) * 36, y + Math.sin(angle) * 36, power.color);
      if (kind === "gravity" || kind === "void" || kind === "time") this.addShockwave(x, y, radius * (kind === "time" ? 1.1 : 0.9), power.color, 0);
      if (kind === "nature" && healNature) this.healPlayer(1 + intensity);
    }

    castSkillOne(power, angle = this.skillAimAngle(this.run.player)) {
      const p = this.run.player;
      this.executePowerSkill("q", power, p, angle, this.skillTargetPoint(p, angle, 250));
    }

    castSkillTwo(power) {
      const p = this.run.player;
      this.executePowerSkill("e", power, p, p.facing, this.skillTargetPoint(p, p.facing, 180));
    }

    castSkillThree(power, aim = this.skillAimAngle(this.run.player), target = this.skillTargetPoint(this.run.player, aim, 250)) {
      const p = this.run.player;
      this.executePowerSkill("r", power, p, aim, target);
    }

    castUltimate(power) {
      const p = this.run.player;
      this.executePowerSkill("f", power, p, p.facing, { x: p.x, y: p.y });
      if (p.stats.divineSigil) {
        this.addEffect({ type: "divinePassive", time: 10, color: "#82ffd3" });
      }
    }

    spawnProjectile(projectile) {
      this.run.projectiles.push({ id: uid("proj"), ...projectile, age: 0 });
    }

    areaDamage(x, y, radius, damage, color, kind, ultimate = false) {
      for (const enemy of [...this.run.enemies]) {
        const d = Math.hypot(enemy.x - x, enemy.y - y);
        if (d < radius + enemy.radius) {
          const force = Math.max(0.2, 1 - d / radius);
          this.damageEnemy(enemy, damage * force, {
            x: (enemy.x - x) / (d || 1),
            y: (enemy.y - y) / (d || 1),
            power: true,
            source: ultimate ? "ultimate" : "skill",
            kind
          });
        }
      }
      const particleScale = clamp(this.perf?.quality ?? 1, 0.35, 1) * (this.isMobileDevice() ? 0.56 : 0.78);
      const count = Math.round((ultimate ? 16 : 7) * this.save.settings.particles * particleScale);
      for (let i = 0; i < count; i++) {
        const angle = rand(0, TAU);
        const r = rand(20, radius);
        this.addParticle(x + Math.cos(angle) * r, y + Math.sin(angle) * r, color, rand(8, 22), rand(0.35, 0.8), "spark");
      }
    }

    damageEnemy(enemy, amount, options = {}) {
      if (this.isMultiplayerClient()) {
        enemy.flash = Math.max(enemy.flash || 0, 0.08);
        return;
      }
      const p = this.run.player;
      const power = this.run.power;
      const crit = chance(p.crit + (options.source === "ultimate" ? 0.25 : 0) + (Number(options.critBonus) || 0));
      let damage = amount * (crit ? 2 : 1);
      if (this.run.curse?.id === "doubleDamage") damage *= 2;
      if (this.run.curse?.id === "glassMight") damage *= 1.22;
      if (this.run.curse?.id === "explosive" && p.combo % 5 === 0) {
        this.addShockwave(enemy.x, enemy.y, 120, "#ff8d3d", 32);
      }
      enemy.hp -= damage;
      enemy.flash = 0.12;
      enemy.stun = Math.max(enemy.stun, enemy.boss ? 0.04 : 0.12);
      enemy.vx += (options.x || 0) * (enemy.boss ? 80 : 260);
      enemy.vy += (options.y || 0) * (enemy.boss ? 80 : 260);
      if (power.id === "fire" || options.kind === "fire" || p.stats.burnDash) enemy.burn = Math.max(enemy.burn, 3);
      if (power.id === "ice" || options.kind === "ice") enemy.chill = Math.max(enemy.chill, 2.4);
      if (power.id === "shadow" || power.id === "void") enemy.mark += 1;
      if (power.id === "gravity") {
        const a = angleTo(enemy, p);
        enemy.vx += Math.cos(a) * 120;
        enemy.vy += Math.sin(a) * 120;
      }
      if (power.id === "blood" || p.stats.lifeSteal) {
        this.healPlayer(damage * (power.id === "blood" ? 0.05 : p.stats.lifeSteal));
      }
      if (crit && (p.stats.chainCrit || power.id === "lightning")) this.chainLightning(enemy, damage * 0.45);
      if (enemy.chill > 0 && enemy.hp <= 0 && p.stats.fracture) this.fracture(enemy);
      p.ult = clamp(p.ult + (crit ? 5 : 3), 0, 100);
      const basicKind = this.basicHitKind(options);
      const basicHit = Boolean(basicKind);
      const impactColor = basicHit ? (crit ? "#fff1b8" : "#f3ead7") : crit ? power.accent : power.color;
      this.addImpact(enemy.x, enemy.y, impactColor, damage, crit);
      if (basicHit) {
        const hitAngle = Math.atan2(options.y || 0, options.x || 1);
        this.addBasicHitSpark(enemy.x, enemy.y, hitAngle, basicKind, options.source === "guardian" || crit);
      }
      if (enemy.boss) this.checkBossPhase(enemy);
      if (enemy.hp <= 0) this.killEnemy(enemy);
    }

    tryGuardianReflect(target, amount, source) {
      if (!target || target.characterId !== "guardian" || !source || !Number.isFinite(source.hp) || source.hp <= 0) return false;
      const parryOpen = Number.isFinite(target.guardianParry)
        ? target.guardianParry > 0
        : (target.animation === "attack" && (target.actionTime || 0) > 0);
      if (!parryOpen) return false;
      const angle = Math.atan2(source.y - target.y, source.x - target.x);
      target.guardianParry = 0;
      target.invuln = Math.max(target.invuln || 0, 0.24);
      target.animation = "attack";
      target.actionTotal = Math.max(target.actionTotal || 0, 0.38);
      target.actionTime = Math.max(target.actionTime || 0, 0.24);
      source.stun = Math.max(source.stun || 0, source.boss ? 0.08 : 0.34);
      source.vx += Math.cos(angle) * (source.boss ? 110 : 320);
      source.vy += Math.sin(angle) * (source.boss ? 110 : 320);
      this.addBasicAttackBurst(target.x + Math.cos(angle) * 52, target.y + Math.sin(angle) * 52, angle, "guardian", 104);
      this.addShockwave(source.x, source.y, source.boss ? 130 : 96, "#ffd36a", 0);
      this.damageEnemy(source, Math.max(1, amount * 0.5), {
        x: Math.cos(angle) * 1.7,
        y: Math.sin(angle) * 1.7,
        source: "guardianReflect",
        kind: "guardian"
      });
      this.camera.shake = Math.max(this.camera.shake, 9);
      this.audio.sfx(130, "square", 0.07, 0.11);
      return true;
    }

    guardianParryOpen(target) {
      if (!target || target.characterId !== "guardian") return false;
      return Number.isFinite(target.guardianParry)
        ? target.guardianParry > 0
        : (target.animation === "attack" && (target.actionTime || 0) > 0);
    }

    markGuardianParry(target) {
      const realTarget = target.local ? this.run.player : (this.remotePlayers.get(target.id) || target);
      realTarget.guardianParry = 0;
      realTarget.invuln = Math.max(realTarget.invuln || 0, 0.24);
      realTarget.animation = "attack";
      realTarget.actionTotal = Math.max(realTarget.actionTotal || 0, 0.38);
      realTarget.actionTime = Math.max(realTarget.actionTime || 0, 0.24);
      return realTarget;
    }

    tryGuardianProjectileReflect(target, projectile) {
      if (!this.guardianParryOpen(target) || !projectile || projectile.owner !== "enemy") return false;
      const guardian = this.markGuardianParry(target);
      const guardianRadius = guardian.radius || target.radius || 22;
      const nearest = this.nearestEnemy(guardian.x, guardian.y, 920);
      const speed = Math.max(620, Math.hypot(projectile.vx || 0, projectile.vy || 0) * 1.08);
      const angle = nearest ? Math.atan2(nearest.y - guardian.y, nearest.x - guardian.x) : Math.atan2(-(projectile.vy || 0), -(projectile.vx || 1));
      projectile.owner = target.local ? "player" : "ally";
      projectile.x = guardian.x + Math.cos(angle) * (guardianRadius + projectile.radius + 10);
      projectile.y = guardian.y + Math.sin(angle) * (guardianRadius + projectile.radius + 10);
      projectile.vx = Math.cos(angle) * speed;
      projectile.vy = Math.sin(angle) * speed;
      projectile.damage = Math.max(1, projectile.damage * 0.5);
      projectile.life = Math.max(projectile.life || 0, 0.7);
      projectile.color = "#ffd36a";
      projectile.kind = "guardianReflect";
      this.addBasicAttackBurst(guardian.x + Math.cos(angle) * 52, guardian.y + Math.sin(angle) * 52, angle, "guardian", 104);
      this.addShockwave(guardian.x, guardian.y, 96, "#ffd36a", 0);
      this.camera.shake = Math.max(this.camera.shake, 8);
      this.audio.sfx(150, "square", 0.07, 0.1);
      return true;
    }

    tryGuardianEffectReflect(target, effect) {
      if (!this.guardianParryOpen(target) || !effect || !Number.isFinite(effect.damage)) return false;
      const guardian = this.markGuardianParry(target);
      const nearest = this.nearestEnemy(guardian.x, guardian.y, 860);
      const angle = nearest ? Math.atan2(nearest.y - guardian.y, nearest.x - guardian.x) : (effect.angle || guardian.facing || 0);
      this.spawnProjectile({
        owner: target.local ? "player" : "ally",
        x: guardian.x + Math.cos(angle) * 36,
        y: guardian.y + Math.sin(angle) * 36,
        vx: Math.cos(angle) * 820,
        vy: Math.sin(angle) * 820,
        radius: 13,
        damage: Math.max(1, effect.damage * 0.5),
        life: 0.72,
        color: "#ffd36a",
        pierce: 0,
        kind: "guardianReflect"
      });
      this.addBasicAttackBurst(guardian.x + Math.cos(angle) * 52, guardian.y + Math.sin(angle) * 52, angle, "guardian", 104);
      this.addShockwave(guardian.x, guardian.y, 106, "#ffd36a", 0);
      this.camera.shake = Math.max(this.camera.shake, 8);
      this.audio.sfx(150, "square", 0.07, 0.1);
      return true;
    }

    damagePlayer(amount, source = null) {
      const p = this.run.player;
      if (!p || p.dead) return;
      if (this.tryGuardianReflect(p, amount, source)) return;
      if (p.invuln > 0) return;
      let damage = amount;
      if (this.run.curse?.id === "doubleDamage") damage *= 2;
      if (this.run.curse?.id === "ironPulse") damage *= 0.76;
      damage *= p.stats.damageTakenMult || 1;
      let absorbed = 0;
      if (p.shield > 0) {
        absorbed = Math.min(p.shield, damage);
        p.shield -= absorbed;
        damage -= absorbed;
      }
      if (damage <= 0) {
        this.addImpact(p.x, p.y, "#83e8ff", absorbed || 0, false);
        return;
      }
      p.hp -= damage;
      p.invuln = 0.75;
      p.animation = "damage";
      p.actionTotal = 0.28;
      p.actionTime = p.actionTotal;
      this.run.flawless = false;
      this.camera.shake = Math.max(this.camera.shake, 13);
      this.addImpact(p.x, p.y, "#ff4b55", damage, false);
      if (this.run.curse?.id === "lifesteal" && source) source.hp = Math.min(source.maxHp, source.hp + damage * 0.35);
      if (this.run.curse?.id === "teleport" && chance(0.24)) {
        p.x = rand(ROOM_PAD + 120, WORLD_W - ROOM_PAD - 120);
        p.y = rand(ROOM_PAD + 120, WORLD_H - ROOM_PAD - 120);
        this.addShockwave(p.x, p.y, 120, "#64a8ff", 24);
      }
      if (p.hp <= 0) {
        this.playerDeath();
      }
    }

    healPlayer(amount) {
      if (!this.run) return;
      const p = this.run.player;
      if (p.dead) return;
      p.hp = Math.min(p.maxHp, p.hp + amount);
      if (amount >= 2) this.addParticle(p.x, p.y - 18, "#70e083", 18, 0.6, "plus");
    }

    killEnemy(enemy) {
      const index = this.run.enemies.indexOf(enemy);
      if (index >= 0) this.run.enemies.splice(index, 1);
      for (let i = 0; i < 16 * this.save.settings.particles; i++) {
        this.addParticle(enemy.x + rand(-enemy.radius, enemy.radius), enemy.y + rand(-enemy.radius, enemy.radius), enemy.boss ? "#f2bf63" : this.run.power.color, rand(8, 24), rand(0.25, 0.7), "spark");
      }
      if (enemy.boss) {
        this.onBossDefeated(enemy);
        return;
      }
      if (this.run.enemies.length === 0 && !this.run.currentRoom?.cleared) {
        this.spawnRoomReward(enemy.x, enemy.y);
        this.run.roomClearTimer = 0.35;
      }
    }

    onBossDefeated(enemy = null) {
      this.save.progression.bossesDefeated += 1;
      this.save.materials.bossCore += 1;
      if (chance(0.35)) this.save.materials.divineSpark += 1;
      this.save.achievements.bossBreaker = true;
      this.persist();
      if (this.run.currentRoom) this.run.currentRoom.bossDefeated = true;
      const x = enemy?.x ?? WORLD_W / 2;
      const y = enemy?.y ?? WORLD_H / 2;
      this.claimBossExitReward(x, y);
      this.addShockwave(x, y, 520, "#f2bf63", 88);
      this.toast("Boss gục xuống. Rương vàng đã rơi.");
    }

    claimBossExitReward(x = this.run.player.x, y = this.run.player.y) {
      const room = this.run?.currentRoom;
      if (!room || room.rewardDropped) return;
      room.bossExitOpened = true;
      this.spawnRoomReward(x, y, { container: "goldChest" });
      this.clearRoom();
      this.addShockwave(x, y, 210, "#f2bf63", 0);
    }

    advanceToNextStageAfterBoss() {
      if (this.run.currentRoom?.advancing) return;
      if (this.run.currentRoom) this.run.currentRoom.advancing = true;
      this.run.stage += 1;
      if (this.run.stage >= BIOMES.length) {
        this.showVictory();
        return;
      }
      this.run.biome = BIOMES[this.run.stage];
      this.audio.setBiome(this.run.biome);
      this.run.roomNumber = 0;
      this.run.nextRooms = [];
      this.toast(`Tiến vào ${this.run.biome.name}`);
      this.startRoom({ type: "normal", label: "Phòng Thường", icon: "X", color: "#c9d0db" });
    }

    clearRoom() {
      const room = this.run.currentRoom;
      if (!room) return;
      if (room.cleared) {
        this.clearRoomHazards();
        return;
      }
      room.cleared = true;
      this.clearRoomHazards();
      this.save.progression.roomsCleared += 1;
      this.run.roomsCleared += 1;
      this.save.progression.bestStage = Math.max(this.save.progression.bestStage, this.run.stage);
      if (!room.xpAwarded) {
        room.xpAwarded = true;
        this.awardXp(this.roomXpReward(room.type));
      }
      if (this.run.flawless) this.save.achievements.flawlessRoom = true;
      this.save.achievements.firstRift = true;
      this.persist();
      if (!room.rewardDropped && this.roomDropsReward(room)) this.spawnRoomReward(this.run.player.x, this.run.player.y);
      if (!this.roomDropsReward(room)) {
        room.rewardDropped = true;
        room.rewardClaimed = true;
      }
      if (room.rewardClaimed) this.openNextRoomsAfterReward();
    }

    clearRoomHazards() {
      if (!this.run?.hazards?.length) return;
      for (const hazard of this.run.hazards) {
        if (!this.inView(hazard.x, hazard.y, hazard.radius + 80)) continue;
        this.addParticle(hazard.x, hazard.y, "#dfe6ef", 14, 0.36, "ring");
      }
      this.run.hazards = [];
    }

    roomDropsReward(room) {
      return room && !["healing", "merchant", "curse"].includes(room.type);
    }

    xpToNextLevel(level = this.save.progression?.level || 1) {
      return Math.round(70 + level * 22 + Math.pow(level, 1.35) * 12);
    }

    roomXpReward(type) {
      const base = {
        healing: 22,
        merchant: 22,
        normal: 45,
        treasure: 54,
        challenge: 74,
        curse: 82,
        elite: 92,
        secret: 96,
        boss: 145
      }[type] ?? 45;
      return Math.round(base * (1 + this.run.stage * 0.18));
    }

    awardXp(amount) {
      if (!amount) return;
      this.normalizeStatPoints();
      const progress = this.save.progression;
      progress.xp += amount;
      progress.totalXp += amount;
      let levels = 0;
      while (progress.xp >= this.xpToNextLevel(progress.level)) {
        progress.xp -= this.xpToNextLevel(progress.level);
        progress.level += 1;
        progress.statPoints += 1;
        levels++;
      }
      if (levels > 0) this.toast(`Lên cấp ${progress.level}! +${levels} điểm nâng`);
      else this.toast(`Nhận ${amount} kinh nghiệm`);
    }

    rollRoomReward() {
      const luck = this.run.player.stats.rewardLuck || 0;
      const room = this.run.currentRoom.type;
      const difficulty = this.roomDifficulty(room) + (this.run.difficulty?.rewardBonus || 0);
      const itemChance = room === "boss"
        ? clamp(0.82 + luck * 0.25, 0.82, 0.98)
        : room === "treasure"
          ? clamp(0.7 + luck * 0.35, 0.66, 0.94)
          : clamp(0.34 + difficulty * 0.4 + luck * 0.45, 0.28, 0.86);
      if (chance(itemChance)) return { type: "item", item: this.rollItemForRoom(difficulty, luck), difficulty };
      return {
        type: "material",
        material: pick(["emberGlass", "frostCore", "stormThread", "bloodAmber"]),
        amount: randi(2, 5) + Math.round(difficulty * 4) + (room === "boss" ? 3 : 0),
        rarity: this.rollRarityForDifficulty(difficulty * 0.62, luck * 0.4)
      };
    }

    rollCoinReward() {
      const room = this.run.currentRoom.type;
      const difficulty = this.roomDifficulty(room) + (this.run.difficulty?.rewardBonus || 0);
      const roomMult = room === "boss" ? 2.35 : room === "treasure" ? 1.55 : room === "challenge" || room === "elite" ? 1.28 : 1;
      const bonus = 1 + (this.run.player.stats.coinBonus || 0);
      const amount = Math.max(2, Math.round((randi(5, 10) + this.run.stage * 4 + difficulty * 13) * roomMult * bonus));
      return { type: "coin", amount, rarity: this.rollRarityForDifficulty(difficulty * 0.42, 0) };
    }

    rewardOwners() {
      if (!this.isMultiplayerRun()) return [{ id: this.lobby.id, name: this.save.account.username || "Bạn" }];
      if (this.isMultiplayerHost()) {
        return this.lobby.slots.filter(Boolean).map((slot) => ({ id: slot.id, name: slot.name || "Người chơi" }));
      }
      return [{ id: this.lobby.id, name: this.save.account.username || "Bạn" }];
    }

    aliveRewardOwners() {
      if (!this.isMultiplayerRun()) return this.aliveActor(this.run?.player) ? [{ id: this.lobby.id, name: this.save.account.username || "Bạn" }] : [];
      if (this.isMultiplayerHost()) {
        return this.lobby.slots.filter(Boolean).filter((slot) => {
          if (slot.id === this.lobby.id) return this.aliveActor(this.run.player);
          return this.aliveActor(this.remotePlayers.get(slot.id));
        }).map((slot) => ({ id: slot.id, name: slot.name || "Người chơi" }));
      }
      return this.aliveActor(this.run?.player) ? [{ id: this.lobby.id, name: this.save.account.username || "Bạn" }] : [];
    }

    allRewardOwnersClaimed(room = this.run?.currentRoom) {
      if (!room?.rewardOwners?.length) return Boolean(room?.rewardClaimed);
      const claims = room.rewardClaims || {};
      return room.rewardOwners.every((id) => claims[id]);
    }

    rollDistinctRoomReward(usedItems) {
      let reward = this.rollRoomReward();
      for (let tries = 0; reward.type === "item" && usedItems.has(reward.item.id) && tries < 8; tries++) {
        reward = this.rollRoomReward();
      }
      if (reward.type === "item") usedItems.add(reward.item.id);
      return reward;
    }

    spawnRoomReward(x, y, options = {}) {
      const room = this.run?.currentRoom;
      if (!room || room.rewardDropped) return;
      const owners = this.aliveRewardOwners();
      if (!owners.length) {
        room.rewardDropped = true;
        room.rewardClaimed = true;
        room.rewardClaims = {};
        room.rewardOwners = [];
        this.run.rewardQueue = [];
        this.toast("Không còn người sống để nhận rương");
        return;
      }
      const usedItems = new Set();
      const rewards = owners.map((owner) => ({ owner, reward: this.rollDistinctRoomReward(usedItems) }));
      room.rewardDropped = true;
      room.rewardClaimed = false;
      room.rewardClaims = {};
      room.rewardOwners = owners.map((owner) => owner.id);
      this.run.rewardQueue = rewards.map((entry) => entry.reward);
      const scatterBase = rand(0, TAU);
      rewards.forEach(({ owner, reward }, index) => {
        const color = this.rewardColor(reward);
        const angle = rewards.length === 1 ? scatterBase : scatterBase + (index / rewards.length) * TAU + rand(-0.28, 0.28);
        const container = options.container || "woodChest";
        const burst = 260 + index * 18 + rand(0, 90);
        this.run.pickups.push({
          id: uid("pickup"),
          x: clamp(x, ROOM_PAD + 42, WORLD_W - ROOM_PAD - 42),
          y: clamp(y, ROOM_PAD + 42, WORLD_H - ROOM_PAD - 42),
          vx: Math.cos(angle) * burst,
          vy: Math.sin(angle) * burst * 0.78,
          type: "reward",
          container,
          ownerId: owner.id,
          ownerName: owner.name,
          chestReward: reward,
          coinReward: this.rollCoinReward(),
          radius: 22,
          life: 90,
          age: 0,
          color,
          stationary: false,
          settleTime: 0.48 + index * 0.04,
          settleTotal: 0.48 + index * 0.04
        });
      });
      const firstColor = this.rewardColor(rewards[0]?.reward || { type: "material", rarity: "rare" });
      this.addShockwave(x, y, 110, firstColor, 0);
      for (let i = 0; i < 18 * this.save.settings.particles; i++) {
        this.addParticle(x + rand(-28, 28), y + rand(-18, 18), firstColor, rand(8, 22), rand(0.35, 0.85), i % 4 === 0 ? "ring" : "spark");
      }
      this.toast(this.isMultiplayerRun() ? `Rơi ${rewards.length} rương gỗ riêng và tiền` : `Rơi rương gỗ: ${this.rewardLabel(rewards[0].reward)}`);
    }

    pickupTarget(pickup) {
      if (!pickup?.ownerId || pickup.ownerId === this.lobby.id) return this.run.player.dead ? null : this.run.player;
      if (this.isMultiplayerHost()) return this.remotePlayers.get(pickup.ownerId) || null;
      return null;
    }

    requestChestOpen(pickup) {
      if (!pickup || pickup.opened || pickup.ownerId !== this.lobby.id) return;
      const now = performance.now();
      const last = this.chestOpenRequests.get(pickup.id) || 0;
      if (now - last < 320) return;
      this.chestOpenRequests.set(pickup.id, now);
      pickup.opening = true;
      const openDuration = pickup.container === "goldChest" ? 0.62 : 0.42;
      pickup.openTimer = Math.min(Number(pickup.openTimer ?? openDuration), openDuration);
      this.lobby.sendOpenChest(pickup.id, this.run.player.x, this.run.player.y);
    }

    handleRemoteOpenChest(remoteId, pickupId, x, y) {
      if (!this.isMultiplayerHost() || !pickupId || !this.run) return;
      const chest = this.run.pickups.find((entry) => (
        entry.id === pickupId
        && (entry.container === "woodChest" || entry.container === "goldChest")
        && (!entry.ownerId || entry.ownerId === remoteId)
        && !entry.opened
      ));
      if (!chest) return;
      let target = this.remotePlayers.get(remoteId);
      const requestX = Number(x);
      const requestY = Number(y);
      if (target && Number.isFinite(requestX) && Number.isFinite(requestY)) {
        target.x = requestX;
        target.y = requestY;
        target.t = performance.now();
      }
      target = target || { x: requestX, y: requestY, radius: 22 };
      if (![target.x, target.y].every(Number.isFinite)) return;
      const d = Math.hypot(target.x - chest.x, target.y - chest.y);
      if (d > (target.radius || 22) + chest.radius + 96) return;
      if (chest.opening) return;
      chest.opening = true;
      chest.openTimer = chest.container === "goldChest" ? 0.62 : 0.42;
    }

    spawnLootFromChest(chest, target = this.run.player) {
      if (!chest || chest.opened) return;
      chest.opened = true;
      chest.life = 0;
      const color = chest.color || "#f2bf63";
      const rewards = [
        { reward: chest.chestReward, countsForClaim: true, container: chest.chestReward?.type === "item" ? "looseItem" : "material" },
        { reward: chest.coinReward, countsForClaim: false, container: "coin" }
      ].filter((entry) => entry.reward);
      const lootBase = rand(0, TAU);
      rewards.forEach((entry, index) => {
        const spreadAngle = lootBase + (index / Math.max(1, rewards.length)) * TAU + rand(-0.45, 0.45);
        const burst = 430 + index * 95 + rand(0, 130);
        this.run.pickups.push({
          id: uid(entry.container === "coin" ? "coin" : "loot"),
          x: chest.x,
          y: chest.y - 12,
          vx: Math.cos(spreadAngle) * burst + rand(-24, 24),
          vy: Math.sin(spreadAngle) * burst * 0.58 - 235 + rand(-52, 18),
          type: "reward",
          container: entry.container,
          ownerId: chest.ownerId || "",
          ownerName: chest.ownerName || "",
          reward: entry.reward,
          countsForClaim: entry.countsForClaim,
          radius: entry.container === "coin" ? 14 : 17,
          life: 90,
          age: 0,
          scatterTime: 0.58 + index * 0.04,
          scatterTotal: 0.58 + index * 0.04,
          magnetDelay: 0.72 + index * 0.08,
          dropGrace: 0.96 + index * 0.1,
          requiresMagnetPickup: true,
          magnetStarted: false,
          color: this.rewardColor(entry.reward)
        });
      });
      this.addShockwave(chest.x, chest.y, 118, color, 0);
      for (let i = 0; i < 18 * this.save.settings.particles; i++) {
        const a = -Math.PI / 2 + rand(-1.25, 1.25);
        this.addParticle(
          chest.x + rand(-20, 20),
          chest.y + rand(-16, 10),
          i % 3 === 0 ? "#5a321c" : i % 3 === 1 ? color : "#fff0ad",
          rand(8, 22),
          rand(0.3, 0.72),
          i % 5 === 0 ? "ring" : "spark",
          a,
          rand(90, 280)
        );
      }
      this.audio.sfx(420, "triangle", 0.09, 0.09);
    }

    rewardColor(reward) {
      if (reward.type === "item") return RARITY[reward.item.rarity]?.color || "#f2bf63";
      if (reward.type === "upgrade") return RARITY[reward.rarity]?.color || "#70e083";
      if (reward.type === "material") return RARITY[reward.rarity]?.color || "#35d6c9";
      if (reward.type === "coin") return "#f2bf63";
      return "#f2bf63";
    }

    rewardLabel(reward) {
      if (reward.type === "item") return reward.item.name;
      if (reward.type === "upgrade") return `Nâng ${upgradeLabel(reward.stat)}`;
      if (reward.type === "material") return `${materialLabel(reward.material)} x${reward.amount}`;
      if (reward.type === "coin") return `${materialLabel("gold")} x${reward.amount}`;
      return "Phần thưởng";
    }

    openNextRoomsAfterReward() {
      const room = this.run?.currentRoom;
      if (!room || room.nextOpened) return;
      if (!this.allRewardOwnersClaimed(room)) {
        if (this.isMultiplayerClient()) this.toast("Chờ mọi người nhặt phần thưởng");
        return;
      }
      room.nextOpened = true;
      setTimeout(() => {
        if (this.mode === "game" && this.run?.currentRoom?.cleared) {
          if (this.isMultiplayerClient()) {
            this.toast("Chờ chủ phòng chọn phòng tiếp theo");
            return;
          }
          if (this.prepareNextRooms()) this.spawnNextRoomDoors();
        }
      }, 350);
    }

    doorEffectFor(room) {
      if (room.type === "treasure") return "gold";
      if (room.type === "merchant") return "merchant";
      if (room.type === "curse") return "curse";
      if (room.type === "boss") return "boss";
      if (room.type === "healing") return "leaf";
      if (this.run.biome.id === "forest") return "leaf";
      if (this.run.biome.id === "frozen") return "snow";
      if (this.run.biome.id === "temple") return "sand";
      if (this.run.biome.id === "lava") return "ember";
      if (this.run.biome.id === "neon") return "spark";
      return "spark";
    }

    spawnNextRoomDoors() {
      if (!this.run?.nextRooms?.length) return;
      const doors = this.run.nextRooms;
      const spacing = doors.length > 2 ? 170 : 210;
      const baseX = WORLD_W / 2 - ((doors.length - 1) * spacing) / 2;
      const y = ROOM_PAD + 105;
      this.run.roomObjects = this.run.roomObjects.filter((object) => object.type !== "nextDoor");
      doors.forEach((room, index) => {
        this.addRoomObject("nextDoor", {
          x: baseX + index * spacing,
          y,
          radius: room.type === "boss" ? 66 : 54,
          roomType: room.type,
          label: room.label,
          icon: room.icon,
          color: room.color,
          effect: this.doorEffectFor(room)
        });
      });
      this.addShockwave(WORLD_W / 2, y, 220, this.run.biome.accent, 0);
      this.toast("Cửa khu tiếp theo đã mọc lên ở phía trên bản đồ");
    }

    roomDifficulty(type) {
      const base = {
        healing: 0.08,
        merchant: 0.1,
        normal: 0.18,
        treasure: 0.42,
        challenge: 0.56,
        curse: 0.62,
        elite: 0.72,
        secret: 0.78,
        boss: 1
      }[type] ?? 0.2;
      return clamp(base + this.run.stage * 0.08, 0, 1.25);
    }

    rollRarityForDifficulty(difficulty = 0, luck = 0) {
      const roll = Math.random() + luck + difficulty * 0.34;
      if (roll > 1.12) return "divine";
      if (roll > 1.02) return "mythic";
      if (roll > 0.88) return "legendary";
      if (roll > 0.68) return "epic";
      if (roll > 0.38) return "rare";
      return "common";
    }

    rollItemForRoom(difficulty = 0, luck = 0) {
      const rarity = this.rollRarityForDifficulty(difficulty, luck);
      const order = ["common", "rare", "epic", "legendary", "mythic", "divine"];
      const start = Math.max(0, order.indexOf(rarity));
      for (let i = start; i >= 0; i--) {
        const lower = ITEMS.filter((item) => item.rarity === order[i] && !item.merchantOnly);
        if (lower.length) return pick(lower);
      }
      return pick(ITEMS.filter((item) => item.rarity === "rare" && !item.merchantOnly));
    }

    rollMerchantItemForRoom(difficulty = 0, luck = 0) {
      const rarity = this.rollRarityForDifficulty(difficulty + 0.1, luck);
      const order = ["rare", "epic", "legendary", "mythic", "divine"];
      const start = Math.max(0, order.indexOf(rarity));
      for (let i = Math.max(start, 0); i >= 0; i--) {
        const pool = ITEMS.filter((item) => item.merchantOnly && item.rarity === order[i]);
        if (pool.length) return pick(pool);
      }
      return pick(ITEMS.filter((item) => item.merchantOnly));
    }

    showReward() {
      this.mode = "reward";
      const cards = this.run.rewardQueue.map((reward, index) => this.rewardCard(reward, index)).join("");
      this.setScreen(`
        <section class="wide-panel">
          <div class="panel-header">
              <div>
              <h2 class="panel-title">Chọn Phần Thưởng</h2>
              <p class="panel-subtitle">Đã vượt ${this.run.currentRoom.label || "phòng"}.</p>
            </div>
          </div>
          <div class="grid cols-3">${cards}</div>
        </section>
      `);
    }

    rewardCard(reward, index) {
      if (reward.type === "item") {
        const item = reward.item;
        return `
          <button class="reward-card rarity-${item.rarity}" data-reward="${index}">
            ${this.itemIllustration(item)}
            <h3>${item.name}</h3>
            <p>${slotLabel(item.slot)} - ${RARITY[item.rarity].label}</p>
            <p class="small">${item.text}</p>
          </button>
        `;
      }
      if (reward.type === "upgrade") {
        return `
          <button class="reward-card rarity-${reward.rarity}" data-reward="${index}">
            <div class="mini-ill upgrade-ill" style="--ill:${RARITY[reward.rarity].color}"><span>+</span></div>
            <h3>Nâng ${upgradeLabel(reward.stat)}</h3>
            <p>${RARITY[reward.rarity].label}</p>
            <p class="small">Tăng sức mạnh ngay trong lượt chơi và cộng tinh thông.</p>
          </button>
        `;
      }
      return `
        <button class="reward-card rarity-${reward.rarity}" data-reward="${index}">
          <div class="mini-ill material-ill" style="--ill:${RARITY[reward.rarity].color}"><span>NL</span></div>
          <h3>${materialLabel(reward.material)}</h3>
          <p>Nguyên liệu x${reward.amount}</p>
          <p class="small">Dùng cho thức tỉnh và tiến trình dài hạn.</p>
        </button>
      `;
    }

    rollMerchantOffers() {
      const offers = [];
      const usedItems = new Set();
      for (let i = 0; i < 4; i++) {
        const difficulty = clamp(0.62 + this.run.stage * 0.12 + i * 0.06, 0.55, 1.25);
        const reward = { type: "item", item: this.rollMerchantItemForRoom(difficulty, 0.08), difficulty };
        for (let tries = 0; usedItems.has(reward.item.id) && tries < 8; tries++) reward.item = this.rollMerchantItemForRoom(difficulty, 0.08);
        usedItems.add(reward.item.id);
        const rarity = reward.item.rarity;
        const rarityCost = { common: 8, rare: 13, epic: 22, legendary: 34, mythic: 48, divine: 68 }[rarity] || 14;
        offers.push({
          id: uid("offer"),
          reward,
          priceMaterial: "gold",
          price: Math.max(6, rarityCost + this.run.stage * 6 + i * 4),
          bought: false
        });
      }
      return offers;
    }

    merchantOfferHtml(offer, index) {
      const reward = offer.reward;
      const color = this.rewardColor(reward);
      const owned = Math.floor(this.run?.runGold || 0);
      const canBuy = owned >= offer.price && !offer.bought;
      const illustration = reward.type === "item"
        ? this.itemIllustration(reward.item)
        : `<div class="mini-ill upgrade-ill" style="--ill:${color}"><span>+</span></div>`;
      const titleText = this.rewardLabel(reward);
      const detail = reward.type === "item"
        ? `${slotLabel(reward.item.slot)} - ${RARITY[reward.item.rarity].label}`
        : `${RARITY[reward.rarity].label} - tăng ngay trong lượt chơi`;
      return `
        <div class="reward-card shop-offer" style="border-color:${color}">
          ${illustration}
          <div>
            <h3>${titleText}</h3>
            <p>${detail}</p>
            <p class="small">${reward.type === "item" ? reward.item.text : "Phụ trợ đặc biệt của thương nhân."}</p>
          </div>
          <div class="shop-price">
            <span>Tiền ${owned}/${offer.price}</span>
            <button class="btn primary" data-action="buy-merchant-offer" data-offer="${index}" ${canBuy ? "" : "disabled"}>${offer.bought ? "ĐÃ MUA" : "MUA"}</button>
          </div>
        </div>
      `;
    }

    showMerchantShop(tab = "buy") {
      if (!this.run) return;
      this.mode = "merchant";
      if (!this.run.merchantOffers?.length) this.run.merchantOffers = this.rollMerchantOffers();
      const offers = this.run.merchantOffers.map((offer, index) => this.merchantOfferHtml(offer, index)).join("");
      const sellCards = (this.run.runItems || []).map((entry) => this.runItemCard(entry, "sell")).join("");
      this.setScreen(`
        <section class="wide-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Thương Nhân Khe Nứt</h2>
              <p class="panel-subtitle">Tiền trong ải: ${Math.floor(this.run.runGold || 0)}. Đồ và tiền này mất khi thoát ải.</p>
            </div>
            <button class="btn" data-action="leave-merchant">RỜI QUẦY</button>
          </div>
          <div class="tab-strip">
            <button class="btn ${tab === "buy" ? "primary" : ""}" data-action="merchant-tab" data-tab="buy">MUA</button>
            <button class="btn ${tab === "sell" ? "primary" : ""}" data-action="merchant-tab" data-tab="sell">BÁN</button>
          </div>
          <div class="grid">${tab === "sell" ? (sellCards || `<div class="empty-state">Không có phụ trợ nào để bán.</div>`) : offers}</div>
        </section>
      `);
    }

    buyMerchantOffer(index) {
      const offer = this.run?.merchantOffers?.[Number(index)];
      if (!offer || offer.bought) return;
      const owned = Math.floor(this.run.runGold || 0);
      if (owned < offer.price) {
        this.toast("Không đủ tiền trong ải");
        return;
      }
      if (offer.reward?.type === "item" && (this.run.runItems || []).length >= RUN_ITEM_LIMIT) {
        this.toast("Kho trong ải đã đầy");
        return;
      }
      this.run.runGold = owned - offer.price;
      offer.bought = true;
      if (!this.grantReward(offer.reward)) {
        this.run.runGold = owned;
        offer.bought = false;
        return;
      }
      this.persist();
      this.showMerchantShop();
    }

    sellValueForItem(item) {
      const base = { common: 5, rare: 9, epic: 15, legendary: 24, mythic: 36, divine: 54 }[item?.rarity] || 8;
      return Math.max(3, base + this.run.stage * 3);
    }

    sellRunItem(uidValue) {
      const entry = this.removeRunItem(uidValue);
      if (!entry) return;
      const item = itemById(entry.id);
      const value = this.sellValueForItem(item);
      this.run.runGold = Math.floor(this.run.runGold || 0) + value;
      this.toast(`Đã bán ${item.name} +${value} tiền`);
      this.showMerchantShop("sell");
    }

    completeMerchantRoom() {
      if (!this.run?.currentRoom) return;
      if (this.isMultiplayerClient()) {
        this.resumeGame();
        return;
      }
      for (const object of this.run.roomObjects || []) {
        if (object.type === "merchantStall") object.opened = true;
      }
      this.run.currentRoom.rewardDropped = true;
      this.run.currentRoom.rewardClaimed = true;
      this.clearRoom();
      this.resumeGame();
    }

    claimReward(index) {
      const reward = this.run.rewardQueue[Number(index)];
      if (!reward) return;
      this.grantReward(reward);
      this.run.currentRoom.rewardClaimed = true;
      this.openNextRoomsAfterReward();
    }

    grantReward(reward) {
      if (reward.type === "item") {
        if (!this.addRunItem(reward.item.id)) return false;
      }
      if (reward.type === "upgrade") {
        this.applyUpgrade(reward);
      }
      if (reward.type === "material") {
        this.save.materials[reward.material] = (this.save.materials[reward.material] || 0) + reward.amount;
        this.toast(`${materialLabel(reward.material)} x${reward.amount}`);
      }
      if (reward.type === "coin") {
        this.run.runGold = (this.run.runGold || 0) + reward.amount;
        this.toast(`${materialLabel("gold")} x${reward.amount}`);
      }
      if (reward.type !== "coin") {
        this.save.powers[this.run.power.id].mastery += 1;
        if (this.save.powers[this.run.power.id].mastery % 4 === 0) this.save.powers[this.run.power.id].level += 1;
      }
      this.persist();
      return true;
    }

    collectRewardPickup(pickup) {
      if (!pickup.reward || pickup.collected) return false;
      if (pickup.ownerId && pickup.ownerId !== this.lobby.id) return false;
      if (!this.grantReward(pickup.reward)) return false;
      pickup.collected = true;
      if (this.run.currentRoom && pickup.countsForClaim !== false) {
        this.run.currentRoom.rewardClaims ||= {};
        this.run.currentRoom.rewardClaims[this.lobby.id] = true;
        this.run.currentRoom.rewardClaimed = this.allRewardOwnersClaimed();
      }
      if (this.isMultiplayerClient()) this.lobby.sendCollect(pickup.id);
      const color = this.rewardColor(pickup.reward);
      this.addShockwave(pickup.x, pickup.y, 140, color, 0);
      for (let i = 0; i < 14 * this.save.settings.particles; i++) {
        this.addParticle(pickup.x, pickup.y, color, rand(8, 20), rand(0.3, 0.75), i % 3 === 0 ? "ring" : "spark");
      }
      if (this.run.currentRoom?.cleared) {
        if (!this.isMultiplayerClient() && this.run.currentRoom.type === "boss" && this.run.currentRoom.bossExitOpened && this.run.currentRoom.rewardClaimed) {
          this.advanceToNextStageAfterBoss();
        } else {
          this.openNextRoomsAfterReward();
        }
      }
      return true;
    }

    handleRemoteCollect(remoteId, pickupId) {
      if (!this.isMultiplayerHost() || !pickupId || !this.run?.currentRoom) return;
      const pickup = this.run.pickups.find((entry) => entry.id === pickupId && (!entry.ownerId || entry.ownerId === remoteId));
      if (!pickup) return;
      pickup.collected = true;
      pickup.life = 0;
      if (pickup?.countsForClaim === false) return;
      this.run.currentRoom.rewardClaims ||= {};
      this.run.currentRoom.rewardClaims[remoteId] = true;
      this.run.currentRoom.rewardClaimed = this.allRewardOwnersClaimed();
      if (this.run.currentRoom.rewardClaimed) {
        if (this.run.currentRoom.type === "boss" && this.run.currentRoom.bossExitOpened) this.advanceToNextStageAfterBoss();
        else this.openNextRoomsAfterReward();
      }
    }

    handleRemoteDropItem(remoteId, itemId, x = null, y = null, facing = 0) {
      if (!this.isMultiplayerHost() || !this.run || !itemById(itemId)) return;
      const remote = this.remotePlayers.get(remoteId);
      const slot = this.lobby.slots.find((entry) => entry.id === remoteId);
      const dropX = Number.isFinite(Number(x)) ? Number(x) : (remote?.x || this.run.player.x);
      const dropY = Number.isFinite(Number(y)) ? Number(y) : (remote?.y || this.run.player.y);
      this.spawnDroppedRunItem(
        { id: itemId },
        dropX,
        dropY,
        slot?.name || remote?.name || "Người chơi",
        { facing: Number(facing) || remote?.facing || 0, dropperId: remoteId }
      );
    }

    handleRemoteLeaveRun(remoteId) {
      if (!remoteId || !this.run) return;
      const remote = this.remotePlayers.get(remoteId);
      if (remote) {
        const pos = this.displayActorPosition(remote);
        this.addShockwave(pos.x, pos.y - 16, 120, "#d9fbff", 0);
        for (let i = 0; i < 10 * this.save.settings.particles; i++) {
          this.addParticle(pos.x + rand(-12, 12), pos.y + rand(-20, 8), "#d9fbff", rand(6, 16), rand(0.24, 0.6), i % 3 === 0 ? "ring" : "spark");
        }
      }
      this.remotePlayers.delete(remoteId);
      this.lobby.slots = this.lobby.slots.filter((slot) => slot?.host || slot?.id !== remoteId);
      this.updateRunLeader();
    }

    applyUpgrade(reward) {
      const p = this.run.player;
      const mult = { common: 1, rare: 1.2, epic: 1.45, legendary: 1.75, mythic: 2.1, divine: 2.7 }[reward.rarity];
      if (reward.stat === "damage") p.damage += 3 * mult;
      if (reward.stat === "hp") {
        p.maxHp += 22 * mult;
        p.hp += 22 * mult;
      }
      if (reward.stat === "energy") p.maxEnergy += 16 * mult;
      if (reward.stat === "crit") p.crit += 0.035 * mult;
      if (reward.stat === "skill") {
        p.cooldowns.q = 0;
        p.cooldowns.e = 0;
        p.cooldowns.r = 0;
        p.damage += 1.5 * mult;
      }
      this.toast(`Đã nâng ${upgradeLabel(reward.stat)}`);
    }

    prepareNextRooms() {
      if (this.run.currentRoom.type === "boss") {
        this.run.stage += 1;
        if (this.run.stage >= BIOMES.length) {
          this.showVictory();
          return false;
        }
        this.run.biome = BIOMES[this.run.stage];
        this.audio.setBiome(this.run.biome);
        this.run.roomNumber = 0;
        this.toast(`Tiến vào ${this.run.biome.name}`);
      }
      if (this.run.roomsCleared > 0 && this.run.roomsCleared % 6 === 0) {
        this.run.nextRooms = [{ type: "boss", label: "Trùm", icon: "B", color: this.run.biome.accent }];
        return true;
      }
      const rooms = [];
      while (rooms.length < 3) {
        const type = weighted(ROOM_TYPES);
        if (!rooms.some((room) => room.type === type.id)) {
          rooms.push({ type: type.id, label: type.label, icon: type.icon, color: type.color });
        }
      }
      this.run.nextRooms = rooms;
      return true;
    }

    showMapOverlay() {
      if (!this.run) return;
      this.mode = "map";
      const clientLocked = this.isMultiplayerRun() && !this.isDoorLeader();
      if (!this.run.nextRooms.length && !clientLocked) this.prepareNextRooms();
      const roomCards = this.run.nextRooms.map((room) => {
        const encoded = encodeURIComponent(JSON.stringify(room));
        return `
          <button class="choice-card ${clientLocked ? "locked" : ""}" data-action="choose-room" data-room="${encoded}" style="border-color:${room.color}" ${clientLocked ? "disabled" : ""}>
            ${this.roomIllustration(room)}
            <h3>${room.label}</h3>
            <p class="small">Độ khó ${Math.round(this.roomDifficulty(room.type) * 100)}%</p>
            <p>${this.roomFlavor(room.type)}</p>
          </button>
        `;
      }).join("");
      this.setScreen(`
        <section class="wide-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">${this.run.biome.name}</h2>
              <p class="panel-subtitle">${clientLocked ? "Chờ chủ phòng chọn ải tiếp theo" : `Tầng ${this.run.stage + 1} - Đã vượt ${this.run.roomsCleared} phòng`}</p>
            </div>
            ${this.run.currentRoom?.cleared ? "" : `<button class="btn" data-action="close-map">ĐÓNG</button>`}
          </div>
          <div class="room-choice-grid">${roomCards}</div>
        </section>
      `);
    }

    roomFlavor(type) {
      return {
        normal: "Giao tranh tiêu chuẩn với quái và bẫy của khu vực.",
        elite: "Đội hình khó hơn, rương gỗ có độ hiếm cao hơn.",
        treasure: "Rương được canh giữ, tỉ lệ rơi phụ trợ cao.",
        healing: "Hồi phục trước tuyến đường tiếp theo.",
        merchant: "Thương nhân ẩn giữa các khe nứt.",
        challenge: "Nhiều áp lực hơn, phần thưởng tốt hơn.",
        curse: "Nhận hỗn loạn để đổi lấy cơ hội thưởng mạnh.",
        secret: "Đấu trường lạ với nguyên liệu hiếm.",
        boss: "Đấu trường boss có chuyển pha và tuyệt kỹ."
      }[type] || "Khe nứt chưa rõ";
    }

    resumeGame() {
      if (!this.run) {
        this.showMainMenu();
        return;
      }
      this.pauseOverlay = false;
      this.mode = "game";
      this.setScreen("");
      this.hud.classList.remove("hidden");
    }

    showPause() {
      if (!this.run || this.run.player.dead) return;
      this.pauseOverlay = true;
      this.mode = "game";
      this.setScreen(`
        <section class="wide-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Tùy Chọn</h2>
              <p class="panel-subtitle">${this.run.biome.name} - trận vẫn tiếp diễn phía sau.</p>
            </div>
          </div>
          <div class="grid cols-2">
            <button class="btn primary" data-action="resume">TIẾP TỤC</button>
            <button class="btn" data-action="run-inventory">KHO TRONG ẢI</button>
            <button class="btn" data-action="settings">CÀI ĐẶT</button>
            <button class="btn danger" data-action="menu">KẾT THÚC LƯỢT</button>
          </div>
        </section>
      `);
    }

    showVictory() {
      this.mode = "victory";
      this.setScreen(`
        <section class="wide-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Đã Phong Ấn Khe Nứt</h2>
              <p class="panel-subtitle">Đã vượt cả năm khu vực. Thức tỉnh, thành tựu và nguyên liệu đã được lưu.</p>
            </div>
          </div>
          <div class="grid cols-2">
            <button class="btn primary" data-action="play">LƯỢT MỚI</button>
            <button class="btn" data-action="menu">TRÌNH ĐƠN</button>
          </div>
        </section>
      `);
    }

    playerDeath() {
      if (!this.run || this.run.player.dead) return;
      const p = this.run.player;
      p.hp = 0;
      p.dead = true;
      p.deathTime = 0;
      p.spectating = false;
      p.spectateId = "";
      p.vx = 0;
      p.vy = 0;
      p.pendingBasicAttack = null;
      p.animation = "death";
      p.actionTotal = 0.9;
      p.actionTime = p.actionTotal;
      this.run.spectating = false;
      this.run.spectateId = "";
      this.pauseOverlay = false;
      this.input.mouse.left = false;
      this.camera.shake = Math.max(this.camera.shake, 16);
      this.addShockwave(p.x, p.y, 130, "#d9fbff", 0);
      if (this.isMultiplayerRun()) this.lobby.sendState(this.networkPlayerState(this.lobby.id, p));
      this.updateRunLeader();
      this.persist();
      this.showDeathChoices();
      return;
      this.mode = "dead";
      this.run.player.animation = "death";
      this.persist();
      this.setScreen(`
        <section class="wide-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Lượt Chơi Thất Bại</h2>
              <p class="panel-subtitle">Tầng ${this.run.stage + 1}, đã vượt ${this.run.roomsCleared} phòng. Tiến trình dài hạn đã được lưu.</p>
            </div>
          </div>
          <div class="grid cols-2">
            <button class="btn primary" data-action="restart">THỬ LẠI</button>
            <button class="btn" data-action="menu">TRÌNH ĐƠN</button>
          </div>
        </section>
      `);
    }

    showDeathChoices() {
      if (!this.run) return;
      const canWatch = this.livingSpectateTargets().length > 0;
      this.mode = "game";
      this.hud.classList.remove("hidden");
      this.setScreen(`
        <section class="wide-panel death-panel">
          <div class="panel-header">
            <div>
              <h2 class="panel-title">Đã Gục Xuống</h2>
              <p class="panel-subtitle">Tầng ${this.run.stage + 1}, đã vượt ${this.run.roomsCleared} phòng. Bạn có thể rời lượt chơi hoặc xem đồng đội còn sống.</p>
            </div>
          </div>
          <div class="grid cols-2">
            <button class="btn danger" data-action="exit-run">THOÁT</button>
            <button class="btn primary" data-action="spectate-run" ${canWatch ? "" : "disabled"}>XEM</button>
          </div>
        </section>
      `);
    }

    startSpectating() {
      if (!this.run?.player.dead) return;
      const target = this.setSpectateTarget(0, true);
      if (!target) {
        this.toast("Không có đồng đội còn sống để xem");
        this.showDeathChoices();
        return;
      }
      this.run.spectating = true;
      this.run.player.spectating = true;
      this.pauseOverlay = false;
      this.mode = "game";
      this.hud.classList.remove("hidden");
      if (this.isMultiplayerRun()) this.lobby.sendState(this.networkPlayerState(this.lobby.id, this.run.player));
      this.showSpectatePanel();
    }

    showSpectatePanel() {
      if (!this.run?.player.dead) return;
      const target = this.currentSpectateTarget();
      const name = target?.name || "đồng đội";
      this.setScreen("");
      this.toast(`Đang xem ${name}`);
      this.updateQuickActions();
    }

    cycleSpectateTarget() {
      if (!this.run?.player.dead) return;
      const target = this.setSpectateTarget(1);
      if (!target) {
        this.run.spectating = false;
        this.run.player.spectating = false;
        this.toast("Không còn đồng đội để xem");
        this.showDeathChoices();
        return;
      }
      if (this.isMultiplayerRun()) this.lobby.sendState(this.networkPlayerState(this.lobby.id, this.run.player));
      this.showSpectatePanel();
    }

    combatTargets() {
      if (!this.run) return [];
      const targets = [];
      if (this.aliveActor(this.run.player)) targets.push({ id: this.lobby.id, local: true, radius: this.run.player.radius, ...this.run.player });
      if (this.isMultiplayerHost()) {
        for (const [id, remote] of this.remotePlayers) {
          if (this.aliveActor(remote)) targets.push({ id, local: false, radius: 22, ...remote });
        }
      }
      return targets;
    }

    nearestCombatTarget(x, y, fallback = this.run?.player) {
      let best = null;
      let bestD = Infinity;
      for (const target of this.combatTargets()) {
        const d = Math.hypot(target.x - x, target.y - y);
        if (d < bestD) {
          bestD = d;
          best = target;
        }
      }
      return best || (this.aliveActor(fallback) ? fallback : null);
    }

    damageCombatTarget(target, amount, source = null) {
      if (!target || target.local || target.id === this.lobby.id || !this.isMultiplayerHost()) {
        this.damagePlayer(amount, source);
        return;
      }
      const remote = this.remotePlayers.get(target.id);
      if (remote && this.tryGuardianReflect(remote, amount, source)) return;
      if (remote) {
        remote.hp = Math.max(0, (remote.hp ?? target.maxHp ?? 1) - amount);
        if (remote.hp <= 0) {
          remote.dead = true;
          remote.animation = "death";
          remote.actionTime = 0.9;
          remote.actionTotal = 0.9;
          this.updateRunLeader();
        } else {
          remote.animation = "damage";
          remote.actionTime = 0.28;
          remote.actionTotal = 0.28;
        }
        remote.t = performance.now();
      }
      this.lobby.sendDamage(target.id, amount);
    }

    applyHostDamage(amount) {
      if (!this.isMultiplayerClient() || !this.run) return;
      this.damagePlayer(Math.max(0, Number(amount) || 0));
    }

    updateEnemies(dt) {
      const p = this.run.player;
      for (const enemy of [...this.run.enemies]) {
        enemy.flash = Math.max(0, enemy.flash - dt);
        enemy.stun = Math.max(0, enemy.stun - dt);
        enemy.attackAnim = Math.max(0, (enemy.attackAnim || 0) - dt);
        enemy.launch = Math.max(0, (enemy.launch || 0) - dt);
        if (enemy.burn > 0) {
          enemy.burn -= dt;
          if (chance(dt * 5)) this.damageEnemy(enemy, 2.2 + this.run.stage, { x: 0, y: 0, source: "burn", kind: "fire" });
        }
        if (enemy.chill > 0) enemy.chill -= dt;
        if (enemy.mark > 0 && enemy.mark >= 4) {
          enemy.mark = 0;
          this.damageEnemy(enemy, 38, { x: 0, y: 0, source: "mark", kind: "void" });
        }
        if (enemy.stun > 0) continue;
        if (enemy.boss) this.updateBoss(enemy, dt);
        else this.updateEnemyAi(enemy, dt);
        const maxSpeed = enemy.speed * (enemy.boss ? 2.4 : enemy.elite ? 2.2 : 2);
        const currentSpeed = Math.hypot(enemy.vx, enemy.vy);
        if (currentSpeed > maxSpeed) {
          enemy.vx = (enemy.vx / currentSpeed) * maxSpeed;
          enemy.vy = (enemy.vy / currentSpeed) * maxSpeed;
        }
        enemy.vx *= Math.pow(0.35, dt);
        enemy.vy *= Math.pow(0.35, dt);
        enemy.x = clamp(enemy.x + enemy.vx * dt, ROOM_PAD + enemy.radius, WORLD_W - ROOM_PAD - enemy.radius);
        enemy.y = clamp(enemy.y + enemy.vy * dt, ROOM_PAD + enemy.radius, WORLD_H - ROOM_PAD - enemy.radius);
        if (!p.dead) this.keepEnemyOutOfPlayer(enemy, p);
      }
    }

    steerEnemy(enemy, targetVx, targetVy, dt, response = 8) {
      const blend = clamp(dt * response, 0, 1);
      enemy.vx += (targetVx - enemy.vx) * blend;
      enemy.vy += (targetVy - enemy.vy) * blend;
    }

    keepEnemyOutOfPlayer(enemy, player) {
      if (!player) return;
      const dx = player.x - enemy.x;
      const dy = player.y - enemy.y;
      const d = Math.hypot(dx, dy) || 1;
      const minDist = enemy.radius + player.radius + (enemy.boss ? 24 : 14);
      if (d >= minDist) return;
      const push = minDist - d;
      const nx = dx / d;
      const ny = dy / d;
      enemy.x = clamp(enemy.x - nx * push, ROOM_PAD + enemy.radius, WORLD_W - ROOM_PAD - enemy.radius);
      enemy.y = clamp(enemy.y - ny * push, ROOM_PAD + enemy.radius, WORLD_H - ROOM_PAD - enemy.radius);
      enemy.vx -= nx * 80;
      enemy.vy -= ny * 80;
    }

    updateEnemyAi(enemy, dt) {
      const p = this.nearestCombatTarget(enemy.x, enemy.y);
      if (!p) {
        this.steerEnemy(enemy, 0, 0, dt, 5);
        return;
      }
      const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      const a = Math.atan2(p.y - enemy.y, p.x - enemy.x);
      enemy.facingDir = p.x >= enemy.x ? 1 : -1;
      const slow = enemy.chill > 0 ? 0.48 : 1;
      enemy.attackCd -= dt;
      enemy.skillCd = Math.max(0, (enemy.skillCd || 0) - dt);
      if (this.updateEnemyWindup(enemy, dt, p)) return;
      if (this.updateEnemyCharge(enemy, dt, p)) return;

      if (enemy.ranged) {
        const desired = enemy.role === "marksman" ? 360 : enemy.role === "bomber" ? 280 : enemy.role === "caster" ? 300 : 320;
        if (d < desired - 40) {
          this.steerEnemy(enemy, -Math.cos(a) * enemy.speed * slow, -Math.sin(a) * enemy.speed * slow, dt, 9);
        } else if (d > desired + 40) {
          this.steerEnemy(enemy, Math.cos(a) * enemy.speed * slow, Math.sin(a) * enemy.speed * slow, dt, 7);
        } else {
          const strafe = Math.sin(this.menuTime * 1.7 + enemy.aiTimer * 8) > 0 ? 1 : -1;
          this.steerEnemy(enemy, -Math.sin(a) * enemy.speed * 0.28 * strafe, Math.cos(a) * enemy.speed * 0.28 * strafe, dt, 5);
        }
        if (enemy.skillCd <= 0 && d < 620) {
          const special = enemy.specialSkill || this.enemySpecialSkill(enemy.role);
          if (enemy.role === "bomber") {
            enemy.skillCd = enemy.elite ? 2.35 : 3.05;
            this.startEnemyWindup(enemy, special, enemy.elite ? 0.58 : 0.72, a, p.x, p.y);
            return;
          }
          if (enemy.role === "marksman") {
            enemy.skillCd = enemy.elite ? 2.0 : 2.6;
            this.startEnemyWindup(enemy, special, enemy.elite ? 0.42 : 0.55, a);
            return;
          }
          if (enemy.role === "caster") {
            enemy.skillCd = enemy.elite ? 2.2 : 2.9;
            this.startEnemyWindup(enemy, special, enemy.elite ? 0.62 : 0.78, a, p.x, p.y);
            return;
          }
        }
      } else {
        const contact = enemy.radius + p.radius;
        const desired = contact + (enemy.role === "guard" ? 62 : enemy.role === "duelist" ? 58 : enemy.role === "skirmisher" ? 72 : 42);
        if (d > desired + 8) {
          this.steerEnemy(enemy, Math.cos(a) * enemy.speed * slow, Math.sin(a) * enemy.speed * slow, dt, 8);
        } else if (d < desired - 8) {
          this.steerEnemy(enemy, -Math.cos(a) * enemy.speed * 0.85, -Math.sin(a) * enemy.speed * 0.85, dt, 10);
        } else {
          const strafe = Math.sin(this.menuTime * 2.2 + enemy.aiTimer * 7) > 0 ? 1 : -1;
          const strafePower = enemy.role === "skirmisher" ? 0.68 : enemy.role === "duelist" ? 0.56 : 0.35;
          this.steerEnemy(enemy, -Math.sin(a) * enemy.speed * strafePower * strafe, Math.cos(a) * enemy.speed * strafePower * strafe, dt, 5);
        }
        if (enemy.skillCd <= 0) {
          const special = enemy.specialSkill || this.enemySpecialSkill(enemy.role);
          if (enemy.role === "skirmisher" && d > contact + 35 && d < contact + 175) {
            enemy.skillCd = enemy.elite ? 1.55 : 2.05;
            this.startEnemyWindup(enemy, special, enemy.elite ? 0.24 : 0.32, a);
            return;
          }
          if (enemy.role === "brute" && d > contact + 55 && d < 360) {
            enemy.skillCd = enemy.elite ? 2.45 : 3.1;
            this.startEnemyWindup(enemy, special, enemy.elite ? 0.44 : 0.58, a, p.x, p.y);
            return;
          }
          if (enemy.role === "guard" && d < contact + 115) {
            enemy.skillCd = enemy.elite ? 2.15 : 2.75;
            this.startEnemyWindup(enemy, "guardSlam", enemy.elite ? 0.42 : 0.5, a);
            return;
          }
          if (enemy.role === "duelist" && d < contact + 135) {
            enemy.skillCd = enemy.elite ? 1.8 : 2.35;
            this.startEnemyWindup(enemy, special, enemy.elite ? 0.28 : 0.36, a);
            return;
          }
        }
        if (d < contact + 22 && enemy.attackCd <= 0) {
          enemy.attackCd = enemy.role === "skirmisher" ? (enemy.elite ? 0.78 : 1.0) : enemy.role === "duelist" ? (enemy.elite ? 0.82 : 1.08) : enemy.elite ? 0.82 : 1.1;
          enemy.attackAnim = 0.32;
          enemy.attackDir = a;
          this.damageCombatTarget(p, enemy.damage * (enemy.role === "brute" ? 1.05 : enemy.role === "skirmisher" ? 0.76 : 0.92), enemy);
          enemy.vx -= Math.cos(a) * 120;
          enemy.vy -= Math.sin(a) * 120;
        }
      }
    }

    updateEnemyWindup(enemy, dt, player) {
      if (!enemy.windupTime || enemy.windupTime <= 0) return false;
      enemy.windupTime -= dt;
      enemy.attackAnim = Math.max(enemy.attackAnim, enemy.windupTime);
      enemy.attackDir = enemy.windupAngle;
      this.steerEnemy(enemy, 0, 0, dt, 7);
      if (enemy.windupTime <= 0) this.resolveEnemyWindup(enemy, player);
      return true;
    }

    updateEnemyCharge(enemy, dt, player) {
      if (!enemy.chargeTime || enemy.chargeTime <= 0) return false;
      if (!player) {
        enemy.chargeTime = 0;
        return false;
      }
      enemy.chargeTime -= dt;
      const speed = enemy.chargeSpeed || (enemy.elite ? 380 : 330);
      enemy.vx += (Math.cos(enemy.chargeDir) * speed - enemy.vx) * clamp(dt * 8, 0, 1);
      enemy.vy += (Math.sin(enemy.chargeDir) * speed - enemy.vy) * clamp(dt * 8, 0, 1);
      enemy.attackAnim = Math.max(enemy.attackAnim, 0.18);
      enemy.attackDir = enemy.chargeDir;
      if (!enemy.chargeHit && Math.hypot(player.x - enemy.x, player.y - enemy.y) < player.radius + enemy.radius + 18) {
        enemy.chargeHit = true;
        this.damageCombatTarget(player, enemy.damage * (enemy.chargeDamage || 0.72), enemy);
        this.camera.shake = Math.max(this.camera.shake, 5);
      }
      if (chance(dt * 12)) this.addParticle(enemy.x, enemy.y, this.run.biome.accent, 9, 0.28, "spark", enemy.chargeDir + Math.PI, rand(80, 150));
      return true;
    }

    startEnemyWindup(enemy, type, time, angle, targetX = 0, targetY = 0) {
      enemy.windupType = type;
      enemy.windupTime = time;
      enemy.windupTotal = time;
      enemy.windupAngle = angle;
      enemy.windupX = targetX;
      enemy.windupY = targetY;
      enemy.attackAnim = time;
      enemy.attackDir = angle;
      const color = enemy.elite ? "#ffbd5e" : this.run.biome.accent;
      if (type === "lineShot") {
        this.addEffect({ type: "lineTell", x: enemy.x, y: enemy.y, angle, length: enemy.elite ? 640 : 560, width: enemy.elite ? 34 : 26, time, maxTime: time, color });
      }
      if (type === "spreadShot") {
        for (let i = -1; i <= 1; i++) {
          this.addEffect({ type: "lineTell", x: enemy.x, y: enemy.y, angle: angle + i * 0.22, length: enemy.elite ? 520 : 460, width: enemy.elite ? 24 : 20, time, maxTime: time, color });
        }
      }
      if (type === "charge") {
        this.addEffect({ type: "lineTell", x: enemy.x, y: enemy.y, angle, length: enemy.elite ? 310 : 250, width: enemy.elite ? 44 : 36, time, maxTime: time, color: "#ff8d3d" });
      }
      if (type === "quake") {
        this.addEffect({ type: "danger", x: enemy.x, y: enemy.y, radius: enemy.elite ? 132 : 108, time, color: "#ff8d3d", damage: enemy.damage * 0.66 });
      }
      if (type === "casterZone") {
        const radius = enemy.elite ? 92 : 74;
        this.addEffect({ type: "danger", x: targetX, y: targetY, radius, time: time + 0.08, color: "#ff4b55", damage: enemy.damage * 0.82 });
      }
      if (type === "orbNova") {
        this.addEffect({ type: "danger", x: enemy.x, y: enemy.y, radius: enemy.elite ? 118 : 96, time, color, damage: enemy.damage * 0.45 });
      }
      if (type === "bombZone") {
        const radius = enemy.elite ? 104 : 86;
        this.addEffect({ type: "danger", x: targetX, y: targetY, radius, time: time + 0.12, color: "#ff8d3d", damage: enemy.damage * 0.72 });
      }
      if (type === "mineScatter") {
        for (let i = 0; i < 3; i++) {
          const a = angle + (i - 1) * 0.62;
          const x = targetX + Math.cos(a) * (42 + i * 18);
          const y = targetY + Math.sin(a) * (42 + i * 18);
          this.addEffect({ type: "danger", x, y, radius: enemy.elite ? 70 : 58, time: time + 0.18 + i * 0.05, color: "#ff8d3d", damage: enemy.damage * 0.46 });
        }
      }
      if (type === "guardSlam") {
        this.addEffect({
          type: "danger",
          x: enemy.x + Math.cos(angle) * (enemy.radius + 46),
          y: enemy.y + Math.sin(angle) * (enemy.radius + 46),
          radius: enemy.elite ? 94 : 76,
          time,
          color: "#f4d26f",
          damage: enemy.damage * 0.62
        });
      }
      if (type === "duelistSlash") {
        this.addEffect({ type: "lineTell", x: enemy.x, y: enemy.y, angle, length: enemy.elite ? 170 : 135, width: enemy.elite ? 58 : 46, time, maxTime: time, color: "#f3ead7" });
      }
      if (type === "crossSlash") {
        for (const offset of [-0.42, 0.42]) {
          this.addEffect({ type: "lineTell", x: enemy.x, y: enemy.y, angle: angle + offset, length: enemy.elite ? 178 : 146, width: enemy.elite ? 48 : 38, time, maxTime: time, color: "#f3ead7" });
        }
      }
      if (type === "skirmisherDash") {
        this.addEffect({ type: "lineTell", x: enemy.x, y: enemy.y, angle, length: enemy.elite ? 190 : 160, width: enemy.elite ? 40 : 32, time, maxTime: time, color: "#dfe6ef" });
      }
      if (type === "feintDash") {
        this.addEffect({ type: "lineTell", x: enemy.x, y: enemy.y, angle, length: enemy.elite ? 230 : 190, width: enemy.elite ? 34 : 28, time, maxTime: time, color: "#dfe6ef" });
      }
    }

    resolveEnemyWindup(enemy, player) {
      const angle = enemy.windupAngle;
      const type = enemy.windupType;
      enemy.windupType = "";
      enemy.windupTime = 0;
      if (type === "lineShot") {
        this.spawnProjectile({
          owner: "enemy",
          x: enemy.x + Math.cos(angle) * enemy.radius,
          y: enemy.y + Math.sin(angle) * enemy.radius,
          vx: Math.cos(angle) * (enemy.elite ? 500 : 455),
          vy: Math.sin(angle) * (enemy.elite ? 500 : 455),
          radius: enemy.elite ? 8 : 7,
          damage: enemy.damage * 0.82,
          life: 2.2,
          color: enemy.elite ? "#ffbd5e" : this.run.biome.accent,
          pierce: 0,
          kind: "enemySniper"
        });
      }
      if (type === "spreadShot") {
        const count = enemy.elite ? 5 : 3;
        const spread = enemy.elite ? 0.18 : 0.24;
        for (let i = 0; i < count; i++) {
          const a = angle + (i - (count - 1) / 2) * spread;
          this.spawnProjectile({
            owner: "enemy",
            x: enemy.x + Math.cos(a) * enemy.radius,
            y: enemy.y + Math.sin(a) * enemy.radius,
            vx: Math.cos(a) * (enemy.elite ? 430 : 390),
            vy: Math.sin(a) * (enemy.elite ? 430 : 390),
            radius: enemy.elite ? 7 : 6,
            damage: enemy.damage * 0.48,
            life: 2.0,
            color: enemy.elite ? "#ffbd5e" : this.run.biome.accent,
            pierce: 0,
            kind: "enemySpread"
          });
        }
      }
      if (type === "charge") {
        enemy.chargeTime = enemy.elite ? 0.5 : 0.42;
        enemy.chargeDir = angle;
        enemy.chargeHit = false;
        enemy.chargeSpeed = enemy.elite ? 380 : 330;
        enemy.chargeDamage = 0.72;
      }
      if (type === "quake") {
        enemy.vx -= Math.cos(angle) * 120;
        enemy.vy -= Math.sin(angle) * 120;
        this.addShockwave(enemy.x, enemy.y, enemy.elite ? 145 : 118, "#ff8d3d", 0);
      }
      if (type === "skirmisherDash") {
        enemy.chargeTime = enemy.elite ? 0.34 : 0.28;
        enemy.chargeDir = angle;
        enemy.chargeHit = false;
        enemy.chargeSpeed = enemy.elite ? 430 : 385;
        enemy.chargeDamage = 0.5;
      }
      if (type === "feintDash") {
        enemy.chargeTime = enemy.elite ? 0.42 : 0.34;
        enemy.chargeDir = Math.atan2(player.y - enemy.y, player.x - enemy.x);
        enemy.chargeHit = false;
        enemy.chargeSpeed = enemy.elite ? 400 : 350;
        enemy.chargeDamage = 0.44;
      }
      if (type === "guardSlam") {
        this.addShockwave(enemy.x + Math.cos(angle) * 58, enemy.y + Math.sin(angle) * 58, enemy.elite ? 110 : 88, "#f4d26f", 0);
        enemy.vx -= Math.cos(angle) * 80;
        enemy.vy -= Math.sin(angle) * 80;
      }
      if (type === "duelistSlash") {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const d = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx);
        enemy.vx += -Math.sin(angle) * (enemy.elite ? 130 : 95);
        enemy.vy += Math.cos(angle) * (enemy.elite ? 130 : 95);
        if (d < enemy.radius + player.radius + 92 && Math.abs(angleDelta(targetAngle, angle)) < Math.PI * 0.35) {
          this.damageCombatTarget(player, enemy.damage * 0.68, enemy);
        }
      }
      if (type === "crossSlash") {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const d = Math.hypot(dx, dy);
        const targetAngle = Math.atan2(dy, dx);
        for (const offset of [-0.42, 0.42]) {
          if (d < enemy.radius + player.radius + 102 && Math.abs(angleDelta(targetAngle, angle + offset)) < Math.PI * 0.28) {
            this.damageCombatTarget(player, enemy.damage * 0.46, enemy);
          }
        }
        enemy.vx += -Math.sin(angle) * (enemy.elite ? 150 : 105);
        enemy.vy += Math.cos(angle) * (enemy.elite ? 150 : 105);
      }
      if (type === "casterZone" || type === "bombZone") {
        for (let i = 0; i < 8; i++) {
          this.addParticle(enemy.windupX + rand(-34, 34), enemy.windupY + rand(-34, 34), this.run.biome.accent, rand(8, 18), rand(0.25, 0.55), "spark");
        }
      }
      if (type === "orbNova") {
        const count = enemy.elite ? 8 : 6;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * TAU + angle * 0.2;
          this.spawnProjectile({
            owner: "enemy",
            x: enemy.x + Math.cos(a) * enemy.radius,
            y: enemy.y + Math.sin(a) * enemy.radius,
            vx: Math.cos(a) * (enemy.elite ? 245 : 215),
            vy: Math.sin(a) * (enemy.elite ? 245 : 215),
            radius: enemy.elite ? 9 : 8,
            damage: enemy.damage * 0.42,
            life: 2.7,
            color: this.run.biome.accent,
            pierce: 0,
            kind: "enemyOrb"
          });
        }
      }
    }

    updateBoss(enemy, dt) {
      const p = this.nearestCombatTarget(enemy.x, enemy.y);
      if (!p) {
        this.steerEnemy(enemy, 0, 0, dt, 4);
        return;
      }
      enemy.phaseLock = Math.max(0, enemy.phaseLock - dt);
      const d = Math.hypot(p.x - enemy.x, p.y - enemy.y);
      const a = Math.atan2(p.y - enemy.y, p.x - enemy.x);
      enemy.facingDir = p.x >= enemy.x ? 1 : -1;
      const slow = enemy.chill > 0 ? 0.65 : 1;
      const desired = enemy.radius + p.radius + 150;
      if (d > desired + 20) {
        this.steerEnemy(enemy, Math.cos(a) * enemy.speed * slow, Math.sin(a) * enemy.speed * slow, dt, 5);
      } else if (d < desired - 30) {
        this.steerEnemy(enemy, -Math.cos(a) * enemy.speed * 0.65, -Math.sin(a) * enemy.speed * 0.65, dt, 7);
      } else {
        this.steerEnemy(enemy, -Math.sin(a) * enemy.speed * 0.22, Math.cos(a) * enemy.speed * 0.22, dt, 4);
      }
      enemy.attackCd -= dt;
      if (enemy.attackCd <= 0 && enemy.phaseLock <= 0) {
        const pattern = randi(0, enemy.phase + 1);
        if (pattern === 0) this.bossRing(enemy, 10 + enemy.phase * 4);
        if (pattern === 1) this.bossSlam(enemy);
        if (pattern >= 2) this.bossLine(enemy, a);
        enemy.attackAnim = 0.42;
        enemy.attackDir = a;
        enemy.attackCd = Math.max(0.65, 1.7 - enemy.phase * 0.22);
      }
      if (d < enemy.radius + p.radius + 8 && enemy.attackCd < 0.8) this.damageCombatTarget(p, enemy.damage * 0.75, enemy);
    }

    checkBossPhase(enemy) {
      const ratio = enemy.hp / enemy.maxHp;
      if (enemy.phase === 1 && ratio < 0.66) this.phaseTransition(enemy, 2);
      if (enemy.phase === 2 && ratio < 0.33) this.phaseTransition(enemy, 3);
    }

    phaseTransition(enemy, phase) {
      enemy.phase = phase;
      enemy.phaseLock = 1.2;
      enemy.attackCd = 1.4;
      this.camera.shake = Math.max(this.camera.shake, 20);
      this.addShockwave(enemy.x, enemy.y, 280 + phase * 70, this.run.biome.accent, 54);
      for (let i = 0; i < phase + 1; i++) {
        const pos = this.edgePosition(pick(["top", "bottom", "left", "right"]));
        this.run.enemies.push(this.createEnemy(pick(this.run.biome.enemies), pos.x, pos.y, true));
      }
      this.toast(`Trùm chuyển pha ${phase}`);
    }

    bossRing(enemy, count) {
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * TAU + this.menuTime * 0.2;
        this.spawnProjectile({
          owner: "enemy",
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * (230 + enemy.phase * 25),
          vy: Math.sin(angle) * (230 + enemy.phase * 25),
          radius: 10,
          damage: enemy.damage,
          life: 4,
          color: this.run.biome.accent,
          pierce: 0,
          kind: "boss"
        });
      }
      this.addShockwave(enemy.x, enemy.y, 180, this.run.biome.accent, 24);
    }

    bossSlam(enemy) {
      const target = this.nearestCombatTarget(enemy.x, enemy.y);
      if (!target) return;
      this.addEffect({ type: "danger", x: target.x, y: target.y, radius: 135 + enemy.phase * 25, time: 0.8, color: "#ff4b55", damage: enemy.damage * 1.6 });
    }

    bossLine(enemy, angle) {
      for (let i = -1; i <= 1; i++) {
        const a = angle + i * 0.22;
        this.spawnProjectile({
          owner: "enemy",
          x: enemy.x + Math.cos(a) * enemy.radius,
          y: enemy.y + Math.sin(a) * enemy.radius,
          vx: Math.cos(a) * 420,
          vy: Math.sin(a) * 420,
          radius: 13,
          damage: enemy.damage * 1.15,
          life: 2.7,
          color: this.run.biome.accent,
          pierce: 0,
          kind: "boss"
        });
      }
    }

    enemyShoot(enemy, angle) {
      enemy.attackAnim = 0.28;
      enemy.attackDir = angle;
      const spread = enemy.elite ? (enemy.role === "caster" ? 0.12 : 0.16) : 0;
      const shots = enemy.elite && enemy.role !== "caster" ? 3 : 1;
      const speed = enemy.role === "caster" ? 270 : enemy.role === "marksman" ? 350 : 330;
      const damage = enemy.damage * (enemy.role === "caster" ? 0.72 : enemy.role === "marksman" ? 0.86 : 0.95);
      for (let i = 0; i < shots; i++) {
        const a = angle + (i - (shots - 1) / 2) * spread;
        this.spawnProjectile({
          owner: "enemy",
          x: enemy.x + Math.cos(a) * enemy.radius,
          y: enemy.y + Math.sin(a) * enemy.radius,
          vx: Math.cos(a) * speed,
          vy: Math.sin(a) * speed,
          radius: enemy.role === "caster" ? 10 : enemy.elite ? 9 : 7,
          damage,
          life: 2.8,
          color: enemy.elite ? "#ffbd5e" : this.run.biome.accent,
          pierce: 0,
          kind: enemy.role === "caster" ? "enemyOrb" : "enemy"
        });
      }
    }

    segmentCircleHit(x1, y1, x2, y2, cx, cy, radius) {
      const sx = x2 - x1;
      const sy = y2 - y1;
      const lenSq = sx * sx + sy * sy;
      const t = lenSq > 0 ? clamp(((cx - x1) * sx + (cy - y1) * sy) / lenSq, 0, 1) : 1;
      const x = x1 + sx * t;
      const y = y1 + sy * t;
      const d = Math.hypot(cx - x, cy - y);
      return d <= radius ? { t, x, y, d } : null;
    }

    firstProjectileEnemyHit(projectile, fromX, fromY) {
      let best = null;
      for (const enemy of this.run.enemies) {
        if (projectile.hitIds?.includes(enemy.id)) continue;
        const hitPadding = projectile.kind === "rangerBasic" ? 10 : projectile.kind === "mageBasic" ? 6 : 4;
        const hit = this.segmentCircleHit(fromX, fromY, projectile.x, projectile.y, enemy.x, enemy.y, enemy.radius + projectile.radius + hitPadding);
        if (hit && (!best || hit.t < best.t)) best = { ...hit, enemy };
      }
      return best;
    }

    stopVisualProjectileAtEnemy(projectile, fromX, fromY) {
      const hit = this.firstProjectileEnemyHit(projectile, fromX, fromY);
      if (!hit) return false;
      projectile.x = hit.x;
      projectile.y = hit.y;
      projectile.vx = 0;
      projectile.vy = 0;
      projectile.life = Math.min(projectile.life, 0.035);
      projectile.hitIds = projectile.hitIds || [];
      if (hit.enemy.id) projectile.hitIds.push(hit.enemy.id);
      if (!projectile.visualImpact) {
        projectile.visualImpact = true;
        this.addShockwave(projectile.x, projectile.y, projectile.kind === "rangerBasic" ? 42 : 54, projectile.color || "#ffffff", 0);
        for (let i = 0; i < 5 * this.save.settings.particles; i++) {
          this.addParticle(projectile.x, projectile.y, projectile.color || "#ffffff", rand(5, 12), rand(0.18, 0.36), "spark");
        }
      }
      return true;
    }

    firstProjectileTargetHit(projectile, fromX, fromY) {
      let best = null;
      for (const target of this.combatTargets()) {
        const hit = this.segmentCircleHit(fromX, fromY, projectile.x, projectile.y, target.x, target.y, target.radius + projectile.radius);
        if (hit && (!best || hit.t < best.t)) best = { ...hit, target };
      }
      return best;
    }

    updateProjectiles(dt) {
      let write = 0;
      for (let i = 0; i < this.run.projectiles.length; i++) {
        const projectile = this.run.projectiles[i];
        projectile.age += dt;
        projectile.life -= dt;
        const fromX = projectile.x;
        const fromY = projectile.y;
        projectile.x += projectile.vx * dt;
        projectile.y += projectile.vy * dt;
        if (this.inView(projectile.x, projectile.y, 90) && chance((this.isMobileDevice() ? 18 : 30) * dt)) {
          this.addParticle(projectile.x, projectile.y, projectile.color, projectile.radius * 0.9, 0.25, "dot");
        }
        if (projectile.visualOnly || ((projectile.owner === "player" || projectile.owner === "ally") && this.isMultiplayerClient())) {
          this.stopVisualProjectileAtEnemy(projectile, fromX, fromY);
        } else if ((projectile.owner === "player" || projectile.owner === "ally") && !this.isMultiplayerClient()) {
          const hit = this.firstProjectileEnemyHit(projectile, fromX, fromY);
          if (hit) {
            projectile.x = hit.x;
            projectile.y = hit.y;
            projectile.hitIds = projectile.hitIds || [];
            if (hit.enemy.id) projectile.hitIds.push(hit.enemy.id);
            const len = Math.hypot(projectile.vx, projectile.vy) || 1;
            this.damageEnemy(hit.enemy, projectile.damage, { x: projectile.vx / len, y: projectile.vy / len, source: "projectile", kind: projectile.kind, critBonus: projectile.critBonus || 0 });
            if (projectile.kind === "mageBasic" && chance(0.25)) {
              this.areaDamage(projectile.x, projectile.y, 72, projectile.damage * 0.1, projectile.color, "mageBasic");
              this.addShockwave(projectile.x, projectile.y, 92, projectile.color, 0);
            }
            projectile.pierce -= 1;
            if (projectile.kind === "gravity" || projectile.kind === "void") this.addShockwave(projectile.x, projectile.y, 90, projectile.color, 18);
            if (projectile.pierce < 0) projectile.life = 0;
          }
        } else if (projectile.owner === "enemy" && !this.isMultiplayerClient()) {
          let reflected = false;
          const hit = this.firstProjectileTargetHit(projectile, fromX, fromY);
          if (hit) {
            projectile.x = hit.x;
            projectile.y = hit.y;
            if (this.tryGuardianProjectileReflect(hit.target, projectile)) {
              reflected = true;
            } else {
              this.damageCombatTarget(hit.target, projectile.damage, projectile);
              projectile.life = 0;
            }
          }
          if (reflected) {
            this.run.projectiles[write++] = projectile;
            continue;
          }
        }
        if (
          projectile.x < ROOM_PAD ||
          projectile.x > WORLD_W - ROOM_PAD ||
          projectile.y < ROOM_PAD ||
          projectile.y > WORLD_H - ROOM_PAD
        ) {
          projectile.life = 0;
        }
        if (projectile.life > 0) this.run.projectiles[write++] = projectile;
      }
      this.run.projectiles.length = write;
    }

    updateDrones(dt) {
      const p = this.run.player;
      let write = 0;
      for (let i = 0; i < this.run.drones.length; i++) {
        const drone = this.run.drones[i];
        drone.angle += dt * 2.4;
        drone.cooldown -= dt;
        if (drone.temporary) {
          drone.temporary -= dt;
          if (drone.temporary <= 0) continue;
        }
        const x = p.x + Math.cos(drone.angle) * drone.radius;
        const y = p.y + Math.sin(drone.angle) * drone.radius;
        drone.x = x;
        drone.y = y;
        if (drone.cooldown <= 0 && !this.isMultiplayerClient()) {
          const target = this.nearestEnemy(x, y, 430);
          if (target) {
            const angle = Math.atan2(target.y - y, target.x - x);
            this.spawnProjectile({
              owner: "player",
              x,
              y,
              vx: Math.cos(angle) * 520,
              vy: Math.sin(angle) * 520,
              radius: 6,
              damage: 16 + this.run.stage * 3,
              life: 1.0,
              color: drone.color || "#35d6c9",
              pierce: 0,
              kind: "lightning"
            });
            drone.cooldown = 0.7;
          }
        }
        this.run.drones[write++] = drone;
      }
      this.run.drones.length = write;
    }

    nearestEnemy(x, y, range) {
      let best = null;
      let bestD = range;
      for (const enemy of this.run.enemies) {
        const d = Math.hypot(enemy.x - x, enemy.y - y);
        if (d < bestD) {
          bestD = d;
          best = enemy;
        }
      }
      return best;
    }

    updateRoomObjects(dt) {
      if (!this.run?.roomObjects?.length) return;
      const p = this.run.player;
      for (const object of this.run.roomObjects) {
        object.grow = clamp((object.grow || 0) + dt * 1.9, 0, 1);
        if (object.opening) {
          object.openTimer = Math.max(0, (object.openTimer || 0.55) - dt);
          if (chance(dt * 16)) this.addParticle(object.x + rand(-34, 34), object.y + rand(-28, 18), object.color || "#f2bf63", rand(8, 18), rand(0.24, 0.55), "spark");
          if (object.openTimer <= 0) this.completeRoomObjectOpening(object);
          continue;
        }
        if (object.opened || object.locked) continue;
        const touchRadius = object.radius * (object.type === "nextDoor" ? 0.82 : 0.72);
        if (Math.hypot(p.x - object.x, p.y - object.y) > p.radius + touchRadius) continue;
        this.handleRoomObjectContact(object);
      }
    }

    handleRoomObjectContact(object) {
      if (!object || object.opened) return;
      if (object.type === "nextDoor") {
        if (this.isMultiplayerRun()) {
          if (!this.isDoorLeader()) {
            this.toast(`Chờ ${this.leaderName()} chọn cửa tiếp theo`);
            return;
          }
          if (this.isMultiplayerClient()) {
            if (this.run.pendingDoor?.objectId !== object.id) {
              for (const door of this.run.roomObjects) {
                if (door.type === "nextDoor") door.enterProgress = 0;
              }
              this.run.pendingDoor = { objectId: object.id, timer: DOOR_ENTER_TIME, total: DOOR_ENTER_TIME };
              this.toast(`Đang vào ${object.label || "cửa"}... có thể đổi cửa trong 1.5 giây`);
            }
            return;
          }
        }
        if (this.isMultiplayerClient()) {
          this.toast("Chờ chủ phòng đi vào cửa tiếp theo");
          return;
        }
        if (this.run.pendingDoor?.objectId !== object.id) {
          for (const door of this.run.roomObjects) {
            if (door.type === "nextDoor") door.enterProgress = 0;
          }
          this.run.pendingDoor = { objectId: object.id, timer: DOOR_ENTER_TIME, total: DOOR_ENTER_TIME };
          this.toast(`Đang vào ${object.label || "cửa"}... có thể đổi cửa trong 1.5 giây`);
        }
        return;
      }
      if (object.type === "merchantStall") {
        this.showMerchantShop();
        return;
      }
      if (this.isMultiplayerClient()) {
        this.toast("Chờ chủ phòng kích hoạt vật thể này");
        return;
      }
      if (object.type === "treasureChest") {
        object.opening = true;
        object.openTimer = 0.55;
        this.audio.sfx(520, "triangle", 0.12, 0.12);
        return;
      }
      if (object.type === "bossGate") {
        if (this.run.currentRoom.started) return;
        object.opened = true;
        object.active = false;
        this.run.currentRoom.started = true;
        this.run.roomObjects = this.run.roomObjects.filter((entry) => entry !== object);
        this.spawnBoss();
        this.addShockwave(object.x, object.y, 260, object.color || this.run.biome.accent, 0);
        this.camera.shake = Math.max(this.camera.shake, 18);
        this.toast("Trùm đã xuất hiện");
        return;
      }
      if (object.type === "bossExit") {
        object.opened = true;
        this.claimBossExitReward(object.x, object.y);
        return;
      }
      if (object.type === "curseBook") {
        object.opened = true;
        this.applyCurse(pick(CURSES));
        const room = this.run.currentRoom;
        room.rewardDropped = true;
        room.rewardClaimed = true;
        this.clearRoom();
        this.addShockwave(object.x, object.y, 190, object.color || "#a169ff", 0);
      }
    }

    completeRoomObjectOpening(object) {
      if (!object || object.opened) return;
      if (object.type === "treasureChest") {
        object.opened = true;
        object.opening = false;
        this.spawnRoomReward(object.x, object.y, { container: "goldChest" });
        this.clearRoom();
        this.addShockwave(object.x, object.y, 170, object.color || "#f2bf63", 0);
      }
    }

    updateHazards(dt) {
      const p = this.run.player;
      for (const hazard of this.run.hazards) {
        hazard.pulse += dt;
        hazard.cooldown -= dt;
        const radius = hazard.radius + Math.sin(hazard.pulse * 3) * 6;
        if (Math.hypot(p.x - hazard.x, p.y - hazard.y) < p.radius + radius && hazard.cooldown <= 0) {
          hazard.cooldown = 0.8;
          this.damagePlayer(10 + this.run.stage * 4);
          if (hazard.type === "ice") p.dashCd += 0.12;
          if (hazard.type === "voltage") p.energy = Math.max(0, p.energy - 12);
        }
      }
      let pickupWrite = 0;
      for (let i = 0; i < this.run.pickups.length; i++) {
        const pickup = this.run.pickups[i];
        pickup.age = (pickup.age || 0) + dt;
        if (pickup.type === "reward") {
          const chest = pickup.container === "woodChest" || pickup.container === "goldChest";
          const target = this.pickupTarget(pickup);
          const canCollect = !pickup.ownerId || pickup.ownerId === this.lobby.id;
          if (Number(pickup.dropGrace || 0) > 0) pickup.dropGrace = Math.max(0, Number(pickup.dropGrace || 0) - dt);
          if (!chest && Number(pickup.scatterTime || 0) > 0) {
            pickup.scatterTime = Math.max(0, Number(pickup.scatterTime || 0) - dt);
            pickup.vy = (pickup.vy || 0) + 230 * dt;
            pickup.x = clamp(pickup.x + (pickup.vx || 0) * dt, ROOM_PAD + pickup.radius, WORLD_W - ROOM_PAD - pickup.radius);
            pickup.y = clamp(pickup.y + (pickup.vy || 0) * dt, ROOM_PAD + pickup.radius, WORLD_H - ROOM_PAD - pickup.radius);
            pickup.vx *= Math.pow(0.2, dt);
            pickup.vy *= Math.pow(0.2, dt);
            if (pickup.scatterTime <= 0) {
              pickup.vx *= 0.35;
              pickup.vy *= 0.25;
            }
          } else if ((chest || pickup.noMagnet) && Number(pickup.settleTime || 0) > 0) {
            pickup.settleTime = Math.max(0, Number(pickup.settleTime || 0) - dt);
            pickup.x = clamp(pickup.x + (pickup.vx || 0) * dt, ROOM_PAD + pickup.radius, WORLD_W - ROOM_PAD - pickup.radius);
            pickup.y = clamp(pickup.y + (pickup.vy || 0) * dt, ROOM_PAD + pickup.radius, WORLD_H - ROOM_PAD - pickup.radius);
            pickup.vx *= Math.pow(0.035, dt);
            pickup.vy *= Math.pow(0.035, dt);
            if (pickup.settleTime <= 0) {
              pickup.vx = 0;
              pickup.vy = 0;
              pickup.stationary = true;
            }
          } else if (chest || pickup.stationary) {
            pickup.vx = 0;
            pickup.vy = 0;
          } else {
            pickup.vy = (pickup.vy || 0) + 180 * dt;
            pickup.x = clamp(pickup.x + (pickup.vx || 0) * dt, ROOM_PAD + pickup.radius, WORLD_W - ROOM_PAD - pickup.radius);
            pickup.y = clamp(pickup.y + (pickup.vy || 0) * dt, ROOM_PAD + pickup.radius, WORLD_H - ROOM_PAD - pickup.radius);
            pickup.vx *= Math.pow(0.18, dt);
            pickup.vy *= Math.pow(0.18, dt);
          }
          if (chest) {
            if (Number(pickup.settleTime || 0) <= 0 && this.isMultiplayerClient() && target && pickup.age > 0.3) {
              const d = Math.hypot(target.x - pickup.x, target.y - pickup.y);
              if (d < target.radius + pickup.radius + 64 || pickup.opening) {
                this.requestChestOpen(pickup);
                if (pickup.opening) {
                  const openDuration = pickup.container === "goldChest" ? 0.62 : 0.42;
                  pickup.openTimer = Math.max(0.08, Number(pickup.openTimer ?? openDuration) - dt);
                }
              }
            } else if (Number(pickup.settleTime || 0) <= 0 && target && pickup.age > 0.45) {
              const d = Math.hypot(target.x - pickup.x, target.y - pickup.y);
              if (d < target.radius + pickup.radius + 54 || pickup.opening) {
                const openDuration = pickup.container === "goldChest" ? 0.62 : 0.42;
                pickup.opening = true;
                pickup.openTimer = Math.max(0, Number(pickup.openTimer ?? openDuration) - dt);
                if (chance(dt * (pickup.container === "goldChest" ? 32 : 18))) {
                  const a = rand(0, TAU);
                  const sparkColor = pickup.container === "goldChest" && chance(0.45) ? pick(["#fff6d2", "#f2bf63", "#ffffff"]) : (pickup.color || "#f2bf63");
                  this.addParticle(pickup.x + Math.cos(a) * 18, pickup.y + Math.sin(a) * 8, sparkColor, rand(7, pickup.container === "goldChest" ? 20 : 15), rand(0.2, 0.5), pickup.container === "goldChest" && chance(0.28) ? "ring" : "spark", a, rand(30, 130));
                }
                if (pickup.openTimer <= 0) this.spawnLootFromChest(pickup, target);
              }
            }
          } else if (!pickup.noMagnet && (canCollect || (this.isMultiplayerHost() && pickup.ownerId && target)) && pickup.age > Math.max(0.2, Number(pickup.magnetDelay || 0))) {
            const magnetTarget = target || p;
            const dx = magnetTarget.x - pickup.x;
            const dy = magnetTarget.y - pickup.y;
            const d = Math.hypot(dx, dy) || 1;
            const roomCleared = Boolean(this.run.currentRoom?.cleared);
            const magnetRange = (roomCleared ? 9999 : 260) + (canCollect ? (p.stats.magnetBonus || 0) : 0);
            const pull = clamp((magnetRange - d) / magnetRange, 0, 1);
            const speed = roomCleared ? 360 + pull * 760 : 130 + pull * 420;
            pickup.x += (dx / d) * speed * dt;
            pickup.y += (dy / d) * speed * dt;
            pickup.magnetStarted = true;
          }
          const canPickupNow = !pickup.requiresMagnetPickup || pickup.magnetStarted;
          if (!chest && canCollect && canPickupNow && Number(pickup.dropGrace || 0) <= 0 && Math.hypot(p.x - pickup.x, p.y - pickup.y) < p.radius + pickup.radius + 8) {
            if (this.collectRewardPickup(pickup)) pickup.life = 0;
          }
        } else {
          if (pickup.collected) continue;
          pickup.life -= dt;
          if (!this.isMultiplayerClient() && !p.dead && Math.hypot(p.x - pickup.x, p.y - pickup.y) < p.radius + pickup.radius) {
            pickup.collected = true;
            this.healPlayer(20);
            pickup.life = 0;
          }
        }
        if (pickup.life > 0) this.run.pickups[pickupWrite++] = pickup;
      }
      this.run.pickups.length = pickupWrite;
    }

    updateEffects(dt) {
      if (!this.run) return;
      let write = 0;
      for (let i = 0; i < this.run.effects.length; i++) {
        const effect = this.run.effects[i];
        effect.time -= dt;
        if (effect.type === "pull" && !this.isMultiplayerClient()) {
          for (const enemy of this.run.enemies) {
            const d = Math.hypot(effect.x - enemy.x, effect.y - enemy.y);
            if (d < effect.radius) {
              const a = Math.atan2(effect.y - enemy.y, effect.x - enemy.x);
              enemy.vx += Math.cos(a) * 420 * dt;
              enemy.vy += Math.sin(a) * 420 * dt;
            }
          }
        }
        if (effect.type === "zone") {
          effect.tick -= dt;
          if (effect.tick <= 0 && !this.isMultiplayerClient()) {
            effect.tick = 0.35;
            this.areaDamage(effect.x, effect.y, effect.radius, 20, effect.color, effect.kind);
          }
        }
        if (effect.type === "danger" && effect.time <= 0.05 && !effect.done) {
          effect.done = true;
          this.addShockwave(effect.x, effect.y, effect.radius + 30, effect.color, 36);
          if (!this.isMultiplayerClient()) {
            for (const target of this.combatTargets()) {
              if (Math.hypot(target.x - effect.x, target.y - effect.y) < effect.radius + target.radius) {
                if (!this.tryGuardianEffectReflect(target, effect)) this.damageCombatTarget(target, effect.damage, effect);
              }
            }
          }
        }
        if (effect.type === "gravityAnomaly" && !this.isMultiplayerClient()) {
          effect.pulse -= dt;
          if (effect.pulse <= 0) {
            effect.pulse = 3.5;
            const x = rand(220, WORLD_W - 220);
            const y = rand(190, WORLD_H - 190);
            this.addEffect({ type: "pull", x, y, radius: 240, time: 1.2, color: "#b28dff" });
            this.addShockwave(x, y, 190, "#b28dff", 22);
          }
        }
        if (effect.time > 0) this.run.effects[write++] = effect;
      }
      this.run.effects.length = write;
    }

    addEffect(effect) {
      if (!this.run) return;
      this.run.effects.push(effect);
      this.trimEffectList();
    }

    updateSlashes(dt) {
      let write = 0;
      for (let i = 0; i < this.run.slashes.length; i++) {
        const slash = this.run.slashes[i];
        slash.life -= dt;
        if (slash.life > 0) this.run.slashes[write++] = slash;
      }
      this.run.slashes.length = write;
    }

    updateTrails(dt) {
      let write = 0;
      for (let i = 0; i < this.run.trails.length; i++) {
        const trail = this.run.trails[i];
        trail.life -= dt;
        if (trail.damageTick !== undefined) {
          trail.damageTick -= dt;
          if (trail.damageTick <= 0) {
            trail.damageTick = 0.18;
            for (const enemy of [...this.run.enemies]) {
              if (Math.hypot(enemy.x - trail.x, enemy.y - trail.y) < enemy.radius + trail.radius) {
                this.damageEnemy(enemy, 10, { x: 0, y: 0, source: "trail", kind: "fire" });
              }
            }
          }
        }
        if (trail.life > 0) this.run.trails[write++] = trail;
      }
      this.run.trails.length = write;
    }

    leaveTrail(x, y, color) {
      this.run.trails.push({ x, y, radius: 18, color, life: 0.45, maxLife: 0.45 });
      this.trimVisualList(this.run.trails, this.isMobileDevice() ? 28 : 42);
    }

    addTrailDamage(x, y, color) {
      this.run.trails.push({ x, y, radius: 28, color, life: 1.1, maxLife: 1.1, damageTick: 0 });
      this.trimVisualList(this.run.trails, this.isMobileDevice() ? 28 : 42);
    }

    addShockwave(x, y, radius, color, damage = 0) {
      this.run.shockwaves.push({ x, y, radius, color, life: 0.42, maxLife: 0.42, damage, hit: new Set() });
      this.trimVisualList(this.run.shockwaves, this.isMobileDevice() ? 16 : 24);
    }

    updateShockwaves(dt) {
      let write = 0;
      for (let i = 0; i < this.run.shockwaves.length; i++) {
        const wave = this.run.shockwaves[i];
        wave.life -= dt;
        const progress = 1 - wave.life / wave.maxLife;
        const current = wave.radius * progress;
        if (wave.damage > 0) {
          for (const enemy of [...this.run.enemies]) {
            if (!wave.hit.has(enemy.id) && Math.hypot(enemy.x - wave.x, enemy.y - wave.y) < current + enemy.radius) {
              wave.hit.add(enemy.id);
              this.damageEnemy(enemy, wave.damage, { x: (enemy.x - wave.x) / current, y: (enemy.y - wave.y) / current, source: "shockwave" });
            }
          }
        }
        if (wave.life > 0) this.run.shockwaves[write++] = wave;
      }
      this.run.shockwaves.length = write;
    }

    chainLightning(origin, damage) {
      let source = origin;
      const hit = new Set([origin.id]);
      for (let i = 0; i < 3; i++) {
        let target = null;
        let best = 260;
        for (const enemy of this.run.enemies) {
          if (hit.has(enemy.id)) continue;
          const d = Math.hypot(enemy.x - source.x, enemy.y - source.y);
          if (d < best) {
            best = d;
            target = enemy;
          }
        }
        if (!target) break;
        hit.add(target.id);
        this.run.slashes.push({ x: source.x, y: source.y, tx: target.x, ty: target.y, line: true, life: 0.16, maxLife: 0.16, color: "#ffe45e" });
        this.trimVisualList(this.run.slashes, this.isMobileDevice() ? 24 : 38);
        this.damageEnemy(target, damage, { x: 0, y: 0, source: "chain", kind: "lightning" });
        source = target;
      }
    }

    fracture(enemy) {
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * TAU;
        this.spawnProjectile({
          owner: "player",
          x: enemy.x,
          y: enemy.y,
          vx: Math.cos(angle) * 470,
          vy: Math.sin(angle) * 470,
          radius: 5,
          damage: 18,
          life: 0.75,
          color: "#83e8ff",
          pierce: 1,
          kind: "ice"
        });
      }
    }

    addImpact(x, y, color, damage, crit) {
      this.camera.shake = Math.max(this.camera.shake, crit ? 9 : 4);
      for (let i = 0; i < (crit ? 14 : 8) * this.save.settings.particles; i++) {
        this.addParticle(x, y, color, rand(6, crit ? 18 : 13), rand(0.25, 0.7), crit ? "crit" : "spark");
      }
      if (this.save.settings.damageNumbers) {
        this.run.damageTexts.push({ x, y: y - 18, vx: rand(-18, 18), vy: -52, life: 0.72, text: `${crit ? "CRIT " : ""}${Math.ceil(damage)}`, color: crit ? "#ffe45e" : "#ffffff", crit });
        this.trimVisualList(this.run.damageTexts, this.isMobileDevice() ? 28 : 48);
      }
      this.audio.sfx(crit ? 520 : 360, crit ? "square" : "triangle", 0.045, crit ? 0.13 : 0.08);
    }

    isBasicHit(options) {
      return Boolean(this.basicHitKind(options));
    }

    basicHitKind(options) {
      if (options.source === "basic") return "swordsman";
      if (options.source === "guardian") return "guardian";
      if (options.source === "guardianReflect") return "guardian";
      if (options.source === "assassin") return "assassin";
      if (options.source === "remoteBasic") return options.kind || "swordsman";
      if (options.source === "projectile" && options.kind === "mageBasic") return "mage";
      if (options.source === "projectile" && options.kind === "rangerBasic") return "ranger";
      return "";
    }

    characterEffectPalette(kind) {
      if (kind === "guardian") return { color: "#ffd36a", accent: "#fff3c2", dust: "#b08b55" };
      if (kind === "mage") return { color: "#78e7ff", accent: "#ffffff", dust: "#5bb8d8" };
      if (kind === "ranger") return { color: "#ffc15a", accent: "#fff0b8", dust: "#b9813e" };
      if (kind === "assassin") return { color: "#b8b7ff", accent: "#ffffff", dust: "#7f80c8" };
      return { color: "#dfe6ef", accent: "#ffffff", dust: "#9aa6b5" };
    }

    addBasicAttackBurst(x, y, angle, kind = "swordsman", reach = 0) {
      if (!this.run) return;
      const heavy = kind === "guardian";
      const ranged = kind === "mage" || kind === "ranger";
      const life = heavy ? 0.24 : kind === "assassin" ? 0.18 : ranged ? 0.19 : 0.22;
      const palette = this.characterEffectPalette(kind);
      this.addEffect({
        type: "attackBurst",
        x,
        y,
        angle,
        kind,
        heavy,
        ranged,
        reach,
        color: palette.color,
        accent: palette.accent,
        time: life,
        maxTime: life
      });
    }

    addAttackDust(x, y, angle, heavy = false) {
      const count = Math.round((heavy ? 10 : 6) * this.save.settings.particles);
      for (let i = 0; i < count; i++) {
        this.addParticle(
          x + rand(-5, 5),
          y + rand(-5, 5),
          i % 2 ? "#8a8172" : "#c7c0ae",
          rand(3, heavy ? 8 : 6),
          rand(0.12, 0.24),
          "spark",
          angle + Math.PI + rand(-0.55, 0.55),
          rand(35, heavy ? 130 : 90)
        );
      }
    }

    addBasicHitSpark(x, y, angle, kind = "swordsman", heavy = false) {
      const life = heavy ? 0.3 : 0.24;
      const palette = this.characterEffectPalette(kind);
      const color = heavy ? palette.accent : palette.color;
      this.addEffect({
        type: "hitSpark",
        x,
        y,
        angle,
        kind,
        color,
        accent: palette.accent,
        heavy,
        time: life,
        maxTime: life
      });
      const count = Math.round((heavy ? 16 : 11) * this.save.settings.particles);
      for (let i = 0; i < count; i++) {
        this.addParticle(
          x + rand(-4, 4),
          y + rand(-4, 4),
          i % 3 === 0 ? "#ffffff" : color,
          rand(4, heavy ? 13 : 10),
          rand(0.12, 0.26),
          "spark",
          angle + Math.PI + rand(-0.95, 0.95),
          rand(90, heavy ? 260 : 190)
        );
      }
    }

    addParticle(x, y, color, size, life, shape = "spark", angle = rand(0, TAU), speed = rand(20, 220)) {
      if (!this.run || this.save.settings.particles <= 0) return;
      if (Math.random() > this.particleSpawnChance(shape)) return;
      const limit = this.particleLimit();
      if (this.run.particles.length >= limit) {
        if (!["crit", "plus", "ring"].includes(shape)) return;
        this.run.particles.shift();
      }
      this.run.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size,
        life,
        maxLife: life,
        color,
        shape
      });
    }

    updateParticles(dt) {
      if (!this.run) return;
      let write = 0;
      for (let i = 0; i < this.run.particles.length; i++) {
        const particle = this.run.particles[i];
        particle.life -= dt;
        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vx *= Math.pow(0.05, dt);
        particle.vy *= Math.pow(0.05, dt);
        if (particle.life > 0) this.run.particles[write++] = particle;
      }
      this.run.particles.length = write;
    }

    updateDamageTexts(dt) {
      if (!this.run) return;
      let write = 0;
      for (let i = 0; i < this.run.damageTexts.length; i++) {
        const text = this.run.damageTexts[i];
        text.life -= dt;
        text.x += text.vx * dt;
        text.y += text.vy * dt;
        text.vy += 80 * dt;
        if (text.life > 0) this.run.damageTexts[write++] = text;
      }
      this.run.damageTexts.length = write;
    }

    updateNetwork(dt) {
      this.networkTimer -= dt;
      this.snapshotTimer -= dt;
      this.resyncTimer -= dt;
      if (!this.run || !this.isMultiplayerRun()) return;
      if (this.networkTimer <= 0) {
        this.networkTimer = this.lobby.hasOpenPeers() ? 0.04 : 0.1;
        const p = this.run.player;
        this.lobby.sendState(this.networkPlayerState(this.lobby.id, p));
      }
      if (this.isMultiplayerHost() && this.lobby.guestCount() > 0 && this.snapshotTimer <= 0) {
        this.snapshotTimer = this.lobby.hasOpenPeers() ? (this.perf.quality < 0.75 ? 0.16 : 0.1) : 0.18;
        const snapshot = this.networkSnapshot(true);
        if (snapshot) this.lobby.broadcastSnapshot(snapshot, snapshot);
      }
      this.maybeRequestNetworkResync(dt);
      for (const [id, remote] of [...this.remotePlayers]) {
        const stillInRoom = this.lobby.slots.some((slot) => slot?.id === id);
        if (!stillInRoom && performance.now() - remote.t > 4000) this.remotePlayers.delete(id);
      }
      this.ensureRemotePlayersFromLobby();
    }

    expectedCombatRoom() {
      const room = this.run?.currentRoom;
      if (!room || room.cleared || room.rewardDropped || room.nextOpened) return false;
      if (room.intro > 0.15) return false;
      if (["treasure", "merchant", "healing", "curse"].includes(room.type)) return false;
      if (room.type === "boss" && !room.started) return false;
      return true;
    }

    maybeRequestNetworkResync(dt) {
      if (!this.isMultiplayerClient() || !this.expectedCombatRoom()) return;
      if (this.run.enemies.length > 0 || this.resyncTimer > 0) return;
      this.resyncTimer = 0.75;
      this.lobby.requestSnapshot();
    }

    ensureRemotePlayersFromLobby() {
      if (!this.run || !this.isMultiplayerRun()) return;
      const p = this.run.player;
      const offsets = [
        { x: -54, y: 34 },
        { x: 54, y: 34 },
        { x: 0, y: 76 }
      ];
      const slots = (this.lobby.slots || []).filter((slot) => slot?.id && slot.id !== this.lobby.id);
      slots.forEach((slot, index) => {
        if (this.remotePlayers.has(slot.id)) return;
        const character = characterById(slot.characterId || "swordsman");
        const offset = offsets[index % offsets.length];
        this.remotePlayers.set(slot.id, {
          id: slot.id,
          name: slot.name || "Người chơi",
          x: p.x + offset.x,
          y: p.y + offset.y,
          displayX: p.x + offset.x,
          displayY: p.y + offset.y,
          vx: 0,
          vy: 0,
          hp: character.stats.hp,
          maxHp: character.stats.hp,
          energy: character.stats.energy,
          maxEnergy: character.stats.energy,
          damage: character.stats.damage,
          crit: character.stats.crit,
          color: "#d8b46a",
          characterId: character.id,
          animation: "idle",
          animTime: this.menuTime,
          actionTime: 0,
          actionTotal: 0,
          power: slot.powerId || "fire",
          facing: -Math.PI / 2,
          t: performance.now()
        });
      });
    }

    sendNetworkSnapshotTo(remoteId) {
      if (!this.isMultiplayerHost() || !remoteId) return;
      const snapshot = this.networkSnapshot(true);
      if (snapshot) this.lobby.sendSnapshot(remoteId, snapshot);
    }

    updateNetworkInterpolation(dt) {
      if (!this.run || !this.isMultiplayerRun()) return;
      const now = performance.now();
      const remoteBlend = clamp(dt * 22, 0, 1);
      for (const remote of this.remotePlayers.values()) {
        const age = clamp((now - (remote.t || now)) / 1000, 0, 0.12);
        const targetX = Number(remote.x) + (Number(remote.vx) || 0) * age;
        const targetY = Number(remote.y) + (Number(remote.vy) || 0) * age;
        if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) continue;
        if (!Number.isFinite(remote.displayX) || !Number.isFinite(remote.displayY)) {
          remote.displayX = targetX;
          remote.displayY = targetY;
        } else {
          remote.displayX += (targetX - remote.displayX) * remoteBlend;
          remote.displayY += (targetY - remote.displayY) * remoteBlend;
        }
      }
      if (!this.isMultiplayerClient()) return;
      const enemyBlend = clamp(dt * 18, 0, 1);
      for (const enemy of this.run.enemies) {
        enemy.flash = Math.max(0, (enemy.flash || 0) - dt);
        enemy.attackAnim = Math.max(0, (enemy.attackAnim || 0) - dt);
        enemy.launch = Math.max(0, (enemy.launch || 0) - dt);
        enemy.windupTime = Math.max(0, (enemy.windupTime || 0) - dt);
        const targetX = Number(enemy.x) + (Number(enemy.vx) || 0) * 0.06;
        const targetY = Number(enemy.y) + (Number(enemy.vy) || 0) * 0.06;
        if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) continue;
        if (!Number.isFinite(enemy.displayX) || !Number.isFinite(enemy.displayY)) {
          enemy.displayX = targetX;
          enemy.displayY = targetY;
        } else {
          enemy.displayX += (targetX - enemy.displayX) * enemyBlend;
          enemy.displayY += (targetY - enemy.displayY) * enemyBlend;
        }
      }
    }

    updateHud() {
      if (!this.run) return;
      const p = this.run.player;
      const hpBar = document.getElementById("hpBar");
      const energyBar = document.getElementById("energyBar");
      const hpText = document.getElementById("hpText");
      const energyText = document.getElementById("energyText");
      const statusStrip = document.getElementById("statusStrip");
      const roomPill = document.getElementById("roomPill");
      const objectivePill = document.getElementById("objectivePill");
      const hpWidth = `${clamp((p.hp / p.maxHp) * 100, 0, 100).toFixed(1)}%`;
      const energyWidth = `${clamp((p.energy / p.maxEnergy) * 100, 0, 100).toFixed(1)}%`;
      const hpLabel = `${Math.ceil(p.hp)} / ${Math.ceil(p.maxHp)}`;
      const energyLabel = `${Math.ceil(p.energy)} / ${Math.ceil(p.maxEnergy)}`;
      const mobileHud = this.isMobileDevice();
      const roomLabel = mobileHud
        ? `T${this.run.stage + 1}.${this.run.roomNumber} - ${this.run.currentRoom?.label || ""}`
        : `${this.run.biome.name} - ${this.run.currentRoom?.label || ""}`;
      const objectiveLabel = mobileHud ? this.compactObjectiveText() : this.roomObjectiveText();
      if (hpBar.style.width !== hpWidth) hpBar.style.width = hpWidth;
      if (energyBar.style.width !== energyWidth) energyBar.style.width = energyWidth;
      if (hpText.textContent !== hpLabel) hpText.textContent = hpLabel;
      if (energyText.textContent !== energyLabel) energyText.textContent = energyLabel;
      if (statusStrip) {
        const effects = (this.run.statusEffects || []).filter((effect) => effect.time > 0);
        statusStrip.classList.toggle("hidden", effects.length === 0);
        const statusMarkup = effects.map((effect, index) => `
          <button class="status-icon" data-status-index="${index}" style="--status:${effect.color || "#a169ff"}">
            ${effect.icon || effect.name.slice(0, 1)}
          </button>
        `).join("");
        if (statusMarkup !== this.hudStatusMarkup) {
          this.hudStatusMarkup = statusMarkup;
          statusStrip.innerHTML = statusMarkup;
        }
      }
      if (roomPill.textContent !== roomLabel) roomPill.textContent = roomLabel;
      if (objectivePill.textContent !== objectiveLabel) objectivePill.textContent = objectiveLabel;
      const now = performance.now();
      if (now < this.nextHudSkillAt) return;
      this.nextHudSkillAt = now + (this.perf.quality < 0.7 ? 150 : 95);
      const skills = [
        ["ĐÁNH", this.run.power.skills.basic, this.run.player.attackCd, this.run.player.basicAttackCd || 0.38],
        ["Q", this.run.power.skills.q, p.cooldowns.q, 3.2],
        ["E", this.run.power.skills.e, p.cooldowns.e, 5.4],
        ["R", this.run.power.skills.r, p.cooldowns.r, 8.6],
        ["F", `${this.run.power.skills.f} ${Math.floor(p.ult)}%`, p.ult >= 100 ? 0 : 1, 1]
      ];
      if (mobileHud) {
        this.updateTouchCooldowns(skills);
        if (this.hudSkillMarkup !== "") {
          this.hudSkillMarkup = "";
          document.getElementById("skillStrip").innerHTML = "";
        }
        return;
      }
      const markup = skills.map(([key, name, cd, max]) => `
        <div class="skill ${cd <= 0 ? "ready" : ""}">
          <span class="key">${key}</span>
          <span class="name">${name}</span>
          <span class="cool" style="height:${clamp((cd / max) * 100, 0, 100)}%"></span>
        </div>
      `).join("");
      if (markup !== this.hudSkillMarkup) {
        this.hudSkillMarkup = markup;
        document.getElementById("skillStrip").innerHTML = markup;
      }
    }

    updateTouchCooldowns(skills) {
      const map = new Map([
        ["attack", skills[0]],
        ["q", skills[1]],
        ["e", skills[2]],
        ["r", skills[3]],
        ["f", skills[4]],
        ["dash", ["LƯỚT", "Lướt", this.run.player.dashCd, 0.7]]
      ]);
      for (const button of document.querySelectorAll("[data-touch]")) {
        const data = map.get(button.dataset.touch);
        if (!data) continue;
        const [label, , cd, max] = data;
        const ready = cd <= 0;
        const text = ready ? label : `${label} ${Math.ceil(cd)}`;
        if (button.textContent !== text) button.textContent = text;
        button.classList.toggle("cooling", !ready);
        button.style.setProperty("--cool", `${clamp((cd / (max || 1)) * 100, 0, 100)}%`);
      }
    }

    compactObjectiveText() {
      const enemies = this.run?.enemies.length || 0;
      if (enemies > 0) return `${enemies} quái`;
      const pending = this.run?.pendingDoor;
      if (pending) return `Vào cửa ${Math.ceil(pending.timer)}s`;
      if (this.run?.roomObjects?.some((object) => object.type === "nextDoor")) return "Chọn cửa";
      const room = this.run?.currentRoom;
      if (room?.rewardDropped && !room.rewardClaimed) return "Nhặt rương";
      return "Xong";
    }

    roomObjectiveText() {
      const room = this.run?.currentRoom;
      const enemies = this.run?.enemies.length || 0;
      if (enemies > 0) return `Hạ ${enemies} quái`;
      const activeObject = this.run?.roomObjects?.find((object) => !object.opened && object.type !== "nextDoor");
      if (activeObject?.type === "treasureChest") return "Chạm rương kho báu";
      if (activeObject?.type === "bossGate") return "Chạm cổng lớn để gọi boss";
      if (activeObject?.type === "bossExit") return "Chạm cổng thưởng";
      if (activeObject?.type === "merchantStall") return "Chạm quầy thương nhân";
      if (activeObject?.type === "curseBook") return "Chạm sách nguyền";
      if (!room?.cleared) return "Đang ổn định khe nứt";
      if (room.rewardDropped && !room.rewardClaimed) return "Nhặt thưởng";
      if (this.run?.roomObjects?.some((object) => object.type === "nextDoor")) return "Đi vào một cánh cửa";
      if (room.nextOpened) return "Chờ cửa khu tiếp theo";
      return "Đã dọn phòng";
    }

    render() {
      const ctx = this.ctx;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, this.width, this.height);
      if (this.run) this.drawGame(ctx);
      else this.drawMenuBackdrop(ctx);
      if (this.run && this.mode !== "game") this.drawMenuBackdrop(ctx, true);
    }

    drawMenuBackdrop(ctx, overlay = false) {
      const t = this.menuTime;
      ctx.save();
      if (!overlay) {
        ctx.fillStyle = "#080a10";
        ctx.fillRect(0, 0, this.width, this.height);
      }
      const baseY = this.height * 0.62;
      for (let y = 0; y < this.height; y += 34) {
        ctx.fillStyle = y % 68 === 0 ? "#101521" : "#0d1018";
        ctx.fillRect(0, y, this.width, 34);
      }
      for (let i = 0; i < 80; i++) {
        const x = (i * 137 + t * (12 + (i % 5) * 5)) % (this.width + 80) - 40;
        const y = (i * 83) % this.height;
        const color = i % 3 === 0 ? "#f2bf63" : i % 3 === 1 ? "#35d6c9" : "#ff4b55";
        ctx.globalAlpha = overlay ? 0.08 : 0.18;
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), 2 + (i % 3), 2 + (i % 2));
      }
      ctx.globalAlpha = overlay ? 0.18 : 0.58;
      this.drawHero(ctx, this.width * 0.68, baseY + Math.sin(t * 2) * 5, 3.2, { facing: -Math.PI * 0.7, animation: "idle", hp: 1 }, powerById("fire"), this.save.customization);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    drawGame(ctx) {
      const camX = this.camera.x - this.camera.shakeX;
      const camY = this.camera.y - this.camera.shakeY;
      const scale = this.worldViewScale();
      this.renderViewW = this.width / scale;
      this.renderViewH = this.height / scale;
      ctx.save();
      ctx.scale(scale, scale);
      ctx.translate(-camX, -camY);
      this.drawRoom(ctx);
      this.drawTrails(ctx);
      this.drawHazards(ctx);
      this.drawPickups(ctx);
      this.drawRoomObjects(ctx);
      this.drawEffects(ctx);
      for (const projectile of this.run.projectiles) this.drawProjectile(ctx, projectile);
      for (const drone of this.run.drones) this.drawDrone(ctx, drone);
      const actorY = (actor) => Number.isFinite(actor.displayY) ? actor.displayY : actor.y;
      const localGhost = this.run.player.dead && this.run.spectating;
      const actors = [...this.run.enemies];
      if (!localGhost) actors.push(this.run.player);
      actors.sort((a, b) => actorY(a) - actorY(b));
      for (const actor of actors) {
        if (actor === this.run.player) {
          this.drawHero(ctx, actor.x, actor.y, 2.2, actor, this.run.power, this.save.customization);
          if (this.isMultiplayerRun()) this.drawNameTag(ctx, actor.x, actor.y - 58, actor.name || this.save.account.username || "Bạn", true, actor.hp, actor.maxHp);
        } else {
          const enemyX = Number.isFinite(actor.displayX) ? actor.displayX : actor.x;
          const enemyY = Number.isFinite(actor.displayY) ? actor.displayY : actor.y;
          if (this.inView(enemyX, enemyY, actor.radius + 120)) this.drawEnemy(ctx, { ...actor, x: enemyX, y: enemyY });
        }
      }
      for (const remote of this.remotePlayers.values()) {
        const remoteX = Number.isFinite(remote.displayX) ? remote.displayX : remote.x;
        const remoteY = Number.isFinite(remote.displayY) ? remote.displayY : remote.y;
        if (remote.dead && remote.spectating) {
          const target = this.playerByNetworkId(remote.spectateId);
          const pos = this.displayActorPosition(this.aliveActor(target) ? target : remote);
          if (this.inView(pos.x, pos.y, 160)) this.drawSoulGhost(ctx, pos.x, pos.y, remote.name || "Người chơi", false, remote.color || "#d9fbff");
          continue;
        }
        if (!this.inView(remoteX, remoteY, 120)) continue;
        this.drawHero(ctx, remoteX, remoteY, 2.0, {
          facing: remote.facing,
          animation: remote.dead ? "death" : remote.animation || "run",
          animTime: remote.animTime || this.menuTime,
          actionTime: remote.actionTime || 0,
          actionTotal: remote.actionTotal || 0,
          hp: remote.hp,
          dead: remote.dead,
          characterId: remote.characterId
        }, powerById(remote.power), { ...this.save.customization, color: remote.color });
        this.drawNameTag(ctx, remoteX, remoteY - 54, remote.name || "Người chơi", false, remote.hp, remote.maxHp);
      }
      if (localGhost) {
        const target = this.currentSpectateTarget();
        const pos = this.displayActorPosition(this.aliveActor(target) ? target : this.run.player);
        if (this.inView(pos.x, pos.y, 170)) this.drawSoulGhost(ctx, pos.x, pos.y, this.save.account.username || "Bạn", true, this.save.customization.color || "#d9fbff");
      }
      this.drawSlashes(ctx);
      this.drawShockwaves(ctx);
      this.drawParticles(ctx);
      this.drawEffects(ctx, true);
      this.drawDamageTexts(ctx);
      this.drawBossBars(ctx);
      if (this.run.currentRoom?.intro > 0) this.drawRoomIntro(ctx);
      ctx.restore();
      this.renderViewW = 0;
      this.renderViewH = 0;
      this.drawVignette(ctx);
    }

    drawRoom(ctx) {
      const biome = this.run.biome;
      const bounds = this.viewBounds(120);
      ctx.fillStyle = "#05070b";
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.fillStyle = biome.floor;
      ctx.fillRect(ROOM_PAD, ROOM_PAD, WORLD_W - ROOM_PAD * 2, WORLD_H - ROOM_PAD * 2);
      const startX = Math.max(ROOM_PAD, ROOM_PAD + Math.floor((bounds.left - ROOM_PAD) / 64) * 64);
      const endX = Math.min(WORLD_W - ROOM_PAD, bounds.right + 64);
      const startY = Math.max(ROOM_PAD, ROOM_PAD + Math.floor((bounds.top - ROOM_PAD) / 64) * 64);
      const endY = Math.min(WORLD_H - ROOM_PAD, bounds.bottom + 64);
      for (let x = startX; x < endX; x += 64) {
        for (let y = startY; y < endY; y += 64) {
          const n = Math.sin(x * 0.04 + y * 0.03 + this.run.seed * 10);
          ctx.fillStyle = n > 0 ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.08)";
          ctx.fillRect(x, y, 62, 62);
          if ((x + y) % 192 === 0) {
            ctx.fillStyle = biome.accent;
            ctx.globalAlpha = 0.1;
            ctx.fillRect(x + 18, y + 18, 8, 8);
            ctx.globalAlpha = 1;
          }
        }
      }
      ctx.fillStyle = biome.wall;
      ctx.fillRect(0, 0, WORLD_W, ROOM_PAD);
      ctx.fillRect(0, WORLD_H - ROOM_PAD, WORLD_W, ROOM_PAD);
      ctx.fillRect(0, 0, ROOM_PAD, WORLD_H);
      ctx.fillRect(WORLD_W - ROOM_PAD, 0, ROOM_PAD, WORLD_H);
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.fillRect(ROOM_PAD, ROOM_PAD, WORLD_W - ROOM_PAD * 2, 18);
      ctx.fillRect(ROOM_PAD, WORLD_H - ROOM_PAD - 18, WORLD_W - ROOM_PAD * 2, 18);
      ctx.fillRect(ROOM_PAD, ROOM_PAD, 18, WORLD_H - ROOM_PAD * 2);
      ctx.fillRect(WORLD_W - ROOM_PAD - 18, ROOM_PAD, 18, WORLD_H - ROOM_PAD * 2);
      ctx.fillStyle = biome.haze;
      for (let i = 0; i < 8; i++) {
        const x = ROOM_PAD + ((i * 317 + this.menuTime * 18) % (WORLD_W - ROOM_PAD * 2));
        const y = ROOM_PAD + ((i * 181 + Math.sin(this.menuTime + i) * 80) % (WORLD_H - ROOM_PAD * 2));
        if (!this.inView(x + 90, y + 12, 220)) continue;
        ctx.fillRect(x, y, 180, 24);
      }
    }

    drawHazards(ctx) {
      for (const hazard of this.run.hazards) {
        if (!this.inView(hazard.x, hazard.y, hazard.radius + 80)) continue;
        const color = {
          thorn: "#75e66e",
          ice: "#83e8ff",
          lava: "#ff6b3a",
          voltage: "#fd57ff",
          blade: "#f4d26f"
        }[hazard.type] || this.run.biome.accent;
        const r = hazard.radius + Math.sin(hazard.pulse * 3) * 6;
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, r, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, r, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    drawPickups(ctx) {
      for (const pickup of this.run.pickups) {
        if (!this.inView(pickup.x, pickup.y, pickup.radius + 90)) continue;
        ctx.save();
        if (pickup.type === "reward") {
          const color = pickup.color || this.rewardColor(pickup.reward);
          const chest = pickup.container === "woodChest" || pickup.container === "goldChest";
          const bob = chest ? 0 : Math.sin(this.menuTime * 7 + (pickup.age || 0) * 3) * 4;
          ctx.translate(pickup.x, pickup.y + bob);
          ctx.globalAlpha = 0.92;
          ctx.shadowColor = color;
          ctx.shadowBlur = this.glow(16);
          if (pickup.container === "coin" || pickup.reward?.type === "coin") {
            ctx.fillStyle = "#f2bf63";
            ctx.strokeStyle = "#fff0ad";
            ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.ellipse(i * 5 - 5, i * -3 + 4, 8, 5, -0.25, 0, TAU);
              ctx.fill();
              ctx.stroke();
            }
            ctx.fillStyle = "#3a2509";
            ctx.font = "900 9px ui-sans-serif, system-ui";
            ctx.textAlign = "center";
            ctx.fillText("$", 0, 5);
          } else if (pickup.container === "woodChest" || pickup.container === "goldChest") {
            const gold = pickup.container === "goldChest";
            const openDuration = gold ? 0.62 : 0.42;
            const rawOpening = pickup.opening ? clamp(1 - Number(pickup.openTimer ?? openDuration) / openDuration, 0, 1) : 0;
            const opening = gold ? 1 - Math.pow(1 - rawOpening, 2.4) : rawOpening;
            const bodyLift = Math.sin(rawOpening * Math.PI) * (gold ? 5 : 3);
            const lidAngle = -opening * (gold ? 1.45 : 1.18);
            if (gold) ctx.shadowBlur = this.glow(20 + opening * 22);
            ctx.translate(0, bodyLift);
            ctx.fillStyle = "rgba(0,0,0,0.34)";
            ctx.beginPath();
            ctx.ellipse(0, 18, gold ? 28 : 24, gold ? 7 : 6, 0, 0, TAU);
            ctx.fill();
            ctx.fillStyle = gold ? "#b9892f" : "#8b5128";
            ctx.strokeStyle = gold ? "#fff0ad" : "#f2bf63";
            ctx.lineWidth = gold ? 3.5 : 3;
            roundPixel(ctx, gold ? -23 : -20, -6, gold ? 46 : 40, 23, 3);
            ctx.strokeRect(gold ? -23 : -20, -6, gold ? 46 : 40, 23);
            ctx.fillStyle = gold ? "#f2bf63" : "#f4d26f";
            ctx.fillRect(gold ? -25 : -22, 1, gold ? 50 : 44, 4);
            ctx.fillStyle = "rgba(255,255,255,0.18)";
            ctx.fillRect(gold ? -18 : -16, -3, gold ? 36 : 32, 3);
            if (gold) {
              ctx.fillStyle = "#6b3d13";
              ctx.fillRect(-6, 4, 12, 11);
              ctx.fillStyle = "#fff6d2";
              ctx.fillRect(-3, 6, 6, 6);
            }
            if (gold && opening > 0) {
              ctx.save();
              ctx.globalCompositeOperation = "lighter";
              ctx.globalAlpha = 0.16 + opening * 0.28;
              ctx.fillStyle = "#fff0ad";
              ctx.beginPath();
              ctx.moveTo(-14, -7);
              ctx.lineTo(-42 - opening * 8, -68 - opening * 24);
              ctx.lineTo(42 + opening * 8, -68 - opening * 24);
              ctx.lineTo(14, -7);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = "#fff6d2";
              ctx.lineWidth = 2;
              for (let i = -2; i <= 2; i++) {
                const sway = Math.sin(this.menuTime * 7 + i) * 0.08;
                const a = -Math.PI / 2 + i * 0.18 + sway;
                const inner = 12 + opening * 10;
                const outer = 34 + opening * 30 + (2 - Math.abs(i)) * 5;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * inner, -5 + Math.sin(a) * inner);
                ctx.lineTo(Math.cos(a) * outer, -5 + Math.sin(a) * outer);
                ctx.stroke();
              }
              for (let i = 0; i < 4; i++) {
                const a = this.menuTime * 2.4 + i * TAU / 4;
                const sx = Math.cos(a) * (18 + opening * 12);
                const sy = -20 + Math.sin(a) * (7 + opening * 7);
                ctx.fillStyle = i % 2 ? "#ffffff" : "#fff0ad";
                ctx.fillRect(sx - 2, sy - 2, 4, 4);
              }
              ctx.restore();
            }
            ctx.save();
            ctx.translate(gold ? -23 : -20, -6 - (gold ? opening * 5 : 0));
            ctx.rotate(lidAngle);
            ctx.translate(gold ? 23 : 20, 6);
            ctx.fillStyle = gold ? "#f2bf63" : "#5a321c";
            ctx.beginPath();
            ctx.moveTo(gold ? -23 : -20, -6);
            ctx.quadraticCurveTo(0, -28 - opening * (gold ? 15 : 8), gold ? 23 : 20, -6);
            ctx.lineTo(gold ? 23 : 20, 0);
            ctx.quadraticCurveTo(0, -18 - opening * (gold ? 10 : 6), gold ? -23 : -20, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = gold ? "#fff0ad" : "#d6a052";
            ctx.fillRect(gold ? -17 : -14, -8, gold ? 34 : 28, 4);
            ctx.restore();
            if (opening > 0) {
              ctx.globalAlpha = (gold ? 0.55 : 0.35) * opening;
              ctx.fillStyle = color;
              ctx.beginPath();
              ctx.ellipse(0, -5, (gold ? 27 : 22) + opening * (gold ? 14 : 8), 9 + opening * (gold ? 8 : 5), 0, 0, TAU);
              ctx.fill();
              ctx.globalAlpha = 0.92;
            }
            ctx.fillStyle = color;
            ctx.fillRect(-5, -1 + opening * (gold ? 8 : 5), 10, 10);
            ctx.font = "900 9px ui-sans-serif, system-ui";
            ctx.textAlign = "center";
            ctx.fillStyle = "#fff6d2";
            ctx.fillText(pickup.chestReward?.type === "material" ? "NL" : "PT", 0, 22);
          } else if (pickup.container === "looseItem" || pickup.reward?.type === "item") {
            const item = pickup.reward?.item;
            ctx.fillStyle = color;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect?.(-14, -14, 28, 28, 4);
            if (!ctx.roundRect) ctx.rect(-14, -14, 28, 28);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = "#101521";
            ctx.font = "900 9px ui-sans-serif, system-ui";
            ctx.textAlign = "center";
            ctx.fillText(item?.icon?.slice(0, 2) || "PT", 0, 4);
          } else {
            ctx.fillStyle = color;
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-11, -11, 22, 22);
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.strokeRect(-13, -13, 26, 26);
            ctx.rotate(-Math.PI / 4);
          }
          if (pickup.ownerName) {
            ctx.font = "800 10px ui-sans-serif, system-ui";
            ctx.textAlign = "center";
            ctx.fillStyle = pickup.ownerId === this.lobby.id ? "#f2bf63" : "#f3ead7";
            ctx.fillText(String(pickup.ownerName).slice(0, 12), 0, 32);
          }
        } else {
          ctx.globalAlpha = clamp(pickup.life, 0, 1);
          ctx.fillStyle = "#70e083";
          ctx.fillRect(pickup.x - 4, pickup.y - 12, 8, 24);
          ctx.fillRect(pickup.x - 12, pickup.y - 4, 24, 8);
        }
        ctx.restore();
      }
    }

    drawRoomObjects(ctx) {
      const objects = this.run.roomObjects || [];
      for (const object of objects) {
        if (!this.inView(object.x, object.y, (object.radius || 50) + 180)) continue;
        if (object.type === "nextDoor" || object.type === "bossGate" || object.type === "bossExit") this.drawDoorObject(ctx, object);
        if (object.type === "treasureChest") this.drawTreasureChest(ctx, object);
        if (object.type === "merchantStall") this.drawMerchantStall(ctx, object);
        if (object.type === "curseBook") this.drawCurseBook(ctx, object);
      }
    }

    drawObjectAmbient(ctx, object, radius) {
      const effect = object.effect || "spark";
      const color = object.color || this.run.biome.accent;
      const count = this.perf.quality < 0.65 ? 7 : 12;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < count; i++) {
        const t = this.menuTime * (effect === "snow" ? 0.7 : 1.35) + i * 0.73;
        const angle = (i / count) * TAU + t * 0.32;
        const wave = Math.sin(t * 1.7 + i) * 10;
        const x = object.x + Math.cos(angle) * (radius + wave);
        const y = object.y + Math.sin(angle) * (radius * 0.72 + wave * 0.5) + (effect === "snow" ? (t * 18 + i * 9) % 42 - 21 : 0);
        ctx.globalAlpha = object.opened ? 0.18 : 0.35;
        if (effect === "leaf") {
          ctx.fillStyle = "#8ee27a";
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.beginPath();
          ctx.ellipse(0, 0, 4, 9, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        } else if (effect === "snow") {
          ctx.fillStyle = "#d9fbff";
          ctx.fillRect(x - 2, y - 2, 4, 4);
        } else if (effect === "sand") {
          ctx.fillStyle = "#f4d26f";
          ctx.fillRect(x - 10, y - 1, 20, 2);
        } else if (effect === "gold" || effect === "merchant") {
          ctx.fillStyle = effect === "merchant" ? "#35d6c9" : "#f2bf63";
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(Math.PI / 4);
          ctx.fillRect(-4, -4, 8, 8);
          ctx.restore();
        } else if (effect === "curse" || effect === "boss") {
          ctx.strokeStyle = effect === "boss" ? color : "#a169ff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, 6 + (i % 3), 0, TAU);
          ctx.stroke();
        } else {
          ctx.fillStyle = color;
          ctx.fillRect(x - 3, y - 3, 6, 6);
        }
      }
      ctx.restore();
    }

    drawDoorObject(ctx, object) {
      const grow = clamp(object.grow || 0, 0, 1);
      const color = object.color || this.run.biome.accent;
      const w = object.type === "bossGate" ? 118 : object.type === "bossExit" ? 92 : 84;
      const h = object.type === "bossGate" ? 146 : object.type === "bossExit" ? 112 : 120;
      const y = object.y + (1 - grow) * 54;
      this.drawObjectAmbient(ctx, { ...object, y }, Math.max(w, h) * 0.62);
      ctx.save();
      ctx.translate(object.x, y);
      ctx.scale(grow, grow);
      ctx.shadowColor = color;
      ctx.shadowBlur = this.glow(object.type === "bossGate" ? 28 : 18);
      ctx.fillStyle = "rgba(0,0,0,0.44)";
      ctx.beginPath();
      ctx.ellipse(0, h * 0.48, w * 0.62, 12, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#101521";
      ctx.strokeStyle = color;
      ctx.lineWidth = object.type === "bossGate" ? 8 : 5;
      ctx.beginPath();
      ctx.moveTo(-w / 2, h / 2);
      ctx.lineTo(-w / 2, -h * 0.06);
      ctx.quadraticCurveTo(0, -h * 0.72, w / 2, -h * 0.06);
      ctx.lineTo(w / 2, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = object.opened ? 0.22 : 0.52;
      ctx.fillStyle = color;
      ctx.fillRect(-w * 0.32, -h * 0.06, w * 0.64, h * 0.5);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.24, h * 0.38);
      ctx.lineTo(-w * 0.24, -h * 0.02);
      ctx.quadraticCurveTo(0, -h * 0.38, w * 0.24, -h * 0.02);
      ctx.lineTo(w * 0.24, h * 0.38);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "900 16px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(object.icon || (object.type === "bossGate" ? "B" : ">"), 0, -4);
      if (object.enterProgress > 0) {
        ctx.strokeStyle = "#fff0ad";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, h * 0.1, Math.max(w, h) * 0.38, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(object.enterProgress, 0, 1));
        ctx.stroke();
      }
      if (object.label) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#f3ead7";
        ctx.font = "850 11px ui-sans-serif, system-ui";
        ctx.fillText(String(object.label).slice(0, 18), 0, h * 0.68);
      }
      ctx.restore();
    }

    drawTreasureChest(ctx, object) {
      const grow = clamp(object.grow || 0, 0, 1);
      const y = object.y + (1 - grow) * 34;
      this.drawObjectAmbient(ctx, { ...object, y }, 74);
      ctx.save();
      ctx.translate(object.x, y);
      ctx.scale(grow, grow);
      ctx.shadowColor = "#f2bf63";
      ctx.shadowBlur = this.glow(18);
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      ctx.beginPath();
      ctx.ellipse(0, 32, 58, 12, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#5b3418";
      ctx.fillRect(-45, -8, 90, 42);
      const opening = object.opened ? 1 : object.opening ? clamp(1 - (object.openTimer || 0) / 0.55, 0, 1) : 0;
      ctx.save();
      ctx.translate(0, -8);
      ctx.rotate(-opening * 0.75);
      ctx.translate(0, 8);
      ctx.fillStyle = "#8b5524";
      ctx.fillRect(-43, -24, 86, 24);
      ctx.restore();
      ctx.fillStyle = "#f2bf63";
      ctx.fillRect(-49, -6, 98, 8);
      ctx.fillRect(-6, -23, 12, 57);
      ctx.fillRect(-10, 6, 20, 15);
      ctx.strokeStyle = "#fff0b8";
      ctx.lineWidth = 3;
      ctx.strokeRect(-45, -8, 90, 42);
      if (object.opened || object.opening) {
        ctx.globalAlpha = 0.72;
        ctx.fillStyle = "#fff0b8";
        ctx.fillRect(-30, -36 - opening * 12, 60, 12);
      }
      ctx.restore();
    }

    drawMerchantStall(ctx, object) {
      const grow = clamp(object.grow || 0, 0, 1);
      const y = object.y + (1 - grow) * 34;
      this.drawObjectAmbient(ctx, { ...object, y }, 82);
      ctx.save();
      ctx.translate(object.x, y);
      ctx.scale(grow, grow);
      ctx.shadowColor = "#35d6c9";
      ctx.shadowBlur = this.glow(14);
      ctx.fillStyle = "rgba(0,0,0,0.34)";
      ctx.beginPath();
      ctx.ellipse(0, 46, 74, 13, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#1d2230";
      ctx.fillRect(-64, -12, 128, 58);
      ctx.fillStyle = "#2f3546";
      ctx.fillRect(-58, 8, 116, 30);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? "#f2bf63" : "#35d6c9";
        ctx.fillRect(-66 + i * 33, -40, 34, 28);
      }
      ctx.fillStyle = "#c9d0db";
      ctx.fillRect(-52, 18, 24, 14);
      ctx.fillStyle = "#f2bf63";
      ctx.fillRect(-3, 12, 18, 18);
      ctx.fillStyle = "#76ffd8";
      ctx.save();
      ctx.translate(43, 22);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
      ctx.strokeStyle = "#9ffcf1";
      ctx.lineWidth = 3;
      ctx.strokeRect(-64, -12, 128, 58);
      ctx.restore();
    }

    drawCurseBook(ctx, object) {
      const grow = clamp(object.grow || 0, 0, 1);
      const y = object.y + Math.sin(this.menuTime * 2.3) * 4 + (1 - grow) * 38;
      this.drawObjectAmbient(ctx, { ...object, y }, 76);
      ctx.save();
      ctx.translate(object.x, y);
      ctx.scale(grow, grow);
      ctx.shadowColor = "#a169ff";
      ctx.shadowBlur = this.glow(20);
      ctx.rotate(Math.sin(this.menuTime * 1.6) * 0.04);
      ctx.fillStyle = "rgba(0,0,0,0.34)";
      ctx.beginPath();
      ctx.ellipse(0, 35, 50, 10, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#211430";
      ctx.fillRect(-38, -28, 76, 58);
      ctx.fillStyle = "#a169ff";
      ctx.fillRect(-4, -28, 8, 58);
      ctx.strokeStyle = "#e5d6ff";
      ctx.lineWidth = 3;
      ctx.strokeRect(-38, -28, 76, 58);
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "#e5d6ff";
      ctx.fillRect(-3, -18, 6, 36);
      ctx.fillRect(-18, -3, 36, 6);
      ctx.restore();
    }

    drawTrails(ctx) {
      for (const trail of this.run.trails) {
        if (!this.inView(trail.x, trail.y, trail.radius + 80)) continue;
        const alpha = trail.life / trail.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = trail.color;
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, trail.radius * (1 + (1 - alpha) * 0.5), 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }

    drawProjectile(ctx, projectile) {
      if (!this.inView(projectile.x, projectile.y, projectile.radius + 120)) return;
      ctx.save();
      const angle = Math.atan2(projectile.vy || 0, projectile.vx || 1);
      const tail = clamp(Math.hypot(projectile.vx || 0, projectile.vy || 0) / 45, 8, 28);
      const hideTail = projectile.kind === "mageBasic" || projectile.kind === "rangerBasic";
      ctx.shadowColor = projectile.color;
      ctx.shadowBlur = this.glow(14);
      if (!hideTail) {
        ctx.strokeStyle = projectile.color;
        ctx.lineWidth = Math.max(2, projectile.radius * 0.45);
        ctx.globalAlpha = 0.48;
        ctx.beginPath();
        ctx.moveTo(projectile.x - Math.cos(angle) * tail, projectile.y - Math.sin(angle) * tail);
        ctx.lineTo(projectile.x, projectile.y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.translate(projectile.x, projectile.y);
      ctx.rotate(angle);
      ctx.fillStyle = projectile.color;
      if (projectile.kind === "phantomSlash") {
        const r = projectile.radius * 2.7;
        ctx.globalAlpha = 0.82;
        ctx.strokeStyle = projectile.color;
        ctx.lineWidth = Math.max(6, projectile.radius * 0.5);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(-projectile.radius * 0.4, 0, r, -0.58, 0.58);
        ctx.stroke();
        ctx.globalAlpha = 0.48;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(-projectile.radius * 0.15, 0, r * 0.7, -0.52, 0.52);
        ctx.stroke();
        ctx.globalAlpha = 0.28;
        ctx.strokeStyle = projectile.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(-projectile.radius * 1.1, 0, r * 1.12, -0.45, 0.45);
        ctx.stroke();
      } else if (projectile.kind === "rangerBasic") {
        ctx.shadowBlur = this.glow(10);
        ctx.fillStyle = "#f3ead7";
        ctx.fillRect(-projectile.radius * 1.4, -projectile.radius * 0.22, projectile.radius * 3.4, projectile.radius * 0.44);
        ctx.fillStyle = projectile.color;
        ctx.beginPath();
        ctx.moveTo(projectile.radius * 2.2, 0);
        ctx.lineTo(projectile.radius * 0.8, -projectile.radius * 0.78);
        ctx.lineTo(projectile.radius * 1.02, -projectile.radius * 0.18);
        ctx.lineTo(-projectile.radius * 1.4, -projectile.radius * 0.18);
        ctx.lineTo(-projectile.radius * 1.4, projectile.radius * 0.18);
        ctx.lineTo(projectile.radius * 1.02, projectile.radius * 0.18);
        ctx.lineTo(projectile.radius * 0.8, projectile.radius * 0.78);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-projectile.radius * 0.6, -1, projectile.radius * 2.0, 2);
      } else if (projectile.kind === "crystal" || projectile.kind === "enemySniper") {
        ctx.fillRect(-projectile.radius, -projectile.radius * 0.35, projectile.radius * 2.4, projectile.radius * 0.7);
        ctx.beginPath();
        ctx.moveTo(projectile.radius * 1.4, 0);
        ctx.lineTo(projectile.radius * 0.45, -projectile.radius * 0.7);
        ctx.lineTo(projectile.radius * 0.45, projectile.radius * 0.7);
        ctx.closePath();
        ctx.fill();
      } else if (projectile.kind === "lightning") {
        ctx.beginPath();
        ctx.moveTo(-projectile.radius, -projectile.radius * 0.5);
        ctx.lineTo(projectile.radius * 0.1, -projectile.radius * 0.2);
        ctx.lineTo(-projectile.radius * 0.1, projectile.radius * 0.5);
        ctx.lineTo(projectile.radius * 1.2, -projectile.radius * 0.1);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, projectile.radius, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = "#ffffff";
      ctx.globalAlpha = 0.5;
      ctx.fillRect(-2, -2, 4, 4);
      ctx.restore();
    }

    drawDrone(ctx, drone) {
      if (!drone.x) return;
      if (!this.inView(drone.x, drone.y, 80)) return;
      ctx.save();
      ctx.fillStyle = drone.color || "#35d6c9";
      ctx.shadowColor = drone.color || "#35d6c9";
      ctx.shadowBlur = this.glow(12);
      ctx.fillRect(drone.x - 7, drone.y - 7, 14, 14);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(drone.x - 2, drone.y - 2, 4, 4);
      ctx.restore();
    }

    drawNameTag(ctx, x, y, name, self = false, hp = null, maxHp = null) {
      const label = String(name).slice(0, 18);
      const showHp = Number.isFinite(Number(hp)) && Number.isFinite(Number(maxHp)) && Number(maxHp) > 0;
      ctx.save();
      ctx.font = "800 12px ui-sans-serif, system-ui";
      const w = Math.max(48, ctx.measureText(label).width + 16);
      const h = showHp ? 26 : 18;
      ctx.fillStyle = self ? "rgba(242,191,99,0.82)" : "rgba(8,10,16,0.78)";
      ctx.fillRect(x - w / 2, y - 16, w, h);
      ctx.strokeStyle = self ? "#f2bf63" : "rgba(255,255,255,0.22)";
      ctx.strokeRect(x - w / 2, y - 16, w, h);
      ctx.fillStyle = self ? "#111521" : "#f3ead7";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y - 3);
      if (showHp) {
        const barW = w - 10;
        const barX = x - barW / 2;
        const barY = y + 3;
        ctx.fillStyle = "rgba(0,0,0,0.48)";
        ctx.fillRect(barX, barY, barW, 5);
        ctx.fillStyle = self ? "#ff8d3d" : "#ff4b55";
        ctx.fillRect(barX, barY, barW * clamp(Number(hp) / Number(maxHp), 0, 1), 5);
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.strokeRect(barX, barY, barW, 5);
      }
      ctx.restore();
    }

    drawSoulGhost(ctx, targetX, targetY, name, self = false, color = "#d9fbff") {
      const t = this.menuTime * (self ? 2.6 : 2.2) + String(name || "").length * 0.17;
      const x = targetX + Math.cos(t) * 46;
      const y = targetY - 34 + Math.sin(t * 1.25) * 20;
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.globalAlpha = self ? 0.9 : 0.72;
      ctx.shadowColor = color;
      ctx.shadowBlur = this.glow(18);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 14, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-8, 8);
      ctx.quadraticCurveTo(-2, 20, 4, 8);
      ctx.quadraticCurveTo(9, 2, 8, -2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#101521";
      ctx.fillRect(-4, -3, 3, 3);
      ctx.fillRect(3, -3, 3, 3);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.arc(0, 2, 15 + Math.sin(t * 2) * 2, 0, TAU);
      ctx.stroke();
      ctx.restore();
      this.drawNameTag(ctx, x, y - 24, name || "Linh hồn", self);
    }

    drawHero(ctx, x, y, scale, actor, power, custom) {
      const t = this.menuTime;
      const facing = actor.facing || 0;
      const character = characterById(actor.characterId || this.save.account?.selectedCharacter || "swordsman");
      const anim = actor.animation || "idle";
      const phase = actor.animTime ?? t;
      const actionTotal = actor.actionTotal || (anim === "ultimate" ? 0.72 : anim === "skill" ? 0.38 : 0.28);
      const actionProgress = actor.actionTime > 0 ? 1 - clamp(actor.actionTime / actionTotal, 0, 1) : 0;
      const hitFrame = anim === "attack" && actionProgress >= 0.22 && actionProgress < 0.5 ? 1 : 0;
      const holdFrame = anim === "attack" && actionProgress >= 0.5 && actionProgress < 0.68 ? 1 : 0;
      const recoilFrame = anim === "attack" && actionProgress >= 0.68 ? 1 : 0;
      const castFrame = anim === "skill" && actionProgress >= 0.18 && actionProgress < 0.72 ? 1 : 0;
      const ultFrame = anim === "ultimate" ? (actionProgress < 0.24 ? 0.35 : actionProgress < 0.72 ? 1 : 0.45) : 0;
      const damageFrame = anim === "damage" && actionProgress < 0.62 ? 1 : 0;
      const deathProgress = anim === "death" ? (actor.actionTime > 0 ? 1 - clamp(actor.actionTime / Math.max(0.1, actionTotal), 0, 1) : 1) : 0;
      const stepStride = Math.round(Math.sin(phase * (anim === "run" ? 12 : anim === "walk" ? 8 : 3)) * 2) / 2;
      const stride = ["walk", "run", "idle"].includes(anim) ? stepStride : 0;
      const bob = stride * (anim === "idle" ? 1 : anim === "walk" ? 2 : anim === "run" ? 3 : 0) - (hitFrame ? 3 : holdFrame ? 2 : 0) + (recoilFrame ? 1 : 0);
      const dir = Math.cos(facing) >= 0 ? 1 : -1;
      const bodyShift = dir * (hitFrame ? 5 : holdFrame ? 3 : recoilFrame ? -2 : castFrame ? 2 : ultFrame ? 1 : damageFrame ? -4 : 0);
      const lean = dir * (anim === "dash" ? 0.09 : damageFrame ? -0.14 : hitFrame ? 0.16 : holdFrame ? 0.08 : recoilFrame ? -0.08 : castFrame ? 0.05 : 0);
      const squashX = anim === "dash" ? 1.08 : hitFrame ? 1.08 : holdFrame ? 1.04 : 1;
      const squashY = anim === "dash" ? 0.92 : hitFrame ? 0.94 : holdFrame ? 0.96 : 1;
      const color = custom.color || "#d8b46a";
      const auraColor = { gold: "#f2bf63", crimson: "#ff4b55", teal: "#35d6c9", violet: "#a169ff" }[custom.aura] || power.color;
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y + bob));
      ctx.scale(scale, scale);
      if (deathProgress > 0) {
        ctx.translate(-dir * deathProgress * 4, deathProgress * 12);
        ctx.rotate(dir * deathProgress * 1.25);
        ctx.scale(1 + deathProgress * 0.06, 1 - deathProgress * 0.18);
      }
      ctx.translate(bodyShift, 0);
      ctx.scale(squashX, squashY);
      ctx.rotate(lean);
      ctx.globalAlpha = actor.invuln > 0 && Math.floor(t * 18) % 2 === 0 ? 0.55 : 1;
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(0, 20, 19 + Math.abs(stride) * 2, 5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = auraColor;
      ctx.globalAlpha *= anim === "ultimate" ? 0.28 : anim === "skill" ? 0.22 : 0.14;
      ctx.beginPath();
      ctx.arc(0, 2, 22 + Math.sin(t * 4) * 2 + (castFrame + ultFrame) * 6, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      if (anim === "skill" || anim === "ultimate") {
        ctx.strokeStyle = power.accent;
        ctx.lineWidth = anim === "ultimate" ? 3 : 2;
        ctx.globalAlpha = anim === "ultimate" ? 0.7 : 0.5;
        ctx.beginPath();
        ctx.arc(0, 1, 27 + Math.sin(t * 12) * 3, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (custom.trail === "runes" || this.save.powers?.[power.id]?.awakened) {
        ctx.strokeStyle = auraColor;
        ctx.globalAlpha = 0.55;
        for (let i = 0; i < 3; i++) {
          const a = t * 1.8 + i * TAU / 3;
          ctx.strokeRect(Math.cos(a) * 20 - 2, Math.sin(a) * 12 - 2, 4, 4);
        }
        ctx.globalAlpha = 1;
      }
      if (custom.accessory === "cape") {
        ctx.fillStyle = "#7a2233";
        ctx.fillRect(-10 - stride, -2 + holdFrame * 2, 20, 23 + Math.abs(stride) * 2);
        ctx.fillStyle = "#4b1622";
        ctx.fillRect(-8 - stride, 8 + holdFrame * 2, 16, 15 + Math.abs(stride));
      }
      if (custom.accessory === "scarf") {
        ctx.fillStyle = "#e8d17d";
        ctx.fillRect(-10, -10, 22, 5);
        ctx.fillRect(8, -8 + stride, 13 + hitFrame * 7, 4);
      }
      const legSwing = anim === "run" || anim === "walk" ? stride : Math.sin(t * 3) * 0.25;
      const crouch = anim === "dash" ? 3 : hitFrame ? 3 : holdFrame ? 2 : castFrame ? 1 : 0;
      ctx.fillStyle = "#1d2230";
      ctx.fillRect(-9 + legSwing * 1.8, 8 + crouch + Math.max(0, -legSwing) * 2, 6, 11 - (anim === "dash" ? 2 : 0));
      ctx.fillRect(3 - legSwing * 1.8, 8 + crouch + Math.max(0, legSwing) * 2, 6, 11 - (anim === "dash" ? 2 : 0));
      ctx.fillStyle = "#202637";
      ctx.fillRect(-15 - recoilFrame * 2, -3 - legSwing * 1.2 + hitFrame * 4, 6, 15);
      ctx.fillRect(9 + hitFrame * 2, -3 + legSwing * 1.2 - hitFrame * 3, 6, 15);
      ctx.fillStyle = color;
      roundPixel(ctx, -10, -18 - holdFrame, 20, 27, 5);
      ctx.fillStyle = "#2f3546";
      ctx.fillRect(-11, -4 - holdFrame, 22, 12);
      ctx.fillStyle = power.color;
      ctx.fillRect(-8, -1 - holdFrame, 16, 3);
      ctx.fillStyle = "#c9d0db";
      ctx.fillRect(-7, -16 - holdFrame, 14, 5);
      ctx.fillStyle = custom.eyes === "frost" ? "#d9fbff" : custom.eyes === "void" ? "#101521" : custom.eyes === "focus" ? "#35d6c9" : "#ffdf73";
      if (Math.cos(facing) >= -0.3) ctx.fillRect(3, -10 - holdFrame, 3, 2);
      if (Math.cos(facing) <= 0.3) ctx.fillRect(-6, -10 - holdFrame, 3, 2);
      ctx.fillStyle = custom.mouth === "mask" ? "#111521" : "#4b1622";
      if (custom.mouth === "smirk") ctx.fillRect(-2, -5 - holdFrame, 6, 1);
      else if (custom.mouth === "grim") ctx.fillRect(-4, -5 - holdFrame, 8, 1);
      else ctx.fillRect(-2, -5 - holdFrame, 4, 2);
      if (custom.accessory === "horns") {
        ctx.fillStyle = "#f2f0e6";
        ctx.fillRect(-13, -22 - holdFrame, 5, 8);
        ctx.fillRect(8, -22 - holdFrame, 5, 8);
      }
      if (custom.accessory === "halo") {
        ctx.strokeStyle = "#f2bf63";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, -24 - holdFrame, 12, 4, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.save();
      ctx.shadowColor = power.color;
      ctx.shadowBlur = (anim === "skill" || anim === "ultimate") ? this.glow(14) : 0;
      if (character.id === "guardian") {
        const thrust = hitFrame ? 30 : holdFrame ? 18 : recoilFrame ? 5 : 0;
        ctx.rotate(facing);
        ctx.translate(thrust, 0);
        ctx.fillStyle = "#dfe8ef";
        ctx.fillRect(11, -16, 22, 32);
        ctx.fillStyle = character.color;
        ctx.fillRect(15, -12, 14, 24);
        ctx.fillStyle = power.accent;
        ctx.fillRect(20, -8, 4, 16);
        if (hitFrame || holdFrame) {
          ctx.globalAlpha = 0.65;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(33, -10, 5, 20);
          ctx.globalAlpha = 1;
        }
      } else if (character.id === "mage") {
        const side = dir;
        const staffX = side * 14;
        ctx.translate(staffX, castFrame ? -2 : 0);
        ctx.fillStyle = "#dfe8ef";
        ctx.fillRect(-2, -16, 4, 42);
        ctx.fillStyle = character.color;
        ctx.beginPath();
        ctx.arc(0, -19, 5 + castFrame * 2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = power.accent;
        ctx.fillRect(-4, 22, 8, 4);
        if (anim === "attack" || castFrame) {
          ctx.globalAlpha = 0.75;
          ctx.strokeStyle = power.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, -19, 10 + castFrame * 5, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      } else if (character.id === "ranger") {
        const pull = anim === "attack"
          ? (actionProgress < 0.58 ? clamp(actionProgress / 0.58, 0, 1) : clamp((0.86 - actionProgress) / 0.28, 0, 1))
          : 0;
        const nockX = 10 - pull * 20;
        ctx.rotate(facing);
        ctx.fillStyle = "#2f3546";
        ctx.fillRect(-8, -3, 46, 6);
        ctx.fillRect(0, -6, 12, 12);
        ctx.strokeStyle = character.color;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(20, -18);
        ctx.lineTo(36, -8);
        ctx.lineTo(36, 8);
        ctx.lineTo(20, 18);
        ctx.stroke();
        ctx.strokeStyle = "#dfe8ef";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(22, -17);
        ctx.lineTo(nockX, 0);
        ctx.lineTo(22, 17);
        ctx.stroke();
        ctx.fillStyle = power.accent;
        ctx.fillRect(nockX, -2, 46 + pull * 12, 4);
        ctx.beginPath();
        ctx.moveTo(nockX + 50 + pull * 12, 0);
        ctx.lineTo(nockX + 39 + pull * 12, -6);
        ctx.lineTo(nockX + 39 + pull * 12, 6);
        ctx.closePath();
        ctx.fill();
      } else if (character.id === "assassin") {
        const fan = hitFrame ? 0.98 : holdFrame ? 0.74 : recoilFrame ? 0.28 : 0.38;
        const extend = hitFrame ? 8 : holdFrame ? 5 : 0;
        ctx.rotate(facing);
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.translate(9 + extend, side * (5 + hitFrame * 7));
          ctx.rotate(side * fan);
          ctx.fillStyle = "#1d2230";
          ctx.fillRect(-5, -2, 8, 4);
          ctx.fillStyle = character.color;
          ctx.fillRect(0, -4, 4, 8);
          ctx.fillStyle = "#dfe8ef";
          ctx.beginPath();
          ctx.moveTo(4, -3);
          ctx.lineTo(16 + extend, -2);
          ctx.lineTo(21 + extend, 0);
          ctx.lineTo(16 + extend, 2);
          ctx.lineTo(4, 3);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = 0.65;
          ctx.fillRect(7, -1, 8 + extend, 1);
          ctx.globalAlpha = 1;
          ctx.restore();
        }
      } else {
        const weaponWindup = anim === "attack"
          ? (actionProgress < 0.22 ? -0.72 : hitFrame ? 0.72 : holdFrame ? 0.34 : recoilFrame ? -0.18 : 0)
          : anim === "skill" ? (castFrame ? 0.24 : -0.18)
            : 0;
        const weaponReach = anim === "dash" ? 7 : hitFrame * 14 + holdFrame * 7 + castFrame * 5;
        ctx.rotate(facing + weaponWindup);
        ctx.translate(weaponReach, 0);
        ctx.fillStyle = "#dfe8ef";
        ctx.fillRect(10, -2, 22 + hitFrame * 10 + holdFrame * 4, 4);
        ctx.fillStyle = power.accent;
        ctx.fillRect(7, -4, 5, 8);
      }
      ctx.restore();
      ctx.restore();
    }

    enemyVariant(enemy) {
      const text = `${enemy.id || ""}${enemy.kind || ""}${enemy.role || ""}`;
      let hash = 0;
      for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
      return hash % 4;
    }

    drawEnemy(ctx, enemy) {
      ctx.save();
      const lift = enemy.launch > 0 ? Math.sin((enemy.launch / (enemy.boss ? 0.12 : 0.45)) * Math.PI) * (enemy.boss ? 7 : 18) : 0;
      ctx.translate(Math.round(enemy.x), Math.round(enemy.y - lift));
      const scale = enemy.boss ? 2.6 : enemy.elite ? 1.35 : 1;
      ctx.scale(scale, scale);
      ctx.scale(enemy.facingDir === -1 ? -1 : 1, 1);
      const color = enemy.flash > 0 ? "#ffffff" : enemy.elite ? "#ffbd5e" : this.enemyColor(enemy.kind);
      const dark = enemy.boss ? "#181019" : "#151923";
      const accent = this.run.biome.accent;
      const variant = this.enemyVariant(enemy);
      if (enemy.boss) {
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.arc(0, 2, 36 + Math.sin(this.menuTime * 5) * 4, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.82;
        ctx.fillStyle = "#0b0d13";
        for (const side of [-1, 1]) {
          ctx.save();
          ctx.scale(side, 1);
          ctx.fillRect(18, -28, 8, 26);
          ctx.fillRect(26, -34, 7, 20);
          ctx.fillRect(28, 1, 18, 8);
          ctx.fillRect(39, -4, 8, 17);
          ctx.restore();
        }
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.42;
        for (let i = -2; i <= 2; i++) {
          ctx.fillRect(i * 12 - 4, -42 - Math.abs(i) * 3, 8, 14);
        }
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = dark;
      ctx.fillRect(-16 - (enemy.role === "brute" ? 3 : 0), -20, 32 + (enemy.role === "brute" ? 6 : 0), 34);
      ctx.fillStyle = color;
      ctx.fillRect(-13, -24, 26, 12);
      ctx.fillRect(-18, -8, 36, 17);
      ctx.fillStyle = "#0b0d13";
      ctx.fillRect(-10, -17, 6, 4);
      ctx.fillRect(4, -17, 6, 4);
      if (variant === 1) {
        ctx.fillStyle = dark;
        ctx.fillRect(-18, -29, 8, 8);
        ctx.fillRect(10, -29, 8, 8);
      } else if (variant === 2) {
        ctx.fillStyle = accent;
        ctx.fillRect(-4, -33, 8, 7);
      } else if (variant === 3) {
        ctx.fillStyle = "#dfe8ef";
        ctx.fillRect(-17, -25, 4, 8);
        ctx.fillRect(13, -25, 4, 8);
      }
      ctx.fillStyle = accent;
      ctx.fillRect(-3, -8, 6, 20);
      ctx.fillStyle = dark;
      ctx.fillRect(-13, 10, 8, 8);
      ctx.fillRect(5, 10, 8, 8);
      if (enemy.ranged) {
        ctx.fillStyle = "#dfe8ef";
        if (enemy.role === "caster") {
          ctx.fillRect(16, -16, 4, 34);
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(18, -20, 6, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 0.45;
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(-1, -5, 17 + variant * 2, 0, TAU);
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (enemy.role === "bomber") {
          ctx.fillStyle = "#2f3546";
          ctx.fillRect(13, -10, 16, 20);
          ctx.fillStyle = "#ff8d3d";
          ctx.fillRect(17, -14, 8, 8);
          ctx.fillStyle = "#dfe8ef";
          ctx.fillRect(20, -20, 3, 8);
          ctx.fillStyle = "#ff4b55";
          ctx.fillRect(24, 4, 5, 5);
        } else {
          ctx.fillRect(15, -12, 4, 30);
          ctx.fillRect(10, -3, enemy.role === "marksman" ? 30 : 16, 4);
          ctx.fillStyle = accent;
          ctx.fillRect(28, -6, 4, 10);
        }
      } else {
        ctx.fillStyle = "#c9d0db";
        if (enemy.role === "guard") {
          ctx.fillStyle = "#677084";
          ctx.fillRect(13, -16, 18, 31);
          ctx.strokeStyle = "#dfe8ef";
          ctx.lineWidth = 2;
          ctx.strokeRect(13, -16, 18, 31);
          ctx.fillStyle = accent;
          ctx.fillRect(18, -8, 5, 16);
        } else if (enemy.role === "brute") {
          ctx.fillRect(11, -15, 28, 10);
          ctx.fillRect(31, -20, 10, 21);
          ctx.fillStyle = "#677084";
          ctx.fillRect(-24, -8, 8, 22);
        } else if (enemy.role === "duelist") {
          ctx.fillRect(13, -7, 27, 3);
          ctx.fillRect(36, -10, 4, 9);
          ctx.fillStyle = accent;
          ctx.fillRect(12, 7, 24, 3);
        } else if (enemy.role === "skirmisher") {
          ctx.fillRect(12, -9, 18, 3);
          ctx.fillRect(12, 6, 18, 3);
          ctx.fillStyle = accent;
          ctx.fillRect(28, -10, 4, 5);
          ctx.fillRect(28, 5, 4, 5);
        } else {
          ctx.fillRect(13, -10, 18, 5);
          ctx.fillRect(24, -13, 5, 11);
        }
      }
      if (enemy.bulky) {
        ctx.fillStyle = "#677084";
        ctx.fillRect(-20, -6, 7, 18);
        ctx.fillRect(13, -6, 7, 18);
      }
      if (enemy.boss) {
        ctx.fillStyle = accent;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(0, -1, 9 + Math.sin(this.menuTime * 6) * 1.5, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -1, 15, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#dfe8ef";
        ctx.fillRect(-25, -2, 10, 6);
        ctx.fillRect(15, -2, 10, 6);
      }
      if (enemy.windupTime > 0) {
        const pulse = clamp(enemy.windupTime / (enemy.windupTotal || 1), 0, 1);
        ctx.strokeStyle = "#ff4b55";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.35 + (1 - pulse) * 0.45;
        ctx.beginPath();
        ctx.arc(0, 0, enemy.radius * (1.05 + (1 - pulse) * 0.45), 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      if (enemy.burn > 0) {
        ctx.fillStyle = "#ff6b3a";
        ctx.fillRect(-12, -28, 4, 7);
        ctx.fillRect(6, -30, 5, 8);
      }
      if (enemy.chill > 0) {
        ctx.strokeStyle = "#83e8ff";
        ctx.lineWidth = 2;
        ctx.strokeRect(-18, -25, 36, 42);
      }
      if (enemy.mark > 0) {
        ctx.strokeStyle = "#8f72ff";
        ctx.strokeRect(-22, -29, 44, 50);
      }
      if (enemy.attackAnim > 0) {
        const attackAlpha = clamp(enemy.attackAnim / (enemy.boss ? 0.42 : 0.32), 0, 1);
        ctx.save();
        ctx.rotate(enemy.attackDir || 0);
        ctx.globalAlpha = attackAlpha;
        ctx.strokeStyle = enemy.ranged ? this.run.biome.accent : "#f3ead7";
        ctx.fillStyle = enemy.ranged ? this.run.biome.accent : "#c9d0db";
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = this.glow(10);
        if (enemy.ranged) {
          ctx.fillRect(enemy.radius * 0.45, -5, 18 + enemy.phase * 4, 10);
          ctx.fillRect(enemy.radius * 0.95, -2, 12, 4);
        } else {
          ctx.lineWidth = enemy.boss ? 5 : 3;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.radius * 0.9 + 18, -0.42, 0.42);
          ctx.stroke();
          ctx.fillRect(enemy.radius * 0.35, -3, enemy.radius * 0.62, 6);
        }
        ctx.restore();
      }
      ctx.restore();
      this.drawEnemyHp(ctx, enemy);
    }

    enemyColor(kind) {
      if (/frost|grave|ice/i.test(kind)) return "#83e8ff";
      if (/ember|slag|chain/i.test(kind)) return "#ff6b3a";
      if (/rift|pulse|chrome/i.test(kind)) return "#fd57ff";
      if (/sun|idol|obsidian/i.test(kind)) return "#f4d26f";
      return "#75e66e";
    }

    drawEnemyHp(ctx, enemy) {
      if (enemy.boss) return;
      const w = enemy.radius * 1.8;
      const x = enemy.x - w / 2;
      const y = enemy.y - enemy.radius - 16;
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(x, y, w, 4);
      ctx.fillStyle = enemy.elite ? "#ffbd5e" : "#ff4b55";
      ctx.fillRect(x, y, w * clamp(enemy.hp / enemy.maxHp, 0, 1), 4);
    }

    drawSlashes(ctx) {
      for (const slash of this.run.slashes) {
        if (!this.inView(slash.x, slash.y, slash.range || 180) && !this.inView(slash.tx || slash.x, slash.ty || slash.y, 80)) continue;
        const alpha = slash.life / slash.maxLife;
        const impact = alpha > 0.55 ? 1 : 0;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = slash.color;
        ctx.lineWidth = slash.line ? (impact ? 8 : 5) : (impact ? 18 : 10);
        ctx.shadowColor = slash.color;
        ctx.shadowBlur = this.glow(impact ? 22 : 10);
        if (slash.line) {
          ctx.beginPath();
          ctx.moveTo(slash.x, slash.y);
          ctx.lineTo(slash.tx, slash.ty);
          ctx.stroke();
          if (impact) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;
            ctx.globalAlpha = alpha * 0.75;
            ctx.stroke();
          }
        } else {
          ctx.beginPath();
          ctx.arc(slash.x, slash.y, slash.range * (impact ? 1.02 : 1.08), slash.angle - slash.arc / 2, slash.angle + slash.arc / 2);
          ctx.stroke();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = impact ? 5 : 2;
          ctx.globalAlpha = alpha * (impact ? 0.72 : 0.4);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    drawShockwaves(ctx) {
      for (const wave of this.run.shockwaves) {
        if (!this.inView(wave.x, wave.y, wave.radius + 80)) continue;
        const progress = 1 - wave.life / wave.maxLife;
        ctx.save();
        ctx.globalAlpha = wave.life / wave.maxLife;
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 5;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = this.glow(16);
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius * progress, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
    }

    drawEffects(ctx, foreground = false) {
      for (const effect of this.run.effects) {
        const combatFlash = effect.type === "attackBurst" || effect.type === "hitSpark";
        if (foreground !== combatFlash) continue;
        if (Number.isFinite(effect.x) && Number.isFinite(effect.y) && !this.inView(effect.x, effect.y, (effect.radius || effect.reach || 180) + 80)) continue;
        ctx.save();
        ctx.globalAlpha = Math.min(0.42, effect.time);
        ctx.strokeStyle = effect.color;
        ctx.fillStyle = effect.color;
        ctx.shadowColor = effect.color;
        ctx.shadowBlur = this.glow(18);
        if (foreground) ctx.globalCompositeOperation = "lighter";
        if (["pull", "zone", "danger", "ultimate"].includes(effect.type)) {
          const pulse = Math.sin(this.menuTime * 8) * 8;
          ctx.beginPath();
          ctx.arc(effect.x, effect.y, Math.max(8, effect.radius + pulse), 0, TAU);
          ctx.stroke();
          ctx.globalAlpha *= 0.16;
          ctx.fill();
        }
        if (effect.type === "skillShape") this.drawSkillShape(ctx, effect);
        if (effect.type === "lineTell") {
          const progress = 1 - effect.time / effect.maxTime;
          ctx.translate(effect.x, effect.y);
          ctx.rotate(effect.angle || 0);
          ctx.globalAlpha = 0.12 + progress * 0.22;
          ctx.fillRect(0, -effect.width / 2, effect.length, effect.width);
          ctx.globalAlpha = 0.55 + progress * 0.35;
          ctx.strokeStyle = effect.color;
          ctx.lineWidth = 2 + progress * 2;
          ctx.strokeRect(0, -effect.width / 2, effect.length, effect.width);
          ctx.fillStyle = effect.color;
          ctx.fillRect(effect.length - 18, -effect.width * 0.2, 18, effect.width * 0.4);
        }
        if (effect.type === "attackBurst") {
          const progress = 1 - effect.time / effect.maxTime;
          const alpha = (1 - progress) * (effect.heavy ? 1 : 0.92);
          const length = effect.reach ? effect.reach : effect.heavy ? 74 : effect.ranged ? 52 : 64;
          const width = effect.kind === "guardian" ? Math.max(42, length * 0.38) : effect.kind === "assassin" ? 24 : effect.ranged ? 18 : 22;
          ctx.translate(effect.x, effect.y);
          ctx.rotate(effect.angle || 0);
          ctx.globalAlpha = alpha;
          ctx.shadowBlur = this.glow(effect.heavy ? 20 : 14);
          ctx.shadowColor = effect.color || "#fff3d0";
          ctx.fillStyle = effect.accent || "#ffffff";
          ctx.strokeStyle = effect.color || "#fff3d0";
          ctx.lineWidth = effect.heavy ? 5 : 4;
          if (effect.kind === "mage") {
            const r = width * (1.05 + progress * 0.7);
            ctx.globalAlpha = alpha * 0.7;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.stroke();
            ctx.globalAlpha = alpha;
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-r * 0.48, -r * 0.48, r * 0.96, r * 0.96);
            ctx.rotate(-Math.PI / 4);
            ctx.globalAlpha = alpha * 0.85;
            ctx.fillStyle = effect.color || "#78e7ff";
            ctx.beginPath();
            ctx.arc(length * 0.42, 0, Math.max(5, width * 0.28), 0, TAU);
            ctx.fill();
          } else if (effect.kind === "ranger") {
            const r = width * (0.82 + progress * 0.25);
            ctx.beginPath();
            ctx.moveTo(length * 1.06, 0);
            ctx.lineTo(length * 0.42, -r);
            ctx.lineTo(length * 0.56, -r * 0.2);
            ctx.lineTo(-length * 0.34, -r * 0.18);
            ctx.lineTo(-length * 0.34, r * 0.18);
            ctx.lineTo(length * 0.56, r * 0.2);
            ctx.lineTo(length * 0.42, r);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = alpha * 0.7;
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.82;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-length * 0.36, 0);
            ctx.lineTo(length * 0.88, 0);
            ctx.stroke();
          } else if (effect.kind === "guardian") {
            ctx.globalAlpha = alpha * 0.86;
            ctx.fillStyle = effect.accent || "#fff3c2";
            ctx.fillRect(-length * 0.12, -width * 0.48, length * 0.92, width * 0.96);
            ctx.strokeRect(-length * 0.12, -width * 0.48, length * 0.92, width * 0.96);
            ctx.globalAlpha = alpha * 0.75;
            ctx.fillStyle = effect.color || "#ffd36a";
            ctx.fillRect(length * 0.18, -width * 0.36, length * 0.5, width * 0.72);
            ctx.globalAlpha = alpha * 0.65;
            ctx.strokeStyle = effect.accent || "#fff3c2";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(length * 0.05, 0, width * 0.72, -0.82, 0.82);
            ctx.stroke();
            ctx.lineWidth = 3;
            for (let i = -1; i <= 1; i++) {
              ctx.beginPath();
              ctx.moveTo(length * 0.04, i * width * 0.24);
              ctx.lineTo(length * 0.78, i * width * 0.42);
              ctx.stroke();
            }
          } else if (effect.kind === "assassin") {
            ctx.lineCap = "round";
            ctx.shadowBlur = this.glow(22);
            ctx.strokeStyle = effect.accent || "#ffffff";
            ctx.lineWidth = width * 0.42;
            for (let i = -1; i <= 1; i += 2) {
              ctx.beginPath();
              ctx.moveTo(-length * 0.38, i * width * 0.95);
              ctx.lineTo(length * 0.82, -i * width * 0.95);
              ctx.stroke();
            }
            ctx.globalAlpha = alpha * 0.82;
            ctx.strokeStyle = effect.color || "#b8b7ff";
            ctx.lineWidth = width * 0.2;
            for (let i = -1; i <= 1; i += 2) {
              ctx.beginPath();
              ctx.moveTo(-length * 0.3, i * width * 0.62);
              ctx.lineTo(length * 0.68, -i * width * 0.62);
              ctx.stroke();
            }
            ctx.globalAlpha = alpha * 0.95;
            ctx.fillStyle = effect.accent || "#ffffff";
            ctx.fillRect(-5, -5, 10, 10);
          } else {
            const slashRadius = length * 0.78;
            const start = -1.05;
            const end = 1.05;
            ctx.lineCap = "round";
            ctx.lineWidth = width * 0.48;
            ctx.strokeStyle = effect.accent || "#ffffff";
            ctx.beginPath();
            ctx.arc(-length * 0.18, 0, slashRadius, start, end);
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.75;
            ctx.strokeStyle = effect.color || "#dfe6ef";
            ctx.lineWidth = width * 0.2;
            ctx.beginPath();
            ctx.arc(-length * 0.18, 0, slashRadius * 0.78, start + 0.12, end - 0.12);
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.5;
            ctx.lineWidth = 3;
            for (let i = -1; i <= 1; i += 2) {
              ctx.beginPath();
              ctx.moveTo(length * 0.18, i * width * 0.72);
              ctx.lineTo(length * 0.44, i * width * 0.38);
              ctx.stroke();
            }
            ctx.globalAlpha = alpha * 0.95;
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-length * 0.04, -width * 1.08);
            ctx.quadraticCurveTo(length * 0.38, -width * 0.26, length * 0.84, width * 0.72);
            ctx.stroke();
          }
        }
        if (effect.type === "hitSpark") {
          const progress = 1 - effect.time / effect.maxTime;
          const alpha = (1 - progress) * (effect.heavy ? 1 : 0.94);
          const length = (effect.heavy ? 82 : 62) * (0.9 + progress * 0.3);
          const spread = effect.heavy ? 20 : 14;
          ctx.translate(effect.x, effect.y);
          ctx.rotate(effect.angle || 0);
          ctx.shadowBlur = this.glow(effect.heavy ? 24 : 18);
          ctx.strokeStyle = effect.color || "#f3ead7";
          ctx.fillStyle = "#ffffff";
          ctx.globalAlpha = alpha;
          if (effect.kind === "mage") {
            const r = (effect.heavy ? 24 : 18) * (0.9 + progress * 0.55);
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.75;
            ctx.rotate(Math.PI / 4);
            ctx.strokeRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9);
          } else if (effect.kind === "ranger") {
            ctx.lineWidth = effect.heavy ? 6 : 4;
            ctx.beginPath();
            ctx.moveTo(-length * 0.18, 0);
            ctx.lineTo(length, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(length * 0.5, -spread);
            ctx.lineTo(length, 0);
            ctx.lineTo(length * 0.5, spread);
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.65;
            ctx.fillRect(-8, -3, length * 0.42, 6);
          } else if (effect.kind === "guardian") {
            const plate = effect.heavy ? 48 : 34;
            ctx.lineWidth = 5;
            ctx.fillStyle = effect.accent || "#fff3c2";
            ctx.fillRect(-plate * 0.5, -plate * 0.5, plate, plate);
            ctx.strokeRect(-plate * 0.5, -plate * 0.5, plate, plate);
            ctx.globalAlpha = alpha * 0.75;
            ctx.strokeStyle = effect.color || "#ffd36a";
            for (let i = -1; i <= 1; i++) {
              ctx.beginPath();
              ctx.moveTo(plate * 0.15, i * plate * 0.32);
              ctx.lineTo(length * 0.6, i * spread);
              ctx.stroke();
            }
          } else if (effect.kind === "assassin") {
            ctx.lineCap = "round";
            ctx.strokeStyle = effect.accent || "#ffffff";
            ctx.shadowBlur = this.glow(22);
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(-31, -25);
            ctx.lineTo(31, 25);
            ctx.moveTo(-31, 25);
            ctx.lineTo(31, -25);
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.76;
            ctx.strokeStyle = effect.color || "#b8b7ff";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-22, -18);
            ctx.lineTo(22, 18);
            ctx.moveTo(-22, 18);
            ctx.lineTo(22, -18);
            ctx.stroke();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-6, -6, 12, 12);
          } else {
            ctx.lineCap = "round";
            ctx.lineWidth = effect.heavy ? 7 : 5;
            ctx.beginPath();
            ctx.moveTo(-length * 0.34, -spread * 1.05);
            ctx.quadraticCurveTo(length * 0.16, -spread * 1.35, length * 0.58, spread * 0.58);
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.72;
            ctx.strokeStyle = effect.accent || "#ffffff";
            ctx.lineWidth = effect.heavy ? 4 : 3;
            ctx.beginPath();
            ctx.moveTo(-length * 0.22, spread * 0.8);
            ctx.quadraticCurveTo(length * 0.04, spread * 0.2, length * 0.42, -spread * 0.48);
            ctx.stroke();
            ctx.globalAlpha = alpha * 0.75;
            ctx.fillRect(-7, -7, 14, 14);
          }
        }
        if (effect.type === "castBurst") {
          const progress = 1 - effect.time / effect.maxTime;
          ctx.translate(effect.x, effect.y);
          ctx.rotate((effect.angle || 0) + progress * 0.75);
          ctx.globalAlpha = (1 - progress) * 0.72;
          ctx.lineWidth = 2 + progress * 5;
          for (let i = 0; i < 2; i++) {
            const r = effect.radius * (0.24 + progress * (0.76 + i * 0.22));
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TAU);
            ctx.stroke();
          }
          ctx.strokeStyle = effect.accent || effect.color;
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * TAU;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * effect.radius * 0.18, Math.sin(a) * effect.radius * 0.18);
            ctx.lineTo(Math.cos(a) * effect.radius * (0.5 + progress * 0.45), Math.sin(a) * effect.radius * (0.5 + progress * 0.45));
            ctx.stroke();
          }
        }
        if (effect.type === "castCone") {
          const progress = 1 - effect.time / effect.maxTime;
          const arc = Math.PI * (0.18 + progress * 0.12);
          const r = effect.radius * (0.36 + progress * 0.72);
          ctx.translate(effect.x, effect.y);
          ctx.rotate(effect.angle || 0);
          ctx.globalAlpha = (1 - progress) * 0.34;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(-arc) * r, Math.sin(-arc) * r);
          ctx.arc(0, 0, r, -arc, arc);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = (1 - progress) * 0.72;
          ctx.strokeStyle = effect.accent || effect.color;
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        if (effect.type === "powerGlyph") this.drawPowerGlyph(ctx, effect);
        ctx.restore();
      }
    }

    drawSkillShape(ctx, effect) {
      const progress = clamp(1 - effect.time / effect.maxTime, 0, 1);
      const fade = clamp(effect.time / effect.maxTime, 0, 1);
      const r = effect.radius || 160;
      const length = effect.length || r;
      const kind = effect.kind;
      const accent = effect.accent || effect.color;
      const alpha = Math.min(0.9, fade * 0.92);
      const quality = this.perf?.quality ?? 1;
      const lowDetail = this.isMobileDevice() || quality < 0.74;
      if (quality < 0.52 && effect.variant !== "ultimate" && progress > 0.62) return;
      ctx.translate(effect.x, effect.y);
      ctx.rotate(effect.angle || 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = alpha;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = accent;
      ctx.fillStyle = effect.color;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = lowDetail ? 0 : this.glow(10);

      const diamond = (x, y, w, h, fill = false) => {
        ctx.beginPath();
        ctx.moveTo(x, y - h);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x - w, y);
        ctx.closePath();
        if (fill) ctx.fill();
        ctx.stroke();
      };
      const leaf = (x, y, size, rot) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.quadraticCurveTo(size * 0.72, -size * 0.16, 0, size);
        ctx.quadraticCurveTo(-size * 0.72, -size * 0.16, 0, -size);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };

      if (kind === "fire") {
        ctx.lineWidth = 3 + progress * 4;
        const fan = lowDetail ? 1 : 2;
        for (let i = -fan; i <= fan; i++) {
          const off = i * 24;
          const reach = r * (0.58 + (fan - Math.abs(i)) * 0.08);
          ctx.globalAlpha = alpha * (0.72 + (fan - Math.abs(i)) * 0.09);
          ctx.beginPath();
          ctx.moveTo(18, off * 0.35);
          ctx.quadraticCurveTo(reach * 0.38, off - 44, reach, off * 0.12);
          ctx.quadraticCurveTo(reach * 0.44, off + 38, 22, off * 0.35);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        if (effect.variant === "meteor") {
          ctx.globalAlpha = alpha;
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(-r * 0.38 + i * 42, -r * 0.65);
            ctx.lineTo(r * 0.14 + i * 18, -r * 0.12);
            ctx.lineTo(-r * 0.1 + i * 34, r * 0.12);
            ctx.stroke();
          }
        }
      } else if (kind === "ice") {
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha * 0.7;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.42 + progress * 0.25), 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = alpha;
        const spikes = lowDetail ? 6 : 8;
        for (let i = 0; i < spikes; i++) {
          const a = (i / spikes) * TAU;
          const sx = Math.cos(a);
          const sy = Math.sin(a);
          ctx.beginPath();
          ctx.moveTo(sx * r * 0.12, sy * r * 0.12);
          ctx.lineTo(sx * r * 0.72, sy * r * 0.72);
          ctx.stroke();
          diamond(sx * r * 0.52, sy * r * 0.52, 9, 18, i % 2 === 0);
        }
      } else if (kind === "lightning") {
        ctx.lineWidth = 5;
        for (let rail = lowDetail ? 0 : -1; rail <= (lowDetail ? 0 : 1); rail++) {
          const y = rail * 18;
          ctx.globalAlpha = alpha * (rail === 0 ? 1 : 0.55);
          ctx.beginPath();
          ctx.moveTo(0, y);
          for (let i = 1; i <= 8; i++) {
            const x = (length / 8) * i;
            const zig = (i % 2 === 0 ? -1 : 1) * (26 + rail * 6);
            ctx.lineTo(x, y + zig);
          }
          ctx.stroke();
        }
        if (effect.variant === "stormCage") {
          const bolts = lowDetail ? 5 : 7;
          for (let i = 0; i < bolts; i++) {
            const a = (i / bolts) * TAU;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32);
            ctx.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
            ctx.stroke();
          }
        }
      } else if (kind === "shadow") {
        ctx.lineWidth = 4;
        ctx.strokeStyle = accent;
        ctx.fillStyle = effect.color;
        for (let i = 0; i < (lowDetail ? 2 : 3); i++) {
          ctx.globalAlpha = alpha * (0.52 + i * 0.13);
          ctx.beginPath();
          ctx.moveTo(-r * 0.18 + i * 16, -r * 0.42 + i * 22);
          ctx.quadraticCurveTo(r * 0.34, -r * 0.2 + i * 14, r * 0.64, r * 0.18 - i * 16);
          ctx.quadraticCurveTo(r * 0.18, r * 0.08 + i * 12, -r * 0.24, r * 0.36 - i * 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        if (effect.variant === "twinSouls") {
          for (let side = -1; side <= 1; side += 2) {
            ctx.globalAlpha = alpha * 0.75;
            ctx.beginPath();
            ctx.ellipse(r * 0.18, side * 42, 18, 34, 0, 0, TAU);
            ctx.stroke();
            ctx.fillRect(r * 0.2, side * 42 - 4, r * 0.34, 8);
          }
        }
      } else if (kind === "blood") {
        ctx.lineWidth = 6;
        for (let i = 0; i < (lowDetail ? 2 : 3); i++) {
          const rr = r * (0.26 + i * 0.14 + progress * 0.08);
          ctx.globalAlpha = alpha * (0.86 - i * 0.18);
          ctx.beginPath();
          ctx.arc(0, 0, rr, -0.85 + i * 0.2, 0.95 + i * 0.24);
          ctx.stroke();
        }
        ctx.globalAlpha = alpha;
        const drops = lowDetail ? 5 : 7;
        for (let i = 0; i < drops; i++) {
          const a = -1.15 + i * 0.38;
          const px = Math.cos(a) * r * 0.56;
          const py = Math.sin(a) * r * 0.42;
          ctx.beginPath();
          ctx.arc(px, py, 7 + (i % 2) * 4, 0, TAU);
          ctx.fill();
        }
      } else if (kind === "gravity") {
        ctx.lineWidth = 4;
        for (let i = 0; i < (lowDetail ? 2 : 3); i++) {
          ctx.save();
          ctx.rotate(progress * 1.8 + i * 0.45);
          ctx.globalAlpha = alpha * (0.84 - i * 0.18);
          const s = r * (0.25 + i * 0.14);
          ctx.strokeRect(-s, -s, s * 2, s * 2);
          ctx.restore();
        }
        ctx.globalAlpha = alpha * 0.75;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.68, 0, TAU);
        ctx.stroke();
        const nodes = lowDetail ? 4 : 6;
        for (let i = 0; i < nodes; i++) {
          const a = (i / nodes) * TAU - progress;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * r * 0.56, Math.sin(a) * r * 0.56, 8, 0, TAU);
          ctx.fill();
        }
      } else if (kind === "crystal") {
        ctx.lineWidth = 3;
        if (effect.variant === "crystalRain") {
          const rain = lowDetail ? 2 : 3;
          for (let i = -rain; i <= rain; i++) {
            const x = i * 38;
            diamond(x, -r * 0.42 + Math.abs(i) * 10, 12, 38, true);
            ctx.beginPath();
            ctx.moveTo(x, -r * 0.15);
            ctx.lineTo(x, r * 0.34);
            ctx.stroke();
          }
        } else {
          const shards = lowDetail ? 2 : 3;
          for (let i = -shards; i <= shards; i++) {
            const a = i * 0.2;
            const dist = r * (0.34 + (shards - Math.abs(i)) * 0.055);
            ctx.save();
            ctx.rotate(a);
            diamond(dist, 0, 13 + (shards - Math.abs(i)) * 2, 32 + (shards - Math.abs(i)) * 3, true);
            ctx.restore();
          }
        }
      } else if (kind === "nature") {
        ctx.lineWidth = 5;
        const line = effect.variant === "thornLine" ? length : r * 0.82;
        for (let i = lowDetail ? 0 : -1; i <= (lowDetail ? 0 : 1); i++) {
          ctx.globalAlpha = alpha * (i === 0 ? 0.95 : 0.62);
          ctx.beginPath();
          ctx.moveTo(0, i * 22);
          ctx.bezierCurveTo(line * 0.24, i * 52 - 30, line * 0.52, i * -44 + 20, line, i * 18);
          ctx.stroke();
        }
        const leaves = lowDetail ? 3 : 5;
        for (let i = 1; i <= leaves; i++) {
          const x = (line / leaves) * i;
          leaf(x, (i % 2 === 0 ? -1 : 1) * 26, 13, (i % 2 === 0 ? -0.8 : 0.8));
          if (effect.variant === "thornLine") diamond(x, 0, 8, 18, true);
        }
      } else if (kind === "void") {
        ctx.lineWidth = 5;
        ctx.globalAlpha = alpha * 0.88;
        ctx.save();
        ctx.scale(1, 0.62);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.55, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.34;
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.moveTo(-r * 0.1, -r * 0.42);
        ctx.lineTo(r * 0.18, -r * 0.06);
        ctx.lineTo(r * 0.02, r * 0.1);
        ctx.lineTo(r * 0.3, r * 0.46);
        ctx.lineTo(-r * 0.12, r * 0.1);
        ctx.closePath();
        ctx.stroke();
      } else if (kind === "time") {
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.52, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.32, 0, TAU);
        ctx.stroke();
        const ticks = lowDetail ? 8 : 12;
        for (let i = 0; i < ticks; i++) {
          const a = (i / ticks) * TAU;
          const inner = r * 0.43;
          const outer = r * 0.52;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
          ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
          ctx.stroke();
        }
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(-0.8 - progress) * r * 0.36, Math.sin(-0.8 - progress) * r * 0.36);
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(1.3 + progress * 1.8) * r * 0.24, Math.sin(1.3 + progress * 1.8) * r * 0.24);
        ctx.stroke();
      }

      if (effect.variant === "ultimate") {
        ctx.globalAlpha = alpha * 0.78;
        ctx.strokeStyle = accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, r * (0.56 + progress * 0.12), 0, TAU);
        ctx.stroke();
        const rays = lowDetail ? 6 : 10;
        for (let i = 0; i < rays; i++) {
          const a = (i / rays) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.64, Math.sin(a) * r * 0.64);
          ctx.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
          ctx.stroke();
        }
      }
    }

    drawPowerGlyph(ctx, effect) {
      const alpha = clamp(effect.time / effect.maxTime, 0, 1);
      const r = effect.radius * (1.05 - alpha * 0.25);
      ctx.globalAlpha = Math.min(0.8, alpha);
      ctx.strokeStyle = effect.color;
      ctx.fillStyle = effect.accent || effect.color;
      ctx.lineWidth = 3 + alpha * 3;
      ctx.shadowColor = effect.color;
      ctx.shadowBlur = this.glow(20);
      ctx.translate(effect.x, effect.y);
      ctx.rotate((effect.angle || 0) + (1 - alpha) * (effect.kind === "time" ? -1.3 : 1.1));
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.18, 0, TAU);
      ctx.stroke();
      if (effect.kind === "fire") {
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 18, -r * 0.12);
          ctx.lineTo(i * 28 + 14, -r * 0.55);
          ctx.lineTo(i * 36 + 4, r * 0.28);
          ctx.closePath();
          ctx.stroke();
        }
      } else if (effect.kind === "ice") {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r * 0.18, Math.sin(a) * r * 0.18);
          ctx.lineTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65);
          ctx.stroke();
          ctx.strokeRect(Math.cos(a) * r * 0.45 - 5, Math.sin(a) * r * 0.45 - 5, 10, 10);
        }
      } else if (effect.kind === "lightning") {
        ctx.beginPath();
        ctx.moveTo(-r * 0.55, -r * 0.1);
        ctx.lineTo(-r * 0.15, -r * 0.32);
        ctx.lineTo(-r * 0.28, r * 0.04);
        ctx.lineTo(r * 0.34, -r * 0.12);
        ctx.lineTo(r * 0.02, r * 0.42);
        ctx.stroke();
      } else if (effect.kind === "shadow") {
        for (let i = 0; i < 3; i++) {
          ctx.strokeRect(-r * 0.5 + i * 18, -r * 0.32 + i * 10, r * 0.8, r * 0.36);
        }
      } else if (effect.kind === "blood") {
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * TAU;
          ctx.beginPath();
          ctx.arc(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.25, 8 + i % 2 * 4, 0, TAU);
          ctx.fill();
        }
      } else if (effect.kind === "gravity") {
        for (let i = 1; i <= 3; i++) {
          ctx.strokeRect(-r * i * 0.13, -r * i * 0.13, r * i * 0.26, r * i * 0.26);
          ctx.beginPath();
          ctx.arc(0, 0, r * i * 0.17, 0, TAU);
          ctx.stroke();
        }
      } else if (effect.kind === "crystal") {
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          ctx.save();
          ctx.translate(Math.cos(a) * r * 0.36, Math.sin(a) * r * 0.36);
          ctx.rotate(a + Math.PI / 4);
          ctx.strokeRect(-8, -18, 16, 36);
          ctx.restore();
        }
      } else if (effect.kind === "nature") {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU;
          ctx.beginPath();
          ctx.ellipse(Math.cos(a) * r * 0.34, Math.sin(a) * r * 0.25, 11, 24, a, 0, TAU);
          ctx.stroke();
        }
      } else if (effect.kind === "void") {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.45, 0, TAU);
        ctx.stroke();
        ctx.rotate(-this.menuTime * 2);
        ctx.strokeRect(-r * 0.32, -r * 0.32, r * 0.64, r * 0.64);
      } else if (effect.kind === "time") {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.42, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(this.menuTime * 3) * r * 0.36, Math.sin(this.menuTime * 3) * r * 0.36);
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(-this.menuTime * 5) * r * 0.24, Math.sin(-this.menuTime * 5) * r * 0.24);
        ctx.stroke();
      }
      ctx.globalAlpha = Math.min(0.6, alpha);
      ctx.fillStyle = effect.accent || effect.color;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(4, r * 0.08), 0, TAU);
      ctx.fill();
    }

    drawParticles(ctx) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const particle of this.run.particles) {
        if (!this.inView(particle.x, particle.y, particle.size + 80)) continue;
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        const size = Math.max(1, particle.size * alpha);
        if (particle.shape === "ring") {
          ctx.strokeStyle = particle.color;
          ctx.lineWidth = Math.max(1, size * 0.16);
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, size * 0.7, 0, TAU);
          ctx.stroke();
        } else if (particle.shape === "plus") {
          ctx.fillRect(particle.x - size / 4, particle.y - size / 2, size / 2, size);
          ctx.fillRect(particle.x - size / 2, particle.y - size / 4, size, size / 2);
        } else if (["spark", "crit", "shade"].includes(particle.shape)) {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.vx + particle.vy) * 0.02);
          ctx.fillRect(-size / 2, -size / 6, size, Math.max(1, size / 3));
          ctx.fillRect(-size / 6, -size / 2, Math.max(1, size / 3), size);
          ctx.restore();
        } else if (["leaf", "shard", "drop", "flame", "snow", "void", "clock"].includes(particle.shape)) {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate((particle.vx + particle.vy) * 0.01);
          ctx.beginPath();
          if (particle.shape === "leaf") ctx.ellipse(0, 0, size * 0.65, size * 0.28, 0, 0, TAU);
          else if (particle.shape === "drop") ctx.ellipse(0, 0, size * 0.38, size * 0.72, 0, 0, TAU);
          else if (particle.shape === "snow") {
            ctx.fillRect(-size / 2, -1, size, 2);
            ctx.fillRect(-1, -size / 2, 2, size);
          } else {
            ctx.fillRect(-size / 2, -size / 2, size, size);
          }
          ctx.fill();
          ctx.restore();
        } else if (particle.shape === "leaf") {
          ctx.fillRect(particle.x - size / 2, particle.y - size / 4, size, size / 2);
        } else {
          ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
        }
      }
      ctx.restore();
    }

    drawDamageTexts(ctx) {
      ctx.save();
      ctx.font = "800 16px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      for (const text of this.run.damageTexts) {
        if (!this.inView(text.x, text.y, 80)) continue;
        ctx.globalAlpha = clamp(text.life / 0.72, 0, 1);
        ctx.fillStyle = "#111521";
        ctx.fillText(text.text, text.x + 1, text.y + 1);
        ctx.fillStyle = text.color;
        ctx.fillText(text.text, text.x, text.y);
      }
      ctx.restore();
    }

    drawBossBars(ctx) {
      const boss = this.run.enemies.find((enemy) => enemy.boss);
      if (!boss) return;
      const viewW = this.worldViewWidth();
      const viewH = this.worldViewHeight();
      const w = Math.min(620, viewW - 80);
      const x = this.camera.x + viewW / 2 - w / 2;
      const y = this.camera.y + viewH - 78;
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(x, y, w, 16);
      ctx.fillStyle = "#ff4b55";
      ctx.fillRect(x, y, w * clamp(boss.hp / boss.maxHp, 0, 1), 16);
      ctx.strokeStyle = this.run.biome.accent;
      ctx.strokeRect(x, y, w, 16);
      ctx.fillStyle = "#f3ead7";
      ctx.font = "800 15px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      ctx.fillText(`${boss.kind} - Pha ${boss.phase}`, x + w / 2, y - 10);
      ctx.restore();
    }

    drawRoomIntro(ctx) {
      const alpha = clamp(this.run.currentRoom.intro, 0, 1);
      const viewW = this.worldViewWidth();
      const viewH = this.worldViewHeight();
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(this.camera.x, this.camera.y + viewH * 0.38, viewW, 96);
      ctx.fillStyle = this.run.biome.accent;
      ctx.font = "900 34px ui-sans-serif, system-ui";
      ctx.textAlign = "center";
      const label = this.run.currentRoom.type === "boss" ? this.run.biome.boss : `${this.run.biome.name} - ${this.run.currentRoom.label}`;
      ctx.fillText(label, this.camera.x + viewW / 2, this.camera.y + viewH * 0.38 + 58);
      ctx.restore();
    }

    drawVignette(ctx) {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.24)";
      ctx.fillRect(0, 0, this.width, 18);
      ctx.fillRect(0, this.height - 22, this.width, 22);
      ctx.fillRect(0, 0, 18, this.height);
      ctx.fillRect(this.width - 18, 0, 18, this.height);
      if (this.run?.player.hp / this.run?.player.maxHp < 0.28) {
        ctx.strokeStyle = "rgba(255,75,85,0.45)";
        ctx.lineWidth = 16;
        ctx.strokeRect(8, 8, this.width - 16, this.height - 16);
      }
      ctx.restore();
    }
  }

  function roundPixel(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
      return;
    }
    ctx.fillRect(x, y, w, h);
  }

  window.addEventListener("DOMContentLoaded", () => {
    window.soulrift = new SoulriftGame();
  });
})();
