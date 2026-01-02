const { Product, Category } = require('../models');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.PRODUCT_SERVICE);

const seedCategories = [
  { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories', sortOrder: 1 },
  { name: 'Clothing', slug: 'clothing', description: 'Apparel and fashion items', sortOrder: 2 },
  { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden supplies', sortOrder: 3 },
  { name: 'Sports', slug: 'sports', description: 'Sports equipment and accessories', sortOrder: 4 }
];

const seedProducts = [
  {
    sku: 'ELEC-001',
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation',
    price: 79.99,
    compareAtPrice: 99.99,
    costPrice: 40.00,
    quantity: 100,
    lowStockThreshold: 10,
    isActive: true
  },
  {
    sku: 'ELEC-002',
    name: 'Smart Watch Pro',
    description: 'Advanced smartwatch with health monitoring features',
    price: 199.99,
    compareAtPrice: 249.99,
    costPrice: 100.00,
    quantity: 50,
    lowStockThreshold: 5,
    isActive: true
  },
  {
    sku: 'CLTH-001',
    name: 'Classic Cotton T-Shirt',
    description: 'Comfortable 100% cotton t-shirt',
    price: 24.99,
    costPrice: 8.00,
    quantity: 200,
    lowStockThreshold: 20,
    isActive: true
  },
  {
    sku: 'CLTH-002',
    name: 'Denim Jeans',
    description: 'Classic fit denim jeans',
    price: 59.99,
    compareAtPrice: 79.99,
    costPrice: 25.00,
    quantity: 150,
    lowStockThreshold: 15,
    isActive: true
  },
  {
    sku: 'HOME-001',
    name: 'LED Desk Lamp',
    description: 'Adjustable LED desk lamp with multiple brightness levels',
    price: 34.99,
    costPrice: 15.00,
    quantity: 75,
    lowStockThreshold: 10,
    isActive: true
  },
  {
    sku: 'SPRT-001',
    name: 'Yoga Mat Premium',
    description: 'Non-slip premium yoga mat',
    price: 44.99,
    costPrice: 18.00,
    quantity: 80,
    lowStockThreshold: 10,
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    const categoryCount = await Category.count();
    const productCount = await Product.count();

    if (categoryCount > 0 && productCount > 0) {
      logger.info('Database already seeded, skipping...');
      return;
    }

    logger.info('Seeding categories and products...');

    // Seed categories
    const categories = {};
    for (const categoryData of seedCategories) {
      const category = await Category.create(categoryData);
      categories[category.slug] = category;
    }

    // Seed products with category associations
    const categoryMap = {
      'ELEC': 'electronics',
      'CLTH': 'clothing',
      'HOME': 'home-garden',
      'SPRT': 'sports'
    };

    for (const productData of seedProducts) {
      const prefix = productData.sku.split('-')[0];
      const categorySlug = categoryMap[prefix];
      if (categorySlug && categories[categorySlug]) {
        productData.categoryId = categories[categorySlug].id;
      }
      await Product.create(productData);
    }

    logger.info(`Successfully seeded ${seedCategories.length} categories and ${seedProducts.length} products`);
  } catch (error) {
    logger.error('Error seeding database', { error: error.message });
    throw error;
  }
};

module.exports = seedDatabase;
