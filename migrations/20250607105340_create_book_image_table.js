const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const BookImage = require(path.join(__dirname, '../models/Book_Image'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new BookImage());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new BookImage());
	return migration.down();
};
