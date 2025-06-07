const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const User = require(path.join(__dirname, '../models/User'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new User());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new User());
	return migration.down();
};
