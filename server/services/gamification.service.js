const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'gamification.json');

const BADGE_DEFINITIONS = {
  streak_starter: { id: 'streak_starter', name: 'Olovli start', icon: '🔥', desc: 'Birinchi kunlik mashg‘ulotni yakunladingiz' },
  streak_3: { id: 'streak_3', name: 'Barqaror o‘quvchi', icon: '⚡', desc: '3 kunlik uzluksiz o‘qish zanjiri' },
  streak_7: { id: 'streak_7', name: 'Haftalik chempion', icon: '🏆', desc: '7 kun uzluksiz o‘qish natijasi' },
  sharp_mind: { id: 'sharp_mind', name: 'O‘tkir zehn', icon: '🎯', desc: '10 ta savolga ketma-ket to‘g‘ri javob' },
  perfect_round: { id: 'perfect_round', name: 'Mutlaq aniqlik', icon: '✨', desc: '6 talik to‘plamdan 6/6 natija' },
  math_expert: { id: 'math_expert', name: 'Matematika ustasi', icon: '🧮', desc: 'Matematika asosiy darsini to‘liq o‘zlashtirdingiz' },
  photo_pioneer: { id: 'photo_pioneer', name: 'Foto Tahlilchi', icon: '📸', desc: 'Kameradan masala yechish vositasini sinab ko‘rdingiz' },
  speaking_pro: { id: 'speaking_pro', name: 'IELTS Spiker', icon: '🎙️', desc: 'Jonli IELTS Speaking simulyatsiyasidan o‘tdingiz' },
  grandmaster: { id: 'grandmaster', name: 'Grandmaster', icon: '💎', desc: '1500+ XP va eng yuqori darajaga erishdingiz' }
};

const LEVELS = [
  { level: 1, minXp: 0, title: 'Boshlang‘ich', nextXp: 100 },
  { level: 2, minXp: 100, title: 'Izlanuvchi', nextXp: 300 },
  { level: 3, minXp: 300, title: 'Bilimdon', nextXp: 700 },
  { level: 4, minXp: 700, title: 'Ekspert', nextXp: 1500 },
  { level: 5, minXp: 1500, title: 'Grandmaster', nextXp: 99999 }
];

class GamificationService {
  constructor() {
    this.ensureDataFile();
  }

