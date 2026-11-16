
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const tutor = require('../ai-engine/tutor');

const DB_DIR = path.join(__dirname, '..', 'database');
const BANK_FILE = path.join(DB_DIR, 'question_bank.json');
const PRACTICE_FILE = path.join(DB_DIR, 'dynamic_practice.json');

const SUBJECT_NAMES = {
  math: 'Matematika',
  physics: 'Fizika',
  informatics: 'Informatika va IT'
};

class DynamicPracticeService {
  constructor() {
    this.ensureFiles();
  }

  ensureFiles() {
    fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(PRACTICE_FILE)) {
      fs.writeFileSync(
        PRACTICE_FILE,
        JSON.stringify({ users: {} }, null, 2),
        'utf8'
      );
    }
  }

  readBank() {
    try {
      if (!fs.existsSync(BANK_FILE)) return { questions: [] };
      const raw = fs.readFileSync(BANK_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('[BANK READ ERROR]', e.message);
      return { questions: [] };
    }
  }

  writeBank(bank) {
    const tempFile = path.join(DB_DIR, `bank-${process.pid}-${crypto.randomUUID()}.tmp`);
    try {
      fs.writeFileSync(tempFile, JSON.stringify(bank, null, 2), 'utf8');
      fs.renameSync(tempFile, BANK_FILE);
      return true;
    } catch (e) {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
      console.error('[BANK WRITE ERROR]', e.message);
      return false;
    }
  }

  readUserPractice() {
    this.ensureFiles();
    try {
      const raw = fs.readFileSync(PRACTICE_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data) || !data.users) {
        return { users: {} };
      }
      return data;
    } catch (e) {
      console.error('[PRACTICE READ ERROR]', e.message);
      return { users: {} };
    }
  }

  writeUserPractice(data) {
    this.ensureFiles();
    const tempFile = path.join(DB_DIR, `practice-${process.pid}-${crypto.randomUUID()}.tmp`);
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, PRACTICE_FILE);
      return true;
    } catch (e) {
      try { if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile); } catch {}
      console.error('[PRACTICE WRITE ERROR]', e.message);
      return false;
    }
  }

  getUserSubjectState(db, userId, subjectId) {
    const uid = String(userId || 'guest_general').trim();
    if (!db.users[uid]) {
      db.users[uid] = {};
    }
    const userRoot = db.users[uid];
    if (!userRoot[subjectId]) {
      userRoot[subjectId] = {
        history: [],
        currentRound: 1,
        currentQuestions: [],
        currentDifficulty: 'medium',
        rounds: [],
        stats: {
          roundsCompleted: 0,
          totalQuestions: 0,
          correctAnswers: 0,
          accuracy: 0
        }
      };
    }
    return userRoot[subjectId];
  }

  // Shuffle array using Fisher-Yates
  shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // AI Generation for infinite new questions
  async generateAIQuestions(subjectId, count = 6, difficulty = 'medium') {
    const subName = SUBJECT_NAMES[subjectId] || 'Matematika';
    console.log(`[AI QUESTION GEN] Generating ${count} new questions for ${subName} (${difficulty})...`);

    const prompt = `Siz malakali ta'lim metodistisiz. Quyidagi fan bo‘yicha O‘zbekiston milliy dasturiga mos ${count} ta yangi, sifatli test savolini JSON formatida tuzing:
Fan: ${subName}
Qiyinlik darajasi: ${difficulty}
Har bir savol 4 ta variant (A, B, C, D) va bitta to‘g‘ri javobdan iborat bo‘lsin.
JAVOBNI FAQAT quyidagi JSON formatida qaytaring, boshqa hech qanday so‘z yoki matn qo‘shmang:
[
  {
    "id": "${subjectId}_ai_${Date.now()}_1",
    "subject": "${subjectId}",
    "topic": "Amaliy mavzu",
    "difficulty": "${difficulty}",
    "question": "Savol matni?",
    "options": [
      { "id": "A", "text": "Variant A" },
      { "id": "B", "text": "Variant B" },
      { "id": "C", "text": "Variant C" },
      { "id": "D", "text": "Variant D" }
    ],
    "correct": "A",
    "explanation": "To‘g‘ri javobning qisqa tushuntirishi."
  }
]`;

    try {
      const response = await tutor.processQuery(prompt);
      let parsed = null;

      // Extract JSON array
      const match = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        parsed = JSON.parse(response);
      }

      if (Array.isArray(parsed) && parsed.length >= count) {
        const bank = this.readBank();
        const validNew = parsed.map((q, idx) => ({
          id: `${subjectId}_ai_${Date.now()}_${idx + 1}`,
          subject: subjectId,
          topic: q.topic || 'Umumiy mavzular',
          difficulty: q.difficulty || difficulty,
          question: q.question,
          options: q.options,
          correct: q.correct || 'A',
          explanation: q.explanation || ''
        }));

        bank.questions.push(...validNew);
        this.writeBank(bank);
        console.log(`[AI QUESTION GEN] Successfully added ${validNew.length} new questions to bank!`);
        return validNew;
      }
    } catch (err) {
      console.warn('[AI QUESTION GEN WARN]', err.message);
    }
    return [];
  }

  // GET SESSION WITH 6 INDIVIDUAL UNSEEN QUESTIONS
  async getSession(userId, subjectId) {
    const sub = String(subjectId || 'math').toLowerCase();
    const db = this.readUserPractice();
    const state = this.getUserSubjectState(db, userId, sub);
    const bank = this.readBank();

    // If current round already has active questions, return them
    if (Array.isArray(state.currentQuestions) && state.currentQuestions.length === 6) {
      const activeObjs = state.currentQuestions
        .map(id => bank.questions.find(q => q.id === id))
        .filter(Boolean);

      if (activeObjs.length === 6) {
        return {
          subject: sub,
          subjectName: SUBJECT_NAMES[sub] || sub,
          round: state.currentRound,
          currentDifficulty: state.currentDifficulty,
          totalAnswered: state.history.length,
          stats: state.stats,
          questions: activeObjs.map(q => ({
            id: q.id,
            subject: q.subject,
            topic: q.topic,
            difficulty: q.difficulty,
            question: q.question,
            options: q.options
            // Notice: 'correct' is strictly excluded from client payload!
          }))
        };
      }
    }

    // Select 6 fresh questions that user has NEVER answered
    const historySet = new Set(state.history || []);
    let pool = (bank.questions || []).filter(
      q => q.subject === sub && !historySet.has(q.id)
    );

    // If pool is low, try generating new questions via AI!
    if (pool.length < 6) {
      const generated = await this.generateAIQuestions(sub, 6, state.currentDifficulty);
      if (generated.length) {
        pool.push(...generated);
      }
    }

    // If still less than 6 (e.g. AI offline and user finished whole bank), recycle oldest questions
    if (pool.length < 6) {
      const allSubjectQuestions = (bank.questions || []).filter(q => q.subject === sub);
      pool = this.shuffle(allSubjectQuestions);
    }

    // Prioritize difficulty matching current performance
    let chosen = pool.filter(q => q.difficulty === state.currentDifficulty);
    if (chosen.length < 6) {
      chosen = pool;
    }

    const selected = this.shuffle(chosen).slice(0, 6);
    state.currentQuestions = selected.map(q => q.id);
    this.writeUserPractice(db);

    return {
      subject: sub,
      subjectName: SUBJECT_NAMES[sub] || sub,
      round: state.currentRound,
      currentDifficulty: state.currentDifficulty,
      totalAnswered: state.history.length,
      stats: state.stats,
      questions: selected.map(q => ({
        id: q.id,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        question: q.question,
        options: q.options
      }))
    };
  }

  // SUBMIT ROUND OF 6 ANSWERS
  submitRound(userId, subjectId, answers = {}) {
    const sub = String(subjectId || 'math').toLowerCase();
    const db = this.readUserPractice();
    const state = this.getUserSubjectState(db, userId, sub);
    const bank = this.readBank();

    const currentIds = safeArray(state.currentQuestions);
    if (currentIds.length !== 6) {
      throw new Error('Joriy mashqda faol savollar topilmadi yoki allaqachon yakunlangan.');
    }

    let correctCount = 0;
    const results = [];

    for (const qId of currentIds) {
      const question = bank.questions.find(q => q.id === qId);
      if (!question) continue;

      const userAns = answers[qId] || null;
      const isCorrect = userAns === question.correct;
      if (isCorrect) correctCount++;

      results.push({
        id: qId,
        question: question.question,
        topic: question.topic,
        userAnswer: userAns,
        correctAnswer: question.correct,
        isCorrect,
        explanation: question.explanation || ''
      });

      // Add to user history to prevent re-appearance
      if (!state.history.includes(qId)) {
        state.history.push(qId);
      }
    }

    const wrongCount = 6 - correctCount;
    const percentage = Math.round((correctCount / 6) * 100);

    // Adaptive difficulty update
    let nextDifficulty = state.currentDifficulty;
    if (correctCount >= 5) {
      nextDifficulty = 'hard';
    } else if (correctCount <= 2) {
      nextDifficulty = 'easy';
    } else {
      nextDifficulty = 'medium';
    }
    state.currentDifficulty = nextDifficulty;

    // Update statistics
    if (!state.stats) {
      state.stats = { roundsCompleted: 0, totalQuestions: 0, correctAnswers: 0, accuracy: 0 };
    }
    state.stats.roundsCompleted++;
    state.stats.totalQuestions += 6;
    state.stats.correctAnswers += correctCount;
    state.stats.accuracy = Math.round((state.stats.correctAnswers / state.stats.totalQuestions) * 100);

    // Save completed round
    const roundRecord = {
      round: state.currentRound,
      completedAt: new Date().toISOString(),
      correctCount,
      wrongCount,
      percentage,
      difficulty: state.currentDifficulty,
      results
    };

    if (!Array.isArray(state.rounds)) state.rounds = [];
    state.rounds.push(roundRecord);

    // Advance round number and reset currentQuestions so next call loads 6 new questions!
    const finishedRound = state.currentRound;
    state.currentRound++;
    state.currentQuestions = [];

    this.writeUserPractice(db);

    // Gamification Hook: record correct answers, streak and round XP
    let gamification = null;
    try {
      const gamificationService = require('./gamification.service');
      for (let i = 0; i < correctCount; i++) {
        gamificationService.recordActivity(userId, 'dynamic_question_correct');
      }
      gamification = gamificationService.recordActivity(userId, 'dynamic_round_completed', {
        correct: correctCount,
        total: 6,
        subjectId: sub
      });
    } catch (gErr) {
      console.warn('[GAMIFICATION HOOK WARN]', gErr.message);
    }

    return {
      round: finishedRound,
      nextRound: state.currentRound,
      correctCount,
      wrongCount,
      percentage,
      nextDifficulty,
      stats: state.stats,
      results,
      gamification,
      nextRoundAvailable: true
    };
  }

  // GET AGGREGATED STATS
  getUserStats(userId) {
    const db = this.readUserPractice();
    const uid = String(userId || 'guest_general').trim();
    const userRoot = db.users[uid] || {};

    let totalRounds = 0;
    let totalQuestions = 0;
    let totalCorrect = 0;

    const subjects = {};
    for (const subKey of ['math', 'physics', 'informatics']) {
      const state = userRoot[subKey] || { stats: {}, currentRound: 1 };
      const st = state.stats || {};
      totalRounds += st.roundsCompleted || 0;
      totalQuestions += st.totalQuestions || 0;
      totalCorrect += st.correctAnswers || 0;

      subjects[subKey] = {
        name: SUBJECT_NAMES[subKey],
        round: state.currentRound || 1,
        roundsCompleted: st.roundsCompleted || 0,
        totalQuestions: st.totalQuestions || 0,
        correctAnswers: st.correctAnswers || 0,
        accuracy: st.accuracy || 0,
        currentDifficulty: state.currentDifficulty || 'medium'
      };
    }

    const overallAccuracy = totalQuestions > 0
      ? Math.round((totalCorrect / totalQuestions) * 100)
      : 0;

    return {
      totalRounds,
      totalQuestions,
      totalCorrect,
      overallAccuracy,
      subjects
    };
  }
}

function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

module.exports = new DynamicPracticeService();
