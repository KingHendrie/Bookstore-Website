const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const Review = require(path.join(__dirname, '../models/Review'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new Review());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new Review());
	return migration.down();
};
