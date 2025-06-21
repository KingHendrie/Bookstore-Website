class ShoppingCartItem {
	constructor() {
		this.tableName = 'shopping_cart_items';
		this.columns = [
			{ name: 'shoppingCartId', type: 'foreign', references: 'shopping_cart.id', onDelete: 'CASCADE' },
			{ name: 'bookId', type: 'foreign', references: 'book.id', onDelete: 'CASCADE' },
			{ name: 'quantity', type: 'integer' }
		];
	}
}

module.exports = ShoppingCartItem;
