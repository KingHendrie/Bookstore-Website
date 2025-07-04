class Book {
	constructor() {
		this.tableName = 'book';
		this.columns = [
			{ name: 'title', type: 'string', length: 255 },
			{ name: 'author', type: 'string', length: 255 },
			{ name: 'genreId', type: 'foreign', references: 'genre.id', onDelete: 'CASCADE' },
			{ name: 'isbn', type: 'string', length: 13, unique: true },
			{ name: 'price', type: 'decimal' },
			{ name: 'stockQuantity', type: 'integer' },
			{ name: 'description', type: 'text' },
			{ name: 'publisher', type: 'string', length: 255 }
		];
	}
}

module.exports = Book;