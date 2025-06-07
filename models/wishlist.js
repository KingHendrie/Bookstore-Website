class Wishlist {
	constructor() {
		this.tableName = 'wishlist';
		this.columns = [
			{ name: 'userId', type: 'integer', foreignKey: true, references: { table: 'user', column: 'id' } }
		]
	}
}

module.exports = Wishlist;
