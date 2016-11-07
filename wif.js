var bitcore = require("bitcore-lib");
var wif = 'Kxr9tQED9H44gCmp6HAdmemAzU3n84H3dGkuWTKvE23JgHMW8gct';
var address = new bitcore.PrivateKey(wif).toAddress();
console.log(address);