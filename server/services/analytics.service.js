// ========================================================
// GULASAL AI — ANALYTICS & LEADERBOARD SERVICE 2026
// Top Students Leaderboard • Subject Popularity Breakdown
// ========================================================

const fs = require('fs');
const path = require('path');
const subscriptionService = require('./subscription.service');

const DB_DIR = path.join(__dirname, '..', 'database');
const PROGRESS_FILE = path.join(DB_DIR, 'curriculum_progress.json');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const CURRICULUM_FILE = path.join(DB_DIR, 'curriculum.json');

class AnalyticsService {
  readJson(file, fallback = {}) {
    try {
      if (!fs.existsSync(file)) return fallback;
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return fallback;
    }
  }

  getOverview() {
    const progressData = this.readJson(PROGRESS_FILE, { users: {} });
    const usersData = this.readJson(USERS_FILE, []);
    const curriculumData = this.readJson(CURRICULUM_FILE, { subjects: [] });
    const usersMap = progressData.users || {};

    // 1. Map registered users for fast name/email lookup
    const profileLookup = new Map();
    if (Array.isArray(usersData)) {
      for (const u of usersData) {
        if (u.id) profileLookup.set(u.id, u);
      }
    }

    // 2. Map subjects for title lookup
    const subjectNames = {
      math: 'Matematika',
      physics: 'Fizika',
      informatics: 'Informatika',
      it: 'Informatika & IT',
      english: 'Ingliz tili',
      uzbek: 'Ona tili',
      chemistry: 'Kimyo',
      biology: 'Biologiya'
    };
    for (const s of curriculumData.subjects || []) {
      if (s.id && s.name) subjectNames[s.id] = s.name;
    }

    // 3. Compute student stats
    const studentList = [];
    const subjectCounts = {};
    let totalCompletedLessonsCount = 0;
    let totalQuizScoresSum = 0;
    let totalQuizCount = 0;

    for (const [userId, store] of Object.entries(usersMap)) {
      const lessons = store.lessons || {};
      let completedCount = 0;
      let userQuizScoreSum = 0;
      let userQuizCount = 0;

      for (const [lessonId, lData] of Object.entries(lessons)) {
        if (lData && lData.completed) {
          completedCount++;
          totalCompletedLessonsCount++;

          // Detect subject from lessonId
          let detectedSub = 'other';
          for (const subKey of Object.keys(subjectNames)) {
            if (lessonId.toLowerCase().includes(subKey)) {
              detectedSub = subKey;
              break;
            }
          }
          subjectCounts[detectedSub] = (subjectCounts[detectedSub] || 0) + 1;
        }

        if (lData && lData.quizScore) {
          const score = typeof lData.quizScore === 'number' ? lData.quizScore : (lData.quizScore.percentage || 0);
          userQuizScoreSum += score;
          userQuizCount++;
          totalQuizScoresSum += score;
          totalQuizCount++;
        }
      }

      if (completedCount > 0 || userQuizCount > 0) {
        const profile = profileLookup.get(userId) || {};
        const sub = subscriptionService.getUserSubscription(userId);

        const avgScore = userQuizCount > 0 ? Math.round(userQuizScoreSum / userQuizCount) : 85;

        const isUserIdGoogle = typeof userId === 'string' && userId.startsWith('google_');
        const isUserIdGuest = typeof userId === 'string' && userId.startsWith('guest_');

        studentList.push({
          userId,
          name: profile.name || (isUserIdGoogle ? 'Google Foydalanuvchi' : (isUserIdGuest ? 'O‘quvchi (Mehmon)' : 'Talaba')),
          email: profile.email || '',
          picture: profile.picture || '',
          isGoogle: isUserIdGoogle || profile.type === 'google',
          completedLessons: completedCount,
          averageScore: avgScore,
          isPro: Boolean(sub?.isVip),
          planName: sub?.planName || 'Standart',
          lastActive: store.updatedAt || null
        });
      }
    }

    // Sort students by completed lessons then average score
    studentList.sort((a, b) => {
      if (b.completedLessons !== a.completedLessons) {
        return b.completedLessons - a.completedLessons;
      }
      return b.averageScore - a.averageScore;
    });

    // Top 10 Leaderboard
    const topStudents = studentList.slice(0, 10).map((s, index) => ({
      rank: index + 1,
      badge: index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `#${index + 1}`)),
      id: s.userId,
      lessonsCompleted: s.completedLessons,
      avgQuizScore: s.averageScore,
      ...s
    }));

    // 4. Calculate Subject Popularity Percentages
    const totalSubjectCompletions = Object.values(subjectCounts).reduce((a, b) => a + b, 0) || 1;
    const subjectPopularity = Object.entries(subjectCounts).map(([key, count]) => {
      const percentage = Math.round((count / totalSubjectCompletions) * 100);
      return {
        id: key,
        name: subjectNames[key] || key.toUpperCase(),
        title: subjectNames[key] || key.toUpperCase(),
        count,
        percentage
      };
    }).sort((a, b) => b.count - a.count);

    const avgPlatformScore = totalQuizCount > 0 ? Math.round(totalQuizScoresSum / totalQuizCount) : 88;

    return {
      topStudents,
      leaderboard: topStudents,
      subjectPopularity,
      totals: {
        totalActiveStudents: studentList.length,
        totalCompletedLessons: totalCompletedLessonsCount,
        totalLessonsCompleted: totalCompletedLessonsCount,
        totalQuizzesPassed: totalQuizCount,
        averagePlatformScore: avgPlatformScore,
        overallAverageQuizScore: avgPlatformScore
      }
    };
  }
}

module.exports = new AnalyticsService();
