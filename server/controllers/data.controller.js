
const dataService = require('../services/data.service');

class DataController {
  send(res, status, data) {
    if (res.headersSent || res.writableEnded || res.destroyed) {
      return;
    }

    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });

    return res.end(JSON.stringify(data));
  }

  handleError(res, error) {
    console.error('[DATA CONTROLLER ERROR]', error.message);

    const status = error.statusCode || 500;

    return this.send(res, status, {
      success: false,
      message: status < 500
        ? error.message
        : 'Ma’lumotlarni yuklashda xatolik yuz berdi.'
    });
  }

  execute(res, callback) {
    try {
      const data = callback();

      return this.send(res, 200, {
        success: true,
        data
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  }

  getAll(req, res) {
    return this.execute(res, () => dataService.getAllData());
  }

  getSubjects(req, res) {
    return this.execute(res, () => dataService.getSubjects());
  }

  getTools(req, res) {
    return this.execute(res, () => dataService.getTools());
  }

  getLibrary(req, res) {
    return this.execute(res, () => dataService.getLibrary());
  }

  getStats(req, res) {
    return this.execute(res, () => dataService.getStats());
  }
}

module.exports = new DataController();
