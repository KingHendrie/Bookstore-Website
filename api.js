const express = require('express');
const router = express.Router();
const transporter = require('./mailer');
const logger = require('./logger');
const { htmlToText } = require('html-to-text');
const db = require('./db');
const bcrypt = require('bcrypt');

function generate2FACode() {
	const digits = () => Math.floor(100 + Math.random() * 900);
	return `${digits()}-${digits()}-${digits()}`;
}

// Enable JSON parsing for API routes
router.use(express.json({ limit: '5mb' }));
router.use(express.urlencoded({ limit: '5mb', extended: true }));

// Emails
router.post('/email/send-email', async (req, res) => {
	const { to, subject, text, html } = req.body;

	if (!to || !subject || !(text || html)) {
		logger.warn('Email send attempt with missing fields');
		return res.status(400).json({ error: "Missing required fields." });
	}

	try {
		await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to,
			subject,
			text,
			html,
		});

		logger.info(`Email sent to ${to} with subject "${subject}"`);
		res.json({ success: true });
	} catch (error) {
		logger.error('Error sending email: ' + error.stack);
		res.status(500).json({ error: "Failed to send email." });
	}
});

router.post('/email/send-contact', async (req, res) => {
	const { to, subject, text, html } = req.body;

	if (!to || !subject || !(text || html)) {
		logger.warn('Email send attempt with missing fields');
		return res.status(400).json({ error: "Missing required fields." });
	}

	try {
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to: process.env.EMAIL_TO,
			subject,
		};

		if (html) {
			mailOptions.html = html;
			mailOptions.text = htmlToText(html);
		} else if (text) {
			mailOptions.text = text;
		}

		await transporter.sendMail(mailOptions);
		logger.info(`Email sent to ${process.env.EMAIL_TO} with subject "${subject}"`);
		res.json({ success: true });
	} catch (error) {
		logger.error('Error sending email: ' + error.stack);
		res.status(500).json({ error: "Failed to send email." });
	}
});

// 2FA Routes
router.post('/2fa/verify-2fa', async (req, res) => {
	const { code } = req.body;
	const pending = req.session.pending2FA;

	if (!pending) {
		logger.warn('2FA verification attempt without pending challenge');
		return res.status(400).json({ error: "No 2FA challenge pending." });
	}
	if (!code || typeof code !== "string") {
		logger.warn('2FA verification attempt with missing code');
		return res.status(400).json({ error: "Code required." });
	}
	if (pending.expires < Date.now()) {
		logger.warn('2FA code expired for user ' + pending.userId);
		delete req.session.pending2FA;
		return res.status(400).json({ error: "2FA code expired. Please login again." });
	}
	if (pending.code !== code.trim()) {
		logger.warn(`2FA verification failed for user ${pending.userId}: Incorrect code`);
		return res.status(401).json({ error: "Incorrect 2FA code." });
	}

	const user = await db.getUserById(pending.userId);
	if (!user) {
		logger.warn(`2FA verification failed: User ${pending.userId} does not exist.`);
		return res.status(400).json({ error: "User no longer exists." });
	}

	req.session.user = {
		id: user.id,
		email: user.email,
		role: user.role,
		firstName: user.firstName,
		lastName: user.lastName
	};

	delete req.session.pending2FA;
	res.json({ success: true, message: "2FA verified. Login complete." });
});

// User Registration
router.post('/user/register', async (req, res) => {
	const { firstName, lastName, email, password, role = 'user' } = req.body;

	if (!firstName || !lastName || !email || !password) {
		logger.warn('Registration attempt with missing fields');
		return res.status(400).json({ error: "Missing required fields." });
	}

	try {
		const userExists = await db.checkUserExists(email);
		if (userExists) {
			logger.warn(`Registration failed: User ${email} already exists.`);
			return res.status(400).json({ error: "User already exists." });
		}
		logger.info(`User ${email} does not exist, proceeding with registration.`);
	} catch (error) {
		logger.error('Error checking user existence: ' + error.stack);
		return res.status(500).json({ error: "Failed to process registration." });
	}

	try {
		const user = await db.createUser(
			firstName, 
			lastName, 
			email, 
			password, 
			role
		);

		if (user) {
			logger.info(`User ${email} registered successfully`);
			res.json({ success: true, message: "Registration successful." });
		} else {
			logger.warn(`Registration failed for user ${email}`);
			res.status(400).json({ error: "User already exists." });
		}
	} catch (error) {
		logger.error('Error during registration: ' + error.stack);
		res.status(500).json({ error: "Failed to process registration." });
	}
});

