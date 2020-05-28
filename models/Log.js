const { Schema, model } = require('mongoose');


const logSchema = new Schema(
	{
		chatId: {
			type: String,
		},
		subreddit: {
			type: String,
		},
    type: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'VIDEO'] // Add more type of reddit posts here
    }
	},
	{ timestamps: true },
);

const Model = model('logs', logSchema);
module.exports = Model;
