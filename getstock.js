var unirest = require("unirest");

function TimeManagedValue() {
	this.maxAgeSeconds = 6;
	this.lastUpdate = null;
	this.lastResponse = null;

	this.stats = {
		"cached": 0,
		"updated": 0
	};

	this.expiresIn = function () {
		return this.maxAgeSeconds - this.ageOfValue();
	}
	this.ageOfValue = function () {
		if (this.lastUpdate == null) {
			return 0;
		}
		return (new Date() - this.lastUpdate) / 1000;
	}
	this.validCache = function () {
		if (this.lastUpdate == null) {
			return false;
		}
		return this.expiresIn() > 0;
	}
	this.validatedValue = function () {
		if (this.validCache()) { return this.value(); }
		return null;
	};
	this.value = function () {
		this.stats.cached++;
		return this.lastResponse;
	};
	this.updateCache = function (e) {
		this.stats.updated++;
		this.lastResponse = e;
		this.lastUpdate = new Date();
		console.log("Cache updated at:", this.lastUpdate);
	};
}

// hack to show updates
var base = 1;
function dgetStockQuote(handleResponse, cache) {
	var result = cache.validatedValue();
	if (result) {
		return handleResponse(result);
	}
	base++;
	result = {
		explains: [],
		count: 1,
		quotes: [
			{
				exchange: 'NYQ',
				shortname: 'International Business Machines',
				quoteType: 'EQUITY',
				symbol: 'IBM',
				index: 'quotes',
				score: base,
				typeDisp: 'Equity',
				longname: 'International Business Machines Corporation',
				isYahooFinance: true
			},
		]
	};
	cache.updateCache(result);
	handleResponse(cache.value());
}

function getStockQuote(handleResponse, cache) {
	var result = cache.validatedValue();
	if (result) {
		return handleResponse(result);
	}
	console.log("Run Query");
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
		cache.updateCache(res.body);
		handleResponse(cache.value());
	});
}

function queryStockLoop() {
	var cache = new TimeManagedValue();
	var loop = 60 * 5;
	var f = function () {
		getStockQuote(printAndReset, cache)
	};
	var printAndReset = function (value) {
		console.log (JSON.stringify(value)) 
		console.log(
			value.quotes[0].symbol, 'value:',  value.quotes[0].score, 
			"age:", cache.ageOfValue().toFixed(2), '(s)', 
			"expires:", cache.expiresIn().toFixed(2), '(s)', 
			JSON.stringify(cache.stats));
		if (loop-- > 0) {
			setTimeout(f, 1000)
		}
	}
	f()
}
queryStockLoop()