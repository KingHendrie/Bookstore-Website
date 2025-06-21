const path = require('path');
const MigrationBuilder = require(path.join(__dirname, '../migrationClasses/MigrationBuilder'));

const User = require(path.join(__dirname, '../models/user'));
const Genre = require(path.join(__dirname, '../models/genre'));
const Book = require(path.join(__dirname, '../models/book'));
const BookImage = require(path.join(__dirname, '../models/book_image'));
const Wishlist = require(path.join(__dirname, '../models/wishlist'));
const WishlistItem = require(path.join(__dirname, '../models/wishlist_items'));
const Order = require(path.join(__dirname, '../models/order'));
const OrderItem = require(path.join(__dirname, '../models/order_items'));
const Payment = require(path.join(__dirname, '../models/payment'));
const Shipping = require(path.join(__dirname, '../models/shipping'));
const Review = require(path.join(__dirname, '../models/review'));
const ShoppingCart = require(path.join(__dirname, '../models/shopping_cart'));
const ShoppingCartItem = require(path.join(__dirname, '../models/shopping_cart_items'));

exports.up = async function(knex) {
	await new MigrationBuilder(knex, new User()).up();
	await new MigrationBuilder(knex, new Genre()).up();
	await new MigrationBuilder(knex, new Book()).up();
	await new MigrationBuilder(knex, new BookImage()).up();
	await new MigrationBuilder(knex, new Wishlist()).up();
	await new MigrationBuilder(knex, new WishlistItem()).up();
	await new MigrationBuilder(knex, new Order()).up();
	await new MigrationBuilder(knex, new OrderItem()).up();
	await new MigrationBuilder(knex, new Payment()).up();
	await new MigrationBuilder(knex, new Shipping()).up();
	await new MigrationBuilder(knex, new Review()).up();
	await new MigrationBuilder(knex, new ShoppingCart()).up();
	await new MigrationBuilder(knex, new ShoppingCartItem()).up();
};

exports.down = async function(knex) {
	await new MigrationBuilder(knex, new ShoppingCartItem()).down();
	await new MigrationBuilder(knex, new ShoppingCart()).down();
	await new MigrationBuilder(knex, new Review()).down();
	await new MigrationBuilder(knex, new Shipping()).down();
	await new MigrationBuilder(knex, new Payment()).down();
	await new MigrationBuilder(knex, new OrderItem()).down();
	await new MigrationBuilder(knex, new Order()).down();
	await new MigrationBuilder(knex, new WishlistItem()).down();
	await new MigrationBuilder(knex, new Wishlist()).down();
	await new MigrationBuilder(knex, new BookImage()).down();
	await new MigrationBuilder(knex, new Book()).down();
	await new MigrationBuilder(knex, new Genre()).down();
	await new MigrationBuilder(knex, new User()).down();
};