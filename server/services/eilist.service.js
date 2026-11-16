const fs = require('fs/promises');
const path = require('path');

const DATABASE_DIR = path.join(__dirname, '..', 'database');
const LESSONS_FILE = path.join(DATABASE_DIR, 'eilist_lessons.json');
const PROGRESS_FILE = path.join(DATABASE_DIR, 'eilist_progress.json');

class EilistService {
  constructor() {
    this.writeQueue = Promise.resolve();
  }

  async readLessons() {
    try {
      const data = await fs.readFile(LESSONS_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async readProgress() {
    try {
      const data = await fs.readFile(PROGRESS_FILE, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  async writeProgress(progress) {
    const tempFile = `${PROGRESS_FILE}.${Date.now()}.tmp`;
    await fs.writeFile(tempFile, JSON.stringify(progress, null, 2), 'utf8');
    await fs.rename(tempFile, PROGRESS_FILE);
  }

  getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  async getTodayLesson(userId = 'guest_default') {
    const lessons = await this.readLessons();
    if (!lessons.length) return null;

    const progress = await this.readProgress();
    const today = this.getTodayDateString();

    const userProg = progress[userId] || {
      currentLessonIndex: 0,
      history: {},
      stats: { totalCompleted: 0, streakDays: 1, averageScore: 0, testsTaken: 0 }
    };

    const lessonIndex = userProg.currentLessonIndex % lessons.length;
    const lesson = lessons[lessonIndex] || lessons[0];

    const todayProgress = userProg.history[today] || {
      lessonId: lesson.id,
      vocabulary: false,
      grammar: false,
      reading: false,
      listening: false,
      listeningScore: 0,
      listeningTotal: lesson.listening?.questions?.length || 6,
      completed: false,
      completedAt: null
    };

    // Calculate completion percentage: 4 parts, each 25%
    let completedParts = 0;
    if (todayProgress.vocabulary) completedParts++;
    if (todayProgress.grammar) completedParts++;
    if (todayProgress.reading) completedParts++;
    if (todayProgress.listening) completedParts++;

    const progressPercentage = Math.round((completedParts / 4) * 100);
    const isDayCompleted = completedParts === 4;

    return {
      date: today,
      lesson,
      progress: {
        ...todayProgress,
        completedParts,
        totalParts: 4,
        progressPercentage,
        completed: isDayCompleted
      },
      stats: userProg.stats
    };
  }

  async completeSection(userId = 'guest_default', sectionKey) {
    const allowedSections = ['vocabulary', 'grammar', 'reading'];
    if (!allowedSections.includes(sectionKey)) {
      throw new Error('Noto‘g‘ri bo‘lim nomi');
    }

    return this.writeQueue = this.writeQueue.then(async () => {
      const progress = await this.readProgress();
      const today = this.getTodayDateString();
      const lessons = await this.readLessons();

      if (!progress[userId]) {
        progress[userId] = {
          currentLessonIndex: 0,
          history: {},
          stats: { totalCompleted: 0, streakDays: 1, averageScore: 0, testsTaken: 0 }
        };
      }

      const userProg = progress[userId];
      const lessonIndex = userProg.currentLessonIndex % lessons.length;
      const lesson = lessons[lessonIndex] || lessons[0];

      if (!userProg.history[today]) {
        userProg.history[today] = {
          lessonId: lesson.id,
          vocabulary: false,
          grammar: false,
          reading: false,
          listening: false,
          listeningScore: 0,
          listeningTotal: lesson.listening?.questions?.length || 6,
          completed: false,
          completedAt: null
        };
      }

      userProg.history[today][sectionKey] = true;

      // Check if all 4 completed
      const hist = userProg.history[today];
      if (hist.vocabulary && hist.grammar && hist.reading && hist.listening && !hist.completed) {
        hist.completed = true;
        hist.completedAt = new Date().toISOString();
        userProg.stats.totalCompleted = (userProg.stats.totalCompleted || 0) + 1;
        userProg.currentLessonIndex = (userProg.currentLessonIndex || 0) + 1;
      }

      await this.writeProgress(progress);
      return this.getTodayLesson(userId);
    });
  }

  async submitListeningTest(userId = 'guest_default', userAnswers = {}) {
    const lessons = await this.readLessons();
    const todayData = await this.getTodayLesson(userId);
    const lesson = todayData.lesson;
    const questions = lesson.listening?.questions || [];

    let correctCount = 0;
    const review = [];

    for (const q of questions) {
      const userAnswer = String(userAnswers[q.id] || '').trim();
      const correctAnswer = String(q.correctAnswer).trim();
      const isCorrect = userAnswer.toLowerCase() === correctAnswer.toLowerCase();

      if (isCorrect) correctCount++;

      review.push({
        id: q.id,
        question: q.question,
        userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || ''
      });
    }

    const totalQuestions = questions.length || 1;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // Calculate IELTS Band Score approximation
    let bandScore = 'Band 5.0';
    if (percentage >= 95) bandScore = 'Band 8.5 - 9.0 (Expert)';
    else if (percentage >= 85) bandScore = 'Band 7.5 - 8.0 (Very Good)';
    else if (percentage >= 70) bandScore = 'Band 6.5 - 7.0 (Competent)';
    else if (percentage >= 50) bandScore = 'Band 5.5 - 6.0 (Modest)';
    else bandScore = 'Band 4.5 - 5.0 (Needs Practice)';

    // Update user progress
    await (this.writeQueue = this.writeQueue.then(async () => {
      const progress = await this.readProgress();
      const today = this.getTodayDateString();

      if (!progress[userId]) {
        progress[userId] = {
          currentLessonIndex: 0,
          history: {},
          stats: { totalCompleted: 0, streakDays: 1, averageScore: 0, testsTaken: 0 }
        };
      }

      const userProg = progress[userId];
      if (!userProg.history[today]) {
        userProg.history[today] = {
          lessonId: lesson.id,
          vocabulary: false,
          grammar: false,
          reading: false,
          listening: false,
          listeningScore: 0,
          listeningTotal: totalQuestions,
          completed: false,
          completedAt: null
        };
      }

      userProg.history[today].listening = true;
      userProg.history[today].listeningScore = correctCount;
      userProg.history[today].listeningTotal = totalQuestions;

      // Update aggregate stats
      const stats = userProg.stats;
      stats.testsTaken = (stats.testsTaken || 0) + 1;
      stats.averageScore = Math.round(
        ((stats.averageScore * (stats.testsTaken - 1)) + percentage) / stats.testsTaken
      );

      // Check if all 4 completed
      const hist = userProg.history[today];
      if (hist.vocabulary && hist.grammar && hist.reading && hist.listening && !hist.completed) {
        hist.completed = true;
        hist.completedAt = new Date().toISOString();
        stats.totalCompleted = (stats.totalCompleted || 0) + 1;
        userProg.currentLessonIndex = (userProg.currentLessonIndex || 0) + 1;
      }

      await this.writeProgress(progress);
    }));

    return {
      success: true,
      score: correctCount,
      total: totalQuestions,
      percentage,
      bandScore,
      review,
      transcript: lesson.listening.transcript || []
    };
  }
}

module.exports = new EilistService();
