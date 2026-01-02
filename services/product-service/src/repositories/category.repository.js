const { Category, Product } = require('../models');
const { Op } = require('sequelize');

class CategoryRepository {
  async create(categoryData) {
    return Category.create(categoryData);
  }

  async findById(id) {
    return Category.findByPk(id, {
      include: [
        { model: Category, as: 'parent' },
        { model: Category, as: 'children' }
      ]
    });
  }

  async findBySlug(slug) {
    return Category.findOne({
      where: { slug },
      include: [
        { model: Category, as: 'parent' },
        { model: Category, as: 'children' }
      ]
    });
  }

  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      includeInactive = false,
      parentId = undefined,
      sortBy = 'sortOrder',
      sortOrder = 'ASC'
    } = options;

    const where = {};

    if (!includeInactive) {
      where.isActive = true;
    }

    if (parentId !== undefined) {
      where.parentId = parentId;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Category.findAndCountAll({
      where,
      include: [
        { model: Category, as: 'children', where: { isActive: true }, required: false }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    return {
      categories: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  async getTree() {
    const categories = await Category.findAll({
      where: { parentId: null, isActive: true },
      include: [{
        model: Category,
        as: 'children',
        where: { isActive: true },
        required: false,
        include: [{
          model: Category,
          as: 'children',
          where: { isActive: true },
          required: false
        }]
      }],
      order: [['sortOrder', 'ASC']]
    });

    return categories;
  }

  async update(id, updateData) {
    const category = await Category.findByPk(id);
    if (!category) return null;

    await category.update(updateData);
    return this.findById(id);
  }

  async delete(id) {
    const category = await Category.findByPk(id);
    if (!category) return false;

    // Check if category has products
    const productCount = await Product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      throw new Error('Cannot delete category with associated products');
    }

    // Check if category has children
    const childCount = await Category.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    await category.destroy();
    return true;
  }

  async existsBySlug(slug, excludeId = null) {
    const where = { slug };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const count = await Category.count({ where });
    return count > 0;
  }
}

module.exports = new CategoryRepository();
