const fs = require('fs');
const path = require('path');
const tutorAI = require('../ai-engine/tutor');
const curriculumService = require('./curriculum.service');

class AiLessonService {
  constructor() {
    this.curriculumFile = path.join(__dirname, '..', 'database', 'curriculum.json');
  }

  async generateLesson(userId = 'guest_general', topic, subjectHint = '') {
    const cleanTopic = String(topic || '').trim();
    if (!cleanTopic) {
      throw new Error('Mavzu nomini kiriting.');
    }

    const prompt = `Siz Ustoz-AI ta'lim tizimisiz. Siz o'quvchi uchun 7 bosqichli boy o'quv darsini (curriculum lesson) JSON formatida yaratishingiz kerak.
Mavzu: "${cleanTopic}"
Fan yo'nalishi: "${subjectHint || 'Umumiy ta\'lim'}"

Javobingiz FAQAT va FAQAT to'g'ri JSON bo'lishi shart! Hech qanday markdown (\`\`\`json) yoki ortiqcha matn qo'shmang.

JSON strukturasi aynan quyidagicha bo'lishi kerak:
{
  "title": "Mavzuning to'liq chiroyli nomi",
  "subjectId": "math yoki physics yoki it yoki english yoki uzb yoki chem yoki bio",
  "subjectName": "Fan nomi",
  "icon": "Tegishli emoji",
  "stages": [
    {
      "stage": 1,
      "title": "Kirish va Nazariya",
      "type": "theory",
      "content": {
        "text": "Mavzuning chuqur nazariy tushuntirishi (kamida 3-4 ta xatboshi, aniq va sodda tilda)",
        "keyPoints": ["Asosiy 1-qoida", "Asosiy 2-qoida", "Asosiy 3-qoida"]
      }
    },
    {
      "stage": 2,
      "title": "Asosiy Formulalar va Qoidalar",
      "type": "formula",
      "content": {
        "formulas": [
          { "name": "Asosiy formula/qoida nomi", "tex": "formula yoki matematik ifoda", "meaning": "Formulaning batafsil izohi" }
        ],
        "notes": "Eslab qolish kerak bo'lgan muhim qoida"
      }
    },
    {
      "stage": 3,
      "title": "Bosqichma-bosqich Misollar",
      "type": "examples",
      "content": {
        "exampleProblem": "Masala yoki amaliy topshiriq matni",
        "steps": [
          { "step": 1, "action": "1-qadam va izoh" },
          { "step": 2, "action": "2-qadam va hisoblash" },
          { "step": 3, "action": "3-qadam va yakuniy javob" }
        ]
      }
    },
    {
      "stage": 4,
      "title": "Interaktiv Amaliyot",
      "type": "interactive",
      "content": {
        "scenario": "O'quvchi o'z bilimini qo'llashi uchun qiziqarli amaliy ssenariy",
        "instruction": "Qanday qilib yechish bo'yicha yo'l-yo'riq"
      }
    },
    {
      "stage": 5,
      "title": "Xulosa va Konspekt",
      "type": "summary",
      "content": {
        "takeaways": [
          "Xulosaning 1-muhim qismi",
          "Xulosaning 2-muhim qismi",
          "Xulosaning 3-muhim qismi"
        ],
        "cheatSheet": "Tezkor eslatma (shporgalka) matni"
      }
    },
    {
      "stage": 6,
      "title": "Mustaqil Mashqlar",
      "type": "practice",
      "content": {
        "tasks": [
          "1-mustaqil topshiriq",
          "2-mustaqil topshiriq"
        ]
      }
    },
    {
      "stage": 7,
      "title": "Yakuniy Test (4 ta variantli)",
      "type": "quiz",
      "content": {
        "questions": [
          {
            "id": "q1",
            "question": "1-test savoli?",
            "options": [
              { "id": "a", "text": "A varianti", "correct": true },
              { "id": "b", "text": "B varianti", "correct": false },
              { "id": "c", "text": "C varianti", "correct": false },
              { "id": "d", "text": "D varianti", "correct": false }
            ],
            "explanation": "To'g'ri javob izohi"
          },
          {
            "id": "q2",
            "question": "2-test savoli?",
            "options": [
              { "id": "a", "text": "A varianti", "correct": false },
              { "id": "b", "text": "B varianti (To'g'ri)", "correct": true },
              { "id": "c", "text": "C varianti", "correct": false },
              { "id": "d", "text": "D varianti", "correct": false }
            ],
            "explanation": "To'g'ri javob izohi"
          },
          {
            "id": "q3",
            "question": "3-test savoli?",
            "options": [
              { "id": "a", "text": "A varianti", "correct": false },
              { "id": "b", "text": "B varianti", "correct": false },
              { "id": "c", "text": "C varianti (To'g'ri)", "correct": true },
              { "id": "d", "text": "D varianti", "correct": false }
            ],
            "explanation": "To'g'ri javob izohi"
          }
        ]
      }
    }
  ]
}`;

    let rawResponse;
    try {
      rawResponse = await tutorAI.callGroq(prompt, []);
    } catch (groqErr) {
      console.warn('[AI LESSON GROQ WARN, TRYING GEMINI]', groqErr.message);
      rawResponse = await tutorAI.callGemini(prompt, [], null, 'gemini-3.8-flash');
    }
    let parsed;
    try {
      const sanitized = rawResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      parsed = JSON.parse(sanitized);
    } catch (err) {
      console.error('[AI LESSON JSON PARSE ERROR]', rawResponse);
      throw new Error('AI dars yaratdi, ammo JSON formatida xatolik yuz berdi. Qayta urinib ko‘ring.');
    }

    if (!parsed.title || !Array.isArray(parsed.stages) || parsed.stages.length < 5) {
      throw new Error('AI darsi to‘liq tuzilmadi.');
    }

    // Assign unique ID and save to curriculum
    const lessonId = `lesson_ai_${Date.now()}`;
    const lessonObj = {
      id: lessonId,
      title: parsed.title,
      totalStages: parsed.stages.length,
      isAiGenerated: true,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      stages: parsed.stages
    };

    this.saveLessonToCurriculum(lessonObj, parsed.subjectId || 'it', parsed.subjectName || 'Sun\'iy Intellekt Fanlari', parsed.icon || '✨');

    return {
      lesson: lessonObj,
      subject: {
        id: parsed.subjectId || 'it',
        name: parsed.subjectName || 'Fan',
        icon: parsed.icon || '✨'
      }
    };
  }

