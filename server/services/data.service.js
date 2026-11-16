
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'database', 'data.json');

class DataService {
  readDatabase() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        const error = new Error('data.json fayli topilmadi.');
        error.statusCode = 500;
        throw error;
      }

      const raw = fs.readFileSync(DB_FILE, 'utf8');
      const data = JSON.parse(raw);

      if (
        !data ||
        typeof data !== 'object' ||
        Array.isArray(data)
      ) {
        throw new Error('Database formati noto‘g‘ri.');
      }

      return data;
    } catch (error) {
      console.error('[DATA SERVICE ERROR]', error.message);

      const result = new Error(
        'Ma’lumotlar bazasini o‘qib bo‘lmadi.'
      );

      result.statusCode = 500;
      throw result;
    }
  }

  getAllData() {
    return this.readDatabase();
  }

  getSubjects() {
    const data = this.readDatabase();

    if (!Array.isArray(data.subjects)) {
      throw new Error('Fanlar ro‘yxati noto‘g‘ri.');
    }

    return data.subjects;
  }

  getTools() {
    const data = this.readDatabase();

    if (!Array.isArray(data.tools)) {
      throw new Error('AI vositalari ro‘yxati noto‘g‘ri.');
    }

    return data.tools;
  }

  getLibrary() {
    const data = this.readDatabase();

    if (!Array.isArray(data.library)) {
      throw new Error('Kutubxona ro‘yxati noto‘g‘ri.');
    }

    return data.library;
  }

  getStats() {
    const data = this.readDatabase();

    if (
      !data.stats ||
      typeof data.stats !== 'object' ||
      Array.isArray(data.stats)
    ) {
      throw new Error('Statistika ma’lumotlari noto‘g‘ri.');
    }

    return data.stats;
  }

  getSystemInfo() {
    const data = this.readDatabase();
    return data.system || {};
  }
}

module.exports = new DataService();
