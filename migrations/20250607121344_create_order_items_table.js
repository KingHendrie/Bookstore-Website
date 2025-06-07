const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const OrderItem = require(path.join(__dirname, '../models/order_items'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new OrderItem());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new OrderItem());
	return migration.down();
};
