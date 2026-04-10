# 🎓 Texnikum 3D Virtual Sayohat (Virtual Tour) — To'liq Yo'riqnoma

Ushbu loyiha muassasa uchun zamonaviy, tezkor va "Google Maps" effektiga ega bo'lgan 3D Virtual Tour yaratish maqsadida Pannellum.js kutubxonasiga asoslanib qurilgan.

---

## 🚀 1. Loyihani 0 dan Ishga Tushirish

Ushbu loyiha lokal fayl tizimida (`file:/// C:/...`) to'g'ri ishlamaydi, chunki brauzerlar xavfsizlik sababli 360-rasmlarni bloklaydi. Loyihani har doim **mahalliy server (localhost)** orqali ochish kerak.

### Qadamlar:
1. Kompyuteringizda [Node.js](https://nodejs.org/) o'rnatilgan bo'lishi shart.
2. Loyiha papkasini (masalan, `3d_tour_site`) **VS Code** dasturida oching.
3. Terminalni oching (`Ctrl` + `~`).
4. Quyidagi buyruqni kiriting va Enter bosing:
   ```bash
   npx -y serve . -l 3000
   ```
5. Chiqqan manzilni (`http://localhost:3000`) brauzerga yozib oching.

---

## 🌍 2. Loyihani Internetga Joylash (Ommaga taqdim etish)

Sayt faqat HTML, CSS va JS dan iborat bo'lgani (Backend va DataBasesiz ishlagani) uchun uni istalgan oddiy xosting yoki bepul platformalarga qo'yishingiz mumkin.

- **Vercel orqali (Tavsiya etiladi):** Loyiha papkasini Vercel'ga tortib (drag-and-drop) tashlaysiz, va u avtomat onlayn bo'ladi.
- **Odatiy xostinglar (cPanel):** Papka ichidagi hamma narsani (`index.html`, `js`, `assets`) Zip qilib xostingning `public_html` jildiga yuklaysiz.

---

## 🎯 3. O'tish nuqtalarini (Hotspots) qo'shish

Dasturga o'zingizning "Debug Mode" yordamchingiz o'rnatilgan. Xonama-xona o'tish uchun quyidagilarni qiling:

### Koordinatani (pitch va yaw) aniqlash
1. Saytni brauzerda oching.
2. O'tish kerak bo'lgan joyni (eshik, yo'lak) ekranning **qo'q o'rtasiga (markazga)** olib keling va klaviaturadagi **"Bo'sh joy" (Space)** tugmasini bosing.
   *(Yoki o'sha yo'nalish ustiga tezda **2 marta bosing - Double Click**).*
3. Ekranning pastki qismida sarg'ish-yashil yozuvda o'sha joyning koordinatalari chiqadi. Masalan: `pitch: 0.42, yaw: 96.37`

### Koordinatani kodga ulash
4. VS Code'da `js/config.js` faylini oching.
5. Qaysi xonada turgan bo'lsangiz, o'sha xonaning `hotSpots: []` blokiga shu nuqtani yozing:

```javascript
    scene_01: {
      id: 'scene_01',
      // ...
      hotSpots: [
        {
          pitch: 0.42,             // Topilgan pitch
          yaw: 96.37,              // Topilgan yaw
          type: "scene",           // O'zgartirmang, sahna o'tishi uchun doim "scene" bo'ladi
          text: "Zalga kirish",    // Sichqonchani olib borganda chiqadigan matn
          sceneId: "scene_02"      // TUGMA BOSILGANDA QAYSI XONAGA O'TISHI KERAk
        }
      ]
    }
```
*Tavsiya: Bir xonadan ikkinchisiga o'tishni qo'shgach, qaytib chiqish yo'lini ham darhol qo'shib yuborishni unutmang (huddi shu ishning teskarisi).*

---

## 📸 4. Yangi xona (Panorama) qo'shish yoki almashtirish

1. Yangi 360-rasmni oling. U albatta **2:1 nisbatda (Equirectangular)** va **.jpg** formatida bo'lishi kerak.
2. Rasmni `assets/panoramas/` papkasiga tashlang.
3. `js/config.js` faylini oching.
4. `scenes` qatorida yangi ob'ekt yarating (eski qatorlardan biridan nusxa olib o'zgartiring):

```javascript
    scene_11: {
      id: 'scene_11',
      title: 'Yangi Bino Kirish',
      shortTitle: 'Yangi Bino',            // Chap paneldagi yozuv
      panorama: 'assets/panoramas/yangi_rasm.jpg',
      pitch: 0,
      yaw: 0,
      hfov: 110,
      icon: 'ri-building-line',            // Remix Icons ro'yxatidan istalgan ikonka
      hotSpots: []
    }
```

Natijada chap tomondagi ochiluvchi menyuda sizning yangi xonangiz ham avtomatik tarzda qo'shiladi!

---

## 🎨 5. Maxsus dizaynlar haqida ma'lumot (Dasturchilar qismi)

- **UI va Glassmorphism:** Asosiy vidjetlar, tugmalar va "Sidebar" qismi `index.html` faylining ichidagi CSS `<style>` bloki orqali modifikatsiya qilingan (Tailwind va xususiy CSS uyg'unligida).
- **Strelka dizayni:** `index.html` ichida `.pnlm-scene` dagi kodlar orqali chiroyli yurak urishidek (pulse) animatsiyali doira shakliga keltirilgan.
- **Google Maps Effect:** `js/app.js` ning 100-qatorlari atrofida kamera oldin belgilangan `pitch` va `yaw` ga burilib (lookAt), so'ng keyingi xonani o'qish (loadScene) logikasi yozilgan.

---
**Omad tilaymiz! Loyiha mutlaqo tayyor va mukammal strukturalashtirilgan.**
