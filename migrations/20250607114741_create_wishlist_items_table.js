const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const WishlistItem = require(path.join(__dirname, '../models/wishlist_items'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new WishlistItem());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new WishlistItem());
	return migration.down();
}
