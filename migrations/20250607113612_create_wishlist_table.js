const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const Wishlist = require(path.join(__dirname, '../models/Wishlist'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new Wishlist());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new Wishlist());
	return migration.down();
};
