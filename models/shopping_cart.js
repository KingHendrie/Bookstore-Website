class ShoppingCart {
	constructor() {
		this.tableName = 'shopping_cart';
		this.columns = [
			{ name: 'userId', type: 'integer', foreignKey: true, references: { table: 'user', column: 'id' } }
		]
	}
}

module.exports = ShoppingCart;
