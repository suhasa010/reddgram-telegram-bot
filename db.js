/* eslint-disable no-console */

const mongoose = require('mongoose');

const dbConnection = () => {
	mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true });
	mongoose.Promise = global.Promise;
	// Get the default connection
	const db = mongoose.connection;

	db.once('open', () => {
		console.info(`Connected to mongoose - ${process.env.DB_URI}`);
	});

	db.on('disconnected', () => {
		console.log('Mongoose default connection is disconnected');
	});

	// Bind connection to error event (to get notification of connection errors)
	db.on('error', console.error.bind(console, 'MongoDB connection error:'));

	process.on('SIGINT', () => {
		db.close(() => {
			console.log('Mongoose default connection is disconnected due to application termination');
			process.exit(0);
		});
	});
};

module.exports = dbConnection;
