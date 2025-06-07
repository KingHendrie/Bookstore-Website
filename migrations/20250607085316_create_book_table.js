const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const Book = require(path.join(__dirname, '../models/Book'));

exports.up = async function(knex) {
  const migration = new MigrationBuilder(knex, new Book());
  return migration.up();
};

exports.down = async function(knex) {
  const migration = new MigrationBuilder(knex, new Book());
  return migration.down();
};
