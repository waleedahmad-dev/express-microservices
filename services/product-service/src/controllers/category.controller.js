const categoryService = require('../services/category.service');
const { HTTP_STATUS } = require('../../../../shared/constants');

class CategoryController {
  async create(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req, res, next) {
    try {
      const category = await categoryService.getCategoryBySlug(req.params.slug);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: category
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
        includeInactive: req.query.includeInactive === 'true',
        parentId: req.query.parentId === 'null' ? null : req.query.parentId,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await categoryService.getAllCategories(options);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.categories,
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

  async getTree(req, res, next) {
    try {
      const tree = await categoryService.getCategoryTree();
      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: tree
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Category deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
