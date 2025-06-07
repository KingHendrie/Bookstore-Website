class Shipping {
	constructor() {
		this.tableName = 'shipping';
		this.columns = [
			{ name: 'order_id', type: 'foreign', references: 'order.id', onDelete: 'CASCADE' },
			{ name: 'address', type: 'string' },
			{ name: 'deliveryDate', type: 'date' },
			{ name: 'trackingNumber', type: 'string', length: 50, unique: true }
		]
	}
}

module.exports = Shipping;
