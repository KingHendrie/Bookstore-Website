const express = require('express');
const router = express.Router();
const transporter = require('./mailer');
const logger = require('./logger');
const { htmlToText } = require('html-to-text');
const db = require('./db');

// Enable JSON parsing for API routes
router.use(express.json());

router.post('/send-email', async (req, res) => {
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

router.post('/send-contact', async (req, res) => {
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

router.post('/register', async (req, res) => {
	const { firstName, lastName, email, password } = req.body;
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
		const user = await db.createUser(firstName, lastName, email, password);
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

router.post('/login', async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) {
		logger.warn('Login attempt with missing fields');
		return res.status(400).json({ error: "Missing email or password." });
	}

	try {
		const user = await db.checkUserCredentials(email, password);
		if (user) {
			req.session.user = {
				id: user.id,
				email: user.email,
				role: user.role,
				firstName: user.firstName,
				lastName: user.lastName
			};

			logger.info(`User ${email} logged in successfully`);
			res.json({ success: true, message: "Login successful." });
		} else {
			logger.warn(`Login failed for user ${email}`);
			res.status(401).json({ error: "Invalid email or password." });
		}
	} catch (error) {
		logger.error('Error during login: ' + error.stack);
		res.status(500).json({ error: "Failed to process login." });
	}
});

router.post('/logout', async (req, res) => {
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

router.get('/users', async (req, res) => {
	const { page = 1, pageSize = 10 } = req.body;

	try {
		const users = await db.getUsersPaginated(page, pageSize);
		res.json(users);
	} catch (error) {
		logger.error('Error fetching users:', error);
		res.status(500).json({ error: "Failed to fetch users." });
	}
});

module.exports = router;