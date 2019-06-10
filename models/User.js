const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
	username: String,
	password: String,
	email: String,
	role: String,
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
	resetPasswordToken: String,
	resetPasswordExpires: Date
});

mongoose.model("Users", UserSchema);