// User Stuff
router.post('/user/login', async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		logger.warn('Login attempt with missing fields');
		return res.status(400).json({ error: "Missing email or password." });
	}

	try {
		const user = await db.checkUserCredentials(email, password);
		if (user) {
			if (user.two_factor_enabled) {
				const code = generate2FACode();
				req.session.pending2FA = {
					userId: user.id,
					email: user.email,
					role: user.role,
					code,
					expires: Date.now() + 5 * 60 * 1000
				};

				await transporter.sendMail({
					from: process.env.EMAIL_USER,
					to: user.email,
					subject: "Your 2FA Code",
					text: `Your 2FA code: ${code}`,
					html: `<p>Your 2FA code: <b>${code}</b></p>`
				});

				logger.info(`2FA code sent to ${user.email}`);
				return res.json({ twoFA: true, message: "Two-factor authentication required." });
			} else {
				req.session.user = {
					id: user.id,
					email: user.email,
					role: user.role,
					firstName: user.firstName,
					lastName: user.lastName
				};
				logger.info(`User ${email} logged in successfully`);
				res.json({ success: true, message: "Login successful." });
			}
		} else {
			logger.warn(`Login failed for user ${email}`);
			res.status(401).json({ error: "Invalid email or password." });
		}
	} catch (error) {
		logger.error('Error during login: ' + error.stack);
		res.status(500).json({ error: "Failed to process login." });
	}
});

router.post('/user/logout', async (req, res) => {
	req.session.destroy(err => {
		if (err) {
			logger.error('Error destroying session:', err);
			return res.status(500).json({ error: 'Failed to log out.' });
		}

		res.clearCookie('connect.sid'); // Default cookie name for express-session
		logger.info('User logged out and session destroyed.');
		return res.json({ success: true, message: 'Logout successful.' });
	});
});

router.get('/user/profile', async (req, res) => {
	if (!req.session.user) {
	  return res.status(401).json({ error: "Not authenticated." });
	}
	try {
		const user = await db.getUserById(req.session.user.id);
		if (!user) return res.status(404).json({ error: "User not found." });
		res.json({
			id: user.id,
			firstName: user.firstName,
			lastName: user.lastName,
			email: user.email,
			two_factor_enabled: !!user.two_factor_enabled
		});

		logger.info(`User profile fetched for ${user.email}`);
	} catch (error) {
		logger.error('Error getting user: ' + error.stack);
		res.status(500).json({ error: "Failed to fetch user info." });
	}
});

router.patch('/user/profile/2fa', async (req, res) => {
	if (!req.session.user) {
		return res.status(401).json({ error: "Not authenticated." });
	}
	const { enabled } = req.body;
	if (typeof enabled !== "boolean") {
		return res.status(400).json({ error: "Enabled flag required (boolean)." });
	}
	try {
		await db.setTwoFA(
			req.session.user.id, 
			enabled
		);

		logger.info(`2FA status updated for user ${req.session.user.email}: ${enabled}`);
		req.session.user.two_factor_enabled = enabled;
		res.json({ success: true });
	} catch (error) {
		logger.error('Error updating 2FA: ' + error.stack);
		res.status(500).json({ error: "Failed to update 2FA." });
	}
});

router.post('/user/profile/password/request', async (req, res) => {
	if (!req.session.user) {
		logger.warn('Password change request without authentication');
		return res.status(401).json({ error: "Not authenticated." });
	}

	try {
		const user = await db.getUserById(req.session.user.id);
		if (!user) return res.status(404).json({ error: "User not found." });

		const code = generate2FACode();
		req.session.pendingPasswordChange = {
			userId: user.id,
			code,
			expires: Date.now() + 5 * 60 * 1000
		};

		await transporter.sendMail({
			from: process.env.EMAIL_USER,
			to: user.email,
			subject: "Your Password Change Code",
			text: `Your code to change password: ${code}`,
			html: `<p>Your code to change password: <b>${code}</b></p>`
		});

		res.json({ success: true, message: "Verification code sent to your email." });
	} catch (error) {
		logger.error('Error sending password change code: ' + error.stack);
		res.status(500).json({ error: "Failed to send password change code." });
	}
});

