/**
 * ============================================================
 *  3D Virtual Tour — Scene Configuration
 *  Technical School | Pannellum.js
 * ============================================================
 *
 *  ⚠ HOTSPOT COORDINATES, SCENE IDs, AND TEXT LABELS
 *    ARE LOCKED AND MUST NOT BE MODIFIED.
 *
 *  Performance tunables live under `defaults`.
 * ============================================================
 */

const TOUR_CONFIG = {
  /* ── Global defaults ─────────────────────────────────── */
  defaults: {
    autoLoad: true,
    autoRotate: -2,                // deg/s  (negative = left)
    autoRotateInactivityDelay: 5000,
    compass: false,
    showControls: false,           // we build our own UI
    hfov: 110,
    minHfov: 50,
    maxHfov: 120,

    /* ── GPU / Performance ─────────────────────────────── */
    friction: 0.1,                 // smoother inertia  (was 0.15)
    sceneFadeDuration: 600,        // faster cross-fade (was 800)

    mouseZoom: true,
    keyboardZoom: true,

    /* ── Preview / Progressive Loading ─────────────────── */
    //  Set to true after placing low-res JPEGs in
    //  assets/panoramas/preview/  with the SAME file names.
    enablePreview: true,
    previewDir: 'assets/panoramas/preview/',
  },

  /* ── First scene to load ─────────────────────────────── */
  firstScene: 'scene_01',

  /* ── Scene definitions ───────────────────────────────── */
  scenes: {
    scene_01: {
      id: 'scene_01',
      title: 'Asosiy Kirish (Tashqari)',
      shortTitle: 'Asosiy Kirish',
      panorama: 'assets/panoramas/01_kirish_tashqari.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-door-open-line',
      hotSpots: [
        {
          pitch: -4.58,
          yaw: -2.95,
          type: "scene",
          text: "Kirish yo'lak",
          sceneId: "scene_02"
        }
      ]
    },

    scene_02: {
      id: 'scene_02',
      title: 'Kirish Chap Yo\'lak',
      shortTitle: 'Chap Yo\'lak',
      panorama: 'assets/panoramas/02_kirish_chap_yolak.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-route-line',
      hotSpots: [
        {
          pitch: 0.42,
          yaw: 96.37,
          type: "scene",
          text: "Asosiy Kirish (Tashqari)",
          sceneId: "scene_01"
        },
        {
          pitch: -2.00,
          yaw: -24.14,
          type: "scene",
          text: "Markaziy maydon",
          sceneId: "scene_03"
        },
        {
          pitch: -1.70,
          yaw: 56.51,
          type: "scene",
          text: "Futbol Stadioni",
          sceneId: "scene_10"
        },
        {
          pitch: 2.53,
          yaw: -82.55,
          type: "scene",
          text: "Zal kirish",
          sceneId: "scene_04"
        }
      ]
    },

    scene_03: {
      id: 'scene_03',
      title: 'Markaziy Maydon',
      shortTitle: 'Markaziy Maydon',
      panorama: 'assets/panoramas/03_markaziy_maydon.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-building-2-line',
      hotSpots: [
        {
          pitch: 5.20,
          yaw: 63.36,
          type: "scene",
          text: "Kirish yo'lak",
          sceneId: "scene_02"
        },
        {
          pitch: 0.52,
          yaw: -138.70,
          type: "scene",
          text: "Foya",
          sceneId: "scene_07"
        }
      ]
    },

    scene_04: {
      id: 'scene_04',
      title: 'Zal Kirish',
      shortTitle: 'Zal Kirish',
      panorama: 'assets/panoramas/04_zal_kirish.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-government-line',
      hotSpots: [
        {
          pitch: -1.57,
          yaw: -63.45,
          type: "scene",
          text: "Kirish yo'lak",
          sceneId: "scene_02"
        },
        {
          pitch: 0.91,
          yaw: 116.49,
          type: "scene",
          text: "Zal",
          sceneId: "scene_05"
        }
      ]
    },

    scene_05: {
      id: 'scene_05',
      title: 'Zal Kirish — 2',
      shortTitle: 'Zal Kirish 2',
      panorama: 'assets/panoramas/05_zal_kirish_2.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-government-line',
      hotSpots: [
        {
          pitch: 2.38,
          yaw: 51.11,
          type: "scene",
          text: "Zal",
          sceneId: "scene_04"
        },
        {
          pitch: -0.53,
          yaw: -111.86,
          type: "scene",
          text: "Zal",
          sceneId: "scene_06"
        }
      ]
    },

    scene_06: {
      id: 'scene_06',
      title: 'Zal Kirish — 3',
      shortTitle: 'Zal Kirish 3',
      panorama: 'assets/panoramas/06_zal_kirish_3.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-government-line',
      hotSpots: [
        {
          pitch: -1.48,
          yaw: 30.01,
          type: "scene",
          text: "Foya",
          sceneId: "scene_07"
        }
      ]
    },

    scene_07: {
      id: 'scene_07',
      title: 'Foydalanish Binosi',
      shortTitle: 'Foya',
      panorama: 'assets/panoramas/07_faya.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-home-smile-line',
      hotSpots: [
        {
          pitch: -2.21,
          yaw: 129.16,
          type: "scene",
          text: "Foya 2",
          sceneId: "scene_08"
        },
        {
          pitch: 0.99,
          yaw: 46.79,
          type: "scene",
          text: "2-Etaj zal",
          sceneId: "scene_09"
        },
        {
          pitch: 0.96,
          yaw: 7.21,
          type: "scene",
          text: "Markaziy maydon",
          sceneId: "scene_03"
        }
      ]
    },

    scene_08: {
      id: 'scene_08',
      title: 'Foya — Chap Tomon',
      shortTitle: 'Foya Chap',
      panorama: 'assets/panoramas/08_faya_chap.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-home-smile-line',
      hotSpots: [
        {
          pitch: 0.69,
          yaw: 44.53,
          type: "scene",
          text: "Foya",
          sceneId: "scene_07"
        }
      ]
    },

    scene_09: {
      id: 'scene_09',
      title: '2-Etaj Zal',
      shortTitle: '2-Etaj Zal',
      panorama: 'assets/panoramas/09_2_etaj_zal.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-stairs-line',
      hotSpots: [
        {
          pitch: -3.51,
          yaw: 154.51,
          type: "scene",
          text: "1-Etaj foya",
          sceneId: "scene_07"
        }
      ]
    },

    scene_10: {
      id: 'scene_10',
      title: 'Futbol Stadion',
      shortTitle: 'Futbol Stadion',
      panorama: 'assets/panoramas/10_futbol_stadion.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-football-line',
      hotSpots: [
        {
          pitch: 3.64,
          yaw: 178.54,
          type: "scene",
          text: "Kirish yo'lak",
          sceneId: "scene_02"
        }
      ]
    }
  }
};
