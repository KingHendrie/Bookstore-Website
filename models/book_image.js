class Book_Image {
	constructor() {
		this.tableName = 'book_image';
		this.columns = [
			{ name: 'bookId', type: 'foreign', references: 'book.id', onDelete: 'CASCADE' },
			{ name: 'image_base64', type: 'text' }
		]
	}
}

module.exports = Book_Image;