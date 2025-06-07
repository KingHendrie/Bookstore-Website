const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const Payment = require(path.join(__dirname, '../models/Payment'));

exports.up = async function(knex) {
	const migration = new MigrationBuilder(knex, new Payment());
	return migration.up();
}

exports.down = async function(knex) {
	const migration = new MigrationBuilder(knex, new Payment());
	return migration.down();
};
