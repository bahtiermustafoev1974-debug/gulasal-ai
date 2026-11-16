const gamificationService = require('./gamification.service');

const BOT_OPPONENTS = [
  { name: 'Kamola AI', avatar: '👩‍🎓', level: 3, accuracy: 0.75, tag: 'Toshkent' },
  { name: 'Bobur AI', avatar: '👨‍💻', level: 4, accuracy: 0.80, tag: 'Samarqand' },
  { name: 'Zilola AI', avatar: '⚡', level: 5, accuracy: 0.85, tag: 'Buxoro' },
  { name: 'Jasur AI', avatar: '🎯', level: 4, accuracy: 0.70, tag: 'Andijon' },
  { name: 'Gulasal Bot', avatar: '👑', level: 6, accuracy: 0.90, tag: 'Ustoz-AI Chempioni' }
];

const QUESTION_BANK = {
  general: [
    {
      id: 'qb1',
      question: 'Quyidagi dasturlash tillaridan qaysi biri asinxronlikni event loop orqali boshqaradi?',
      options: [
        { id: 'a', text: 'C++' },
        { id: 'b', text: 'JavaScript', correct: true },
        { id: 'c', text: 'Fortran' },
        { id: 'd', text: 'Pascal' }
      ]
    },
    {
      id: 'qb2',
      question: 'Kvadrat tenglamada diskriminant D > 0 bo‘lsa, nechta haqiqiy ildiz mavjud?',
      options: [
        { id: 'a', text: '1 ta' },
        { id: 'b', text: 'Ildizga ega emas' },
        { id: 'c', text: '2 ta turli haqiqiy ildiz', correct: true },
        { id: 'd', text: 'Cheksiz ko‘p' }
      ]
    },
    {
      id: 'qb3',
      question: 'Nyutonning ikkinchi qonuni formulasi qaysi?',
      options: [
        { id: 'a', text: 'F = m · a', correct: true },
        { id: 'b', text: 'E = m · c²' },
        { id: 'c', text: 'P = U · I' },
        { id: 'd', text: 'v = s / t' }
      ]
    },
    {
      id: 'qb4',
      question: 'Ingliz tilida "She has _____ in London for five years" jumlasiga qaysi fe\'l shakli to\'g\'ri keladi?',
      options: [
        { id: 'a', text: 'live' },
        { id: 'b', text: 'lived', correct: true },
        { id: 'c', text: 'living' },
        { id: 'd', text: 'lives' }
      ]
    },
    {
      id: 'qb5',
      question: 'Om qonuniga ko‘ra, elektr toki kuchi (I) nimaga to‘g‘ri mutanosib?',
      options: [
        { id: 'a', text: 'Qarshilikka' },
        { id: 'b', text: 'Kuchlanishga (U)', correct: true },
        { id: 'c', text: 'Vaqtga' },
        { id: 'd', text: 'Zaryadga' }
      ]
    },
    {
      id: 'qb6',
      question: 'HTML da giperhavola (link) yaratish uchun qaysi teg ishlatiladi?',
      options: [
        { id: 'a', text: '<link>' },
        { id: 'b', text: '<a>', correct: true },
        { id: 'c', text: '<href>' },
        { id: 'd', text: '<nav>' }
      ]
    },
    {
      id: 'qb7',
      question: 'Suvning kimyoviy formulasi qaysi?',
      options: [
        { id: 'a', text: 'CO2' },
        { id: 'b', text: 'H2O', correct: true },
        { id: 'c', text: 'NaCl' },
        { id: 'd', text: 'O2' }
      ]
    }
  ]
};

const activeBattles = new Map();

class QuizBattleService {
  startBattle(userId = 'guest_general', subject = 'general') {
    const questions = this.getRandomQuestions(5);
    const opponent = BOT_OPPONENTS[Math.floor(Math.random() * BOT_OPPONENTS.length)];
    const battleId = `battle_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const battleSession = {
      battleId,
      userId,
      opponent,
      questions,
      startedAt: Date.now()
    };

    activeBattles.set(battleId, battleSession);

    // Return questions WITHOUT the "correct: true" field to frontend to avoid cheating
    const safeQuestions = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options.map(o => ({ id: o.id, text: o.text }))
    }));

    return {
      battleId,
      opponent,
      questions: safeQuestions,
      timeLimitSeconds: 60
    };
  }

  submitBattle(userId = 'guest_general', battleId, answers = {}) {
    const session = activeBattles.get(battleId);
    if (!session) {
      throw new Error('Jang sessiyasi topilmadi yoki muddati o‘tgan.');
    }

    let userScore = 0;
    const details = [];

    for (const q of session.questions) {
      const correctOpt = q.options.find(o => o.correct === true);
      const isCorrect = answers[q.id] === correctOpt?.id;
      if (isCorrect) userScore++;

      details.push({
        id: q.id,
        question: q.question,
        userAnswer: answers[q.id] || null,
        correctAnswer: correctOpt?.id || null,
        correctText: correctOpt?.text || '',
        isCorrect
      });
    }

    // Simulate opponent score based on their accuracy
    let botScore = 0;
    for (let i = 0; i < session.questions.length; i++) {
      if (Math.random() < session.opponent.accuracy) {
        botScore++;
      }
    }

    const isWinner = userScore > botScore;
    const isDraw = userScore === botScore;

    const xpEarned = isWinner ? 60 : (isDraw ? 30 : 15);
    const coinsEarned = isWinner ? 25 : (isDraw ? 10 : 5);

    try {
      gamificationService.recordActivity(userId, 'battle_completed', {
        xpBonus: xpEarned,
        isWinner
      });
    } catch (e) {
      console.error('[BATTLE GAMIFICATION ERROR]', e);
    }

    activeBattles.delete(battleId);

    return {
      battleId,
      userScore,
      botScore,
      totalQuestions: session.questions.length,
      opponent: session.opponent,
      isWinner,
      isDraw,
      xpEarned,
      coinsEarned,
      details
    };
  }

  getRandomQuestions(count = 5) {
    const list = [...QUESTION_BANK.general];
    // Shuffle
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list.slice(0, count);
  }
}

module.exports = new QuizBattleService();
