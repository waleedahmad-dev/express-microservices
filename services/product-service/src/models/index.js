const Product = require('./product.model');
const Category = require('./category.model');

// Define relationships
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

module.exports = {
  Product,
  Category
};
