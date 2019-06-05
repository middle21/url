const mongoose = require("mongoose");
const validUrl = require("valid-url");
const UrlShorten = mongoose.model("UrlShorten");
const shortid = require("shortid");
const errorUrl = "http://localhost:7000/error";
const auth = require("../middleware/auth.js");

module.exports = app => {

	app.get("/:short_id", async (req, res) => {
		const short_id = req.params.short_id;

		try{
			const link = await UrlShorten.findOne({ urlCode: short_id });
			if(link.length < 1){
				return res.status(404).json('Uh oh.We couldn\'t find a link at that URL');
			}
			res.redirect(link.originalUrl);
		}catch(err){
			return res.status(401).json({ error: err });
		}
	});

	app.get("/api/item/:code",auth.checkToken, async (req,res) => {
		const urlCode = req.params.code;
		const item = await UrlShorten.findOne({ urlCode: urlCode });

		if(item){
      		return res.json(item);
		}else{
      		return res.json('not found.');
		}
	});

	app.post("/api/item", async (req, res) => {
		const { originalUrl, shortBaseUrl, preferedCode } = req.body;
		if( validUrl.isUri(shortBaseUrl) ){

		}else{
			return res
				.status(401)
				.json("Invalid Base Url");
		}
	    let urlCode = '';
	    if(preferedCode){
	      const check = await UrlShorten.findOne({ urlCode: preferedCode });
	      if(check){
	        res.status(401).json("Short URL already used.Choose another one.");
	      }else{
	        urlCode = preferedCode;
	      }
	    }else{
	      urlCode = shortid.generate();
	    }

		
		const updatedAt = new Date();
		if( validUrl.isUri(originalUrl) ){
			const item = await UrlShorten.findOne({ urlCode: urlCode });
			if( item ){
				res.status(200).json(item);
			}else{
				shortUrl = shortBaseUrl + "/" + urlCode;
				const item = new UrlShorten({
					originalUrl,
					shortUrl,
					urlCode,
					updatedAt
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
};