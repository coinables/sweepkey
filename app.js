var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var bitcore = require("bitcore-lib");

app.use(bodyParser.urlencoded({}));

app.get("/", function(req, res){
	res.sendfile(__dirname + "/index2.html");
});

app.post("/address", function(req,res){
	var wif = req.body.pkey;
	var address = new bitcore.PrivateKey(wif).toAddress();
	console.log(address);
	res.send("Addy " + address);
});

app.listen(8080, function(){
	console.log("sever running on 8080");
});