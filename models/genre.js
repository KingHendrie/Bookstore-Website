class Genre {
	constructor() {
		this.tableName = 'genre';
		this.columns = [
			{ name: 'genre', type: 'string', length: 255 },
			{ name: 'genre_icon', type: 'longtext' }
		];
	}
}

module.exports = Genre;