const categoryRepository = require('../repositories/category.repository');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES, HTTP_STATUS } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.PRODUCT_SERVICE);

class CategoryService {
  async createCategory(categoryData) {
    const slug = categoryData.slug || categoryData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const exists = await categoryRepository.existsBySlug(slug);
    if (exists) {
      const error = new Error('Category with this slug already exists');
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    categoryData.slug = slug;
    const category = await categoryRepository.create(categoryData);

    logger.info('Category created', { categoryId: category.id, slug: category.slug });
    return category;
  }

  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return category;
  }

  async getCategoryBySlug(slug) {
    const category = await categoryRepository.findBySlug(slug);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }
    return category;
  }

  async getAllCategories(options) {
    return categoryRepository.findAll(options);
  }

  async getCategoryTree() {
    return categoryRepository.getTree();
  }

  async updateCategory(id, updateData) {
    if (updateData.slug) {
      const exists = await categoryRepository.existsBySlug(updateData.slug, id);
      if (exists) {
        const error = new Error('Category with this slug already exists');
        error.statusCode = HTTP_STATUS.CONFLICT;
        throw error;
      }
    }

    const category = await categoryRepository.update(id, updateData);
    if (!category) {
      const error = new Error('Category not found');
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    logger.info('Category updated', { categoryId: category.id });
    return category;
  }

  async deleteCategory(id) {
    try {
      const deleted = await categoryRepository.delete(id);
      if (!deleted) {
        const error = new Error('Category not found');
        error.statusCode = HTTP_STATUS.NOT_FOUND;
        throw error;
      }

      logger.info('Category deleted', { categoryId: id });
      return true;
    } catch (error) {
      if (!error.statusCode) {
        error.statusCode = HTTP_STATUS.BAD_REQUEST;
      }
      throw error;
    }
  }
}

module.exports = new CategoryService();
