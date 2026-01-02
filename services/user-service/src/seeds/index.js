const User = require('../models/user.model');
const { createLogger } = require('../../../../shared/logger');
const { SERVICES, USER_ROLES } = require('../../../../shared/constants');

const logger = createLogger(SERVICES.USER_SERVICE);

const seedUsers = [
  {
    email: 'admin@example.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    phone: '+1234567890',
    role: USER_ROLES.ADMIN,
    isActive: true
  },
  {
    email: 'john.doe@example.com',
    password: 'User123!',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567891',
    role: USER_ROLES.USER,
    isActive: true
  },
  {
    email: 'jane.smith@example.com',
    password: 'User123!',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1234567892',
    role: USER_ROLES.USER,
    isActive: true
  },
  {
    email: 'moderator@example.com',
    password: 'Mod123!',
    firstName: 'Mod',
    lastName: 'User',
    phone: '+1234567893',
    role: USER_ROLES.MODERATOR,
    isActive: true
  }
];

const seedDatabase = async () => {
  try {
    const existingCount = await User.count();

    if (existingCount > 0) {
      logger.info('Database already seeded, skipping...');
      return;
    }

    logger.info('Seeding users...');

    for (const userData of seedUsers) {
      await User.create(userData);
    }

    logger.info(`Successfully seeded ${seedUsers.length} users`);
  } catch (error) {
    logger.error('Error seeding database', { error: error.message });
    throw error;
  }
};

module.exports = seedDatabase;
