class OrderItem {
	constructor() {
		this.tableName = 'order_items';
		this.columns = [
			{ name: 'orderId', type: 'foreign', references: 'order.id', onDelete: 'CASCADE' },
			{ name: 'book_id', type: 'foreign', references: 'book.id', onDelete: 'CASCADE' },
			{ name: 'quantity', type: 'integer' },
			{ name: 'price', type: 'decimal' }
		];
	}
}

module.exports = OrderItem;
