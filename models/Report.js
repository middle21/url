const mongoose = require("mongoose");
const { Schema } = mongoose;

const reportSchema = new Schema({
	link: String,
	motiv: String
});

mongoose.model("Report", reportSchema);