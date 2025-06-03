require('dotenv').config(); // Ensure .env is loaded

const knexConfig = require('./knexfile').development; // Use .development config; change as needed for prod/test
const knex = require('knex')(knexConfig);

module.exports = knex;