router.put('/user/profile/password', async (req, res) => {
	const { code, newPassword } = req.body;

	if (!req.session.user) {
		logger.warn('Password change attempt without authentication');
		return res.status(401).json({ error: "Not authenticated." });
	}
	const pending = req.session.pendingPasswordChange;
	if (!pending || pending.userId !== req.session.user.id) {
		logger.warn('Password change attempt without pending request');
		return res.status(400).json({ error: "No password change requested." });
	}
	if (!code || !newPassword) {
		logger.warn('Password change attempt with missing fields');
		return res.status(400).json({ error: "Code and new password required." });
	}
	if (pending.expires < Date.now()) {
		logger.warn(`Password change code expired for user ${pending.userId}`);
		delete req.session.pendingPasswordChange;
		return res.status(400).json({ error: "Verification code expired." });
	}
	if (pending.code !== code.trim()) {
		logger.warn(`Password change failed for user ${pending.userId}: Incorrect code`);
		return res.status(401).json({ error: "Incorrect verification code." });
	}

	try {
		const hash = await bcrypt.hash(newPassword, 10);
		await db.updateUserPassword(req.session.user.id, hash);
		delete req.session.pendingPasswordChange;
		res.json({ success: true, message: "Password updated." });
	} catch (error) {
		logger.error('Error updating password: ' + error.stack);
		res.status(500).json({ error: "Failed to update password." });
	}
});

router.get('/user/status', (req, res) => {
	if (req.session && req.session.user) {
		res.json({ loggedIn: true });
	} else {
		res.json({ loggedIn: false });
	}
});

// Public Books
router.get('/public/home-books', async (req, res) => {
	try {
		const limit = parseInt(req.query.limit, 10) || 8;
		const books = await db.getBooksPaginated(1, limit);
		res.json(books.books);
	} catch (error) {
		logger.error('Error fetching books:', error);
		res.status(500).json({ error: 'Failed to fetch books.' });
	}
});
 
router.get('/public/categories', async (req, res) => {
	try {
		const categories = await db.getCategories();
		res.json(categories);
	} catch (error) {
		logger.error('Error fetching categories:', error);
		res.status(500).json({ error: 'Failed to fetch categories.' });
	}
});

router.get('/public/books', async (req, res) => {
	const id = req.query.id;
	if (!id) return res.status(404).render('404');
	try {
		const book = await db.getBookById(id);
		if (!book) {
			logger.error(`Book with id ${id} not found`);
			return res.status(404).render('404');
		}

		res.render('books', { bookId: id });
	} catch (error) {
		logger.error('Error rendering book page:', error);
		res.status(500).render('404');
	}
});

router.get('/public/books/:id', async (req, res) => {
	const { id } = req.params;
	if (!id) return res.status(400).json({ error: "Missing book id" });

	try {
		const book = await db.getBookById(id);
		if (!book) {
			logger.error(`Book with id ${id} not found`);
			return res.status(404).json({ error: "Book not found" });
		}

		res.json(book);
	} catch (error) {
		logger.error('Error fetching book:', error);
		res.status(500).json({ error: "Failed to fetch book." });
	}
});

router.get('/public/genres', async (req, res) => {
	try {
		const genres = await db.getCategories();
		res.json(genres);
	} catch (error) {
		logger.error('Error fetching genres:', error);
		res.status(500).json({ error: 'Failed to fetch genres.' });
	}
});

router.get('/public/books/:bookId/reviews', async (req, res) => {
	const { bookId } = req.params;
	try {
		const reviews = await db.getReviewsForBook(bookId);
		const count = reviews.length;
		const avgRating = count ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
		res.json({ reviews, avgRating, count });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to fetch reviews." });
	}
});

router.post('/user/books/:bookId/reviews', async (req, res) => {
	if (!req.session || !req.session.user) {
		return res.status(403).json({ error: "You must be logged in to leave a review." });
	}
	const { bookId } = req.params;
	const { rating, comment } = req.body;
	const userId = req.session.user.id;
	try {
		await db.addReview({ userId, bookId, rating, comment });
		res.json({ success: true });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Failed to submit review." });
	}
});

// Public Spotlight
router.get('/public/spotlight-books', async (req, res) => {
	try {
		const genres = await db.getSpotlightGenres();
		if (!genres.length) return res.json([]);
		const genreIds = genres.map(g => g.id);
		const books = await db.getBooksByGenreIds(genreIds);

		const booksWithImageUrl = books.map(book => ({
			...book,
			imageUrl: book.imageUrl // already present
				|| (book.image_base64 ? `data:image/jpeg;base64,${book.image_base64}`
				: book.image_path ? book.image_path
				: null)
		}));

		res.json(booksWithImageUrl);
	} catch (error) {
		logger.error('Error fetching spotlight books:', error);
		res.status(500).json({ error: "Failed to fetch spotlight books." });
	}
});

