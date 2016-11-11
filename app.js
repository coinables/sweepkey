var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var bitcore = require("bitcore-lib");

app.use(bodyParser.urlencoded({}));

app.get("/", function(req, res){
	res.sendfile(__dirname + "/index.html");
});

app.post("/address", function(req,res){
	var wif = req.body.pkey;
	var output = req.body.addy;
	
		//validate pkey
		pkeyValue = wif.replace(/[^\w\s]/gi, '');
		if(bitcore.PrivateKey.isValid(pkeyValue)){
		//private key is valid
		
		//check distination address
		addyValue = output.replace(/[^\w\s]/gi, '');
		if(!bitcore.Address.isValid(addyValue)){
		res.send("Invalid address");
		}
		
			var address = new bitcore.PrivateKey(pkeyValue).toAddress();
					
			//create a tx
			var privateKey = new bitcore.PrivateKey(pkeyValue);
			
			//get unspent from bcinfo
			//todo get additional sources for unspent utxo
			var request = require("request");
			var url = "https://blockchain.info/unspent?active="+ address;
			request({
				url: url,
				json: true
			},function(error, response, body){
				if(body.unspent_outputs){
					var num = body.unspent_outputs.length;
					var utxos = [];
					var totalSats = 0;	
					var txSize = 44;
						
						for(i=0;i < num; i++){
						var utxo = {
							"txId": body.unspent_outputs[i].tx_hash_big_endian,
							"outputIndex": body.unspent_outputs[i].tx_output_n,
							"address": address,
							"script": body.unspent_outputs[i].script,
							"satoshis": body.unspent_outputs[i].value
						};
						utxos.push(utxo);
						totalSats = totalSats + body.unspent_outputs[i].value;
						txSize = txSize + 180;
						};
						
					var fee = txSize * 20;
					totalSats = totalSats - fee;
					
					if(totalSats < 1){
					 alert("you don't have enough funds to send with a sufficient fee");
					} else {
						
					var transaction = new bitcore.Transaction()
					  .from(utxos)
					  .to(output, totalSats)
					  .sign(pkeyValue);
					
							
					
					var txjson = transaction.toString();
					var pload = {
						"tx_hex": txjson
					};
					
					request({
						url: "https://chain.so/api/v2/send_tx/BTC/",
						method: "POST",
						json: true,
						headers: {
							"content-type": "application/json",
						},
						body: pload
					}, function(err, response){
						if(err){ 
							return console.log(err);
						};
						console.log(JSON.stringify(response));
					});
					console.log("done");
					};
					//display to user
					res.send("<body bgcolor='#0b161d'><font color='#f8f8f8'><br>Destination: <a href='https://btc.com/"+output+"' target='_blank'>" + output + "</a><br>Amount sent: " + totalSats + 
					"<br>Fee: " + fee + "<br><br><a href='../'>Send Another</a></font>");
				}
			});
		
		} else {
		//priv key invalid
		res.send("invalid private key");
		}
		
	});

app.listen(80, function(){
	console.log("sever running on 80");
});