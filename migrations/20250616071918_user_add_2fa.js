const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const User = require(path.join(__dirname, '../models/User'));

exports.up = async function(knex) {
	await knex.schema.alterTable('user', (table) => {
		table.boolean('two_factor_enabled').notNullable().defaultTo(false);
	});
}

exports.down = async function(knex) {
	await knex.schema.alterTable('user', (table) => {
		table.dropColumn('two_factor_enabled');
	});
};