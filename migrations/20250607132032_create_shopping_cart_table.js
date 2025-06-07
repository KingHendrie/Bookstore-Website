const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const ShoppingCart = require(path.join(__dirname, '../models/Shopping_Cart'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new ShoppingCart());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new ShoppingCart());
	return migration.down();
};
