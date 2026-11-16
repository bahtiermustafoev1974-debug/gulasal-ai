
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.join(__dirname, '..', 'database');
const LESSONS_FILE = path.join(DB_DIR, 'daily_lessons.json');
const DATA_FILE = path.join(DB_DIR, 'data.json');

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate standard daily educational lessons from subject syllabus
function generateDailyLessons(dateStr) {
  return [
    {
      id: `lesson_${dateStr}_1`,
      subject: 'Matematika',
      icon: '📐',
      title: 'Kvadrat tenglamalar va diskriminant formulasi',
      description: 'Nazariya, formulalar va 5 ta amaliy misol tahlili',
      duration: '25 daqiqa',
      completed: false,
      completedAt: null
    },
    {
      id: `lesson_${dateStr}_2`,
      subject: 'Informatika va IT',
      icon: '💻',
      title: 'JavaScript funksiyalari va asinxron dasturlash',
      description: 'Promises, async/await va amaliy kod mashqi',
      duration: '30 daqiqa',
      completed: false,
      completedAt: null
    },
    {
      id: `lesson_${dateStr}_3`,
      subject: 'Ingliz tili (IELTS)',
      icon: '🌍',
      title: 'IELTS Academic Writing Task 2 strukturasi',
      description: 'Insho kirish qismi va asosiy argumentlar tahlili',
      duration: '20 daqiqa',
      completed: false,
      completedAt: null
    },
    {
      id: `lesson_${dateStr}_4`,
      subject: 'Fizika',
      icon: '⚡',
      title: 'Nyutonning ikkinchi qonuni va dinamika',
      description: 'Kuch, massa va tezlanish bog‘liqligi',
      duration: '20 daqiqa',
      completed: false,
      completedAt: null
    },
    {
      id: `lesson_${dateStr}_5`,
      subject: 'Ona tili va Adabiyot',
      icon: '📜',
      title: 'Murakkab qo‘shma gaplar tahlili va orfografiya',
      description: 'Grammatik qoidalar va matn ustida amaliy tahlil',
      duration: '15 daqiqa',
      completed: false,
      completedAt: null
    }
  ];
}

class LessonService {
  constructor() {
    this.ensureDatabase();
  }

  ensureDatabase() {
    fs.mkdirSync(DB_DIR, { recursive: true });
    if (!fs.existsSync(LESSONS_FILE)) {
      fs.writeFileSync(
        LESSONS_FILE,
        JSON.stringify({ users: {} }, null, 2),
        'utf8'
      );
    }
  }

  readDatabase() {
    this.ensureDatabase();
    try {
      const raw = fs.readFileSync(LESSONS_FILE, 'utf8');
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || Array.isArray(data) || !data.users) {
        return { users: {} };
      }
      return data;
    } catch (error) {
      console.error('[LESSON DB READ]', error.message);
      return { users: {} };
    }
  }

  writeDatabase(data) {
    this.ensureDatabase();
    const tempFile = path.join(
      DB_DIR,
      `lessons-${process.pid}-${crypto.randomUUID()}.tmp`
    );
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, LESSONS_FILE);
      return true;
    } catch (error) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}
      console.error('[LESSON DB WRITE]', error.message);
      return false;
    }
  }

  getUserStore(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('Foydalanuvchi aniqlanmadi.');
    }
    const db = this.readDatabase();
    if (!db.users[userId]) {
      db.users[userId] = {
        currentDate: getTodayString(),
        days: {}
      };
      this.writeDatabase(db);
    }
    return { db, userStore: db.users[userId] };
  }

  getDailyProgress(userId) {
    const today = getTodayString();
    const { db, userStore } = this.getUserStore(userId);

    if (!userStore.days) {
      userStore.days = {};
    }

    // Check if today exists. If not, create a new daily record without erasing previous days!
    if (!userStore.days[today]) {
      const lessons = generateDailyLessons(today);
      userStore.days[today] = {
        date: today,
        lessons,
        total: lessons.length,
        completed: 0,
        percentage: 0,
        updatedAt: new Date().toISOString()
      };
      userStore.currentDate = today;
      this.writeDatabase(db);
    }

    const todayRecord = userStore.days[today];
    
    // Ensure accurate calculation
    const lessons = Array.isArray(todayRecord.lessons) ? todayRecord.lessons : [];
    const completedCount = lessons.filter(l => l.completed === true).length;
    const totalCount = lessons.length;
    const percentage = totalCount > 0
      ? Math.max(0, Math.min(100, Math.round((completedCount / totalCount) * 100)))
      : 0;

    todayRecord.total = totalCount;
    todayRecord.completed = completedCount;
    todayRecord.percentage = percentage;

    // Build history of previous days (excluding today or including past days)
    const history = Object.keys(userStore.days)
      .filter(d => d !== today)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 14)
      .map(d => ({
        date: d,
        total: userStore.days[d].total || 0,
        completed: userStore.days[d].completed || 0,
        percentage: userStore.days[d].percentage || 0
      }));

    return {
      date: today,
      total: totalCount,
      completed: completedCount,
      percentage: Number.isFinite(percentage) ? percentage : 0,
      lessons,
      history
    };
  }

  toggleLesson(userId, lessonId, forceStatus = null) {
    if (!lessonId || typeof lessonId !== 'string') {
      throw new Error('Dars ID noto‘g‘ri.');
    }

    const today = getTodayString();
    const { db, userStore } = this.getUserStore(userId);

    if (!userStore.days || !userStore.days[today]) {
      this.getDailyProgress(userId);
    }

    const todayRecord = userStore.days[today];
    const lesson = todayRecord.lessons.find(l => l.id === lessonId);

    if (!lesson) {
      throw new Error('Dars topilmadi.');
    }

    const newStatus = typeof forceStatus === 'boolean'
      ? forceStatus
      : !lesson.completed;

    lesson.completed = newStatus;
    lesson.completedAt = newStatus ? new Date().toISOString() : null;

    // Recalculate
    const completedCount = todayRecord.lessons.filter(l => l.completed === true).length;
    const totalCount = todayRecord.lessons.length;
    const percentage = totalCount > 0
      ? Math.max(0, Math.min(100, Math.round((completedCount / totalCount) * 100)))
      : 0;

    todayRecord.completed = completedCount;
    todayRecord.percentage = percentage;
    todayRecord.updatedAt = new Date().toISOString();

    this.writeDatabase(db);

    return this.getDailyProgress(userId);
  }
}

module.exports = new LessonService();