  ensureDataFile() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const initial = { users: {}, mockLearners: [] };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (e) {
      console.error('[GAMIFICATION DB INIT ERROR]', e);
    }
  }

  loadData() {
    try {
      this.ensureDataFile();
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(raw);
    } catch {
      return { users: {}, mockLearners: [] };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[GAMIFICATION DB SAVE ERROR]', e);
    }
  }

  getTodayString() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  getUser(userId, userName = 'O‘quvchi') {
    const data = this.loadData();
    const id = userId || 'guest_demo_user';

    if (!data.users[id]) {
      data.users[id] = {
        userId: id,
        name: userName || 'O‘quvchi',
        xp: 50,
        streak: 1,
        bestStreak: 1,
        lastActiveDate: this.getTodayString(),
        level: 1,
        levelTitle: 'Boshlang‘ich',
        badges: ['streak_starter'],
        stats: {
          questionsSolved: 0,
          perfectRounds: 0,
          lessonsCompleted: 0,
          photoMathUsed: 0,
          voiceMinutes: 0
        }
      };
      this.saveData(data);
    }

    return data.users[id];
  }

  calculateLevel(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXp) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }

  recordActivity(userId, activityType, payload = {}) {
    const data = this.loadData();
    const id = userId || 'guest_demo_user';
    const today = this.getTodayString();
    const yesterday = this.getYesterdayString();

    const user = data.users[id] || {
      userId: id,
      name: payload.userName || 'O‘quvchi',
      xp: 0,
      streak: 0,
      bestStreak: 0,
      lastActiveDate: '',
      level: 1,
      levelTitle: 'Boshlang‘ich',
      badges: [],
      stats: {
        questionsSolved: 0,
        perfectRounds: 0,
        lessonsCompleted: 0,
        photoMathUsed: 0,
        voiceMinutes: 0
      }
    };

    if (payload.userName && user.name !== payload.userName) {
      user.name = payload.userName;
    }

    // 1. Streak hisoblash
    if (user.lastActiveDate === yesterday) {
      user.streak += 1;
      if (user.streak > (user.bestStreak || 0)) {
        user.bestStreak = user.streak;
      }
    } else if (user.lastActiveDate !== today) {
      user.streak = 1;
      if (!user.bestStreak) user.bestStreak = 1;
    }
    user.lastActiveDate = today;

    // 2. XP va statistika
    let xpGained = 0;
    const newBadges = [];

    switch (activityType) {
      case 'dynamic_question_correct':
        xpGained = 10;
        user.stats.questionsSolved = (user.stats.questionsSolved || 0) + 1;
        break;

      case 'dynamic_round_completed':
        const isPerfect = payload.correct === payload.total;
        xpGained = isPerfect ? 60 : 30;
        if (isPerfect) {
          user.stats.perfectRounds = (user.stats.perfectRounds || 0) + 1;
          if (!user.badges.includes('perfect_round')) {
            user.badges.push('perfect_round');
            newBadges.push(BADGE_DEFINITIONS.perfect_round);
          }
        }
        break;

      case 'lesson_stage_completed':
        xpGained = 20;
        break;

      case 'lesson_finished':
        xpGained = 100;
        user.stats.lessonsCompleted = (user.stats.lessonsCompleted || 0) + 1;
        if (payload.subjectId === 'math' && !user.badges.includes('math_expert')) {
          user.badges.push('math_expert');
          newBadges.push(BADGE_DEFINITIONS.math_expert);
        }
        break;

      case 'photo_math_solved':
        xpGained = 20;
        user.stats.photoMathUsed = (user.stats.photoMathUsed || 0) + 1;
        if (!user.badges.includes('photo_pioneer')) {
          user.badges.push('photo_pioneer');
          newBadges.push(BADGE_DEFINITIONS.photo_pioneer);
        }
        break;

      case 'speaking_evaluated':
        xpGained = 40;
        user.stats.voiceMinutes = (user.stats.voiceMinutes || 0) + (payload.durationMinutes || 3);
        if (!user.badges.includes('speaking_pro')) {
          user.badges.push('speaking_pro');
          newBadges.push(BADGE_DEFINITIONS.speaking_pro);
        }
        break;

      case 'daily_claim':
        xpGained = 25;
        break;

      default:
        xpGained = payload.xp || 10;
        break;
    }

    user.xp = (user.xp || 0) + xpGained;

    // 3. Levelni yangilash
    const lvlInfo = this.calculateLevel(user.xp);
    user.level = lvlInfo.level;
    user.levelTitle = lvlInfo.title;

    // 4. Badgelarni tekshirish
    if (user.streak >= 1 && !user.badges.includes('streak_starter')) {
      user.badges.push('streak_starter');
      newBadges.push(BADGE_DEFINITIONS.streak_starter);
    }
    if (user.streak >= 3 && !user.badges.includes('streak_3')) {
      user.badges.push('streak_3');
      newBadges.push(BADGE_DEFINITIONS.streak_3);
    }
    if (user.streak >= 7 && !user.badges.includes('streak_7')) {
      user.badges.push('streak_7');
      newBadges.push(BADGE_DEFINITIONS.streak_7);
    }
    if (user.stats.questionsSolved >= 10 && !user.badges.includes('sharp_mind')) {
      user.badges.push('sharp_mind');
      newBadges.push(BADGE_DEFINITIONS.sharp_mind);
    }
    if (user.level >= 5 && !user.badges.includes('grandmaster')) {
      user.badges.push('grandmaster');
      newBadges.push(BADGE_DEFINITIONS.grandmaster);
    }

    data.users[id] = user;
    this.saveData(data);

    return {
      success: true,
      user,
      xpGained,
      newBadges,
      levelInfo: lvlInfo
    };
  }

  getProfile(userId, userName) {
    const user = this.getUser(userId, userName);
    const lvlInfo = this.calculateLevel(user.xp);
    const badgesFull = (user.badges || []).map(bId => BADGE_DEFINITIONS[bId] || { id: bId, name: bId, icon: '⭐' });

    // Progress to next level percentage
    const curBase = lvlInfo.minXp;
    const nextTarget = lvlInfo.nextXp;
    const progressPercent = nextTarget > curBase 
      ? Math.min(100, Math.round(((user.xp - curBase) / (nextTarget - curBase)) * 100))
      : 100;

    return {
      userId: user.userId,
      name: user.name,
      xp: user.xp,
      streak: user.streak,
      bestStreak: user.bestStreak || user.streak,
      level: user.level,
      levelTitle: user.levelTitle,
      progressPercent,
      nextLevelXp: nextTarget,
      badges: badgesFull,
      allBadgeDefinitions: Object.values(BADGE_DEFINITIONS),
      stats: user.stats
    };
  }

  getLeaderboard(currentUserId) {
    const data = this.loadData();
    const list = [];

    // Haqiqiy foydalanuvchilar
    Object.values(data.users || {}).forEach(u => {
      list.push({
        userId: u.userId,
        name: u.name || 'O‘quvchi',
        xp: u.xp || 0,
        streak: u.streak || 1,
        level: u.level || 1,
        levelTitle: u.levelTitle || 'Boshlang‘ich',
        isCurrent: u.userId === currentUserId,
        avatar: (u.name || 'U').charAt(0).toUpperCase()
      });
    });

    // Mock o'quvchilar
    (data.mockLearners || []).forEach(m => {
      list.push({
        userId: 'mock_' + m.name,
        name: m.name,
        xp: m.xp,
        streak: m.streak,
        level: m.level,
        levelTitle: m.levelTitle,
        isCurrent: false,
        avatar: m.avatar || m.name.charAt(0)
      });
    });

    // Saralash: XP kamayish tartibida
    list.sort((a, b) => b.xp - a.xp);

    // Reyting va ligalar
    const ranked = list.map((item, index) => {
      const rank = index + 1;
      let league = '🥉 Bronza liga';
      if (rank <= 3) league = '💎 Olmos liga';
      else if (rank <= 7) league = '🥇 Oltin liga';
      else if (rank <= 12) league = '🥈 Kumush liga';

      return {
        ...item,
        rank,
        league
      };
    });

    return ranked.slice(0, 15);
  }
}

module.exports = new GamificationService();