router.get('/public/spotlight-books', async (req, res) => {
	try {
		const genres = await db.getSpotlightGenres();
		if (!genres.length) return res.json([]);
		const genreIds = genres.map(g => g.id);
		const books = await db.getBooksByGenreIds(genreIds);
		res.json(books);
	} catch (error) {
		logger.error('Error fetching spotlight books:', error);
		res.status(500).json({ error: "Failed to fetch spotlight books." });
	}
});

router.get('/public/browse', async (req, res) => {
	const { genre, search, page = 1, pageSize = 12 } = req.query;
	try {
		const data = await db.getBooksFiltered({
			genre: genre || undefined,
			search: search || undefined,
			page: Number(page),
			pageSize: Number(pageSize),
		});
		res.json(data);
	} catch (error) {
		logger.error('Error in /public/api/browse:', error);
		res.status(500).json({ error: "Failed to fetch books." });
	}
});

// Public Cart
router.get('/cart', async (req, res) => {
	if (!req.session || !req.session.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}
	const userId = req.session.user.id;
	try {
		const items = await db.getCart(userId);
		res.json({ items });
	} catch (error) {
		logger.error('Error fetching cart:', error);
		res.status(500).json({ error: "Failed to fetch cart." });
	}
});

router.post('/cart/add', async (req, res) => {
	if (!req.session || !req.session.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}
	const userId = req.session.user.id;
	const { bookId, quantity = 1 } = req.body;
	if (!bookId) return res.status(400).json({ error: "Missing bookId" });
	try {
		await db.addToCart(userId, bookId, quantity);
		res.json({ success: true });
	} catch (error) {
		logger.error(`Error adding to cart for user ${userId}: ${error}`);
		logger.error('Error adding to cart:', error);
		res.status(500).json({ error: "Failed to add to cart." });
	}
});

router.post('/cart/update', async (req, res) => {
	const userId = req.session.user.id;
	const { bookId, quantity } = req.body;

	if (!userId) return res.status(401).json({ error: "Unauthorized" });
	if (!bookId || !Number.isInteger(quantity) || quantity < 1) {
		return res.status(400).json({ error: "Invalid payload" });
	}

	const book = await db.getBookById(bookId);
	if (!book) return res.status(404).json({ error: "Book not found" });

	if (quantity > book.stockQuantity) {
		return res.status(400).json({ error: "Not enough stock" });
	}

	const updated = await db.updateCartItem(userId, bookId, quantity);

	if (!updated) {
		return res.status(404).json({ error: "Item not in cart" });
	}

	return res.json({ success: true });
});

router.post('/cart/remove', async (req, res) => {
	if (!req.session || !req.session.user) {
		return res.status(401).json({ error: "Not authenticated" });
	}
	const userId = req.session.user.id;
	const { bookId } = req.body;
	if (!bookId) return res.status(400).json({ error: "Missing bookId" });
	try {
		await db.removeFromCart(userId, bookId);
		res.json({ success: true });
	} catch (error) {
		logger.error('Error removing from cart:', error);
		res.status(500).json({ error: "Failed to remove from cart." });
	}
});

// Admin Users
router.get('/admin/users', async (req, res) => {
	const { page = 1, pageSize = 10 } = req.body;

	try {
		const users = await db.getUsersPaginated(page, pageSize);
		res.json(users);
	} catch (error) {
		logger.error('Error fetching users:', error);
		res.status(500).json({ error: "Failed to fetch users." });
	}
});

router.put('/admin/users/:id', async (req, res) => {
	const { id } = req.params;
	const { firstName, lastName, email, password, role } = req.body;

	if (!firstName || !lastName || !email || !role) {
		logger.warn('Update attempt with missing fields');
		return res.status(400).json({ error: "Missing required fields." });
	}

	try {
		const updated = await db.updateUser(id, {
			firstName,
			lastName,
			email,
			password,
			role
		});

		if (updated) {
			logger.info(`User ${email} updated successfully`);
			res.json({ success: true, message: "User updated." });
		} else {
			logger.warn(`Update failed for user ${email}`);
			res.status(400).json({ error: "Update failed." });
		}
	} catch (error) {
		logger.error('Error updating user: ' + error.stack);
		res.status(500).json({ error: "Failed to update user." });
	}
});

// Admin Genres
router.get('/admin/genres', async (req, res) => {
	const { page = 1, pageSize = 10 } = req.query;
	try {
		const result = await db.getGenresPaginated(page, pageSize);
		res.json(result);
	} catch (error) {
		logger.error('Error fetching genres:', error);
		res.status(500).json({ error: "Failed to fetch genres." });
	}
});

