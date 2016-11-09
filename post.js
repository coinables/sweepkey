
var request = require("request");
var tax = "0100000002f7ee6de57913ca6726dad5ca50846b35c87fe047633dbeb1288f31939079167c010000008a47304402204d523143aca414dfd284f9dbbfaec1751e67a60e5ea55697dd014f4001be642202200a7e8e1cf913417e03aeceecd4e4201f4d1e80083a7e0f7ab0b190e1ec761d42014104920cfd123e4a0060da5ae785eac0b98fcb88258cc70cd4608fdf85fc769dcc7644518843a6c03adc7f82c16864fbd0a2c5ec1c124d31649f023b74699d0a5735ffffffff918f679fe4f16f86e9c7642e96d576b7b2f0a1fd770d2527435f95088c77a5e0000000008b483045022100816ca282a663a944e65b8474047ad2984dda86214479e0a91b7154d72ff871c102200134fc6ccb8599cc8a6a03a8c33b6e3345c3f88911cb10f5ba3fa64e04851403014104920cfd123e4a0060da5ae785eac0b98fcb88258cc70cd4608fdf85fc769dcc7644518843a6c03adc7f82c16864fbd0a2c5ec1c124d31649f023b74699d0a5735ffffffff0126b61e00000000001976a914a22019ff471f8763b20db5e008c1cffdcd1fc9e988ac00000000";

var pload = {
			"tx_hex": tax
		};
		console.log(pload);

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