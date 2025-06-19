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
  // User Stuff
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

  createUser: async (firstName, lastName, email, password, role) => {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        firstName,
        lastName,
        email,
        passwordHash,
        role
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

  getUserById: async (id) => {
    try {
      return await knex('user')
        .select('id', 'firstName', 'lastName', 'email', 'role', 'two_factor_enabled')
        .where({ id })
        .first();
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  },

  setTwoFA: async (id, enabled) => {
    try {
      await knex('user')
        .where({ id })
        .update({ two_factor_enabled: !!enabled });
      return true;
    } catch (error) {
      logger.error('Error setting 2FA:', error);
      throw error;
    }
  },

  updateUserPassword: async (id, passwordHash) => {
    try {
      await knex('user')
        .where({ id })
        .update({ passwordHash });
      return true;
    } catch (error) {
      logger.error('Error updating user password:', error);
      throw error;
    }
  },

  // Admin Users
  getUsersPaginated: async (page = 1, pageSize = 10) => {
    try {
      const offset = (page - 1) * pageSize;
      const users = await knex('user')
        .select('id', 'firstName', 'lastName', 'email', 'role', 'two_factor_enabled')
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
  },

  updateUser: async (id, { firstName, lastName, email, password, role }) => {
    try {
      const updateData = { firstName, lastName, email, role };
      if (password && password.trim() !== "") {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      const result = await knex('user')
        .where({ id })
        .update(updateData);
      return result > 0;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  },

  // Admin Books
  getBooksPaginated: async (page = 1, pageSize = 10) => {
    try {
      const offset = (page - 1) * pageSize;
      const books = await knex('book')
        .leftJoin('book_image', 'book.id', 'book_image.bookId')
        .select(
          'book.id',
          'book.title',
          'book.author',
          'book.genre',
          'book.isbn',
          'book.publisher',
          'book.price',
          'book.stockQuantity',
          'book_image.image_base64'
        )
        .limit(pageSize)
        .offset(offset);

      const [{ count }] = await knex('book').count('* as count');

      return {
        books,
        total: Number(count),
        page,
        pageSize,
        totalPages: Math.ceil(Number(count) / pageSize)
      };
    } catch (error) {
      logger.error('Error fetching paginated books:', error);
      throw error;
    }
  },

  addBook: async (title, author, genre, isbn, publisher, description, price, stockQuantity) => {
    try {
      const newBook = {
        title,
        author,
        genre,
        isbn,
        publisher,
        description,
        price,
        stockQuantity
      };

      logger.info('Adding new book:', newBook);
      const result = await knex('book').insert(newBook);
      logger.info('Book added:', newBook);
      return result;
    } catch (error) {
      logger.error('Error adding book:', error);
      throw error;
    }
  },

  updateBook: async (id, { title, author, genre, isbn, publisher, description, price, stockQuantity }) => {
    try {
      const updatedData = { title, author, genre, isbn, publisher, description, price, stockQuantity };
      const result = await knex('book')
        .where({ id })
        .update(updatedData);
      return result > 0;
    } catch (error) {
      logger.error('Error updating book:', error);
      throw error;
    }
  },
  
  addImage: async (bookId, imageBase64) => {
    try {
      const imageData = {
        bookId,
        image_base64: imageBase64
      };

      logger.info('Adding image for book ID:', bookId);
      const result = await knex('book_image').insert(imageData);
      logger.info('Image added for book ID:', bookId);
      return result;
    } catch (error) {
      logger.error('Error adding image:', error);
      throw error;
    }
  },

  checkImageExists: async (bookId) => {
    try {
      const image = await knex('book_image')
        .select('id')
        .where({ bookId })
        .first();
      
      if (image) {
        logger.info(`Image exists for book ID ${bookId}.`);
        return image.id;
      } else {
        logger.warn(`No image found for book ID ${bookId}.`);
        return null;
      }
    } catch (error) {
      logger.error('Error checking if image exists:', error);
      throw error;
    }
  },
  
  updateImage: async (imageId, imageBase64) => {
    try {
      const imageData = {
        image_base64: imageBase64
      };

      logger.info('Updating image for image ID:', imageId);
      const result = await knex('book_image')
        .where({ id: imageId })
        .update(imageData);
      logger.info('Image updated for image ID:', imageId);
      return result > 0;
    } catch (error) {
      logger.error('Error updating image:', error);
      throw error;
    }
  },

  // Admin Reviews
  getReviewsByBookId: async (bookId) => {
    try {
      const rows = await knex('review')
        .join('user', 'review.userId', 'user.id')
        .select(
          'review.id',
          'review.rating',
          'review.comment',
          'review.datePosted',
          'user.firstName',
          'user.lastName',
          'user.id as userId'
        )
        .where({ bookId })
        .orderBy('datePosted', 'desc');
  
      return rows.map(r => ({
        id: r.id,
        userId: r.userId,
        userName: `${r.firstName} ${r.lastName}`,
        rating: r.rating,
        comment: r.comment,
        datePosted: r.datePosted
      }));
    } catch (error) {
      logger.error('Error fetching reviews for book:', error);
      throw error;
    }
  },
  
  deleteReview: async (reviewId) => {
    try {
      return await knex('review').where({ id: reviewId }).del();
    } catch (error) {
      logger.error('Error deleting review:', error);
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