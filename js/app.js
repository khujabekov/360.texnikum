/**
 * ============================================================
 *  3D Virtual Tour — Application Controller  (Optimized)
 *  Technical School | Pannellum.js
 * ============================================================
 *
 *  Performance features:
 *   • Scene Preloader  — background-downloads panoramas
 *                        linked via hotspots using Image.decode()
 *   • Progressive Load — optional low-res preview before hi-res
 *   • Zoom-in Effect   — CSS scale + lookAt hides switch lag
 *   • Memory guard     — bounded image cache, AbortController
 *   • GPU hints        — will-change, translateZ compositing
 * ============================================================
 */
import TOUR_CONFIG from './config.js';

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════
   *  IMAGE PRE-LOADER  (bounded cache + decode API)
   * ═══════════════════════════════════════════════════════════ */
  const _imgCache   = new Map();   // url → Promise<HTMLImageElement>
  const MAX_CACHE   = 8;           // keep at most N decoded images

  /**
   * Download + decode an image off the main thread.
   * Returns a cached promise if the same URL was already requested.
   */
  function preloadImage(url) {
    if (_imgCache.has(url)) return _imgCache.get(url);

    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Use the decode() API when available for non-blocking decode
        if (typeof img.decode === 'function') {
          img.decode().then(() => resolve(img)).catch(() => resolve(img));
        } else {
          resolve(img);
        }
      };
      img.onerror = () => {
        _imgCache.delete(url);
        reject(new Error('Preload failed: ' + url));
      };
      img.src = url;
    });

    // Evict oldest entry if cache is full
    if (_imgCache.size >= MAX_CACHE) {
      const oldest = _imgCache.keys().next().value;
      _imgCache.delete(oldest);
    }
    _imgCache.set(url, promise);
    return promise;
  }

  /**
   * After a scene loads, start downloading every panorama
   * reachable from its hotspots.  Uses requestIdleCallback
   * to avoid jank, falls back to setTimeout.
   */
  function preloadLinkedScenes(sceneId) {
    const scene = TOUR_CONFIG.scenes[sceneId];
    if (!scene || !scene.hotSpots) return;

    const urls = scene.hotSpots
      .filter(hs => hs.sceneId && TOUR_CONFIG.scenes[hs.sceneId])
      .map(hs => TOUR_CONFIG.scenes[hs.sceneId].panorama);

    // Deduplicate
    const unique = [...new Set(urls)];

    let idx = 0;
    function next() {
      if (idx >= unique.length) return;
      const url = unique[idx++];
      preloadImage(url)
        .catch(() => {/* ignore – it's speculative */})
        .finally(() => scheduleIdle(next));
    }

    // Small delay so the current scene's render isn't starved
    setTimeout(() => scheduleIdle(next), 800);
  }

  /** Wrapper: prefer requestIdleCallback, else setTimeout */
  function scheduleIdle(fn) {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(fn, { timeout: 2000 });
    } else {
      setTimeout(fn, 120);
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  STATE
   * ═══════════════════════════════════════════════════════════ */
  let viewer          = null;
  let currentSceneId  = null;
  let isAutoRotating  = true;
  let sidebarOpen     = false;
  let isTransitioning = false;

  // AbortController for event cleanup (memory-leak guard)
  let eventAbort = new AbortController();

  /* ═══════════════════════════════════════════════════════════
   *  DOM REFS
   * ═══════════════════════════════════════════════════════════ */
  const $panorama     = document.getElementById('panorama');
  const $overlay      = document.getElementById('transition-overlay');
  const $spinner      = document.getElementById('loading-spinner');
  const $headerTitle  = document.getElementById('header-title');
  const $headerBadge  = document.getElementById('header-badge');
  const $sidebar      = document.getElementById('sidebar');
  const $sidebarList  = document.getElementById('sidebar-list');
  const $btnMenu      = document.getElementById('btn-menu');
  const $btnClose     = document.getElementById('btn-sidebar-close');
  const $backdrop     = document.getElementById('sidebar-backdrop');
  const $btnZoomIn    = document.getElementById('btn-zoom-in');
  const $btnZoomOut   = document.getElementById('btn-zoom-out');
  const $btnFs        = document.getElementById('btn-fullscreen');
  const $btnRotate    = document.getElementById('btn-rotate');
  const $rotateIcon   = document.getElementById('rotate-icon');
  const $debugToast   = document.getElementById('debug-toast');
  const $sceneCounter = document.getElementById('scene-counter');
  const $preloadBar   = document.getElementById('preload-bar');

  /* ═══════════════════════════════════════════════════════════
   *  HELPERS
   * ═══════════════════════════════════════════════════════════ */
  const sceneKeys   = Object.keys(TOUR_CONFIG.scenes);
  const totalScenes = sceneKeys.length;

  function getSceneIndex(id) {
    return sceneKeys.indexOf(id) + 1;
  }

  /* ── Build sidebar list ──────────────────────────────────── */
  function buildSidebar() {
    $sidebarList.innerHTML = '';
    const frag = document.createDocumentFragment(); // batch DOM writes
    sceneKeys.forEach((key, i) => {
      const scene = TOUR_CONFIG.scenes[key];
      const li = document.createElement('li');
      li.className = 'sidebar-item';
      li.dataset.scene = key;
      li.innerHTML = `
        <span class="sidebar-item-number">${String(i + 1).padStart(2, '0')}</span>
        <i class="${scene.icon} sidebar-item-icon"></i>
        <span class="sidebar-item-label">${scene.shortTitle}</span>
      `;
      li.addEventListener('click', () => {
        loadScene(key);
        closeSidebar();
      }, { signal: eventAbort.signal });
      frag.appendChild(li);
    });
    $sidebarList.appendChild(frag);
  }

  /* ── Sidebar open / close ────────────────────────────────── */
  function openSidebar() {
    sidebarOpen = true;
    $sidebar.classList.add('open');
    $backdrop.classList.add('visible');
    document.body.classList.add('sidebar-open');
  }

  function closeSidebar() {
    sidebarOpen = false;
    $sidebar.classList.remove('open');
    $backdrop.classList.remove('visible');
    document.body.classList.remove('sidebar-open');
  }

  /* ── Highlight active sidebar item ───────────────────────── */
  function highlightSidebarItem(id) {
    document.querySelectorAll('.sidebar-item').forEach(el => {
      el.classList.toggle('active', el.dataset.scene === id);
    });
  }

  /* ── Update header ───────────────────────────────────────── */
  function updateHeader(scene, index) {
    $headerBadge.textContent = String(index).padStart(2, '0');
    $headerTitle.textContent = scene.title;
    $sceneCounter.textContent = `${index} / ${totalScenes}`;
  }

  /* ═══════════════════════════════════════════════════════════
   *  ZOOM-IN TRANSITION  (CSS scale on #panorama)
   * ═══════════════════════════════════════════════════════════ */
  function applyZoomIn() {
    $panorama.classList.add('scene-zoom-in');
  }

  function resetZoom() {
    $panorama.classList.remove('scene-zoom-in');
  }

  /* ═══════════════════════════════════════════════════════════
   *  PRELOAD PROGRESS BAR  (visual feedback)
   * ═══════════════════════════════════════════════════════════ */
  function showPreloadBar() {
    if ($preloadBar) {
      $preloadBar.classList.add('active');
    }
  }

  function hidePreloadBar() {
    if ($preloadBar) {
      $preloadBar.classList.remove('active');
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  SCENE LOADER  (sidebar + keyboard navigation)
   * ═══════════════════════════════════════════════════════════ */
  function loadScene(sceneId) {
    if (sceneId === currentSceneId || isTransitioning) return;
    isTransitioning = true;

    const target = TOUR_CONFIG.scenes[sceneId];

    // 1. Start preloading the target image immediately
    if (target) {
      showPreloadBar();
      preloadImage(target.panorama).catch(() => {});
    }

    // 2. Apply the zoom-in CSS scale for visual effect
    applyZoomIn();

    // 3. After the zoom scale settles, tell Pannellum to switch
    setTimeout(() => {
      if (viewer) {
        viewer.loadScene(sceneId, 'same', 'same', TOUR_CONFIG.defaults.hfov);
      }
    }, 300);
  }

  /* ═══════════════════════════════════════════════════════════
   *  VIEWER  INIT
   * ═══════════════════════════════════════════════════════════ */
  function initViewer() {
    const pannellumScenes = {};

    sceneKeys.forEach(key => {
      const scene = TOUR_CONFIG.scenes[key];

      // Map custom hotSpots → Pannellum info-type with click handler
      const mappedHotSpots = (scene.hotSpots || []).map(hs => {
        if (hs.type === 'scene' || hs.sceneId) {
          return {
            pitch: hs.pitch,
            yaw:   hs.yaw,
            type:  'info',
            text:  hs.text,
            cssClass: 'pnlm-scene',
            clickHandlerFunc: function () {
              if (!viewer || isTransitioning) return;
              isTransitioning = true;

              // Pre-fetch the target panorama immediately
              const linked = TOUR_CONFIG.scenes[hs.sceneId];
              if (linked) preloadImage(linked.panorama).catch(() => {});

              showPreloadBar();

              // Zoom towards the hotspot for a "fly-in" feel
              const zoomHfov = Math.max(
                TOUR_CONFIG.defaults.minHfov,
                viewer.getHfov() - 20
              );
              viewer.lookAt(hs.pitch, hs.yaw, zoomHfov, 700, function () {
                applyZoomIn();
                viewer.loadScene(
                  hs.sceneId, 'same', 'same', TOUR_CONFIG.defaults.hfov
                );
              });
            }
          };
        }
        return hs;
      });

      // Build Pannellum scene descriptor
      const desc = {
        type:    'equirectangular',
        panorama: scene.panorama,
        hfov:    scene.hfov || TOUR_CONFIG.defaults.hfov,
        minHfov: TOUR_CONFIG.defaults.minHfov,
        maxHfov: TOUR_CONFIG.defaults.maxHfov,
        pitch:   scene.pitch,
        yaw:     scene.yaw,
        hotSpots: mappedHotSpots
      };

      // Progressive loading: attach preview if enabled
      if (TOUR_CONFIG.defaults.enablePreview) {
        const filename = scene.panorama.split('/').pop();
        desc.preview = TOUR_CONFIG.defaults.previewDir + filename;
      }

      pannellumScenes[key] = desc;
    });

    /* ── Create the multi-scene viewer (once) ────────────── */
    viewer = pannellum.viewer('panorama', {
      default: {
        firstScene:                TOUR_CONFIG.firstScene,
        sceneFadeDuration:         TOUR_CONFIG.defaults.sceneFadeDuration,
        autoLoad:                  TOUR_CONFIG.defaults.autoLoad,
        autoRotate:                isAutoRotating ? TOUR_CONFIG.defaults.autoRotate : 0,
        autoRotateInactivityDelay: TOUR_CONFIG.defaults.autoRotateInactivityDelay,
        showControls:              false,
        compass:                   false,
        friction:                  TOUR_CONFIG.defaults.friction,
        mouseZoom:                 TOUR_CONFIG.defaults.mouseZoom,
        keyboardZoom:              TOUR_CONFIG.defaults.keyboardZoom,
      },
      scenes: pannellumScenes
    });

    /* ── React to scene changes ──────────────────────────── */
    viewer.on('scenechange', function (newSceneId) {
      currentSceneId = newSceneId;
      const scene = TOUR_CONFIG.scenes[newSceneId];
      if (scene) {
        updateHeader(scene, getSceneIndex(newSceneId));
        highlightSidebarItem(newSceneId);
      }

      // Reset visual transition state
      resetZoom();
      hidePreloadBar();
      isTransitioning = false;

      // Smart preloading: queue downloads for adjacent scenes
      preloadLinkedScenes(newSceneId);
    });

    /* ── On first scene load ─────────────────────────────── */
    viewer.on('load', function () {
      hidePreloadBar();
      preloadLinkedScenes(TOUR_CONFIG.firstScene);
    });

    // Initial UI
    currentSceneId = TOUR_CONFIG.firstScene;
    updateHeader(
      TOUR_CONFIG.scenes[currentSceneId],
      getSceneIndex(currentSceneId)
    );
    highlightSidebarItem(currentSceneId);

    /* ── Debug: dblclick → coords ────────────────────────── */
    $panorama.addEventListener('dblclick', function (e) {
      if (!viewer) return;
      const coords = viewer.mouseEventToCoords(e);
      if (coords) {
        const [pitch, yaw] = coords;
        console.log(
          `%c🎯 Ikki marta bosildi! — Scene: ${currentSceneId}  |  pitch: ${pitch.toFixed(2)}, yaw: ${yaw.toFixed(2)}`,
          'color: #00ffc8; font-size: 14px; font-weight: bold;'
        );
        showDebugToast(pitch, yaw);
      }
    }, { signal: eventAbort.signal });

    /* ── Debug: Space key → coords ───────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.code === 'Space' && viewer) {
        e.preventDefault();
        const pitch = viewer.getPitch();
        const yaw   = viewer.getYaw();
        console.log(
          `%c🎯 Ekran markazi! — Scene: ${currentSceneId}  |  pitch: ${pitch.toFixed(2)}, yaw: ${yaw.toFixed(2)}`,
          'color: #facc15; font-size: 14px; font-weight: bold;'
        );
        showDebugToast(pitch, yaw);
      }
    }, { signal: eventAbort.signal });
  }

  /* ═══════════════════════════════════════════════════════════
   *  DEBUG TOAST
   * ═══════════════════════════════════════════════════════════ */
  let debugToastTimer = null;
  function showDebugToast(pitch, yaw) {
    $debugToast.innerHTML =
      `<i class="ri-crosshair-2-line"></i> pitch: <b>${pitch.toFixed(2)}</b> &nbsp;|&nbsp; yaw: <b>${yaw.toFixed(2)}</b>`;
    $debugToast.classList.add('visible');
    clearTimeout(debugToastTimer);
    debugToastTimer = setTimeout(
      () => $debugToast.classList.remove('visible'), 3000
    );
  }

  /* ═══════════════════════════════════════════════════════════
   *  CONTROLS
   * ═══════════════════════════════════════════════════════════ */
  function zoomIn() {
    if (!viewer) return;
    viewer.setHfov(
      Math.max(viewer.getHfov() - 10, TOUR_CONFIG.defaults.minHfov), 300
    );
  }

  function zoomOut() {
    if (!viewer) return;
    viewer.setHfov(
      Math.min(viewer.getHfov() + 10, TOUR_CONFIG.defaults.maxHfov), 300
    );
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function toggleAutoRotate() {
    isAutoRotating = !isAutoRotating;
    if (viewer) {
      viewer.setAutoRotate(
        isAutoRotating ? TOUR_CONFIG.defaults.autoRotate : 0
      );
    }
    $btnRotate.classList.toggle('control-active', isAutoRotating);
    $rotateIcon.className = isAutoRotating
      ? 'ri-loader-line spin'
      : 'ri-loader-line';
  }

  /* ── Keyboard navigation ─────────────────────────────────── */
  function handleKeyboard(e) {
    if (e.key === 'Escape' && sidebarOpen) { closeSidebar(); return; }
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      const idx = sceneKeys.indexOf(currentSceneId);
      if (idx < sceneKeys.length - 1) loadScene(sceneKeys[idx + 1]);
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      const idx = sceneKeys.indexOf(currentSceneId);
      if (idx > 0) loadScene(sceneKeys[idx - 1]);
    }
  }

  /* ═══════════════════════════════════════════════════════════
   *  EVENT BINDING  (all use AbortController signal)
   * ═══════════════════════════════════════════════════════════ */
  function bindEvents() {
    const sig = { signal: eventAbort.signal };

    $btnMenu.addEventListener('click',  openSidebar,       sig);
    $btnClose.addEventListener('click', closeSidebar,      sig);
    $backdrop.addEventListener('click', closeSidebar,      sig);
    $btnZoomIn.addEventListener('click',  zoomIn,          sig);
    $btnZoomOut.addEventListener('click', zoomOut,          sig);
    $btnFs.addEventListener('click',      toggleFullscreen, sig);
    $btnRotate.addEventListener('click',  toggleAutoRotate, sig);
    document.addEventListener('keydown',  handleKeyboard,   sig);

    /* Fullscreen icon swap */
    document.addEventListener('fullscreenchange', () => {
      const icon = document.getElementById('fs-icon');
      icon.className = document.fullscreenElement
        ? 'ri-fullscreen-exit-line'
        : 'ri-fullscreen-line';
    }, sig);
  }

  /* ═══════════════════════════════════════════════════════════
   *  CLEANUP  (call if you ever need to destroy the tour)
   * ═══════════════════════════════════════════════════════════ */
  function destroy() {
    // Abort every event listener registered with the signal
    eventAbort.abort();
    eventAbort = new AbortController();

    // Clear image cache
    _imgCache.clear();

    // Clear timers
    clearTimeout(debugToastTimer);

    // Destroy Pannellum viewer
    if (viewer) {
      viewer.destroy();
      viewer = null;
    }

    currentSceneId  = null;
    isTransitioning = false;
  }

  // Expose destroy for external use / hot-reload
  window.__tourDestroy = destroy;

  /* ═══════════════════════════════════════════════════════════
   *  INIT
   * ═══════════════════════════════════════════════════════════ */
  function init() {
    buildSidebar();
    bindEvents();
    initViewer();
    $btnRotate.classList.add('control-active');

    console.log(
      '%c🏫 Virtual Tour — Debug Mode Active\n%cIkki marta bosing yoki Space ni bosing.',
      'color: #a78bfa; font-size: 15px; font-weight: bold;',
      'color: #94a3b8; font-size: 12px;'
    );
  }

  /* Wait for DOM (defer scripts fire before DOMContentLoaded) */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
