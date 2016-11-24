//require express, bitcore, request and body parser
var express = require("express");
var app = express();
var request = require("request");
var bodyparser = require("body-parser");
var bitcore = require("bitcore-lib");

//set ejs as view engine template
app.set("view engine", "ejs");

//tell express to use bodyparser
app.use(bodyparser.urlencoded({
    extended: true
}));
app.use(bodyparser.json());

//render index page under root dir
app.get("/", function(req, res){
    res.render("pages/index.ejs", {
         outMessage: ""
    });
});

//render address page on POST data
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
		res.render("pages/index.ejs", {
            outMessage: "Invalid Address"
        });
		}
		
			var address = new bitcore.PrivateKey(pkeyValue).toAddress();
					
			//create a tx
			var privateKey = new bitcore.PrivateKey(pkeyValue);
			
			//get unspent from bcinfo
			//todo get additional sources for unspent utxo
			var url = "https://blockchain.info/unspent?active="+ address;
			request({
				url: url,
				json: true
			},function(error, response, body){
                if(!body.unspent_outputs){
                    res.render("pages/index.ejs", {
                        outMessage: "No UTXOs For This Address"
                    });
                };
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
					    res.render("pages/index.ejs", {
                           outMessage: "This transaction can't afford the 20 satoshis per byte mining fee"
                        });
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
					}, function(err, response, body){
						if(err || response.statusCode != 200){ 
							console.log(err);
						};
                        
						console.log(JSON.stringify(body));
                        completeTxId = body.data.txid;
                        console.log("done");
                        //display to user
                        res.render("pages/address.ejs", {
                            amountTx: totalSats,
                            destinationAddress: output,
                            successTxId: completeTxId
                        });
					});
					
				};
					
					
				}
			});
		
		} else {
		//priv key invalid
		res.render("pages/index.ejs", {
            outMessage: "Invalid Private Key"
        });
            
		}
		
	});

app.listen(80, function(){
	console.log("sever running on 80");
});