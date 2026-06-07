(() => {
  "use strict";

  const APP_VERSION = "20260607-preload-hotfix-272";
  const APP_ICON = "assets/icons/app-icon-20260605-logo-xl-149.svg";
  let deferredInstallPrompt = null;
  let startGame = null;
  let iosGuideShown = false;

  function qs(selector) {
    return document.querySelector(selector);
  }

  function isStandalone() {
    return Boolean(
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      window.matchMedia?.("(display-mode: fullscreen)")?.matches ||
      window.navigator.standalone
    );
  }

  function isIos() {
    const ua = navigator.userAgent || "";
    const iPadOS = navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
    return /iPhone|iPad|iPod/i.test(ua) || iPadOS;
  }

  function isAndroid() {
    return /Android/i.test(navigator.userAgent || "");
  }

  function isMobileLike() {
    const ua = navigator.userAgent || "";
    const touch = (navigator.maxTouchPoints || 0) > 0;
    const coarse = window.matchMedia?.("(pointer: coarse)")?.matches;
    const shortSide = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    const longSide = Math.max(window.innerWidth || 0, window.innerHeight || 0);
    return Boolean(/Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(ua) || (touch && coarse && shortSide <= 820 && longSide <= 1400));
  }

  function allowGameDirectly() {
    return isStandalone() || !isMobileLike();
  }

  function isFullscreenDisplayMode() {
    return Boolean(window.matchMedia?.("(display-mode: fullscreen)")?.matches);
  }

  function syncViewport() {
    const viewport = window.visualViewport;
    const width = Math.round(viewport?.width || window.innerWidth || document.documentElement.clientWidth || 0);
    const height = Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight || 0);
    if (width > 0) document.documentElement.style.setProperty("--app-width", `${width}px`);
    if (height > 0) document.documentElement.style.setProperty("--app-height", `${height}px`);
    document.body.classList.toggle("pwa-standalone", isStandalone());
    document.body.classList.toggle("pwa-fullscreen-mode", isFullscreenDisplayMode());
  }

  async function requestInstalledFullscreen() {
    if (!isMobileLike() || !isStandalone() || isFullscreenDisplayMode() || document.fullscreenElement || document.webkitFullscreenElement) return;
    const target = document.documentElement;
    try {
      if (target.requestFullscreen) {
        try {
          await target.requestFullscreen({ navigationUI: "hide" });
        } catch {
          await target.requestFullscreen();
        }
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } catch {
      // Browser may only allow manifest fullscreen, so keep the CSS viewport synced.
    }
    try {
      if (screen.orientation?.lock) await screen.orientation.lock("landscape");
    } catch {
      // iOS and some Android browsers reject orientation lock outside install launch.
    }
    syncViewport();
  }

  function setLandingVisible(visible) {
    syncViewport();
    document.body.classList.toggle("pwa-landing-active", visible);
    const landing = qs("#installLanding");
    if (landing) {
      landing.classList.toggle("hidden", !visible);
      landing.setAttribute("aria-hidden", visible ? "false" : "true");
    }
    const mobileGate = qs("#mobileGate");
    if (visible && mobileGate) mobileGate.classList.add("hidden");
  }

  function updateInstallButton() {
    const button = qs("#pwaInstallButton");
    const iosButton = qs("#pwaIosHelpButton");
    const apple = isIos();
    const android = isAndroid() && !apple;
    if (button) {
      button.textContent = apple ? "XEM CÁCH TẢI" : android ? "TẢI APP" : "MỞ HƯỚNG DẪN";
      button.dataset.platform = apple ? "ios" : android ? "android" : "other";
    }
    if (iosButton) iosButton.classList.toggle("hidden", !apple);
  }

  function showDialog(kind, title, bodyHtml) {
    const dialog = qs("#pwaInstallDialog");
    if (!dialog) return;
    dialog.className = `pwa-install-dialog ${kind || ""}`;
    dialog.classList.remove("hidden");
    dialog.setAttribute("aria-hidden", "false");
    const titleEl = qs("#pwaDialogTitle");
    const bodyEl = qs("#pwaDialogBody");
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = bodyHtml;
  }

  function hideDialog() {
    const dialog = qs("#pwaInstallDialog");
    if (!dialog) return;
    dialog.classList.add("hidden");
    dialog.setAttribute("aria-hidden", "true");
  }

  function showIosGuide() {
    iosGuideShown = true;
    showDialog("ios-guide", "Tải Soulrift trên iPhone", `
      <div class="ios-guide-art" aria-hidden="true">
        <div class="phone-frame">
          <div class="phone-top"></div>
          <div class="iphone-page-demo">
            <img src="${APP_ICON}" alt="" />
            <span>SOULRIFT</span>
          </div>
          <div class="iphone-safari-bar">
            <span class="safari-aa">AA</span>
            <span class="safari-address">soulrift</span>
            <span class="iphone-share-button">
              <svg viewBox="0 0 32 32" aria-hidden="true">
                <path d="M16 21V6" />
                <path d="M10 12l6-6 6 6" />
                <path d="M9 15H6v11h20V15h-3" />
              </svg>
            </span>
          </div>
          <div class="share-callout"><span></span><b>Bấm nút chia sẻ này</b></div>
          <div class="add-demo">
            <span>+</span>
            <b>Thêm vào Màn hình chính</b>
          </div>
        </div>
      </div>
      <ol class="install-steps">
        <li>Bấm nút <b>Chia sẻ</b> ở thanh Safari.</li>
        <li>Chọn <b>Thêm vào Màn hình chính</b>.</li>
        <li>Bấm <b>Thêm</b>, rồi mở Soulrift từ icon ngoài màn hình.</li>
      </ol>
    `);
  }

  function showAndroidFallback(waiting = false) {
    showDialog("android-guide", waiting ? "Đang chuẩn bị hộp thoại tải" : "Tải Soulrift trên Android", `
      <div class="android-install-art" aria-hidden="true">
        <div class="android-card">
          <img src="${APP_ICON}" alt="" />
          <div><b>Soulrift</b><span>Ứng dụng có thể cài đặt</span></div>
        </div>
        <button class="fake-install-button">Cài đặt</button>
      </div>
      <p>${waiting ? "Nếu hộp thoại hệ thống chưa bật, Chrome vẫn đang chuẩn bị PWA. Bấm lại nút tải sau vài giây hoặc mở menu ba chấm và chọn Cài đặt ứng dụng." : "Nếu trình duyệt không bật hộp thoại hệ thống, mở menu ba chấm của Chrome rồi chọn Cài đặt ứng dụng."}</p>
    `);
  }

  async function installAndroid() {
    showAndroidFallback(!deferredInstallPrompt);
    if (!deferredInstallPrompt) return;
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch {
      showAndroidFallback(false);
    }
  }

  function bindLanding() {
    syncViewport();
    window.addEventListener("resize", syncViewport);
    window.addEventListener("orientationchange", () => window.setTimeout(syncViewport, 120));
    window.visualViewport?.addEventListener("resize", syncViewport);
    window.visualViewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("pointerdown", requestInstalledFullscreen, { capture: true, passive: true });
    window.addEventListener("touchstart", requestInstalledFullscreen, { capture: true, passive: true });
    qs("#pwaInstallButton")?.addEventListener("click", () => {
      if (isIos()) showIosGuide();
      else installAndroid();
    });
    qs("#pwaIosHelpButton")?.addEventListener("click", showIosGuide);
    qs("#pwaDialogClose")?.addEventListener("click", hideDialog);
    qs("#pwaInstallDialog")?.addEventListener("click", (event) => {
      if (event.target?.id === "pwaInstallDialog") hideDialog();
    });
  }

  function registerServiceWorker() {
    if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
    navigator.serviceWorker.register(`service-worker.js?v=${APP_VERSION}`).catch(() => {});
  }

  function startGameSafely() {
    try {
      return startGame?.();
    } catch (error) {
      window.dispatchEvent(new CustomEvent("soulriftbooterror", { detail: error }));
      return null;
    }
  }

  function boot(start) {
    startGame = start;
    syncViewport();
    registerServiceWorker();
    bindLanding();
    updateInstallButton();
    if (allowGameDirectly()) {
      setLandingVisible(false);
      startGameSafely();
      return;
    }
    setLandingVisible(true);
    if (isIos() && !iosGuideShown) {
      window.setTimeout(showIosGuide, 450);
    }
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallButton();
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    showDialog("installed", "Đã tải Soulrift", "<p>Mở Soulrift từ icon trên màn hình chính để vào game.</p>");
  });

  window.SoulriftPwaGate = { boot, isStandalone, isMobileLike, syncViewport };
})();
