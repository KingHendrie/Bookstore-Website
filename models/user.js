class User {
	constructor() {
		this.tableName = 'user';
		this.columns = [
			{ name: 'name', type: 'string', length: 255 },
			{ name: 'email', type: 'string', length: 255, unique: true },
			{ name: 'passwordHash', type: 'text' },
			{ name: 'role', type: 'enum', values: ['admin', 'user'] }
		]
	}
}

module.exports = User;
