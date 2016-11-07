var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var bitcore = require("bitcore-lib");
var merge = require("merge");

app.use(bodyParser.urlencoded({}));

app.get("/", function(req, res){
	res.sendfile(__dirname + "/index2.html");
});

app.post("/address", function(req,res){
	var wif = req.body.pkey;
	var output = req.body.addy;
	var address = new bitcore.PrivateKey(wif).toAddress();
	console.log(address);
	
	//create a tx
	var privateKey = new bitcore.PrivateKey(wif);
	
	//get unspent from bcinfo
	var request = require("request");
	var url = "https://blockchain.info/unspent?active="+ address;
	request({
		url: url,
		json: true
	},function(error, response, body){
		var num = body.unspent_outputs.length;
		var utxos = [];
		var totalSats = 0;	
			
			for(i=0;i < num; i++){
			var utxo = {
				"txId": body.unspent_outputs[i].tx_hash_big_endian,
				"outputIndex": body.unspent_outputs[i].tx_output_n,
				"address": address,
				"script": body.unspent_outputs[i].script,
				"satoshis": body.unspent_outputs[i].value
			};
			utxos.push(utxo);
			totalSats = totalSats + body.unspent_outputs[i].value
			};
			
		var transaction = new bitcore.Transaction()
		  .from(utxos)
		  .to(output, totalSats)
		  .sign(wif);
		
		//console.log(i);
		//console.log(body.unspent_outputs[i].tx_hash_big_endian);
		//console.log(body.unspent_outputs[i].value);
	
		
		console.log(transaction);
		console.log("done");
	})
	
	//display to user
		res.send("Addy " + address);
	});

app.listen(8080, function(){
	console.log("sever running on 8080");
});