  saveLessonToCurriculum(lessonObj, subjectId = 'it', subjectName = 'AI Fanlari', icon = '✨') {
    try {
      if (!fs.existsSync(this.curriculumFile)) return;
      const curriculum = JSON.parse(fs.readFileSync(this.curriculumFile, 'utf8'));

      let subject = (curriculum.subjects || []).find(s => s.id === subjectId);
      if (!subject) {
        subject = {
          id: subjectId,
          name: subjectName,
          icon: icon,
          category: 'AI va Yangi Fanlar',
          description: 'Sun\'iy intellekt tomonidan yaratilgan darslar',
          topics: []
        };
        if (!curriculum.subjects) curriculum.subjects = [];
        curriculum.subjects.push(subject);
      }

      if (!Array.isArray(subject.topics)) subject.topics = [];

      let customTopic = subject.topics.find(t => t.id === `${subjectId}_custom` || t.id.includes('custom'));
      if (!customTopic) {
        customTopic = {
          id: `${subjectId}_custom`,
          title: 'Maxsus va AI darslar',
          lessons: []
        };
        subject.topics.unshift(customTopic);
      }

      if (!Array.isArray(customTopic.lessons)) customTopic.lessons = [];
      customTopic.lessons.unshift(lessonObj);

      fs.writeFileSync(this.curriculumFile, JSON.stringify(curriculum, null, 2), 'utf8');
    } catch (e) {
      console.error('[SAVE AI LESSON ERROR]', e);
    }
  }
}

module.exports = new AiLessonService();
