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
	var pkey = req.body.pkey;
	var addr = req.body.addy;
	
    validateAddress(addr, function(isAddyValid){
        if(isAddyValid == 0){
          res.render("pages/index.ejs", {
            outMessage: "Destination address invalid"
          });  
        } else {
            validatePrivateKey(pkey, function(isPkValid){
                if(isPkValid == 0){
                    res.render("pages/index.ejs", {
                    outMessage: "Private Key invalid"
                    });
                } else {
                    convertPK(pkey, function(convertedAddy){
                        getUTXO(convertedAddy, function(result, feeAmt, totalToSend){
                            if(result == 1){
                                res.render("pages/index.ejs", {
                                    outMessage: "No UTXO"
                                });     
                            } else if(result == 2){
                                res.render("pages/index.ejs", {
                                    outMessage: "Source offline"
                                });
                            } else if(result == 3){
                                res.render("pages/index.ejs", {
                                    outMessage: "Insufficient funds to pay fee"
                                });
                            } else {
                                buildTX(result, feeAmt, totalToSend, pkey, addr, function(payloadTx){
                                    pushTX(payloadTx, function(txdone){
                                        if(txdone !== 1){
                                            res.render("pages/index.ejs", {
                                            outMessage: "TX ID: " + txdone
                                            });
                                        } else {
                                            res.render("pages/index.ejs", {
                                            outMessage: "broadcast failed try later"
                                            });
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
            });//end validatePrivateKey
        }
    });//end validate address
}); //end app post

//sweep GET endpoint
app.get("/sweep", function(req,res){
	if(!req.query.addr){
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify({
            status: "error",
            message: "missing address parameter"
        }));  
    }
    if(!req.query.pkey){
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify({
            status: "error",
            message: "missing privatekey parameter"
        }));  
    }
    
    var wif = req.query.pkey;
    var output = req.query.addr;
	
		//validate pkey
		pkeyValue = wif.replace(/[^\w\s]/gi, '');
		if(bitcore.PrivateKey.isValid(pkeyValue)){
		//private key is valid
		
		//check distination address
		addyValue = output.replace(/[^\w\s]/gi, '');
		if(!bitcore.Address.isValid(addyValue)){
		        res.setHeader("Content-Type", "application/json");
                res.send(JSON.stringify({
                    status: "error",
                    message: "invalid address"
                }));
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
				    res.setHeader("Content-Type", "application/json");
				    res.send(JSON.stringify({
					status: "error",
					message: "No UTXOs"
				    }));
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
					
                        //feerate
                        getBestFee(function(bestHourFee){
                            var fee = txSize * bestHourFee;
                            totalSats = totalSats - fee;

                                if(totalSats < 1){
                                    res.setHeader("Content-Type", "application/json");
                                    res.send(JSON.stringify({
                                        status: "error",
                                        message: "Insufficent funds after "+fee+" mining fee"
                                    }));
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

                                        //console.log(JSON.stringify(body));
                                        completeTxId = body.data.txid;
                                        console.log("done");
                                        //display to user
                                        res.setHeader("Content-Type", "application/json");
                                        res.send(JSON.stringify({
                                            status: "success",
                                            amount: totalSats, 
                                            to: output, 
                                            txid: completeTxId
                                        }));
                                    });

                                }; //ends else if can afford fees
                        });//ends get best fee
            			
			}; //end if
		}); //end request for bcinfo utxo 
		
		} else {
		//priv key invalid
		res.setHeader("Content-Type", "application/json");
        	res.send(JSON.stringify({
            	status: "error",
            	message: "invalid private key"
        	}));
            
		}
		
}); //ends sweep endpoint

app.listen(80, function(){
	console.log("sever running on 80");
});

//functions
//validate address
function validateAddress(output, result){
    addyValue = output.replace(/[^\w\s]/gi, '');
    if(bitcore.Address.isValid(addyValue)){
    result(1);
    } else {
    result(0);    
    };
};

//convert pk to addr
function convertPK(pkeyValue, result){
    var address = new bitcore.PrivateKey(pkeyValue).toAddress();
    result(address);
};

function validatePrivateKey(wif, result){
pkeyValue = wif.replace(/[^\w\s]/gi, '');
		if(bitcore.PrivateKey.isValid(pkeyValue)){
		//private key is valid
        result(1);
        } else {
        result(0);    
        };
};

//get outputs
function getUTXO(address, callback){
    request({
        url: "https://chain.so/api/v2/get_tx_unspent/btc/"+address,
        json: true
    }, function(error, response, body){
        if(!error && response.statusCode == 200){
            if(body.data.txs.length < 1){
                //no utxos
                console.log("no utxo");
                var err = 1;
                callback(err);
            }
            var status = body.status;
            var num = body.data.txs.length;
            var utxos = [];
            var totalSats = 0;	
            var txSize = 44;
                //loop through all UTXOs
                for(i=0;i < num; i++){
		    var convertSats = body.data.txs[i].value * 100000000;
		    convertSats = parseInt(convertSats);
                
                    var utxo = {
                    "txId": body.data.txs[i].txid,
                    "outputIndex": body.data.txs[i].output_no,
                    "address": address,
                    "script": body.data.txs[i].script_hex,
                    "satoshis": convertSats
                    };
			utxos.push(utxo);
			totalSats = totalSats + convertSats;
			//calc tx size for fee
			txSize = txSize + 180;
                }; //end utxo loop
            getBestFee(function(bestHourFee){
                var fee = txSize * bestHourFee;
                totalSats = totalSats - fee;
                console.log(totalSats);
                console.log(fee);
                    if(totalSats < 1){
                        //not enough funds to send
                        var err = 3;
                        callback(err);
                    } else {
                        callback(utxos, fee, totalSats);  
                    }
            });            
       } else {
           //err or no response from api
           console.log("no response from api");
            var error = 2;
           callback(error);
       }
    });
};

//build transaction
function buildTX(utxo, fee, total, pkeyValue, output, callback){

        var transaction = new bitcore.Transaction()
        .from(utxo)
        .to(output, total)
        .sign(pkeyValue);

        //payload to push tx
        var txjson = transaction.toString();
        var pload = {
            "tx": txjson
        };
        callback(pload);  
};


//push transaction
function pushTX(pload, callback){
    request({
	url: "https://api.blockcypher.com/v1/btc/main/txs/push",
	method: "POST",
	json: true,
	headers: {"content-type": "application/json"},
	body: pload
	}, function(err, response, body){
           	if(err){ 
		 //no response or error POST to chainso
	         callback(1);    
		} else {
                console.log(JSON.stringify(body));
                completeTxId = body.tx.hash;
                console.log("done");
                callback(completeTxId);
           	};                
    });
};

function getBestFee(bestFee){
  var findfee = "https://bitcoinfees.21.co/api/v1/fees/recommended";
    request({
        url: findfee,
        json: true
    }, function(error, response, body){
        if(!body.hourFee){
            //no response from api use 150 sats per byte
            var fee = 150;
            bestFee(fee);
        }
        if(body.hourFee){
            var fee = body.hourFee;
            fee = fee * 0.5;
            fee = Math.ceil(fee);
            bestFee(fee);
        }
    });  
}
