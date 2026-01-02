const { Product, Category } = require('../models');
const { Op } = require('sequelize');

class ProductRepository {
  async create(productData) {
    return Product.create(productData);
  }

  async findById(id) {
    return Product.findByPk(id, {
      include: [{ model: Category, as: 'category' }]
    });
  }

  async findBySku(sku) {
    return Product.findOne({ where: { sku } });
  }

  async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      search = '',
      categoryId = null,
      minPrice = null,
      maxPrice = null,
      isActive = null,
      inStock = null,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = options;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (minPrice !== null) {
      where.price = { ...where.price, [Op.gte]: minPrice };
    }

    if (maxPrice !== null) {
      where.price = { ...where.price, [Op.lte]: maxPrice };
    }

    if (isActive !== null) {
      where.isActive = isActive;
    }

    if (inStock === true) {
      where.quantity = { [Op.gt]: 0 };
    } else if (inStock === false) {
      where.quantity = 0;
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category' }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder]]
    });

    return {
      products: rows,
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / limit)
    };
  }

  async update(id, updateData) {
    const product = await Product.findByPk(id);
    if (!product) return null;

    await product.update(updateData);
    return this.findById(id);
  }

  async delete(id) {
    const product = await Product.findByPk(id);
    if (!product) return false;

    await product.destroy();
    return true;
  }

  async updateQuantity(id, quantity) {
    return Product.update({ quantity }, { where: { id } });
  }

  async decrementQuantity(id, amount) {
    const product = await Product.findByPk(id);
    if (!product || product.quantity < amount) return null;

    product.quantity -= amount;
    await product.save();
    return product;
  }

  async incrementQuantity(id, amount) {
    const product = await Product.findByPk(id);
    if (!product) return null;

    product.quantity += amount;
    await product.save();
    return product;
  }

  async findLowStock() {
    return Product.findAll({
      where: {
        quantity: {
          [Op.lte]: sequelize.col('low_stock_threshold')
        },
        isActive: true
      },
      include: [{ model: Category, as: 'category' }]
    });
  }

  async checkAvailability(productIds) {
    const products = await Product.findAll({
      where: {
        id: { [Op.in]: productIds },
        isActive: true
      },
      attributes: ['id', 'quantity', 'price', 'name']
    });

    return products;
  }
}

module.exports = new ProductRepository();
