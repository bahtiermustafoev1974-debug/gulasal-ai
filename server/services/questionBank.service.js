// ========================================================
// GULASAL AI — QUESTION BANK SERVICE 2026
// Admin CRUD: Math, Physics, IT, IELTS Quizzes & Practice
// ========================================================

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'question_bank.json');

class QuestionBankService {
  constructor() {
    this.ensureFile();
  }

  ensureFile() {
    try {
      if (!fs.existsSync(DB_PATH)) {
        const initial = { questions: [] };
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[QUESTION BANK DB INIT WARN]', e);
    }
  }

  loadData() {
    try {
      this.ensureFile();
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(raw);
    } catch {
      return { questions: [] };
    }
  }

  saveData(data) {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('[QUESTION BANK DB SAVE ERROR]', e);
    }
  }

  getQuestions({ subject = 'all', difficulty = 'all', search = '' } = {}) {
    const data = this.loadData();
    let list = Array.isArray(data.questions) ? data.questions : [];

    if (subject && subject !== 'all') {
      list = list.filter(q => q.subject === subject);
    }

    if (difficulty && difficulty !== 'all') {
      list = list.filter(q => q.difficulty === difficulty);
    }

    if (search && search.trim()) {
      const qLower = search.trim().toLowerCase();
      list = list.filter(q =>
        (q.question && q.question.toLowerCase().includes(qLower)) ||
        (q.topic && q.topic.toLowerCase().includes(qLower)) ||
        (q.id && q.id.toLowerCase().includes(qLower))
      );
    }

    // Statistics
    const allList = data.questions || [];
    const subjectsCount = {};
    allList.forEach(q => {
      const s = q.subject || 'other';
      subjectsCount[s] = (subjectsCount[s] || 0) + 1;
    });

    return {
      total: allList.length,
      filteredCount: list.length,
      subjects: subjectsCount,
      questions: list
    };
  }

  getQuestionById(id) {
    const data = this.loadData();
    return (data.questions || []).find(q => q.id === id) || null;
  }

  createQuestion({ subject = 'math', topic = '', difficulty = 'medium', question = '', options = [], correct = 'A', explanation = '' }, adminEmail = 'admin') {
    if (!question || !question.trim()) throw new Error('Savol matni kiritilishi shart.');
    if (!Array.isArray(options) || options.length < 2) throw new Error('Kamida 2 ta javob varianti kiritilishi shart.');

    const data = this.loadData();
    if (!Array.isArray(data.questions)) data.questions = [];

    const id = `${subject}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    // Normalize options format: [{ id: 'A', text: '...' }, ...]
    const formattedOptions = options.map((opt, idx) => {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      const optId = letters[idx] || String(idx + 1);
      const text = typeof opt === 'object' ? (opt.text || opt.value || '') : String(opt);
      return { id: optId, text: text.trim() };
    });

    const newQuestion = {
      id,
      subject: String(subject).trim().toLowerCase(),
      topic: String(topic || 'Umumiy mavzu').trim(),
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
      question: question.trim(),
      options: formattedOptions,
      correct: String(correct || 'A').toUpperCase().trim(),
      explanation: String(explanation || '').trim(),
      createdAt: new Date().toISOString(),
      createdBy: adminEmail
    };

    data.questions.unshift(newQuestion);
    this.saveData(data);
    return newQuestion;
  }

  updateQuestion(id, updates = {}, adminEmail = 'admin') {
    const data = this.loadData();
    const qIndex = (data.questions || []).findIndex(q => q.id === id);
    if (qIndex === -1) throw new Error('Savol topilmadi.');

    const current = data.questions[qIndex];

    let formattedOptions = current.options;
    if (Array.isArray(updates.options) && updates.options.length >= 2) {
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      formattedOptions = updates.options.map((opt, idx) => ({
        id: letters[idx] || String(idx + 1),
        text: (typeof opt === 'object' ? (opt.text || opt.value || '') : String(opt)).trim()
      }));
    }

    const updated = {
      ...current,
      subject: updates.subject ? String(updates.subject).trim().toLowerCase() : current.subject,
      topic: updates.topic !== undefined ? String(updates.topic).trim() : current.topic,
      difficulty: updates.difficulty || current.difficulty,
      question: updates.question !== undefined ? String(updates.question).trim() : current.question,
      options: formattedOptions,
      correct: updates.correct ? String(updates.correct).toUpperCase().trim() : current.correct,
      explanation: updates.explanation !== undefined ? String(updates.explanation).trim() : current.explanation,
      updatedAt: new Date().toISOString(),
      updatedBy: adminEmail
    };

    data.questions[qIndex] = updated;
    this.saveData(data);
    return updated;
  }

  deleteQuestion(id, adminEmail = 'admin') {
    const data = this.loadData();
    const qIndex = (data.questions || []).findIndex(q => q.id === id);
    if (qIndex === -1) throw new Error('Savol topilmadi.');

    const deleted = data.questions.splice(qIndex, 1)[0];
    this.saveData(data);
    return deleted;
  }
}

module.exports = new QuestionBankService();
