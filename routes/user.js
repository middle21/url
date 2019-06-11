const express = require("express");
const mongoose = require("mongoose");
const users = mongoose.model("Users");
const UrlShorten = mongoose.model("UrlShorten");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const auth = require('../middleware/auth.js');
const jwt = require("jsonwebtoken");
const config = require("../config/config.js");

module.exports = app => {

	app.get("/api/users/details", async (req,res) => {
		let token = req.headers['access-token'];

		let user_id = '';
		if (token) {
			jwt.verify(token, config.secret, (err, decoded) => {
				if (!err) {
				    req.decoded = decoded;
				    user_id = decoded.id;
				}
			});
		}

		if(user_id){
			try {
				const user = await users.findOne({ _id: user_id });

				return res.status(200).json(user);
			}catch(err){
				return res.status(401).json(err);
			}
			
		}

	});

	app.post("/api/users", async (req,res) => {
		const { username, password, email, password2, owner_id } = req.body;
		if(!username){
			return res.status(401).json("The username is required.");
		}
		if(!password){
			return res.status(401).json("The password is required.");
		}
		if(!password2){
			return res.status(401).json("Password verification is required (param password2).");
		}
		if(password != password2){
			return res.status(401).json("Passwords don't match.");
		}
		if(!email){
			return res.status(401).json("The email is required.");
		}

		bcrypt.hash(password, 10, async (err,hash) => {
			if(err){
				return res.status(500).json({ error: err });
			}else{
				try{
					const user = await users.findOne({ email: email });

					if(user){
			      		return res.status(401).json("Email address in use.");
					}else{
						const updatedAt = new Date();
						const role = 'admin';
			      		const user = new users({
							username,
							password: hash,
							email,
							role,
							updatedAt
						});

						await user.save();

						let user_links = await UrlShorten.find({ ownerId: owner_id });
						user_links.forEach(async (link) => {
							link.ownerId = user._id;
							await link.save();
						});
						res.status(200).json(user);
					}
				}catch(err){
					return res.status(401).json(err);
				}
			}
		});
		
	});

	app.get("/api/users",auth.checkToken, async (req,res) => {
		/*const loggedInUser = await users.findOne({ _id: req.body.user_id });
		if(loggedInUser.role != 'admin'){
			return res.status(401).json('neautorizat 2');
		}*/
		const usrs = await users.find();

		return res.status(200).json(usrs);
	});

	app.get("/api/users/:userId",auth.checkToken, async (req,res) => {
		const userId = req.params.userId;
		try {
			const u = await users.find({ _id: userId });

			if(u){
				return res.status(200).json(u);
			}else{
				return res.status(401).json('not found');
			}
		}catch(err){
			return res.status(401).json('not found');
		}
	});

	app.patch("/api/users/:userId",auth.checkToken, async (req,res) => {
		const userId = req.params.userId;
		const { password,password2 } = req.body;
		if(!password){
			return res.status(401).json("The password is required.");
		}
		if(!password2){
			return res.status(401).json("The password check is required (param password2).");
		}
		if(password != password2){
			return res.status(401).json("Passwords doesn't match.");
		}

		bcrypt.hash(password, 10, async (err,hash) => {
			if(err){
				return res.status(500).json({ error: err });
			}else{
				try{
					const user = await users.findOne({ _id: userId });
					user.password = hash;

					await user.save();

					return res.status(200).json({ "success":"1" });
				}catch(err){
					return res.status(401).json({ error: err });
				}
			}
		});
	});

	app.delete("/api/users/:userId",auth.checkToken, async (req,res) => {
		const userId = req.params.userId;

		try{
			await users.findOneAndRemove({ _id: userId });

			return res.status(200).json({ "success":"1" });
		}catch(err){
			return res.status(401).json('not found');
		}
	});

};	