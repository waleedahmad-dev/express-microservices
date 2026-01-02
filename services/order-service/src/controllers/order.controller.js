const orderService = require('../services/order.service');
const { HTTP_STATUS } = require('../../../../shared/constants');

class OrderController {
  async create(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const { items, shippingAddress, billingAddress, notes, shippingCost, discount } = req.body;

      const orderData = {
        shippingAddress,
        billingAddress,
        notes,
        shippingCost,
        discount
      };

      const order = await orderService.createOrder(
        orderData,
        items,
        userId,
        req.requestId
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Order created successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const userRole = req.headers['x-user-role'];

      // Admins can view any order
      const checkUserId = userRole === 'ADMIN' ? null : userId;
      const order = await orderService.getOrderById(req.params.id, checkUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async getByOrderNumber(req, res, next) {
    try {
      const order = await orderService.getOrderByNumber(req.params.orderNumber);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await orderService.getOrdersByUser(userId, options);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.orders,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const options = {
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        userId: req.query.userId,
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await orderService.getAllOrders(options);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.orders,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async cancel(req, res, next) {
    try {
      const userId = req.headers['x-user-id'];
      const order = await orderService.cancelOrder(req.params.id, userId, req.requestId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { shippingAddress, billingAddress, notes } = req.body;
      const order = await orderService.updateOrder(req.params.id, {
        shippingAddress,
        billingAddress,
        notes
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Order updated successfully',
        data: order
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
