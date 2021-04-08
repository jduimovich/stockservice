var unirest = require("unirest");

var cache = {
	"maxAgeSeconds": 10,
	"lastUpdate": null,
	"lastResponse": {},
	"maxLoop": 30
};

function validCache() {
	if (cache.lastUpdate == null) {
		return false;
	}
	var delta = (new Date() - cache.lastUpdate) / 1000; 
	console.log("delta ", delta);
	console.log("cache.maxAgeSeconds ", cache.maxAgeSeconds);
	return delta < cache.maxAgeSeconds;
}
function getStockQuote(handleResponse, update) {
	if (validCache()) {
		console.log("Cached Query");
		return handleResponse(cache.lastResponse);
	}

	console.log("Run Query");
	// var r = {
	// 	explains: [],
	// 	count: 15,
	// 	quotes: [
	// 	  {
	// 		exchange: 'NYQ',
	// 		shortname: 'International Business Machines',
	// 		quoteType: 'EQUITY',
	// 		symbol: 'IBM',
	// 		index: 'quotes',
	// 		score: 11838300,
	// 		typeDisp: 'Equity',
	// 		longname: 'International Business Machines Corporation',
	// 		isYahooFinance: true
	// 	  },
	// 	]
	// };
	// update(r);
	// handleResponse(cache.lastResponse);

	var req = unirest("GET", "https://apidojo-yahoo-finance-v1.p.rapidapi.com/auto-complete");
	req.query({
		"q": "IBM",
		"region": "US"
	});
	req.headers({
		"x-rapidapi-key": process.env.X_RAPIDAPI_KEY,
		"x-rapidapi-host": process.env.X_RAPIDAPI_HOST,
		"useQueryString": true
	});
	req.end(function (res) {
		if (res.error) throw new Error(res.error);
		update(res.body);
		handleResponse(cache.lastResponse)
	});
}

function printStockQuote(e) {
	console.log(e.quotes[0]);
	cache.maxLoop--;
	if (cache.maxLoop > 0) {
		setTimeout(queryStockLoop, 1000)
	}
}

function updateCache(e) {
	cache.lastResponse = e;
	cache.lastUpdate = new Date(); 
	console.log ("Cache updated to:", cache.lastUpdate)
}
 
function queryStockLoop() {
	getStockQuote(printStockQuote, updateCache)
}

queryStockLoop()