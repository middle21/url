const mongoose = require("mongoose");
const users = mongoose.model("Users");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const SMTP = require("nodemailer-smtp-transport");
const crypto = require("crypto");

module.exports = app => {

	app.post('/reset', async (req,res) => {
		const { token, new_password } = req.body;
		try{
			const user = await users.findOne({ resetPasswordToken: token });
			if(user.length < 1){
				return res.status(401).json({ error: 'Invalid reset password token.' });
			}

			if(user.resetPasswordExpires < Date.now()){
				return res.status(401).json({ error: 'Password reset token expired.' });
			}

			bcrypt.hash(new_password, 10, async (err,hash) => {
				if(err){
					return res.status(500).json({ error: err });
				}else{
					user.password = hash;
					user.resetPasswordExpires = Date.now() - 1;
					await user.save();

					return res.json(1);
				}
			});
		}catch(err){
			return res.status(401).json({ error: err });
		}
	});

	app.post('/forgot', async (req,res) => {
		const { email } = req.body;
		try {
			const user = await users.findOne({ email: email });

			if(user.length < 1){
				return res.json({ error: 'User not found.' });
			}else{
				user.resetPasswordToken = crypto.randomBytes(Math.ceil((20 * 3) / 4))
								    .toString('base64')
								    .slice(0, 20)
								    .replace(/\+/g, '0')
								    .replace(/\//g, '0')
				user.resetPasswordExpires = Date.now() + 3600000;

				await user.save();

				let smtpTransport = nodemailer.createTransport({
					host: "bloomcom.designyourfuture.ro",
					port: 465,
					secure: true,
					auth: {
						user: 'test@designyourfuture.ro',
						pass: "p}~ynp~T]J6("
					}
				});

				let info = await smtpTransport.sendMail({
					from: '"password_reset" <foo@example.com>',
					to: user.email,
					subject: "Password Reset ✔",
					html: "<b>Hello " + user.username + "</b><br><a href='http://localhost:8080/resetPassword/" + user.resetPasswordToken + "'>Click here to reset your password</a><br><br>If the link doesn't work copy and past the address in your browser: http://locahost:8080/resetPassword/" + user.resetPasswordToken + "<br>.The link is only valid 1 hour."
				});

				return res.json(1);
			}
		}catch(err){
			return res.status(401).json({ error: err.message });
		}
	});

	app.post('/login', async (req,res) => {
		const { email, password } = req.body;
		
		try {
			const check = await users.findOne({ email: email.toLowerCase() });
			if(check.length < 1){
				//return res.status(401).json('not found');
				return res.status(401).json({ error: 1, message: 'Not found.' });
			}
			bcrypt.compare(password, check.password, (err, result) => {
				if(err){
					//return res.status(401).json("Auth failed1.");
					return res.status(401).json({ error: 1, message: 'Auth failed.' });
				}
				
				if(result){
					const payload = {
						id: check._id
					};
					const token = jwt.sign(payload, app.get('Secret'),{
						expiresIn: 1440 // 24 hours
					});

					return res.status(200).json(token);
				}else{
					//return res.status(401).json("Auth failed.");
					return res.status(401).json({ error: 1, message: 'Auth failed.' });
				}
			});
			
		}catch(err){
			return res.status(401).json({ error: err.message });
		}
		
	});
};