var unirest = require("unirest");

var req = unirest("GET", "https://apidojo-yahoo-finance-v1.p.rapidapi.com/auto-complete");

req.query({
	"q": "IBM",
	"region": "US"
});

req.headers({
	"x-rapidapi-key": process.env.x-rapidapi-key,
	"x-rapidapi-host": process.env.x-rapidapi-host,
	"useQueryString": true
});


req.end(function (res) {
	if (res.error) throw new Error(res.error);

	console.log(res.body);
});
 