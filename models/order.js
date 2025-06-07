class Order {
	constructor() {
		this.tableName = 'order';
		this.columns = [
			{ name: 'userId', type: 'integer', foreignKey: true, references: { table: 'user', column: 'id' } },
			{ name: 'orderDate', type: 'datetime' },
			{ name: 'totalPrice', type: 'decimal' },
			{ name: 'paymentStatus', type: 'enum', values: ['pending', 'completed', 'failed'] },
			{ name: 'shippingStatus', type: 'enum', values: ['pending', 'shipped', 'delivered', 'cancelled'] }
		]
	}
}

module.exports = Order;
