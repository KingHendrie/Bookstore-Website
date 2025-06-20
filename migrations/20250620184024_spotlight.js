const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const Genre = require(path.join(__dirname, '../models/Genre'));

exports.up = async function(knex) {
	await knex.schema.alterTable('genre', (table) => {
		table.boolean('spotlight').notNullable().defaultTo(false);
	});
}

exports.down = async function(knex) {
	await knex.schema.alterTable('genre', (table) => {
		table.dropColumn('spotlight');
	});
};