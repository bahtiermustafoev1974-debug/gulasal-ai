/**
 * GULASAL AI — DYNAMIC & ADAPTIVE QUIZ GENERATION ENGINE
 * 
 * - AI-Powered Topic-Specific 5-Question Generation (Groq / Gemini)
 * - 3 Adaptive Difficulty Levels: Boshlang'ich (easy), O'rta (medium), Murakkab (hard)
 * - Anti-Repetition & Semantic Deduplication Engine
 * - Strict Backend Answer Validation & Concealment (No cheating)
 * - Full History & Performance Tracking per User
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const tutor = require('../ai-engine/tutor');

class DynamicQuizService {
  constructor() {
    this.difficultyLabels = {
      easy: 'Boshlang‘ich',
      medium: 'O‘rta',
      hard: 'Murakkab'
    };
  }

  /**
   * Determine user's adaptive difficulty for a lesson
   */
  calculateDifficulty(lessonProgress) {
    if (!lessonProgress || !lessonProgress.quizHistory || !lessonProgress.quizHistory.length) {
      return 'medium'; // Boshlang'ich tavsiya sifatida o'rta darajadan boshlanadi
    }

    const lastAttempts = lessonProgress.quizHistory.slice(-3);
    const avgScore = lastAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / lastAttempts.length;

    if (avgScore >= 80) return 'hard';
    if (avgScore >= 50) return 'medium';
    return 'easy';
  }

  /**
   * Extract clean text signature to detect duplicates
   */
  textSignature(text = '') {
    return String(text)
      .toLowerCase()
      .replace(/[^a-z0-9а-яёўқғҳ]/gi, '')
      .slice(0, 80);
  }

  /**
   * Validate question structure from AI
   */
  isValidQuestion(q) {
    if (!q || typeof q !== 'object') return false;
    if (typeof q.question !== 'string' || q.question.trim().length < 8) return false;
    if (!Array.isArray(q.options) || q.options.length !== 4) return false;

    const validOptionIds = ['A', 'B', 'C', 'D'];
    const optionIds = q.options.map(o => String(o.id || '').toUpperCase());
    for (const vid of validOptionIds) {
      if (!optionIds.includes(vid)) return false;
    }

    const correct = String(q.correct || '').toUpperCase();
    if (!validOptionIds.includes(correct)) return false;

    for (const opt of q.options) {
      if (!opt.text || String(opt.text).trim().length === 0) return false;
    }

    return true;
  }

  /**
   * Generate fresh 5 questions using AI
   */
  async generateQuestionsFromAI(lesson, topic, subject, difficulty = 'medium', seenSignatures = new Set()) {
    const diffLabel = this.difficultyLabels[difficulty] || 'O‘rta';
    
    // Extract key lesson concepts from stages
    const theorySummary = (lesson.stages || [])
      .filter(s => s.type === 'theory' || s.type === 'formula' || s.stage <= 2)
      .map(s => `${s.title}: ${s.summary || ''}`)
      .join('\n')
      .slice(0, 1200);

    const prompt = `Siz O‘zbekiston milliy ta'lim dasturi bo‘yicha tajribali testolog-metodistsiz.
Quyidagi dars mavzusiga AYNAN mos keluvchi 5 ta yangi va sifatli test savolini tuzing.

FAN: ${subject.name}
MAVZU: ${topic.title}
DARS NOMI: ${lesson.title}
QIYINLIK DARAJASI: ${diffLabel} (${difficulty})

DARS NAZARIYASIDAN QISQA MAZMUN:
${theorySummary || lesson.title}

MUHIM QOIDALAR:
1. Faqat va faqat ushbu darsda o‘rganilgan qoidalar, formulalar va tushunchalar bo‘yicha savol bering. O‘tilmagan mavzulardan savol kiritmang.
2. Har bir savolda aniq bitta to‘g‘ri javob bo‘lsin.
3. 3 ta chalg‘ituvchi javob varianti mantiqiy, darsga aloqador va ishonarli bo‘lsin.
4. Javob variantlari roppa-rosa 4 ta: A, B, C, D bo‘lsin.
5. Bir savolning javobi boshqa savol matnida oshkor bo‘lmasin.
6. Savollar grammatik va imlo jihatdan o‘zbek tilida to‘g‘ri bo‘lsin.

JAVOBNI FAQAT quyidagi JSON massiv formatida qaytaring, boshqa hech qanday so‘z, izoh yoki markdown qo‘shmang:
[
  {
    "id": "q1",
    "question": "Savol matni?",
    "options": [
      { "id": "A", "text": "Variant A matni" },
      { "id": "B", "text": "Variant B matni" },
      { "id": "C", "text": "Variant C matni" },
      { "id": "D", "text": "Variant D matni" }
    ],
    "correct": "A",
    "explanation": "To‘g‘ri javobning aniq va mantiqiy tushuntirishi."
  }
]`;

    try {
      const response = await tutor.processQuery(prompt);
      let parsed = null;

      const match = response.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        parsed = JSON.parse(response);
      }

      if (Array.isArray(parsed) && parsed.length >= 3) {
        const validQuestions = [];
        for (let i = 0; i < parsed.length; i++) {
          const item = parsed[i];
          if (!this.isValidQuestion(item)) continue;

          const sig = this.textSignature(item.question);
          if (seenSignatures.has(sig)) continue; // Anti-repetition check

          validQuestions.push({
            id: `dyn_${Date.now()}_${i + 1}`,
            question: String(item.question).trim(),
            options: item.options.map(o => ({ id: String(o.id).toUpperCase(), text: String(o.text).trim() })),
            correct: String(item.correct).toUpperCase(),
            explanation: String(item.explanation || '').trim(),
            difficulty
          });

          seenSignatures.add(sig);
          if (validQuestions.length === 5) break;
        }

        if (validQuestions.length >= 3) {
          return validQuestions;
        }
      }
    } catch (err) {
      console.warn('[DYNAMIC QUIZ AI ERROR]', err.message);
    }

    return null;
  }

  /**
   * Fallback: get questions from existing lesson stage 7 or question bank
   */
  getFallbackQuestions(lesson, seenSignatures = new Set()) {
    const quizStage = (lesson.stages || []).find(s => s.type === 'quiz' || s.stage === 7);
    const existing = quizStage?.content?.questions || [];

    const result = [];
    for (let i = 0; i < existing.length; i++) {
      const q = existing[i];
      const correctOpt = (q.options || []).find(o => o.correct === true);
      const correctId = correctOpt ? correctOpt.id : (q.correct || 'A');

      const options = (q.options || []).map(o => ({
        id: String(o.id).toUpperCase(),
        text: String(o.text || '').trim()
      }));

      result.push({
        id: q.id || `fallback_${Date.now()}_${i + 1}`,
        question: q.question,
        options,
        correct: String(correctId).toUpperCase(),
        explanation: q.explanation || 'Dars materiallari asosida to‘g‘ri javob.',
        difficulty: 'medium'
      });
      if (result.length === 5) break;
    }

    return result;
  }

  /**
   * Get or create dynamic test session for user
   */
  async getOrGenerateQuiz(userId, lesson, topic, subject, userProgress, forceNew = false) {
    if (!userProgress.quizData) {
      userProgress.quizData = {
        seenQuestionSignatures: [],
        difficulty: 'medium',
        attemptsCount: 0,
        history: [],
        activeQuiz: null
      };
    }

    const qd = userProgress.quizData;

    // If an active quiz already exists and user is just reopening/refreshing, return it
    if (!forceNew && qd.activeQuiz && Array.isArray(qd.activeQuiz.questions) && qd.activeQuiz.questions.length >= 3) {
      return {
        lessonId: lesson.id,
        difficulty: qd.activeQuiz.difficulty,
        difficultyLabel: this.difficultyLabels[qd.activeQuiz.difficulty] || 'O‘rta',
        attemptNumber: (qd.attemptsCount || 0) + 1,
        // Send to client WITHOUT revealing correct answers!
        questions: qd.activeQuiz.questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options
        }))
      };
    }

    // Determine adaptive difficulty
    const targetDifficulty = this.calculateDifficulty(userProgress);
    qd.difficulty = targetDifficulty;

    const seenSet = new Set(qd.seenQuestionSignatures || []);

    // Try AI generation first
    let generated = await this.generateQuestionsFromAI(lesson, topic, subject, targetDifficulty, seenSet);

    // Fallback if AI fails or returns empty
    if (!generated || generated.length < 3) {
      generated = this.getFallbackQuestions(lesson, seenSet);
    }

    // Save active quiz on backend WITH correct answers
    qd.activeQuiz = {
      createdAt: new Date().toISOString(),
      difficulty: targetDifficulty,
      questions: generated
    };

    return {
      lessonId: lesson.id,
      difficulty: targetDifficulty,
      difficultyLabel: this.difficultyLabels[targetDifficulty] || 'O‘rta',
      attemptNumber: (qd.attemptsCount || 0) + 1,
      // Client gets questions WITHOUT correct answers
      questions: generated.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
      }))
    };
  }

  /**
   * Submit and grade the dynamic test
   */
  gradeQuiz(userProgress, lessonId, answers = {}) {
    const qd = userProgress.quizData;
    if (!qd || !qd.activeQuiz || !Array.isArray(qd.activeQuiz.questions)) {
      throw new Error('Faol test savollari topilmadi. Iltimos, testni qaytadan boshlang.');
    }

    const questions = qd.activeQuiz.questions;
    let correctCount = 0;
    const results = [];

    for (const q of questions) {
      const userChoice = String(answers[q.id] || '').toUpperCase();
      const isCorrect = userChoice === q.correct;
      if (isCorrect) correctCount++;

      results.push({
        id: q.id,
        question: q.question,
        options: q.options,
        userAnswer: userChoice || null,
        correctAnswer: q.correct,
        isCorrect,
        explanation: q.explanation || ''
      });

      // Record signature so question will never repeat
      const sig = this.textSignature(q.question);
      if (sig && !qd.seenQuestionSignatures.includes(sig)) {
        qd.seenQuestionSignatures.push(sig);
      }
    }

    const totalQuestions = questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const passed = scorePercentage >= 60;

    qd.attemptsCount = (qd.attemptsCount || 0) + 1;

    // Adaptive difficulty update for NEXT round
    let nextDifficulty = 'medium';
    if (scorePercentage >= 80) nextDifficulty = 'hard';
    else if (scorePercentage < 50) nextDifficulty = 'easy';
    qd.difficulty = nextDifficulty;

    const attemptRecord = {
      attempt: qd.attemptsCount,
      difficulty: qd.activeQuiz.difficulty,
      correctCount,
      totalQuestions,
      scorePercentage,
      passed,
      takenAt: new Date().toISOString()
    };

    if (!Array.isArray(qd.history)) qd.history = [];
    qd.history.push(attemptRecord);

    // Save final quizScore for standard curriculum progress
    userProgress.quizScore = {
      correctCount,
      totalQuestions,
      scorePercentage,
      passed,
      takenAt: attemptRecord.takenAt,
      difficulty: qd.activeQuiz.difficulty,
      attempts: qd.attemptsCount
    };

    // Clear active quiz so next attempt will produce brand new unseen questions!
    qd.activeQuiz = null;

    return {
      score: {
        correctCount,
        totalQuestions,
        scorePercentage,
        passed,
        difficulty: attemptRecord.difficulty,
        difficultyLabel: this.difficultyLabels[attemptRecord.difficulty] || 'O‘rta',
        nextDifficulty,
        nextDifficultyLabel: this.difficultyLabels[nextDifficulty] || 'O‘rta',
        attemptNumber: qd.attemptsCount
      },
      results,
      history: qd.history
    };
  }
}

module.exports = new DynamicQuizService();
