const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const ShoppingCartItem = require(path.join(__dirname, '../models/shopping_cart_items'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new ShoppingCartItem());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new ShoppingCartItem());
	return migration.down();
}
