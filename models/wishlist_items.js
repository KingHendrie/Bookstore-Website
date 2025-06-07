class WishlistItem {
	constructor() {
		this.tableName = 'wishlist_items';
		this.columns = [
			{ name: 'wishlistId', type: 'foreign', references: 'wishlist.id', onDelete: 'CASCADE' },
			{ name: 'bookId', type: 'foreign', references: 'book.id', onDelete: 'CASCADE' }
		];
	}
}

module.exports = WishlistItem;
