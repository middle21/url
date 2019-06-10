const mongoose = require("mongoose");
const validUrl = require("valid-url");
const UrlShorten = mongoose.model("UrlShorten");
const shortid = require("shortid");
const auth = require("../middleware/auth.js");
const geoip = require("geoip-lite");
const jwt = require("jsonwebtoken");
const config = require('../config/config.js');

module.exports = app => {

	app.get("/api/getMyLinks", auth.checkToken, async (req,res) => {
		const token = req.headers['access-token'];

		let user_id = '';
		if (token) {
			jwt.verify(token, config.secret, async (err, decoded) => {
				if (!err) {
				    req.decoded = decoded;
				    user_id = decoded.id;
				    try{
					    const items = await UrlShorten.find({ ownerId: user_id });
						if(items.length < 1){
							return res.status(200).json('not found');
						}else{
							return res.status(200).json(items);
						}
					}catch(err2){
						return res.status(401).json({ error: err2 });
					}
				}else{
					return res.status(401).json({ error: err })
				}
			});
		}

	});

	app.get("/api/getGuestLinks", async (req,res) => {
		const masterkey = req.query.masterkey;

		if(masterkey.length < 1 || masterkey.length > 9){
			return res.status(500);
		}

		try{

			const items = await UrlShorten.find({ ownerId: masterkey });

			if(items.length < 1){
				return res.status(401).json('not found');
			}else{
				return res.status(200).json(items);
			}
		}catch(err){
			return res.json(err);
		}
		
	});

	app.get("/api/getOriginalUrl", async (req, res) => {
		const shortCode = req.query.shortCode;

		const item = await UrlShorten.findOne({ urlCode: shortCode });
		
		if(item){
			let expiration;
			if(item.expiration != null && item.expiration < Date.now()){
				expiration = 1;
			}else{
				expiration = 0;
			}
			return res.status(200).json({ originalUrl: item.originalUrl, password: item.password, expiration, redirectionType: item.redirectionType });
		}else{
			return res.status(404).json('not-found');
		}
	});

	app.get("/api/item/:code",/*auth.checkToken,*/ async (req,res) => {
		const urlCode = req.params.code;
		const item = await UrlShorten.findOne({ urlCode: urlCode });

		if(item){
      		return res.json(item);
		}else{
      		return res.json('not found.');
		}
	});

	app.delete("/api/item/:code", async (req, res) => {
		const shortCode = req.params.code;

		try{
			await UrlShorten.findOneAndRemove({ urlCode: shortCode });

			return res.status(200).json({ "success":"1" });
		}catch(err){
			return res.status(401).json('not found');
		}
	});

	app.delete("/api/item/deleteById/:id", async (req, res) => {
		const id = req.params.id;

		try {
			await UrlShorten.findOneAndRemove({ _id: id });
			return res.status(200).json({ success: 1 });
		}catch(err){
			return res.status(401).json({ error: err });
		}
	});

	app.post("/api/item", async (req, res) => {
		let { originalUrl, alias, masterkey, description, expiration, password, redirecton_type } = req.body;
		// check for token 
		let token = req.headers['access-token'];
  		let user_id = '';
		if (token) {
			jwt.verify(token, config.secret, (err, decoded) => {
				if (!err) {
				    req.decoded = decoded;
				    user_id = decoded.id;
				}
			});
		}else{
			if(masterkey){
				user_id = masterkey;
			}
		}
		// -- end -- check for token
		if(user_id.length < 1){
			user_id = shortid.generate();
		}
	    let urlCode = '';
	    if(alias){
	      const check = await UrlShorten.findOne({ urlCode: alias });
	      if(check){
	        res.status(401).json("Short URL already used.Choose another one.");
	      }else{
	        urlCode = alias;
	      }
	    }else{
	      urlCode = shortid.generate();
	    }
		
		const updatedAt = new Date();
		
		const original_url_prefix = originalUrl.split(':')[0];
		if(original_url_prefix != 'http' && original_url_prefix != 'https'){
			originalUrl = 'http://' + originalUrl;
		}
		if( validUrl.isUri(originalUrl) ){
			const item = await UrlShorten.findOne({ urlCode: urlCode });
			if( item ){
				res.status(200).json(item);
			}else{
				shortUrl = "localhost:7000/" + urlCode;
				const item = new UrlShorten({
					originalUrl,
					shortUrl,
					urlCode,
					updatedAt,
					ownerId: user_id,
					description,
					expiration,
					password,
					redirectionType: redirecton_type
				});

				await item.save();
				res.status(200).json(item);
			}
		}else{
			return res
				.status(401)
				.json("Invalid Original Url");
		}
	});

	app.get("/api/items", async (req, res) => {
		try{
			const items = await UrlShorten.find();
			return res.status(200).json(items);
		}catch(err){
			return res.status(401).json({ error: err });
		}
	});

	app.get("/:short_id", async (req, res) => {
		const short_id = req.params.short_id;

		try{
			let link = await UrlShorten.findOne({ urlCode: short_id });
			if(link.length < 1){
				return res.status(404).json('Uh oh.We couldn\'t find a link at that URL');
			}
			//res.redirect(link.originalUrl);
			const geoData = geoip.lookup(req.header('x-forwarded-for') || req.connection.remoteAddress);
			if(link.hits != '' && link.hits != null && link.hits != undefined){
				if(link.hits[`${geoData.country}`] != '' && link.hits[`${geoData.country}`] != null){
					link.hits[`${geoData.country}`] = Number(link.hits[`${geoData.country}`]) + 1;
				}else{
					link.hits[`${geoData.country}`] = 1;
				}
			}else{
				let h = {
					[`${geoData.country}`]: 1
				}
				link.hits = h;
			}
			await link.markModified("hits");
			await link.save();

			return res.json(link);
		}catch(err){
			return res.status(401).json({ error: err });
		}
	});
};