const fs = require('fs');
const path = require('path');
const tutorAI = require('../ai-engine/tutor');

class MistakesService {
  constructor() {
    this.filePath = path.join(__dirname, '..', 'database', 'mistakes.json');
    this.ensureFile();
  }

  ensureFile() {
    try {
      if (!fs.existsSync(this.filePath)) {
        fs.writeFileSync(this.filePath, JSON.stringify({}, null, 2), 'utf8');
      }
    } catch (e) {
      console.error('[MISTAKES SERVICE] ensureFile error:', e);
    }
  }

  readData() {
    try {
      if (!fs.existsSync(this.filePath)) return {};
      const raw = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(raw || '{}');
    } catch {
      return {};
    }
  }

  writeData(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[MISTAKES SERVICE] writeData error:', e);
    }
  }

  getMistakes(userId = 'guest_general') {
    const data = this.readData();
    const userMistakes = data[userId] || [];
    return Array.isArray(userMistakes) ? userMistakes : [];
  }

  recordMistake(userId = 'guest_general', mistake = {}) {
    const data = this.readData();
    if (!data[userId]) data[userId] = [];

    const existingIndex = data[userId].findIndex(
      m => m.questionText === mistake.questionText || (mistake.id && m.id === mistake.id)
    );

    const record = {
      id: mistake.id || `mistake_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      lessonId: mistake.lessonId || '',
      lessonTitle: mistake.lessonTitle || 'Dars amaliyoti',
      subjectId: mistake.subjectId || 'general',
      subjectName: mistake.subjectName || 'Fan',
      questionText: mistake.questionText || '',
      userAnswer: mistake.userAnswer || '',
      correctAnswer: mistake.correctAnswer || '',
      explanation: mistake.explanation || '',
      options: Array.isArray(mistake.options) ? mistake.options : [],
      recordedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      data[userId][existingIndex] = { ...data[userId][existingIndex], ...record };
    } else {
      data[userId].unshift(record);
      if (data[userId].length > 100) {
        data[userId] = data[userId].slice(0, 100);
      }
    }

    this.writeData(data);
    return record;
  }

  deleteMistake(userId = 'guest_general', mistakeId) {
    const data = this.readData();
    if (!data[userId]) return false;

    const initialLength = data[userId].length;
    data[userId] = data[userId].filter(m => m.id !== mistakeId);
    this.writeData(data);
    return data[userId].length < initialLength;
  }

  async explainMistake(userId = 'guest_general', mistakeId) {
    const mistakes = this.getMistakes(userId);
    const item = mistakes.find(m => m.id === mistakeId);
    if (!item) {
      throw new Error('Xatolik topilmadi.');
    }

    const prompt = `Siz Ustoz-AI ta'lim yordamchisisiz. Talaba quyidagi test savolida xatoga yo'l qo'ydi:

Savol: "${item.questionText}"
O'quvchi tanlagan javob: "${item.userAnswer}"
To'g'ri javob: "${item.correctAnswer}"
Mavjud qisqa izoh: "${item.explanation || ''}"

Vazifangiz:
1. O'quvchini ruhlantiring (xato qilish o'rganishning tabiiy qismi).
2. Nima uchun uning tanlagan javobi xato ekanligini sodda va tushunarli qilib ko'rsating.
3. To'g'ri javob nima uchun aynan shunday bo'lishini mantiqiy yoki formula bilan bosqichma-bosqich isbotlang.
4. Kelgusida bunday savollarda adashmaslik uchun o'quvchiga 1 ta qisqa qoida/eslatma (Lifehack) bering.

Javobni samimiy o'zbek tilida, chiroyli formatda bering.`;

    try {
      return await tutorAI.processQuery(prompt, {});
    } catch (e) {
      return `Hurmatli o'quvchi! To'g'ri javob: "${item.correctAnswer}". ${item.explanation || "Mavzuni diqqat bilan takrorlashni tavsiya qilamiz."}`;
    }
  }
}

module.exports = new MistakesService();
