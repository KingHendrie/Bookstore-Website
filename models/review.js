class Review {
	constructor() {
		this.tableName = 'review';
		this.columns = [
			{ name: 'userId', type: 'integer', foreignKey: true, references: { table: 'user', column: 'id' } },
			{ name: 'book_id', type: 'foreign', references: 'book.id', onDelete: 'CASCADE' },
			{ name: 'rating', type: 'integer', constraints: { min: 1, max: 5 } },
			{ name: 'comment', type: 'text' },
			{ name: 'datePosted', type: 'datetime' }
		]
	}
}

module.exports = Review;
