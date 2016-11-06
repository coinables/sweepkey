<?php

//load bitwasp
use BitWasp\BitcoinLib\BitcoinLib;
require_once('vendor/autoload.php');

//fetch post data
	//get private key
		//sanitize input by verifying checksum FUNCTION
	//get destination address
		//sanitize input by verifying checksum FUNCTION
		
?>
<!DOCTYPE html>
<html>
<head>
<style>
html, body{
	background-color: #0b161d;
	color: #f8f8f8;
	font-family: "courier-new", serif, sans-serif;
	padding: 15px;
}

@keyframes changeColor {
    from {background-color: #11222d;}
    to {background-color: #27a739;}
}



input{
	height: 26px;
	width: 280px;
	border: 1px solid #27a739;
	border-radius: 4px;
	background-color: #11222d;
	margin-left: 15px;
	color: #27a739;	
}

input.button:hover{
	background-color: #27a739;
	color: #f8f8f8;
	animation-name: changeColor;
    animation-duration: 1s;
}

h1{
	color: #1e9ae0;
}

.warn{
	color: #efe900;
}
</style>
</head>
<h1>SweepKey.org</h1>
<h2>Sweep a Bitcoin private key to a new address.</h2>
<h4>
	<input type="text" name="pkey" id="pkey" placeholder="Enter a Private Key" onkeyup="getUnspent();" onchange="getUnspent();">
	<input type="text" name="addy" placeholder="Destination Address">
	<input type="submit" class="button" name="send_funds" value="TRANSFER ALL FUNDS">
</h4>
<div id="output"></div>
<br>
All transactions are sent with a minimal mining fee. 
<br>
<h4 class="warn"> 
Although sweepkey does not save, store, or 
log any private keys, it is very important not to re-use a private key of an address entered on this site. 
Whenever entering a private key into any online form you should assume that address is no longer safe.
</h4>
<script>
function getUnspent(){
var pkey = document.getElementById("pkey").value;
var outputDiv = document.getElementById("output");
outputDiv.innerHTML = "<input type='submit' class='button' name='check_unspent' value='Check For Funds'>";
  if(pkey == ""){
	outputDiv.innerHTML = "";
  }
}
</script>
</html>