router.post('/admin/genres/add', async (req, res) => {
	const { genre, genre_icon, spotlight } = req.body;
	if (!genre) return res.status(400).json({ error: "Missing genre." });
	try {
		const [id] = await db.addGenre(genre, genre_icon, !!spotlight);
		res.json({ success: true, id });
	} catch (error) {
		logger.error('Error adding genre:', error);
		res.status(500).json({ error: "Failed to add genre." });
	}
});

router.put('/admin/genres/:id', async (req, res) => {
	const { id } = req.params;
	const { genre, genre_icon, spotlight } = req.body;
	if (!genre) return res.status(400).json({ error: "Missing genre." });
	try {
		const updated = await db.updateGenre(id, genre, genre_icon, !!spotlight);
		res.json({ success: !!updated });
	} catch (error) {
		logger.error('Error updating genre:', error);
		res.status(500).json({ error: "Failed to update genre." });
	}
});

// Admin Books
router.get('/admin/books', async (req, res) => {
	const { page = 1, pageSize = 10 } = req.query;

	try {
		const books = await db.getBooksPaginated(page, pageSize);
		res.json(books);
	} catch (error) {
		logger.error('Error fetching books:', error);
		res.status(500).json({ error: "Failed to fetch books." });
	}
});

router.post('/admin/books/add', async (req, res) => {
	const { title, author, genreId, isbn, publisher, description, price, stockQuantity, image_base64 } = req.body;

	if (!title || !author || !genreId || !isbn || !publisher || isNaN(price) || isNaN(stockQuantity)) {
		logger.warn('Book add attempt with missing fields');
		return res.status(400).json({ error: "Missing required fields." });
	}

	try {
		const [bookId] = await db.addBook(
			title, 
			author, 
			genreId, 
			isbn, 
			publisher, 
			description, 
			price, 
			stockQuantity
		);

		if (image_base64 && bookId) {
			const image = await db.addImage(
				bookId,
				image_base64
			);

			if (image) {
				logger.info(`Image added for book "${title}"`);
			} else {
				logger.warn(`Failed to add image for book "${title}"`);
			}
	  	}

		if (bookId) {
			logger.info(`Book "${title}" added successfully`);
			res.json({ success: true, message: "Book added." });
		} else {
			logger.warn(`Add book failed for "${title}"`);
			res.status(400).json({ error: "Failed to add book." });
		}
	} catch (error) {
		logger.error('Error adding book: ' + error.stack);
		res.status(500).json({ error: "Failed to add book." });
	}
});

router.put('/admin/books/:id', async (req, res) => {
	const { id } = req.params;
	const { title, author, genreId, isbn, publisher, description, price, stockQuantity, image_base64 } = req.body;

	if (!title || !author || !genreId || !isbn || !publisher || isNaN(price) || isNaN(stockQuantity)) {
		logger.warn('Book update attempt with missing fields');
		return res.status(400).json({ error: "Missing required fields." });
	}

	try {
		const updated = await db.updateBook(id, {
			title,
			author,
			genreId,
			isbn,
			publisher,
			description,
			price,
			stockQuantity
		});

		if (image_base64) {
			const imageId = await db.checkImageExists(id);
			let image;
			if (imageId) {
				image = await db.updateImage(
					imageId,
					image_base64
				);
			} else {
				image = await db.addImage(
					id,
					image_base64
				);
			}
	  
			if (image) {
				logger.info(`Image updated for book "${title}"`);
			} else {
				logger.warn(`Failed to update image for book "${title}"`);
			}
	  }

		if (updated) {
			logger.info(`Book "${title}" updated successfully`);
			res.json({ success: true, message: "Book updated." });
		} else {
			logger.warn(`Update failed for book "${title}"`);
			res.status(400).json({ error: "Failed to update book." });
		}
	} catch (error) {
		logger.error('Error updating book: ' + error.stack);
		res.status(500).json({ error: "Failed to update book." });
	}
});

// Admin Reviews
router.get('/admin/reviews', async (req, res) => {
	const { bookId } = req.query;
	if (!bookId) return res.status(400).json({ error: "No bookId" });

	try {
		const reviews = await db.getReviewsByBookId(bookId);
		res.json({ reviews });
	} catch (error) {
		logger.error('Error fetching reviews:', error);
		res.status(500).json({ error: "Failed to fetch reviews." });
	}
});
 
router.delete('/admin/reviews/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await db.deleteReview(id);
		res.json({ success: true });
	} catch (error) {
		logger.error('Error deleting review:', error);
		res.status(500).json({ error: "Failed to delete review." });
	}
});

module.exports = router;