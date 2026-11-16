const subscriptionService = require('../services/subscription.service');
const authController = require('./auth.controller');

class SubscriptionController {
  sendJSON(res, status, data) {
    if (res.headersSent || res.destroyed || res.writableEnded) return;
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    });
    return res.end(JSON.stringify(data));
  }

  getUserId(req) {
    const user = authController.getAuthenticatedUser(req);
    return user?.id || req.headers['x-user-id'] || 'guest_demo_user';
  }

  getPlans(req, res) {
    try {
      const plans = subscriptionService.getPlans();
      return this.sendJSON(res, 200, { success: true, plans });
    } catch (err) {
      console.error('[GET PLANS ERROR]', err);
      return this.sendJSON(res, 500, { success: false, message: err.message });
    }
  }

  getUserStatus(req, res) {
    try {
      const userId = this.getUserId(req);
      const subscription = subscriptionService.getUserSubscription(userId);
      return this.sendJSON(res, 200, { success: true, subscription });
    } catch (err) {
      console.error('[GET USER SUB STATUS ERROR]', err);
      return this.sendJSON(res, 500, { success: false, message: err.message });
    }
  }

  async createOrder(req, res, body = {}) {
    try {
      const userId = this.getUserId(req);
      const planId = body.planId || 'pro_monthly';
      const provider = body.provider || 'click';

      const order = subscriptionService.createOrder(userId, planId, provider);
      return this.sendJSON(res, 200, { success: true, order });
    } catch (err) {
      console.error('[CREATE ORDER ERROR]', err);
      return this.sendJSON(res, 400, { success: false, message: err.message });
    }
  }

  async confirmPayment(req, res, body = {}) {
    try {
      const orderId = body.orderId;
      const paymentCode = body.paymentCode;
      if (!orderId) {
        return this.sendJSON(res, 400, { success: false, message: 'orderId kiritilishi shart.' });
      }

      const result = subscriptionService.confirmPayment(orderId, paymentCode);
      return this.sendJSON(res, 200, { success: true, ...result });
    } catch (err) {
      console.error('[CONFIRM PAYMENT ERROR]', err);
      return this.sendJSON(res, 400, { success: false, message: err.message });
    }
  }
}

module.exports = new SubscriptionController();
