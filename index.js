const express = require("express");
const app = express();
const PORT = 7000;
const bodyParser = require("body-parser");
const mongoURI = "mongodb+srv://mongoUser:mongoPass@cluster0-endxc.mongodb.net/test?retryWrites=true&w=majority";
const mongoose = require("mongoose");
const jtw = require("jsonwebtoken");
const config = require("./config/config.js");

const connectionOptions = {
	keepAlive: true,
	reconnectTries: Number.MAX_VALUE,
	useNewUrlParser: true
};

mongoose.Promise = global.Promise;
mongoose.connect(mongoURI, connectionOptions, (err, db) => {
	if(err){
		console.log('Error: ', err);
	}else{
		console.log('Connected to MongoDB');
	}
})

app.set("Secret", config.secret);

app.use(function(req, res, next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
	res.header(
		"Access-Control-Allow-Headers",
		"Content-type,Accept,x-access,token,X-Key"
	);
	if(req.method == "OPTIONS"){
		res.status(200).end();

	}else{
		next();
	}
});
app.use(bodyParser.json());
require('./models/UrlShorten');
require('./models/User.js');
require('./routes/user.js')(app);
require('./routes/auth.js')(app);
require('./routes/urlshorten')(app);

app.listen(PORT, () => {
	console.log('Server started on port ', PORT)
});