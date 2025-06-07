const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const Shipping = require(path.join(__dirname, '../models/Shipping'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new Shipping());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new Shipping());
	return migration.down();
};
