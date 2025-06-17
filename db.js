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

  checkUserExists: async (email) => {
    try {
      const user = await knex('user').select('*').where({ email }).first();
      if (user) {
        logger.info(`User with email ${email} exists.`);
        return true;
      } else {
        logger.warn(`User with email ${email} does not exist.`);
        return false;
      }
    } catch (error) {
      logger.error('Error checking if user exists:', error);
      throw error;
    }
  },

  checkUserCredentials: async (email, password) => {
    try {
      const user = await knex('user').select('*')
        .where({ email }).first();

      if (user && await bcrypt.compare(password, user.passwordHash)) {
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

  createUser: async (firstName, lastName, email, password) => {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        firstName,
        lastName,
        email,
        passwordHash,
        role: 'user'
      };
      logger.info('Creating new user:', newUser);
      const result = await knex('user').insert(newUser);
      logger.info('User created:', newUser);
      return result;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  },

  getUsersPaginated: async (page = 1, pageSize = 10) => {
    try {
      const offset = (page - 1) * pageSize;
      const users = await knex('user')
        .select('id', 'firstName', 'lastName', 'email', 'role')
        .limit(pageSize)
        .offset(offset);
  
      const [{ count }] = await knex('user').count('* as count');
  
      return {
        users,
        total: Number(count),
        page,
        pageSize,
        totalPages: Math.ceil(Number(count) / pageSize)
      };
    } catch (error) {
      logger.error('Error fetching paginated users:', error);
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