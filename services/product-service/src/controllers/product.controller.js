const productService = require('../services/product.service');
const { HTTP_STATUS } = require('../../../../shared/constants');

class ProductController {
  async create(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: product
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
        search: req.query.search,
        categoryId: req.query.categoryId,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
        inStock: req.query.inStock !== undefined ? req.query.inStock === 'true' : null,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await productService.getAllProducts(options);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.products,
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

  async update(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateInventory(req, res, next) {
    try {
      const { quantity } = req.body;
      const product = await productService.updateInventory(req.params.id, quantity);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Inventory updated successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  }

  async checkAvailability(req, res, next) {
    try {
      const { items } = req.body;
      const availability = await productService.checkAvailability(items);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: availability
      });
    } catch (error) {
      next(error);
    }
  }

  async reserveInventory(req, res, next) {
    try {
      const { items } = req.body;
      const result = await productService.reserveInventory(items);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Inventory reserved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async releaseInventory(req, res, next) {
    try {
      const { items } = req.body;
      await productService.releaseInventory(items);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Inventory released successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
