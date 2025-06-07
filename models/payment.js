class Payment {
	constructor() {
		this.tableName = 'payment';
		this.columns = [
			{ name: 'order_id', type: 'foreign', references: 'order.id', onDelete: 'CASCADE' },
			{ name: 'paymentMethod', type: 'string', length: 50 },
			{ name: 'paymentDate', type: 'date' },
			{ name: 'amount', type: 'decimal' },
			{ name: 'status', type: 'enum', values: ['pending', 'completed', 'failed'], default: 'pending' }
		]
	}
}

module.exports = Payment;
