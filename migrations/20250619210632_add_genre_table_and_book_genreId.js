const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));
const Genre = require(path.join(__dirname, '../models/Genre'));
const Book = require(path.join(__dirname, '../models/Book'));

exports.up = async function(knex) {
	// 1. Create genre table
	const genreMigration = new MigrationBuilder(knex, new Genre());
	await genreMigration.up();

	// 2. Add genreId column (nullable for now) to book
	await knex.schema.alterTable('book', table => {
		table.integer('genreId').unsigned().references('id').inTable('genre').onDelete('CASCADE').nullable();
	});

	// 3. Copy unique genres to genre table and update books with genreId
	const genres = await knex('book').distinct('genre as genre');
	for (const record of genres) {
		if (!record.genre) continue;
		// Insert genre if not exists
			let [genreRow] = await knex('genre').where('genre', record.genre);
		if (!genreRow) {
			const [id] = await knex('genre').insert({ genre: record.genre }).returning('id');
			genreRow = { id: typeof id === 'object' ? id.id : id, genre: record.genre };
		}
		// Update all books with this genre
		await knex('book').where('genre', record.genre).update({ genreId: genreRow.id });
	}

	// 4. Remove old genre column from book
	await knex.schema.alterTable('book', table => {
		table.dropColumn('genre');
	});

	// 5. Alter genreId to not nullable
	await knex.schema.alterTable('book', table => {
		table.integer('genreId').unsigned().notNullable().alter();
	});
};

exports.down = async function(knex) {
	// 1. Add genre column back to book table
	await knex.schema.alterTable('book', table => {
		table.string('genre', 255);
	});

	// 2. For each book, copy genre from genre table
	const books = await knex('book').select('id', 'genreId');
	for (const book of books) {
		if (!book.genreId) continue;
		const genre = await knex('genre').where('id', book.genreId).first();
		if (genre) {
			await knex('book').where('id', book.id).update({ genre: genre.genre });
		}
	}

	// 3. Remove genreId column
	await knex.schema.alterTable('book', table => {
		table.dropColumn('genreId');
	});

	// 4. Drop genre table
	const genreMigration = new MigrationBuilder(knex, new Genre());
	await genreMigration.down();
};