# 📋 GULASAL AI — BAJARILGAN ISHLAR VA SAQLANGAN LOYIHA HISOBOTI
**Sana:** 15-Noyabr, 2026-yil  
**Loyiha jildi:** `C:\Users\maruf\USTOZ-AI`  
**Zaxira nusxasi (Full ZIP Backup):** [USTOZ_AI_BACKUP_2026-11-15.zip](file:///C:/Users/maruf/USTOZ-AI/storage/backups/USTOZ_AI_BACKUP_2026-11-15.zip)

---

## 🌟 1. Bugungi Sessiyada Amalga Oshirilgan Barcha O‘zgarishlar

### A. Admin Paneliga Qo‘shilgan 4 ta Yirik Tizim:
1. **🚧 Texnik Profilaktika Rejimi (Maintenance Mode):**
   * Admin paneldan turib bir tugma bilan saytda profilaktikani yoqish/o‘chirish.
   * Maxsus xabar va kutilayotgan tugash vaqti (ETA) kiritish imkoniyati.
   * Oddiy foydalanuvchilar kirganda zamonaviy profilaktika ekrani chiqadi; Administrator (`bahtiermustafoev1974@gmail.com`) esa to‘siqsiz saytga kiradi va boshqaradi.
   * Backend: [systemSettings.service.js](file:///C:/Users/maruf/USTOZ-AI/server/services/systemSettings.service.js) & `server/database/system_settings.json`.

2. **📊 O‘quvchilar Faolligi & Fanlar Analitikasi (Analytics & Leaderboard):**
   * Real-time o‘quvchilar natijalarini hisoblovchi analitika dvigateli: [analytics.service.js](file:///C:/Users/maruf/USTOZ-AI/server/services/analytics.service.js).
   * **Top-10 O‘quvchilar Reytingi**: 🥇 Oltin, 🥈 Kumush, 🥉 Bronza medallari, bajarilgan darslar, test ballari va PRO holati.
   * **⭐ PRO Sovg‘a qilish**: Reytingdagi iqtidorli o‘quvchilarga to‘g‘ridan-to‘g‘ri jadvalning o‘zidan PRO obuna berish.
   * **Fanlar Mashhurligi**: Qaysi fanlar ko‘proq o‘qilayotganini ko‘rsatuvchi foizli diagrammalar.

3. **📨 Foydalanuvchiga Shaxsiy Bildirishnoma Yuborish (Direct Notice):**
   * Admin foydalanuvchini tanlab, unga shaxsiy xabar, tabrik yoki ogohlantirish yuborishi mumkin.
   * Foydalanuvchi sahifaga kirishi bilan ekranda chiroyli tabrik modal oynasi ochiladi va «✓ Tushundim» tugmasi bilan o‘qilgan deb belgilanadi.
   * Backend: [notification.service.js](file:///C:/Users/maruf/USTOZ-AI/server/services/notification.service.js) & `server/database/notifications.json`.

4. **🧠 AI Model & Dvigatel Sozlamalari (AI Engine Settings):**
   * Asosiy AI Provayderini tanlash: **⚡ Groq Cloud** (`openai/gpt-oss-120b`) va **🌟 Google Gemini** (`gemini-3.8-flash`).
   * Tyutor uslubi/ohangi: Do‘stona, Akademik, Sokratik yoki Maxsus Prompt.
   * Harorat (Temperature) slayderi: 0.10 dan 1.00 gacha ijodiylikni boshqarish.
   * Integratsiya: [tutor.js](file:///C:/Users/maruf/USTOZ-AI/server/ai-engine/tutor.js) AI so‘rovlarini ushbu sozlamalar asosida dinamik shakllantiradi.

---

### B. Admin Paneldagi Avvalgi Barcha Funksiyalar (To‘liq Saqlangan):
* 👥 **Foydalanuvchilar Boshqaruvi**: Ro‘yxat, qidiruv, PRO berish va bekor qilish, bloklash (Ban) va ovozini o‘chirish (Mute).
* 📢 **Umumiy E’lonlar (Broadcast Banner)**: Sayt tepasida ko‘rinadigan tasma e’lon matni va ranglari.
* 🎁 **Promokodlar Generatori**: PRO obuna uchun chegirma va promokodlar yaratish.
* 📚 **Darslar & Fanlar Boshqaruvi**: 19 ta 7 bosqichli boy darslarni tahrirlash va yangi fanlar qo‘shish.
* 🤖 **AI Salomatligi**: Groq va Gemini API jonli holati, kunlik limitlar hisoblagichi.
* 💬 **Support Inbox**: Foydalanuvchilar yozgan murojaatlar va adminning jonli javoblari.
* 🛡️ **Guruh Nazorati**: Guruh chatini tozalash va xabarlarni bittalab o‘chirish.
* 📋 **Audit Loglari**: Qilingan barcha amallar va moderatorlik jurnali.

---

### C. Foydalanuvchi Interfeysi (UI) Tozalanishi:
* **Chap Menyuda faqat 2 ta narsa qoldirildi**:
  1. 💬 **Gulasal AI Chat** — Asosiy sun’iy intellekt muloqot interfeysi.
  2. 👑 **Admin Paneli** — Faqat admin (`bahtiermustafoev1974@gmail.com`) uchun.
* **Tozalangan bo‘limlar**: Qizlar guruhi, AI Mentor, Eilist, Fanlar va darslar, AI ta’lim asboblari menyudan chiqarildi.
* **Sozlamalar**: Dastur mavzulari (Dark luxury, neon, phone-themes) o‘ng yuqoridagi profil menyusi ichidagi **«⚙️ Dastur Sozlamalari»** bo‘limiga qulay joylashtirildi.

---

## 📂 2. Asosiy Fayllar Joylashuvi

| Fayl Nomi | To'liq Manzili | Tavsifi |
| :--- | :--- | :--- |
| **Admin UI** | [admin.js](file:///C:/Users/maruf/USTOZ-AI/client/admin/admin.js) | Barcha 11 ta tab, jadvallar va modallar |
| **Admin Controller** | [admin.controller.js](file:///C:/Users/maruf/USTOZ-AI/server/controllers/admin.controller.js) | Backend API boshqaruvchilari |
| **Tizim & AI Sozlamalari** | [systemSettings.service.js](file:///C:/Users/maruf/USTOZ-AI/server/services/systemSettings.service.js) | Profilaktika va AI konfiguratsiyasi |
| **Analitika Xizmati** | [analytics.service.js](file:///C:/Users/maruf/USTOZ-AI/server/services/analytics.service.js) | Top-10 reyting va fanlar statistikasi |
| **Bildirishnomalar Xizmati** | [notification.service.js](file:///C:/Users/maruf/USTOZ-AI/server/services/notification.service.js) | Foydalanuvchilarga shaxsiy xabarnomalar |
| **AI Dvigateli** | [tutor.js](file:///C:/Users/maruf/USTOZ-AI/server/ai-engine/tutor.js) | Groq va Gemini dynamic provider |
| **Chap Menyu** | [sidebar.js](file:///C:/Users/maruf/USTOZ-AI/client/sidebar/sidebar.js) | Ixcham menyu (faqat Chat va Admin) |
| **Yuqori Panel** | [Navbar.js](file:///C:/Users/maruf/USTOZ-AI/client/components/Navbar.js) | Profil, Sozlamalar va bildirishnomalar |
| **API Yo'nalishlari** | [api.routes.js](file:///C:/Users/maruf/USTOZ-AI/server/routes/api.routes.js) | Barcha server marshrutlari |
| **Zaxira ZIP** | [USTOZ_AI_BACKUP_2026-11-15.zip](file:///C:/Users/maruf/USTOZ-AI/storage/backups/USTOZ_AI_BACKUP_2026-11-15.zip) | Loyihaning to'liq arxiv nusxasi |

---

## 🚀 3. Ertaga Ishni Davom Ettirish Rejalari (Tavsiyalar)

1. 🎙️ **Jonli Ovozli Suhbat Rejimi (Hands-Free Voice Call)**: Ovozli to'lqinlar bilan real-time AI ovozli suhbat.
2. 📂 **Suhbatlar Tarixi & Mavzular Arxivi (Chat History)**: ChatGPT kabi alohida mavzularda chatlar ochish va PDF/Word eksport.
3. 📸 **Rasm va Fayllarni Tahlil Qilish (AI Vision)**: Masalalar fotosuratini yoki PDF konspektni yuklab tahlil qilish.
4. 🎭 **Tezkor AI Rollari (Personas)**: Repetitor, Senior Dasturchi, IELTS Native Speaker, Insho tekshiruvchi.
5. 🧠 **Doimiy AI Xotirasi (Long-Term Memory)**: O'quvchining maqsadi va bilim darajasini eslab qolish.
6. 💳 **Click / Payme To'lov Tizimi**: PRO obuna uchun qulay avtomatik to'lov.

---

## 💻 4. Serverni Ishga Tushirish
Ertaga kompyuterni yoqqaningizda terminalda quyidagi buyruqni berishingiz kifoya:
```powershell
cd C:\Users\maruf\USTOZ-AI
node server.js
```
Sayt manzillari:
* **Kompyuterda:** `http://localhost:3000`
* **Telefon yoki boshqa qurilmada (Wi-Fi):** `http://192.168.100.158:3000`
