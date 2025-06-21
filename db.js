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

  // Public Books
  getCategories: async () => {
    try {
      const categories = await knex('genre').select('id', 'genre as name').orderBy('genre', 'asc');
      return categories;
    } catch (error) {
      logger.error('Error fetching categories:', error);
      throw error;
    }
  },

  getBookById: async (id) => {
    try {
      const book = await knex('book')
        .leftJoin('book_image', 'book.id', 'book_image.bookId')
        .leftJoin('genre', 'book.genreId', 'genre.id')
        .select(
          'book.id',
          'book.title',
          'book.author',
          'genre.genre as genre',
          'book.isbn',
          'book.publisher',
          'book.description',
          'book.price',
          'book.stockQuantity',
          'book_image.image_base64'
        )
        .where('book.id', id)
        .first();
  
      if (book && book.image_base64) {
        book.imageUrl = `data:image/png;base64,${book.image_base64}`;
      } else {
        book.imageUrl = null;
      }
      if (book) delete book.image_base64;
      return book;
    } catch (error) {
      logger.error('Error fetching book by id:', error);
      throw error;
    }
  },

  getBooksFiltered: async ({ genre, search, page = 1, pageSize = 12 }) => {
    try {
      const query = knex('book')
        .leftJoin('book_image', 'book.id', 'book_image.bookId')
        .leftJoin('genre', 'book.genreId', 'genre.id')
        .select(
          'book.id',
          'book.title',
          'book.author',
          'book.genreId',
          'genre.genre as genre',
          'book.isbn',
          'book.publisher',
          'book.description',
          'book.price',
          'book.stockQuantity',
          'book_image.image_base64'
        );

      if (genre) query.where('genre.genre', genre);
      if (search) {
        query.where(function() {
          this.where('book.title', 'like', `%${search}%`)
            .orWhere('book.author', 'like', `%${search}%`)
            .orWhere('book.isbn', 'like', `%${search}%`);
        });
      }

      const offset = (page - 1) * pageSize;
      query.offset(offset).limit(pageSize);
  
      const books = await query;

      const countQuery = knex('book')
        .leftJoin('genre', 'book.genreId', 'genre.id')
        .count('* as count');
      if (genre) countQuery.where('genre.genre', genre);
      if (search) {
        countQuery.where(function() {
          this.where('book.title', 'like', `%${search}%`)
            .orWhere('book.author', 'like', `%${search}%`)
            .orWhere('book.isbn', 'like', `%${search}%`);
        });
      }
      const [{ count }] = await countQuery;

      books.forEach(book => {
        if (book.image_base64) {
          book.imageUrl = `data:image/png;base64,${book.image_base64}`;
        } else {
          book.imageUrl = null;
        }
        delete book.image_base64;
      });

      return {
        books,
        total: Number(count),
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(Number(count) / pageSize)
      };
    } catch (error) {
      logger.error('Error fetching filtered books:', error);
      throw error;
    }
  },

  getReviewsForBook: async (bookId) => {
    return await knex('review')
      .join('user', 'review.userId', 'user.id')
      .where({ bookId })
      .orderBy('datePosted', 'desc')
      .select('review.*', 'user.firstName');
  },

  addReview: async ({ userId, bookId, rating, comment }) => {
    return await knex('review').insert({
      userId,
      bookId,
      rating,
      comment,
      datePosted: knex.fn.now()
    });
  },

  // Public Spotlight
  getSpotlightGenres: async () => {
    try {
      return await knex('genre')
        .select('id', 'genre as name', 'genre_icon', 'spotlight')
        .where('spotlight', true)
        .orderBy('genre', 'asc');
    } catch (error) {
      logger.error('Error fetching spotlight genres:', error);
      throw error;
    }
  },

  getBooksByGenreIds: async (genreIds) => {
    try {
      if (!Array.isArray(genreIds) || genreIds.length === 0) {
        return [];
      }
      const cleanIds = genreIds.filter(x => !!x).map(Number);
      if (cleanIds.length === 0) {
        return [];
      }

      const books = await knex('book')
      .leftJoin('book_image', 'book.id', 'book_image.bookId')
      .leftJoin('genre', 'book.genreId', 'genre.id')
      .select(
        'book.id',
        'book.title',
        'book.author',
        'book.genreId',
        'genre.genre as genre',
        'book.isbn',
        'book.publisher',
        'book.description',
        'book.price',
        'book.stockQuantity',
        'book_image.image_base64'
      )
      .whereIn('genreId', cleanIds)

      return books;
    } catch (error) {
      logger.error('Error fetching books for spotlight genres:', error);
      throw error;
    }
  },

  // Public Cart
  getOrCreateCartId: async (userId) => {
    let cart = await knex('shopping_cart').where({ userId }).first();
    if (!cart) {
      const [cartId] = await knex('shopping_cart').insert({ userId }).returning('id');
      return cartId.id || cartId;
    }
    return cart.id;
  },

  getCart: async (userId) => {
    const cart = await knex('shopping_cart').where({ userId }).first();
    if (!cart) return [];
    const items = await knex('shopping_cart_items')
      .join('book', 'shopping_cart_items.bookId', 'book.id')
      .join('book_image', 'book.id', 'book_image.bookId')
      .select(
        'shopping_cart_items.bookId',
        'shopping_cart_items.quantity',
        'book.title',
        'book.author',
        'book.price',
        'book.stockQuantity',
        'book_image.image_base64'
      )
      .where({ shoppingCartId: cart.id });
    return items;
  },

  addToCart: async (userId, bookId, quantity = 1) => {
    const cartId = await db.getOrCreateCartId(userId);
    const existing = await knex('shopping_cart_items')
      .where({ shoppingCartId: cartId, bookId })
      .first();
    if (existing) {
      await knex('shopping_cart_items')
        .where({ shoppingCartId: cartId, bookId })
        .update({ quantity: existing.quantity + quantity });
    } else {
      await knex('shopping_cart_items')
        .insert({ shoppingCartId: cartId, bookId, quantity });
    }
    return true;
  },

  updateCartItem: async (userId, bookId, quantity) => {
    const cart = await knex('shopping_cart').where({ userId }).first();
    if (!cart) return false;
  
    const book = await knex('book').where({ id: bookId }).first();
    if (!book) throw new Error('Book not found');
    if (quantity > book.stockQuantity) throw new Error('Not enough stock');
  
    const item = await knex('shopping_cart_items')
      .where({ shoppingCartId: cart.id, bookId })
      .first();
  
    if (!item) return false;
  
    if (quantity < 1) {
      const deletedRows = await knex('shopping_cart_items')
        .where({ shoppingCartId: cart.id, bookId })
        .del();
      return deletedRows > 0;
    } else {
      const updatedRows = await knex('shopping_cart_items')
        .where({ shoppingCartId: cart.id, bookId })
        .update({ quantity });
      return updatedRows > 0;
    }
  },

  removeFromCart: async (userId, bookId) => {
    const cartId = await db.getOrCreateCartId(userId);
    await knex('shopping_cart_items')
      .where({ shoppingCartId: cartId, bookId })
      .del();
    return true;
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

  // Admin Genres
  getGenresPaginated: async (page = 1, pageSize = 10) => {
    try {
      const offset = (page - 1) * pageSize;
      const genres = await knex('genre')
        .select('id', 'genre as name', 'genre_icon', 'spotlight')
        .orderBy('genre', 'asc')
        .limit(pageSize)
        .offset(offset);
  
      const [{ count }] = await knex('genre').count('* as count');
  
      return {
        genres,
        total: Number(count),
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(Number(count) / pageSize)
      };
    } catch (error) {
      logger.error('Error fetching paginated genres:', error);
      throw error;
    }
  },

  addGenre: async (genre, genre_icon, spotlight = false) => {
    try {
      return await knex('genre').insert({ genre, genre_icon, spotlight });
    } catch (error) {
      logger.error('Error adding genre:', error);
      throw error;
    }
  },

  updateGenre: async (id, genre, genre_icon, spotlight = false) => {
    try {
      return await knex('genre').where({ id }).update({ genre, genre_icon, spotlight });
    } catch (error) {
      logger.error('Error updating genre:', error);
      throw error;
    }
  },

  // Admin Books
  getBooksPaginated: async (page = 1, pageSize = 10) => {
    try {
      const offset = (page - 1) * pageSize;
      const books = await knex('book')
      .leftJoin('book_image', 'book.id', 'book_image.bookId')
      .leftJoin('genre', 'book.genreId', 'genre.id')
      .select(
        'book.id',
        'book.title',
        'book.author',
        'book.genreId',
        'genre.genre as genre',
        'book.isbn',
        'book.publisher',
        'book.description',
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

  addBook: async (title, author, genreId, isbn, publisher, description, price, stockQuantity) => {
    try {
      const newBook = {
        title,
        author,
        genreId,
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

  updateBook: async (id, { title, author, genreId, isbn, publisher, description, price, stockQuantity }) => {
    try {
      const updatedData = { title, author, genreId, isbn, publisher, description, price, stockQuantity };
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