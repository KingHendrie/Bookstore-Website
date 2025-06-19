class Genre {
	constructor() {
		this.tableName = 'genre';
		this.columns = [
			{ name: 'genre', type: 'string', length: 255 }
		];
	}
}

module.exports = Genre;