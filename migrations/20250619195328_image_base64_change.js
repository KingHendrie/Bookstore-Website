const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const BookImage = require(path.join(__dirname, '../models/Book_Image'));

exports.up = function(knex) {
	return knex.schema.alterTable('book_image', function(table) {
		table.longtext('image_base64').alter();
	 });
};

exports.down = function(knex) {
	return knex.schema.alterTable('book_image', function(table) {
		table.text('image_base64').alter();
	 });
};
