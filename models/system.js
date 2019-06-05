const mongoose = require("mongoose");
const { Schema } = mongoose;

const SystemSchema = new Schema({
	maintenanceMode: Integer,
	guestCanShort: Integer
});