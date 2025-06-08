class AuthService {
	static async login(req, res) {
		const { email, password } = req.body;

		try {
			const user = await db.knex('user').where({ email }).first();
				if (!user) {
				return res.status(401).json({ message: 'Invalid credentials' });
			}

			const validPassword = await bcrypt.compare(password, user.passwordHash);
				if (!validPassword) {
				return res.status(401).json({ message: 'Invalid credentials' });
			}

			// Create session **only for authenticated users**
			req.session.user = {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role
			};

			res.redirect('/dashboard'); // Redirect to authenticated area
		} catch (error) {
			res.status(500).json({ message: 'Server error' });
		}
	}

	static async logout(req, res) {
		req.session.destroy(() => res.redirect('/login'));
	}

	static requireAuth(req, res, next) {
		if (!req.session.user) {
			return res.redirect('/login');
		}
		next();
	}
}
 
module.exports = AuthService;