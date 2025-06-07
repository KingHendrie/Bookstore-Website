const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const Order = require(path.join(__dirname, '../models/Order'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new Order());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new Order());
	return migration.down();
};
