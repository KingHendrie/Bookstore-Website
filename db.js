require('dotenv').config();
const knex = require('knex')(require('./knexfile').development);
const logger = require('./logger');
const bcrypt = require('bcrypt');

async function checkConnection() {
  try {
    await knex.raw('SELECT 1');
    logger.info('Database connection successful.');
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

const db = {
  getUsers: async () => {
    try {
      const users = await knex('users').select('*');
      logger.info('Fetched all users.');
      return users;
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  },

  checkUserCredentials: async (email, password) => {
    try {
      const user = await knex('users').select('*')
        .where({ email }).first();

      if (user && await bcrypt.compare(password, user.password)) {
        logger.info('User credentials verified.');
        return user;
      } else {
        logger.warn('Invalid email or password.');
        return null;
      }
    } catch (error) {
      logger.error('Error checking user credentials:', error);
      throw error;
    }
  },

  createUser: async (fisrtName, lastName, email, password) => {
    try {
      const hasedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        first_name: firstName,
        last_name: lastName,
        email,
        passwordHash: hasedPassword,
        role: 'user'
      };
      const result = await knex('users').insert(newUser);
      logger.info('User created:', newUser);
      return result;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const user = await knex('users').where({ id }).first();
      logger.info(`Fetched user with ID: ${id}`);
      return user;
    } catch (error) {
      logger.error(`Error fetching user with ID ${id}:`, error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const result = await knex('users').insert(userData);
      logger.info('User created:', userData);
      return result;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  },

  updateUser: async (id, newData) => {
    try {
      const result = await knex('users').where({ id }).update(newData);
      logger.info(`Updated user with ID ${id}:`, newData);
      return result;
    } catch (error) {
      logger.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  },

  deleteUser: async (id) => {
    try {
      const result = await knex('users').where({ id }).del();
      logger.info(`Deleted user with ID ${id}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting user with ID ${id}:`, error);
      throw error;
    }
  }
};

// Close connections gracefully
process.on('SIGINT', async () => {
  logger.warn('Shutting down database connections...');
  await knex.destroy();
  process.exit(0);
});

module.exports = { knex, checkConnection, ...db };