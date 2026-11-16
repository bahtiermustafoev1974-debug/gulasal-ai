const aiEngine = require('../ai-engine/tutor');
const gamificationService = require('../services/gamification.service');

class ToolsController {
  async executeTool(req, res, body = {}) {
    try {
      const toolId = body.toolId;
      const input = typeof body.input === 'string'
        ? body.input.trim()
        : '';
      const image = body.image || null;
      const userId = req.headers['x-user-id'] || 'guest_demo_user';

      const allowedTools = [
        'math-solver',
        'essay-check',
        'code-helper',
        'quiz-generator',
        'photo-math',
        'speaking-examiner'
      ];

      if (!allowedTools.includes(toolId)) {
        return this.sendError(res, 400, 'Bunday vosita mavjud emas.');
      }

      // Maxsus Photo-Math tekshiruvi
      if (toolId === 'photo-math' && !image && !input) {
        return this.sendError(res, 400, 'Masala rasmini yuklang yoki matnini kiriting.');
      }

      // Boshqa vositalar uchun input tekshirish
      if (toolId !== 'photo-math' && !input) {
        return this.sendError(res, 400, 'Matn kiritishingiz kerak.');
      }

      if (input.length > 10000) {
        return this.sendError(res, 400, 'Matn 10 000 belgidan oshmasligi kerak.');
      }

      let result;
      let gamification = null;

      switch (toolId) {
        case 'math-solver':
          result = await aiEngine.solveFormula(input);
          break;

        case 'essay-check':
          result = await aiEngine.checkEssay(input);
          break;

        case 'code-helper':
          result = await aiEngine.helpCode(input);
          break;

        case 'quiz-generator':
          result = await aiEngine.processQuery(
            `Quyidagi mavzu bo'yicha o'zbek tilida test tuz. 
Har bir savolda A, B, C, D variantlari bo'lsin.
Oxirida javoblar kalitini alohida ko'rsat.

Mavzu: ${input}`
          );
          break;

        case 'photo-math': {
          const photoPrompt = `Siz oliy toifali matematika va aniq fanlar repetitorisiz.
Rasmda ko'rsatilgan masalani, formulani yoki chizmani sinchiklab tahlil qiling.
Javobingizni quyidagi chiroyli, tushunarli tartibda o'zbek tilida taqdim eting:

## 📝 1. Rasmda aniqlangan masala:
(Masalaning to'liq matni, berilgan qiymatlar va formulalar)

## 📐 2. Formulalar va nazariya:
(Yechishda qo'llaniladigan qoidalar va formulalar)

## 🔍 3. Bosqichma-bosqich yechim:
(Har bir amalni qadamma-qadam, oraliq hisoblashlar va tushuntirish bilan ko'rsating)

## ✅ 4. Yakuniy javob:
(Aniq va ravshan yakuniy javobni alohida ajratib yozing)

${input ? `Foydalanuvchi izohi: ${input}` : ''}`;

          if (image) {
            result = await aiEngine.callGemini(photoPrompt, [], image);
          } else {
            result = await aiEngine.processQuery(photoPrompt);
          }

          try {
            gamification = gamificationService.recordActivity(userId, 'photo_math_solved');
          } catch (e) {
            console.warn('[PHOTO MATH GAMIFICATION WARN]', e.message);
          }
          break;
        }

        case 'speaking-examiner': {
          const part = body.part || 'Part 1';
          const question = body.question || 'Describe your hometown.';
          const speakingPrompt = `Siz rasmiy va xolis IELTS Speaking Examiner (Imtihon oluvchi)siz.
O'quvchi quyidagi savolga javob berdi:

Imtihon bo'limi: ${part}
Savol: "${question}"
O'quvchining javobi: "${input}"

O'quvchining nutqini rasmiy IELTS 9-band shkalasi bo'yicha tahlil qilib, quyidagi tuzilishda hisobot bering:

## 🏆 Umumiy Band Ball: [Masalan: 6.5 / 9.0]

### 1. 🗣️ Fluency & Coherence (Ravonlik va Mantiq): [X.X / 9.0]
- Izoh va fikr bildirish

### 2. 📚 Lexical Resource (Lug'at boyligi): [X.X / 9.0]
- Foydalanilgan yaxshi so'zlar
- Qaysi oddiy so'zlarni akademik sinonimga almashtirish mumkin

### 3. ✍️ Grammatical Range & Accuracy (Grammatika): [X.X / 9.0]
- Mavjud grammatik xatolar va ularning to'g'rilangan shakli

### 4. 🎙️ Pronunciation & Delivery (Talaffuz va intonatsiya): [X.X / 9.0]
- Tavsiyalar

### 🌟 7.5+ Band uchun namunaviy ideal javob (Band 8.0 Model Answer):
(Savolga berilishi mumkin bo'lgan namunaviy yuqori balli javob)`;

          result = await aiEngine.processQuery(speakingPrompt);

          try {
            gamification = gamificationService.recordActivity(userId, 'speaking_evaluated');
          } catch (e) {
            console.warn('[SPEAKING GAMIFICATION WARN]', e.message);
          }
          break;
        }
      }

      if (typeof result !== 'string' || !result.trim()) {
        throw new Error('AI natija qaytarmadi.');
      }

      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8'
      });

      return res.end(JSON.stringify({
        success: true,
        toolId,
        result,
        gamification
      }));

    } catch (error) {
      console.error('[TOOLS ERROR]:', error.message);

      return this.sendError(
        res,
        500,
        'Vosita ishlashida xatolik yuz berdi: ' + error.message
      );
    }
  }

  sendError(res, statusCode, message) {
    if (res.headersSent) {
      if (!res.writableEnded) res.end();
      return;
    }

    res.writeHead(statusCode, {
      'Content-Type': 'application/json; charset=utf-8'
    });

    return res.end(JSON.stringify({
      success: false,
      message
    }));
  }
}

module.exports = new ToolsController();
