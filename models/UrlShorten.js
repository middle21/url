const mongoose = require("mongoose");
const { Schema } = mongoose;

const urlShortenSchema = new Schema({
	originalUrl: String,
	urlCode: String,
	shortUrl: String,
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	hits: Object,
	ownerId: String,
	expiration: Date,
	password: String,
	description: String,
	redirectionType: String
});

mongoose.model("UrlShorten", urlShortenSchema);
