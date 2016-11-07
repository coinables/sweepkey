var request = require("request");
var url = "https://blockchain.info/address/16ADt6uR8mJd923JQaRjrw7jsJL58NstK7?format=json";

request({
	url: url,
	json: true
},function(error, response, body){
	console.log(body);
})