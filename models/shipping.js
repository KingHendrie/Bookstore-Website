class Shipping {
	constructor() {
		this.tableName = 'shipping';
		this.columns = [
			{ name: 'orderId', type: 'foreign', references: 'order.id', onDelete: 'CASCADE' },
			{ name: 'address', type: 'string' },
			{ name: 'deliveryDate', type: 'date' },
			{ name: 'trackingNumber', type: 'string', length: 50, unique: true }
		]
	}
}

module.exports = Shipping;
