const mongoose = require("mongoose");
const users = mongoose.model("Users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

module.exports = app => {
	app.post('/login', async (req,res) => {
		const { email, password } = req.body;
		
		try {
			const check = await users.findOne({ email: email });
			if(check.length < 1){
				return res.status(401).json('not found');
			}

			bcrypt.compare(password, check.password, (err, result) => {
				if(err){
					return res.status(401).json("Auth failed.");
				}

				if(result){
					const payload = {
						id: check._id
					};
					const token = jwt.sign(payload, app.get('Secret'),{
						expiresIn: 1440 // 24 hours
					});

					return res.status(200).json(token);
				}
			});
			
		}catch(err){
			return res.status(401).json("not found");
		}
		
	});
};