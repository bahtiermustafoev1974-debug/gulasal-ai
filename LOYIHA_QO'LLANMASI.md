# GULASAL AI — TO‘LIQ VA YANGILANGAN LOYIHA

Ushbu arxivda Gulasal AI platformasining barcha yangilangan kodlari, maʼlumotlar bazasi, sunʼiy intellekt moduli va frontend/backend qismlari to‘liq jamlangan.

---

### 🌟 Yangi qo‘shilgan va takomillashtirilgan funksiyalar:

1. **Qizlar Chat — Aʼzolar Tizimi:**
   - «Aʼzolar» ro‘yxatida va aʼzolar sonida faqat rasmiy Google hisobi bilan kirgan haqiqiy foydalanuvchilar ko‘rinadi.
   - Guest (mehmon) foydalanuvchilar ro‘yxatda ko‘rinmaydi va aʼzolar soniga qo‘shilmaydi.
   - Mehmonlarning chatdan foydalanish va xabar yozish imkoniyati to‘liq saqlangan.

2. **Xabarlarni O‘chirish & Huquqlar:**
   - Har bir foydalanuvchi faqat o‘zi yuborgan xabarlarni o‘chira oladi.
   - Yagona Administrator (`bahtiermustafoev1974@gmail.com`) barcha foydalanuvchilarning xabarlarini o‘chirish va butun chat tarixini tozalash huquqiga ega.
   - Ruxsatsiz o‘chirishga urinilganda backend darajasida 403 xatosi qaytariladi.
   - Xabar o‘chirilganda interfeys avtomatik yangilanadi.

3. **Yagona Administratorlik Tizimi:**
   - Saytda yagona maxsus administrator: `bahtiermustafoev1974@gmail.com` (`google_115401282415026396030`).
   - Adminlik huquqlari faqat backend tomonidan xavfsiz tekshiriladi.

4. **Dinamik Savollar Generatsiyasi & Takrorlanmasligi:**
   - Fanlar va darslar bo‘limida darsning 7-bosqichida (Yakuniy test) AI aynan dars nazariyasiga mos keluvchi 5 ta yangi sifatli savol tuzadi.
   - Har bir foydalanuvchi uchun yechilgan savollar tarixi saqlanadi va savollar takrorlanmaydi.
   - «🔄 Yangi savollar bilan qayta topshirish» tugmasi bosilganda mutlaqo yangi savollar to‘plami yaratiladi.

5. **Moslashuvchan Qiyinlik Darajasi (Adaptive Difficulty):**
   - 3 ta daraja: Boshlang‘ich (`easy`), O‘rta (`medium`), Murakkab (`hard`).
   - Test natijasi 80% dan yuqori bo‘lsa — keyingi safar Murakkab savollar beriladi.
   - Test natijasi 50% dan past bo‘lsa — savollar Boshlang‘ich darajaga soddalashtiriladi.

6. **Barcha Avvalgi Bo‘limlar:**
   - AI Ustoz, Gulasal AI Chat, IELTS (Eilist), Fanlar va darslar, Amaliy laboratoriyalar, Parabola simulyatori, Yutuqlar va Statistika.

---

### 🚀 Loyihani Ishga Tushirish:

1. Terminalni oching va loyiha papkasiga kiring:
   ```bash
   cd USTOZ-AI
   ```
2. Loyihani ishga tushiring:
   ```bash
   node server.js
   ```
3. Brauzerda oching:
   ```
   http://localhost:3000
   ```
