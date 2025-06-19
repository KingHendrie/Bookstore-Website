const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const Genre = require(path.join(__dirname, '../models/Genre'));

exports.up = async function(knex) {
	await knex.schema.alterTable('genre', (table) => {
		table.longtext('genre_icon');
	});
};

exports.down = async function(knex) {
	await knex.schema.alterTable('genre', function(table) {
		table.dropColumn('genre_icon');
	});
};
