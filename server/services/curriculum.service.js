
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const lessonService = require('./lesson.service');
const dynamicQuizService = require('./dynamicQuiz.service');

const DB_DIR = path.join(__dirname, '..', 'database');
const CURRICULUM_FILE = path.join(DB_DIR, 'curriculum.json');
const PROGRESS_FILE = path.join(DB_DIR, 'curriculum_progress.json');

class CurriculumService {
  constructor() {
    this.ensureFiles();
  }

  ensureFiles() {
    fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(PROGRESS_FILE)) {
      fs.writeFileSync(
        PROGRESS_FILE,
        JSON.stringify({ users: {} }, null, 2),
        'utf8'
      );
    }
  }

  readCurriculum() {
    try {
      if (!fs.existsSync(CURRICULUM_FILE)) return { subjects: [] };
      const raw = fs.readFileSync(CURRICULUM_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      console.error('[CURRICULUM READ ERROR]', error.message);
      return { subjects: [] };
    }
  }

  readProgress() {
    this.ensureFiles();
    try {
      const raw = fs.readFileSync(PROGRESS_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data) || !data.users) {
        return { users: {} };
      }
      return data;
    } catch (error) {
      console.error('[CURRICULUM PROGRESS READ ERROR]', error.message);
      return { users: {} };
    }
  }

  writeProgress(data) {
    this.ensureFiles();
    const tempFile = path.join(
      DB_DIR,
      `curriculum-prog-${process.pid}-${crypto.randomUUID()}.tmp`
    );
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, PROGRESS_FILE);
      return true;
    } catch (error) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}
      console.error('[CURRICULUM PROGRESS WRITE ERROR]', error.message);
      return false;
    }
  }

  getUserStore(userId = 'guest_general') {
    const validId = String(userId || 'guest_general').trim();
    const db = this.readProgress();
    if (!db.users[validId]) {
      db.users[validId] = {
        lessons: {},
        subjects: {},
        updatedAt: new Date().toISOString()
      };
      this.writeProgress(db);
    }
    return { db, userStore: db.users[validId], userId: validId };
  }

  findLesson(lessonId) {
    const curriculum = this.readCurriculum();

    // Map daily lesson IDs (e.g. lesson_2026-11-14_2 -> lesson_it_async)
    const dailyIndexMatch = String(lessonId || '').match(/_([1-5])$/);
    const dailyMap = {
      '1': 'lesson_math_quadratic',
      '2': 'lesson_it_async',
      '3': 'lesson_eng_writing2',
      '4': 'lesson_phys_newton',
      '5': 'lesson_uzb_syntax'
    };
    const targetId = (dailyIndexMatch && dailyMap[dailyIndexMatch[1]]) ? dailyMap[dailyIndexMatch[1]] : lessonId;

    for (const subject of curriculum.subjects || []) {
      for (const topic of subject.topics || []) {
        for (const lesson of topic.lessons || []) {
          if (
            lesson.id === lessonId ||
            lesson.id === targetId ||
            lesson.dailyLessonId === lessonId ||
            (lessonId && lessonId.includes(lesson.id))
          ) {
            return {
              lesson,
              topic,
              subject
            };
          }
        }
      }
    }
    return null;
  }

  // GET ALL SUBJECTS WITH USER PROGRESS
  getSubjectsWithProgress(userId = 'guest_general') {
    const curriculum = this.readCurriculum();
    const { userStore } = this.getUserStore(userId);
    const userLessons = userStore.lessons || {};

    const subjects = (curriculum.subjects || []).map(subject => {
      let totalLessons = 0;
      let completedLessons = 0;
      let totalStagesAcrossSubject = 0;
      let completedStagesAcrossSubject = 0;

      const topics = (subject.topics || []).map(topic => {
        const lessons = (topic.lessons || []).map(lesson => {
          totalLessons++;
          const lessonProgress = userLessons[lesson.id] || {
            completedStages: [],
            currentStage: 1,
            totalStages: lesson.totalStages || 5,
            progress: 0,
            completed: false
          };

          const totalStages = lesson.totalStages || 5;
          const completedCount = Array.isArray(lessonProgress.completedStages)
            ? lessonProgress.completedStages.length
            : 0;

          totalStagesAcrossSubject += totalStages;
          completedStagesAcrossSubject += completedCount;

          if (lessonProgress.completed) {
            completedLessons++;
          }

          return {
            id: lesson.id,
            title: lesson.title,
            subtitle: lesson.subtitle || '',
            duration: lesson.duration || '20 daqiqa',
            icon: lesson.icon || subject.icon,
            badge: lesson.badge || '',
            totalStages,
            completedStagesCount: completedCount,
            progress: lessonProgress.progress || 0,
            completed: Boolean(lessonProgress.completed),
            currentStage: lessonProgress.currentStage || 1
          };
        });

        return {
          id: topic.id,
          order: topic.order,
          title: topic.title,
          description: topic.description,
          lessons
        };
      });

      // Calculate subject progress: based on completed stages & lessons
      let progressPercentage = 0;
      if (totalStagesAcrossSubject > 0) {
        progressPercentage = Math.round(
          (completedStagesAcrossSubject / totalStagesAcrossSubject) * 100
        );
      }

      return {
        id: subject.id,
        name: subject.name,
        icon: subject.icon,
        description: subject.description,
        category: subject.category || 'Ta’lim',
        totalTopics: (subject.topics || []).length,
        totalLessons,
        completedLessons,
        progress: progressPercentage,
        topics
      };
    });

    return subjects;
  }

  // GET LESSON DETAIL WITH USER PROGRESS
  getLessonDetail(userId = 'guest_general', lessonId) {
    const found = this.findLesson(lessonId);
    if (!found) {
      throw new Error(`Dars topilmadi: ${lessonId}`);
    }

    const { lesson, topic, subject } = found;
    const { userStore } = this.getUserStore(userId);
    const userLessons = userStore.lessons || {};

    let lessonProgress = userLessons[lesson.id];
    if (!lessonProgress) {
      lessonProgress = {
        completedStages: [],
        currentStage: 1,
        totalStages: lesson.totalStages || (lesson.stages ? lesson.stages.length : 5),
        progress: 0,
        completed: false,
        completedAt: null,
        quizScore: null
      };
      userLessons[lesson.id] = lessonProgress;
    }

    const totalStages = lesson.totalStages || (lesson.stages ? lesson.stages.length : 5);
    const completedStages = Array.isArray(lessonProgress.completedStages)
      ? lessonProgress.completedStages
      : [];
    const completedCount = completedStages.length;
    const progressPercentage = Math.min(
      100,
      Math.round((completedCount / totalStages) * 100)
    );

    // Map stages with user-specific unlock & complete status
    const stages = (lesson.stages || []).map((stage, idx) => {
      const stageNum = stage.stage || idx + 1;
      const isCompleted = completedStages.includes(stageNum);
      // Stage is unlocked if it's stage 1 OR previous stage is completed
      const isUnlocked = stageNum === 1 || completedStages.includes(stageNum - 1) || isCompleted;

      return {
        ...stage,
        stage: stageNum,
        isCompleted,
        isUnlocked,
        isCurrent: lessonProgress.currentStage === stageNum
      };
    });

    return {
      lesson: {
        id: lesson.id,
        title: lesson.title,
        subtitle: lesson.subtitle,
        duration: lesson.duration,
        icon: lesson.icon,
        totalStages,
        stages
      },
      topic: {
        id: topic.id,
        title: topic.title
      },
      subject: {
        id: subject.id,
        name: subject.name,
        icon: subject.icon
      },
      progress: {
        completedStages,
        completedCount,
        totalStages,
        percentage: progressPercentage,
        currentStage: lessonProgress.currentStage || 1,
        completed: Boolean(lessonProgress.completed),
        completedAt: lessonProgress.completedAt,
        quizScore: lessonProgress.quizScore || null
      }
    };
  }

  // COMPLETE STAGE
  completeStage(userId = 'guest_general', lessonId, stageNumber) {
    const stageNum = Number.parseInt(stageNumber, 10);
    if (!Number.isInteger(stageNum) || stageNum < 1) {
      throw new Error('Bosqich raqami noto‘g‘ri.');
    }

    const found = this.findLesson(lessonId);
    if (!found) {
      throw new Error(`Dars topilmadi: ${lessonId}`);
    }

    const { lesson, subject } = found;
    const totalStages = lesson.totalStages || (lesson.stages ? lesson.stages.length : 5);

    if (stageNum > totalStages) {
      throw new Error(`Mavjud bo‘lmagan bosqich (jami ${totalStages} ta).`);
    }

    const { db, userStore } = this.getUserStore(userId);
    if (!userStore.lessons) userStore.lessons = {};

    let lessonProgress = userStore.lessons[lesson.id];
    if (!lessonProgress) {
      lessonProgress = {
        completedStages: [],
        currentStage: 1,
        totalStages,
        progress: 0,
        completed: false,
        completedAt: null
      };
      userStore.lessons[lesson.id] = lessonProgress;
    }

    if (!Array.isArray(lessonProgress.completedStages)) {
      lessonProgress.completedStages = [];
    }

    // Add stage to completed list (prevent duplicates)
    if (!lessonProgress.completedStages.includes(stageNum)) {
      lessonProgress.completedStages.push(stageNum);
      lessonProgress.completedStages.sort((a, b) => a - b);
    }

    const completedCount = lessonProgress.completedStages.length;
    const percentage = Math.min(
      100,
      Math.round((completedCount / totalStages) * 100)
    );

    lessonProgress.totalStages = totalStages;
    lessonProgress.progress = percentage;
    lessonProgress.updatedAt = new Date().toISOString();

    // Advance currentStage if the completed stage was the current one
    if (stageNum < totalStages) {
      lessonProgress.currentStage = stageNum + 1;
    } else {
      lessonProgress.currentStage = totalStages;
    }

    // If all stages are completed:
    if (completedCount >= totalStages) {
      lessonProgress.completed = true;
      lessonProgress.completedAt = new Date().toISOString();

      // Synchronize with daily_lessons.json if applicable
      try {
        this.syncDailyLesson(userId, lesson.id);
      } catch (e) {
        console.warn('[SYNC DAILY LESSON WARN]', e.message);
      }
    }

    this.writeProgress(db);

    // Gamification Hook: record stage completion XP
    try {
      const gamificationService = require('./gamification.service');
      gamificationService.recordActivity(userId, 'lesson_stage_completed', {
        subjectId: subject.id,
        lessonId: lesson.id,
        stage: stageNum
      });
      if (completedCount >= totalStages) {
        gamificationService.recordActivity(userId, 'lesson_finished', {
          subjectId: subject.id,
          lessonId: lesson.id
        });
      }
    } catch (gErr) {
      console.warn('[GAMIFICATION STAGE HOOK WARN]', gErr.message);
    }

    return this.getLessonDetail(userId, lesson.id);
  }

  // GET DYNAMIC AI QUIZ FOR STAGE 7
  async getLessonDynamicQuiz(userId = 'guest_general', lessonId, forceNew = false) {
    const found = this.findLesson(lessonId);
    if (!found) {
      throw new Error(`Dars topilmadi: ${lessonId}`);
    }

    const { lesson, topic, subject } = found;
    const { db, userStore } = this.getUserStore(userId);
    if (!userStore.lessons) userStore.lessons = {};
    if (!userStore.lessons[lesson.id]) {
      userStore.lessons[lesson.id] = {
        completedStages: [],
        currentStage: 1,
        totalStages: lesson.totalStages || 7,
        progress: 0,
        completed: false,
        completedAt: null,
        quizScore: null
      };
    }

    const lessonProgress = userStore.lessons[lesson.id];
    const quizPayload = await dynamicQuizService.getOrGenerateQuiz(
      userId,
      lesson,
      topic,
      subject,
      lessonProgress,
      Boolean(forceNew)
    );

    this.writeProgress(db);
    return quizPayload;
  }

  // SUBMIT TEST FOR STAGE 7
  submitTest(userId = 'guest_general', lessonId, answers = {}) {
    const found = this.findLesson(lessonId);
    if (!found) {
      throw new Error(`Dars topilmadi: ${lessonId}`);
    }

    const { lesson, subject } = found;
    const { db, userStore } = this.getUserStore(userId);
    if (!userStore.lessons) userStore.lessons = {};
    if (!userStore.lessons[lesson.id]) {
      userStore.lessons[lesson.id] = {
        completedStages: [],
        currentStage: 1,
        totalStages: lesson.totalStages || 7,
        progress: 0,
        completed: false,
        completedAt: null,
        quizScore: null
      };
    }

    const lessonProgress = userStore.lessons[lesson.id];
    let gradeData;

    // Check if active dynamic quiz exists
    if (lessonProgress.quizData?.activeQuiz) {
      gradeData = dynamicQuizService.gradeQuiz(lessonProgress, lesson.id, answers);
    } else {
      // Fallback to static quiz in lesson
      const quizStage = (lesson.stages || []).find(s => s.type === 'quiz' || s.stage === 7);
      if (!quizStage || !quizStage.content?.questions) {
        throw new Error('Test savollari topilmadi.');
      }

      const questions = quizStage.content.questions;
      let correctCount = 0;
      const results = [];

      for (const q of questions) {
        const userAnswer = answers[q.id];
        const correctOption = q.options.find(o => o.correct === true);
        const isCorrect = userAnswer === correctOption?.id;

        if (isCorrect) correctCount++;

        results.push({
          id: q.id,
          question: q.question,
          options: q.options,
          userAnswer: userAnswer || null,
          correctAnswer: correctOption?.id || null,
          isCorrect,
          explanation: q.explanation || ''
        });
      }

      const totalQuestions = questions.length;
      const scorePercentage = Math.round((correctCount / totalQuestions) * 100);

      gradeData = {
        score: {
          correctCount,
          totalQuestions,
          scorePercentage,
          passed: scorePercentage >= 60,
          difficulty: 'medium',
          difficultyLabel: 'O‘rta',
          nextDifficulty: scorePercentage >= 80 ? 'hard' : (scorePercentage < 50 ? 'easy' : 'medium'),
          nextDifficultyLabel: scorePercentage >= 80 ? 'Murakkab' : (scorePercentage < 50 ? 'Boshlang‘ich' : 'O‘rta'),
          attemptNumber: 1
        },
        results
      };

      lessonProgress.quizScore = {
        correctCount,
        totalQuestions,
        scorePercentage,
        passed: scorePercentage >= 60,
        takenAt: new Date().toISOString()
      };
    }

    const scorePercentage = gradeData.score.scorePercentage;
    const stageNum = 7;
    if (!Array.isArray(lessonProgress.completedStages)) {
      lessonProgress.completedStages = [];
    }
    if (!lessonProgress.completedStages.includes(stageNum)) {
      lessonProgress.completedStages.push(stageNum);
      lessonProgress.completedStages.sort((a, b) => a - b);
    }

    const completedCount = lessonProgress.completedStages.length;
    const totalStages = lesson.totalStages || 7;
    lessonProgress.progress = Math.min(100, Math.round((completedCount / totalStages) * 100));

    if (completedCount >= totalStages) {
      lessonProgress.completed = true;
      lessonProgress.completedAt = new Date().toISOString();
      try {
        this.syncDailyLesson(userId, lesson.id);
      } catch (e) {}
    }

    this.writeProgress(db);

    // Gamification Hook: record test completion
    try {
      const gamificationService = require('./gamification.service');
      gamificationService.recordActivity(userId, 'lesson_stage_completed', {
        subjectId: subject.id,
        lessonId: lesson.id,
        stage: 7
      });
      if (scorePercentage >= 60) {
        gamificationService.recordActivity(userId, 'lesson_finished', {
          subjectId: subject.id,
          lessonId: lesson.id
        });
      }
    } catch (gErr) {
      console.warn('[GAMIFICATION TEST HOOK WARN]', gErr.message);
    }

    return {
      score: gradeData.score,
      results: gradeData.results,
      lessonDetail: this.getLessonDetail(userId, lesson.id)
    };
  }

  // SYNCHRONIZE WITH DAILY LESSON
  syncDailyLesson(userId, lessonId) {
    if (!lessonService) return;
    try {
      const daily = lessonService.getDailyProgress(userId);
      const match = (daily.lessons || []).find(
        l => l.title.includes('Kvadrat') || l.id.includes('math') || l.id.includes('_1')
      );
      if (match && !match.completed) {
        lessonService.toggleLesson(userId, match.id, true);
        console.log(`[CURRICULUM SYNC] Daily lesson marked completed: ${match.id}`);
      }
    } catch (err) {
      console.warn('[SYNC DAILY ERROR]', err.message);
    }
  }

  // RESET LESSON
  resetLesson(userId = 'guest_general', lessonId) {
    const { db, userStore } = this.getUserStore(userId);
    if (userStore.lessons && userStore.lessons[lessonId]) {
      const prevQuizData = userStore.lessons[lessonId].quizData || {};
      userStore.lessons[lessonId] = {
        completedStages: [],
        currentStage: 1,
        totalStages: 7,
        progress: 0,
        completed: false,
        completedAt: null,
        quizScore: null,
        quizData: {
          seenQuestionSignatures: prevQuizData.seenQuestionSignatures || [],
          difficulty: prevQuizData.difficulty || 'medium',
          attemptsCount: prevQuizData.attemptsCount || 0,
          history: prevQuizData.history || [],
          activeQuiz: null // Cleared so fresh unseen questions will generate on next attempt
        }
      };
      this.writeProgress(db);
    }
    return this.getLessonDetail(userId, lessonId);
  }

  // ==========================================
  // ADMIN CONTENT MANAGEMENT METHODS
  // ==========================================

  saveCurriculum(curriculumData) {
    try {
      fs.writeFileSync(CURRICULUM_FILE, JSON.stringify(curriculumData, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('[CURRICULUM SAVE ERROR]', e);
      throw e;
    }
  }

  getSubjectsSummary() {
    const cur = this.readCurriculum();
    return (cur.subjects || []).map(s => ({
      id: s.id,
      name: s.name,
      icon: s.icon || '📚',
      description: s.description || '',
      topicsCount: (s.topics || []).length,
      topics: (s.topics || []).map(t => ({
        id: t.id,
        order: t.order,
        title: t.title,
        description: t.description || '',
        lessonsCount: (t.lessons || []).length
      }))
    }));
  }

  addTopic(subjectId, { title, description }) {
    if (!subjectId || !title) {
      throw new Error('Fan ID va Mavzu nomi ko‘rsatilishi shart.');
    }
    const cur = this.readCurriculum();
    const subject = (cur.subjects || []).find(s => s.id === subjectId);
    if (!subject) {
      throw new Error('Bunday fan topilmadi: ' + subjectId);
    }

    subject.topics = subject.topics || [];
    const topicId = `${subjectId}_topic_${Date.now()}`;
    const lessonId = `lesson_${subjectId}_${Date.now()}`;

    const newTopic = {
      id: topicId,
      order: subject.topics.length + 1,
      title: String(title).trim(),
      description: String(description || '').trim() || 'Ushbu mavzu bo‘yicha interaktiv dars va mashqlar',
      lessons: [
        {
          id: lessonId,
          dailyLessonId: lessonId,
          title: String(title).trim(),
          subtitle: 'Nazariya, tushunchalar va amaliy mashg‘ulot',
          duration: '20 daqiqa',
          icon: subject.icon || '📖',
          badge: 'Yangi dars',
          totalStages: 7,
          stages: [
            {
              stage: 1,
              id: 'intro',
              title: 'Mavzuga kirish',
              subtitle: 'Asosiy tushunchalar va ahamiyati',
              type: 'theory',
              summary: `${title} mavzusi bo‘yicha darsga xush kelibsiz!`,
              content: {
                overview: description || `${title} mavzusini puxta o‘rganish sizning fanni chuqurroq tushunishingizga yordam beradi.`,
                goals: [
                  'Asosiy qoida va tushunchalarni o‘zlashtirish;',
                  'Amaliy misol va mashqlarni ko‘rib chiqish;',
                  'Bilimlarni test savollari orqali mustahkamlash.'
                ],
                tip: 'Har bir bosqichni diqqat bilan o‘rganing.'
              }
            },
            {
              stage: 2,
              id: 'concept',
              title: 'Asosiy tushunchalar',
              subtitle: 'Qoidalar va tushuntirish',
              type: 'concept',
              summary: 'Mavzuning poydevor qoidalari.',
              content: {
                definition: `${title} mavzusining asosiy ta’rifi va mohiyati.`,
                types: [
                  { type: '1-asosiy qoida', formula: 'Asosiy tushuncha', example: 'Mavzuga oid amaliy misol' }
                ]
              }
            },
            {
              stage: 3,
              id: 'formula',
              title: 'Formulalar va qoidalar',
              subtitle: 'Muhim qoidalar ro‘yxati',
              type: 'formula',
              summary: 'Yodda saqlash kerak bo‘lgan qoidalar.',
              content: {
                summary: 'Mavzuga oid asosiy formulalar va ulardan foydalanish tartibi.'
              }
            },
            {
              stage: 4,
              id: 'examples',
              title: 'Amaliy namunalar',
              subtitle: 'Misollar tahlili',
              type: 'examples',
              summary: 'Bosqichma-bosqich yechimlar.',
              content: {
                problems: [
                  {
                    num: 1,
                    statement: `${title} bo‘yicha 1-namunaviy misol`,
                    solution: ['1-qadam: Berilganlarni aniqlash', '2-qadam: Formulani qo‘llash', '3-qadam: Natijani hisoblash'],
                    answer: 'Yechim topildi'
                  }
                ]
              }
            },
            {
              stage: 5,
              id: 'practice',
              title: 'Mustaqil mashq',
              subtitle: 'O‘z bilimingizni sinab ko‘ring',
              type: 'practice',
              summary: 'Interaktiv mashg‘ulot.',
              content: {
                tasks: [
                  {
                    id: 't1',
                    question: `${title} mavzusiga oid amaliy savol:`,
                    hint: 'Darsning nazariya qismiga e’tibor bering.',
                    answer: 'To‘g‘ri javob'
                  }
                ]
              }
            },
            {
              stage: 6,
              id: 'mistakes',
              title: 'Ko‘p uchraydigan xatolar',
              subtitle: 'Diqqat qilish kerak bo‘lgan holatlar',
              type: 'mistakes',
              summary: 'Xatolardan saboq oling.',
              content: {
                cases: [
                  {
                    mistake: 'Shoshmashosharlik bilan hisoblash',
                    correct: 'Har bir bosqichni tekshirib borish',
                    explanation: 'E’tiborli bo‘lish to‘g‘ri natija garovidir.'
                  }
                ]
              }
            },
            {
              stage: 7,
              id: 'quiz',
              title: 'Yakuniy test',
              subtitle: 'Bilimlarni tekshirish',
              type: 'quiz',
              summary: 'Mavzuni to‘liq o‘zlashtirganingizni tasdiqlang.',
              content: {
                questions: [
                  {
                    id: 'q1',
                    question: `${title} mavzusi bo‘yicha asosiy tushuncha to‘g‘ri berilgan qatorni toping:`,
                    options: [
                      { id: 'A', text: 'To‘g‘ri ta’rif', correct: true },
                      { id: 'B', text: 'Noto‘g‘ri ta’rif', correct: false },
                      { id: 'C', text: 'Mavzuga aloqador emas', correct: false }
                    ],
                    explanation: 'Mavzu qoidalariga binoan A varianti to‘g‘ri.'
                  }
                ]
              }
            }
          ]
        }
      ]
    };

    subject.topics.push(newTopic);
    this.saveCurriculum(cur);
    return newTopic;
  }

  updateTopic(subjectId, topicId, { title, description }) {
    const cur = this.readCurriculum();
    const subject = (cur.subjects || []).find(s => s.id === subjectId);
    if (!subject) throw new Error('Fan topilmadi.');
    const topic = (subject.topics || []).find(t => t.id === topicId);
    if (!topic) throw new Error('Mavzu topilmadi.');

    if (title) topic.title = String(title).trim();
    if (description !== undefined) topic.description = String(description).trim();
    this.saveCurriculum(cur);
    return topic;
  }

  deleteTopic(subjectId, topicId) {
    const cur = this.readCurriculum();
    const subject = (cur.subjects || []).find(s => s.id === subjectId);
    if (!subject) throw new Error('Fan topilmadi.');
    const beforeCount = (subject.topics || []).length;
    subject.topics = (subject.topics || []).filter(t => t.id !== topicId);
    if (subject.topics.length === beforeCount) throw new Error('O‘chirish uchun mavzu topilmadi.');
    this.saveCurriculum(cur);
    return true;
  }
}

module.exports = new CurriculumService();
