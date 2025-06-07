class WishlistItem {
	constructor() {
		this.tableName = 'wishlist_items';
		this.columns = [
			{ name: 'wishlist_id', type: 'foreign', references: 'wishlist.id', onDelete: 'CASCADE' },
			{ name: 'book_id', type: 'foreign', references: 'book.id', onDelete: 'CASCADE' }
		];
	}
}

module.exports = WishlistItem;
