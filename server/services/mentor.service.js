
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_DIR = path.join(__dirname, '..', 'database');
const DB_FILE = path.join(DB_DIR, 'mentor.json');

function createDefaultData() {
  return { users: {} };
}

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanString(value, maxLength, fallback = '') {
  return String(value ?? fallback).trim().slice(0, maxLength);
}

function isValidDate(value) {
  if (typeof value !== 'string') return false;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value;
}

function createId() {
  return crypto.randomUUID();
}

function createUserData() {
  const now = new Date().toISOString();

  return {
    goals: [],
    tasks: [],
    plans: [],
    achievements: [],
    focusSessions: [],
    createdAt: now,
    updatedAt: now
  };
}

class MentorService {
  constructor() {
    this.ensureDatabase();
  }

  ensureDatabase() {
    fs.mkdirSync(DB_DIR, { recursive: true });

    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(createDefaultData(), null, 2),
        'utf8'
      );
    }
  }

  validateUserData(data) {
    const arrays = [
      'goals',
      'tasks',
      'plans',
      'achievements',
      'focusSessions'
    ];

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw createError('Mentor ma’lumotlari noto‘g‘ri.', 500);
    }

    for (const key of arrays) {
      if (!Array.isArray(data[key])) {
        throw createError(
          `Mentor bazasida ${key} ma’lumotlari noto‘g‘ri.`,
          500
        );
      }
    }

    return data;
  }

  readDatabase() {
    this.ensureDatabase();

    try {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw);

      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data) ||
        !data.users ||
        typeof data.users !== 'object' ||
        Array.isArray(data.users)
      ) {
        throw new Error('Database formati noto‘g‘ri.');
      }

      return data;
    } catch (error) {
      console.error('[MENTOR DB READ]', error.message);

      throw createError(
        'Mentor ma’lumotlarini o‘qib bo‘lmadi.',
        500
      );
    }
  }

  writeDatabase(data) {
    this.ensureDatabase();

    const tempFile = path.join(
      DB_DIR,
      `mentor-${process.pid}-${createId()}.tmp`
    );

    try {
      fs.writeFileSync(
        tempFile,
        JSON.stringify(data, null, 2),
        { encoding: 'utf8', flag: 'wx' }
      );

      fs.renameSync(tempFile, DB_FILE);
    } catch (error) {
      try {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      } catch {}

      console.error('[MENTOR DB WRITE]', error.message);

      throw createError(
        'Ma’lumotlarni saqlab bo‘lmadi.',
        500
      );
    }
  }

  getUserData(userId) {
    if (typeof userId !== 'string' || !userId.trim()) {
      throw createError('Foydalanuvchi aniqlanmadi.', 401);
    }

    const db = this.readDatabase();

    if (!db.users[userId]) {
      db.users[userId] = createUserData();
      this.writeDatabase(db);
    }

    return this.validateUserData(db.users[userId]);
  }

  updateUserData(userId, callback) {
    if (typeof userId !== 'string' || !userId.trim()) {
      throw createError('Foydalanuvchi aniqlanmadi.', 401);
    }

    const db = this.readDatabase();

    if (!db.users[userId]) {
      db.users[userId] = createUserData();
    }

    const userData = this.validateUserData(db.users[userId]);

    callback(userData);

    userData.updatedAt = new Date().toISOString();

    this.writeDatabase(db);

    return userData;
  }

  // DASHBOARD
  getDashboard(userId) {
    const data = this.getUserData(userId);

    const completedTasks = data.tasks.filter(
      task => task.completed === true
    ).length;

    const completedGoals = data.goals.filter(
      goal => goal.completed === true
    ).length;

    const totalTasks = data.tasks.length;
    const totalGoals = data.goals.length;

    const goalProgress = totalGoals
      ? Math.round(
          data.goals.reduce(
            (sum, goal) => sum + (
              goal.completed
                ? 100
                : Math.max(0, Math.min(100, Number(goal.progress) || 0))
            ),
            0
          ) / totalGoals
        )
      : 0;

    return {
      goals: data.goals,
      tasks: data.tasks,
      plans: data.plans,
      achievements: data.achievements,
      focusSessions: data.focusSessions,

      stats: {
        totalGoals,
        completedGoals,
        totalTasks,
        completedTasks,
        goalProgress,
        taskProgress: totalTasks
          ? Math.round(completedTasks / totalTasks * 100)
          : 0
      },

      createdAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  }

  // ADD GOAL
  addGoal(userId, input = {}) {
    const title = cleanString(input.title, 150);

    if (!title) {
      throw createError('Maqsad nomini kiriting.');
    }

    if (
      input.deadline &&
      !isValidDate(input.deadline)
    ) {
      throw createError('Maqsad muddati noto‘g‘ri.');
    }

    return this.updateUserData(userId, data => {
      data.goals.push({
        id: createId(),
        title,
        description: cleanString(input.description, 1000),
        category: cleanString(input.category, 50, 'personal'),
        deadline: input.deadline || null,
        completed: false,
        progress: 0,
        createdAt: new Date().toISOString()
      });
    });
  }

  // UPDATE GOAL
  updateGoal(userId, goalId, updates = {}) {
    return this.updateUserData(userId, data => {
      const goal = data.goals.find(
        item => item.id === goalId
      );

      if (!goal) {
        throw createError('Maqsad topilmadi.', 404);
      }

      if (typeof updates.title === 'string') {
        const title = cleanString(updates.title, 150);

        if (!title) {
          throw createError('Maqsad nomi bo‘sh bo‘lmasligi kerak.');
        }

        goal.title = title;
      }

      if (typeof updates.description === 'string') {
        goal.description = cleanString(updates.description, 1000);
      }

      if (typeof updates.progress === 'number') {
        if (!Number.isFinite(updates.progress)) {
          throw createError('Maqsad foizi noto‘g‘ri.');
        }

        goal.progress = Math.max(
          0,
          Math.min(100, Math.round(updates.progress))
        );

        goal.completed = goal.progress === 100;
      }

      if (typeof updates.completed === 'boolean') {
        goal.completed = updates.completed;

        if (updates.completed) {
          goal.progress = 100;
        } else if (goal.progress === 100) {
          goal.progress = 0;
        }
      }

      if (updates.deadline !== undefined) {
        if (
          updates.deadline !== null &&
          !isValidDate(updates.deadline)
        ) {
          throw createError('Maqsad muddati noto‘g‘ri.');
        }

        goal.deadline = updates.deadline;
      }

      if (typeof updates.category === 'string') {
        goal.category = cleanString(updates.category, 50);
      }
    });
  }

  // DELETE GOAL
  deleteGoal(userId, goalId) {
    return this.updateUserData(userId, data => {
      const before = data.goals.length;

      data.goals = data.goals.filter(
        item => item.id !== goalId
      );

      if (before === data.goals.length) {
        throw createError('Maqsad topilmadi.', 404);
      }

      data.tasks.forEach(task => {
        if (task.goalId === goalId) {
          task.goalId = null;
        }
      });
    });
  }

  // ADD TASK
  addTask(userId, input = {}) {
    const title = cleanString(input.title, 150);

    if (!title) {
      throw createError('Vazifa nomini kiriting.');
    }

    const date = input.date || new Date().toISOString().slice(0, 10);

    if (!isValidDate(date)) {
      throw createError('Vazifa sanasi noto‘g‘ri.');
    }

    if (
      input.goalId &&
      typeof input.goalId !== 'string'
    ) {
      throw createError('Maqsad ID noto‘g‘ri.');
    }

    if (
      input.priority !== undefined &&
      !['low', 'medium', 'high'].includes(input.priority)
    ) {
      throw createError('Vazifa ustuvorligi noto‘g‘ri.');
    }

    return this.updateUserData(userId, data => {
      if (
        input.goalId &&
        !data.goals.some(goal => goal.id === input.goalId)
      ) {
        throw createError('Bog‘langan maqsad topilmadi.', 404);
      }

      data.tasks.push({
        id: createId(),
        title,
        description: cleanString(input.description, 500),
        goalId: input.goalId || null,
        date,
        priority: input.priority || 'medium',
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
      });
    });
  }

  // UPDATE TASK
  updateTask(userId, taskId, updates = {}) {
    return this.updateUserData(userId, data => {
      const task = data.tasks.find(
        item => item.id === taskId
      );

      if (!task) {
        throw createError('Vazifa topilmadi.', 404);
      }

      if (typeof updates.title === 'string') {
        const title = cleanString(updates.title, 150);

        if (!title) {
          throw createError('Vazifa nomi bo‘sh bo‘lmasligi kerak.');
        }

        task.title = title;
      }

      if (typeof updates.completed === 'boolean') {
        task.completed = updates.completed;
        task.completedAt = updates.completed
          ? new Date().toISOString()
          : null;
      }

      if (updates.priority !== undefined) {
        if (!['low', 'medium', 'high'].includes(updates.priority)) {
          throw createError('Vazifa ustuvorligi noto‘g‘ri.');
        }

        task.priority = updates.priority;
      }

      if (updates.date !== undefined) {
        if (!isValidDate(updates.date)) {
          throw createError('Vazifa sanasi noto‘g‘ri.');
        }

        task.date = updates.date;
      }

      if (updates.description !== undefined) {
        task.description = cleanString(updates.description, 500);
      }

      if (updates.goalId !== undefined) {
        if (
          updates.goalId !== null &&
          (
            typeof updates.goalId !== 'string' ||
            !data.goals.some(goal => goal.id === updates.goalId)
          )
        ) {
          throw createError('Bog‘langan maqsad topilmadi.', 404);
        }

        task.goalId = updates.goalId;
      }
    });
  }

  // DELETE TASK
  deleteTask(userId, taskId) {
    return this.updateUserData(userId, data => {
      const before = data.tasks.length;

      data.tasks = data.tasks.filter(
        item => item.id !== taskId
      );

      if (before === data.tasks.length) {
        throw createError('Vazifa topilmadi.', 404);
      }
    });
  }

  // SAVE DAILY PLAN
  savePlan(userId, plan = {}) {
    if (
      !isValidDate(plan.date) ||
      !Array.isArray(plan.items)
    ) {
      throw createError('Reja ma’lumotlari noto‘g‘ri.');
    }

    if (plan.items.length > 30) {
      throw createError('Bir kunlik rejada 30 tadan ortiq vazifa bo‘lmasligi kerak.');
    }

    const items = plan.items.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw createError('Rejadagi vazifa formati noto‘g‘ri.');
      }

      const title = cleanString(item.title, 150);

      if (!title) {
        throw createError('Rejadagi vazifa nomi bo‘sh.');
      }

      return {
        id: typeof item.id === 'string' ? item.id : createId(),
        title,
        time: cleanString(item.time, 30),
        completed: Boolean(item.completed)
      };
    });

    return this.updateUserData(userId, data => {
      const existing = data.plans.find(
        item => item.date === plan.date
      );

      const newPlan = {
        id: existing?.id || createId(),
        date: plan.date,
        title: cleanString(plan.title, 150, 'Kunlik reja'),
        items,
        updatedAt: new Date().toISOString()
      };

      if (existing) {
        Object.assign(existing, newPlan);
      } else {
        data.plans.push(newPlan);
      }
    });
  }

  // TRANSFER GUEST DATA TO ACCOUNT
  transferUserData(oldUserId, newUserId) {
    if (
      typeof oldUserId !== 'string' ||
      typeof newUserId !== 'string' ||
      !oldUserId.trim() ||
      !newUserId.trim()
    ) {
      throw createError('Foydalanuvchi ID aniqlanmadi.');
    }

    if (oldUserId === newUserId) {
      throw createError('Hisoblar bir xil.');
    }

    const db = this.readDatabase();
    const guestData = db.users[oldUserId];

    if (!guestData) {
      return false;
    }

    if (db.users[newUserId]) {
      throw createError(
        'Yangi hisobda ma’lumotlar mavjud. Ko‘chirish bekor qilindi.'
      );
    }

    this.validateUserData(guestData);

    db.users[newUserId] = {
      ...guestData,
      updatedAt: new Date().toISOString()
    };

    delete db.users[oldUserId];

    this.writeDatabase(db);

    return true;
  }
}

module.exports = new MentorService();
