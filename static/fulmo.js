$(document).ready(function() {

	console.log('Document Ready');

	defaultView();
	refresh();

	// ------------------------------
	// button handlers

	// connect button event
	$('#connect').click(function() {
		connect();
		listchannels();
		getbalances();
	});

	// create invoice button event
	$('#createInvoice').click(function() {
		createInvoice();
	});

	// funding button event
	$('#fundingButton').click(function() {
		getNewAddr();
	});

	// withdraw button event
	$('#withdrawButton').click(function() {
		withdraw();
	});

	// withdraw all checkbox event
	// When this is checked, we want to disable the "withdrawAmount" input
	$("#withdrawAll").click(function() {

		if($(this).is(":checked")){
			$("#withdrawAmount").val("Send All Funds");
			$("#withdrawAmount").prop('disabled', true);
		}else {
			$("#withdrawAmount").val("");
			$("#withdrawAmount").prop('disabled', false);
		}
	});

	// decode payment button event
	$('#decodebolt11').click(function() {
		bolt11("decode");
	});

	// decode payment when an invoice is pasted in
	$("#bolt11").on("input propertychange", function() {
		bolt11("decode");
	});

	// make payment button event
	$('#paybolt11').click(function() {
		bolt11("pay");
	});

	// clear button event
	$('#clear').click(function() {
		clear();
	});

	// help button event
	$('#help').click(function() {
		help();
	});

	// stop button event
	$('#stop').click(function() {
		stop();
	});
	// ------------------------------

	// ------------------------------
	// display/navigation

	// show node info - default view
	$('#shownodeinfo').click(function() {
		defaultView();
	});

	// show channels and peers
	$('#showchannelspeers').click(function() {
		hideAll();
		$('.channels').show();
		$('.buttons').show();
	});

	// show on-chain BTC payments and balances
	$('#showwallet').click(function() {
		hideAll();
		$('.balances').show();
		$('.onchainwallet').show();
		$('.buttons').show();
	});

	// show LN payments, balances, and invoices
	$('#showpayments').click(function() {
		hideAll();
		$('.balances').show();
		$('.lightningwallet').show();
		$('.buttons').show();
	});

	// show LN payment history
	$('#showhistory').click(function() {
		hideAll();
		$('.history').show();
	});

	// show all
	$('#showall').click(function() {
		showAll();
	});
	// ------------------------------

	// refresh statuses
	window.setInterval(refresh, 30000);
});

function defaultView(){
	hideAll();
	$('.info').show();

	// blank out some form fields that might be leftover from a page refresh
	$('#payInvoiceAmount').val("");
	$('#bolt11').val("");
}

function hideAll(){
	// hide all divs, but still show the navigation tabs
	$('.info').hide();
	$('.channels').hide();
	$('.balances').hide();
	$('.onchainwallet').hide();
	$('.lightningwallet').hide();
	$('#noAmount').hide();
	$('.history').hide();
	$('.buttons').hide();
}

function showAll(){
	$('.info').show();
	$('.channels').show();
	$('.balances').show();
	$('.onchainwallet').show();
	$('.lightningwallet').show();
	$('.history').show();
	$('.buttons').show();
}

function refresh(){
	console.log("refresh");
	getinfo();
	listchannels();
	getbalances();
	gethistory();
}

function noDaemon(){
	defaultView();
	$('#tabs').hide();
	$('#getinfoBlurb').hide();
	$('#getinfoText').html("Stopping daemon");
}

function getinfo(){
	$.get( "getinfo/", function( data ) {
		var getinfo = JSON.parse(data);
		var getinfoHTML = "";

		if ("message" in getinfo){
			noDaemon();
			getinfoHTML += "<br />Error: " + getinfo.message + "<br /><br />";
			getinfoHTML += "Please make sure the c-lightning daemon is running, and this line is added to your ~/.lighting/config file:<br /><br />";
			getinfoHTML += "rpc-file=/tmp/lightning-rpc<br /><br />";
		} else {
			getinfoHTML += "Network: " + getinfo.network + "<br />";
			getinfoHTML += "Port: " + getinfo.port + "<br />";
			getinfoHTML += "Version: " + getinfo.version + "<br />";
			getinfoHTML += "Block Height: " + getinfo.blockheight + "<br />";
			getinfoHTML += "Lightning Node ID: " + getinfo.id + "<br />";
		}
		$('#getinfoText').html(getinfoHTML);
	});
}

function gethistory(){
	$.get( "listpayments/", function( data ){
		var response = JSON.parse(data);
		var payments = JSON.parse(JSON.stringify(response["payments"]));
		var paymentsHTML = "<br />";

		for (var key in payments) {
			paymentsHTML += "<div class='alt'>";
			paymentsHTML += "Recipient: " + payments[key]["destination"] + "<br />";
			paymentsHTML += "Amount: " + payments[key]["msatoshi"].toLocaleString() + " msatoshis<br />";
			paymentsHTML += "Fee: " + (payments[key]["msatoshi_sent"] - payments[key]["msatoshi"]).toLocaleString() + " msatoshis<br />";
			paymentsHTML += "Status: " + payments[key]["status"] + "<br />";

			var sent = new Date(payments[key]["timestamp"] * 1000);
			paymentsHTML += "Sent At: " + sent.toLocaleString("en-US") + "<br />";
			paymentsHTML += "</div>";
		}

		$('#historyText').html(paymentsHTML);
	});
}

function connect(){
	var connectEndpoint = "connect/";
	var node = $('#connection').val();
	var connectURL = connectEndpoint + "?c=" + node
	var satoshis = Number($('#connectionAmount').val());
	$('#connectionText').html("<br />Attempting to connect...<br />");
	connectURL = connectURL + "&satoshis=" + satoshis;

	$.get( connectURL, function( data ) {
		var jsonData = JSON.parse(data);
		var response = "<br />";

		// If there's an error, the json data will contain a "message" key.
		// If it's successful, the json data will contain a "txid" key.
		// If the json data contains neither of those keys,
		// display a generic message based on the c-lighting documentation
		if ("message" in jsonData){
			response += "Error: " + jsonData.message;
		} else if ("txid" in jsonData){
			response += "Successfully opened.";
			response += "TXID: " + jsonData.txid;
			response += "Channel ID: " + jsonData.channel_id;
		} else {
			response += "Something went wrong."
		}
		$('#connectionText').html(response + "<br />");
		listchannels();
	});
}

function closeChannel(channel_id){
	var closeURL = "close/?channel_id=" + channel_id;

	$.get( closeURL, function( data ) {
		var jsonData = JSON.parse(data);
		var response = "<br />";

		// If there's an error, the json data will contain a "message" key.
		// If it's successful, the json data will contain a "txid" key.
		// If the json data contains neither of those keys,
		// display a generic message based on the c-lighting documentation
		if ("message" in jsonData){
			response += "Error: " + jsonData.message;
		} else if ("txid" in jsonData){
			response += "Successfully closed. TXID: " + jsonData.txid;
		} else {
			response += "Unable to contact peer. This channel will eventually be closed."
		}
		$('#connectionText').html(response + "<br />");
	});

	getbalances();
}

function getNewAddr(){
	var addrURL = "newaddr/";
	if ($('#bech32').is(':checked')){
		addrURL += "?type=bech32";
	}else {
		addrURL += "?type=p2sh-segwit";
	}

	if ($('#fundingQR').is(":checked")){
		addrURL += "&qr";
	}

	$.get( addrURL, function( data ) {
		var jsonData = JSON.parse(data);
		var response = "<br />";

		// if there's an error, the json data will contain a "message" key
		// display that, otherwise display the actual response
		if ("message" in jsonData){
			response += "Error: " + jsonData.message + "<br />";
		}else {
			response += jsonData.address + "<br />";

			if ("qr" in jsonData){
				response += "<img src='/" + jsonData.qr + "'height='200' width='200'/>";
				response += "<br />";
			}
		}
		$('#fundingText').html(response);
		console.log( "New Address: " + data );
	});
}

function withdraw(){
	var addr = $('#withdrawAddress').val();
	var amount = Number($('#withdrawAmount').val());

	var withdrawURL = "withdraw/?addr=" + addr;

	if ($('#withdrawAll').is(':checked')){
		amount = "all";
	}

	var withdrawURL = "withdraw/?addr=" + addr + "&amount=" + amount;

	$.get( withdrawURL, function( data ) {
		var jsonData = JSON.parse(data);
		var response = "<br />";

		// if there's an error, the json data will contain a "message" key
		// display that, otherwise display the actual response
		if ("message" in jsonData){
			response += "Error: " + jsonData.message + "<br />";
		}else {
			response += "Status: Success<br />";
			response += "Txid: " + jsonData.txid + "<br />";

			// since funds were moved, refresh the wallet balances
			getbalances();
		}

		$('#withdrawText').html(response);
	});

	getbalances();
}

function createInvoice(){
	var amount = $('#invoiceAmount').val();
	var description = $('#invoiceDescription').val();
	var expire = $("#expire").val();
	var invoiceURL = "invoice/?amount=" + amount + "&description=" + description + "&expire=" + expire;

	if ($('#invoiceQR').is(':checked')){
		invoiceURL += "&qr";
	}

	$.get( invoiceURL, function( data ) {
		// if there's an error, the json data will contain a "message" key
		// display that, otherwise display the actual response
		var jsonData = JSON.parse(data);
		var response = "<br />";

		if ("message" in jsonData){
			response += jsonData.message;
		}else {
			// wrap the invoice in a span, so we can can copy it later
			response += "<span id='displaybolt11'>" + jsonData.bolt11 + "</span>";

			if ("qr" in jsonData){
				response += "<br />"
				response += "<img src='/" + jsonData.qr + "'height='200' width='200'/>";
			}

			//create button to copy invoice
			response += "<br />";
			response += "<input id='copybolt11' type='button' value='Copy Invoice to Clipboard' />";

		}

		$('#invoiceText').html(response + "<br />");

		// now that the copy button has been added to the html page,
		// the button click event listener can be defined
		$('#copybolt11').click(function() {
			var el = document.getElementById("displaybolt11");
			var range = document.createRange();
			range.selectNodeContents(el);
			var sel = window.getSelection();
			sel.removeAllRanges();
			sel.addRange(range);
			document.execCommand('copy');
			sel.removeAllRanges();
		});
		console.log( "Invoice: " + data );
	});
}

function bolt11(action){
	var bolt11 = $('#bolt11').val();
	var amount = $('#payInvoiceAmount').val();

	// just return false if bolt11 value is null
	if (!bolt11){
		return false;
	}

	var url = "bolt11/" + action;
	url += "?bolt11=" + bolt11;

	if (amount){
		url += "&amount=" + amount;
	}

	// When paying an invoice, the response from the c-lightning server
	// can someimes take a few seconds, leaving the user wondering what's happening
	// Immediately show a message telling the user that it's in progress
	if (action == "pay"){
		$('#paymentText').html("<br />Finding a route...");
	}

	$.get( url, function( data ) {
		jsonData = JSON.parse(data);
		response = "<br />";

		// if there's an error, the json data will contain a "message" key
		// display that, otherwise display the actual response
		if ("message" in jsonData){
			response += "Error: " + jsonData.message;
		}else if (action == "pay"){
			response += "Amount: " + jsonData.msatoshi.toLocaleString() + " msatoshi<br />";
			response += "Status: " + jsonData.status + "<br />";
			response += "Recipient: " + jsonData.destination + "<br />";
			response += "Payment Hash: " + jsonData.payment_hash;

			// since a payment was just made,
			// refresh the wallet balances and payment history
			getbalances();
			gethistory();
		}else if(action = "decode"){
			// This field gets hidden/shown based on whether the invoice
			// has an amount specified. Sometimes when it's hidden, there
			// is still an unnesesary value. Blank it out.
			$('#payInvoiceAmount').val("");

			// if there is no amount, show the input to enter an amount
			if (!jsonData.msatoshi){
				$('#noAmount').show();
			}else {
				$('#noAmount').hide();
			}
			response += "Amount: " + jsonData.msatoshi.toLocaleString() + " msatoshi<br />";
			response += "Description: " + jsonData.description + "<br />";
			response += "Recipient: " + jsonData.payee + "<br />";

			var expire = new Date((jsonData.created_at + jsonData.expiry) * 1000);
			response += "Expires At: " + expire.toLocaleString("en-US")
		}else {
			response += "Error: Bad Action";
		}

		response += "<br />";
		$('#paymentText').html(response);
		console.log( "Bolt11 " + action + " : " + data );
	});
}

function getbalances(){
	$.get( "listfunds/", function( data ) {
		var response = JSON.parse(data);
		var balance = response.balance * 0.00000001
		console.log("onchain balance: " + balance);
		$('#onchainbalance').html("<br />On-chain Balance: " + balance + " BTC<br />");
	});
	$.get( "lightningbalance/", function( data ) {
		var response = JSON.parse(data);
		var balance = (response.balance * 0.00000000001).toFixed(8)
		console.log("lightning balance: " + balance);
		$('#lightningbalance').html("Lightning Balance: " + balance + " BTC<br />");
	});
}

function listchannels(){
	$.get( "listchannels/", function( data ) {
		var response = JSON.parse(data);
		var peers = JSON.parse(JSON.stringify(response["peers"]));
		var channel_html = "";

		// Loop through each peer
		// Display peers that we have channels with,
		// or are still negotiating a channel with
		for (var key in peers) {
			// if the state field exists for a peer,
			// it means we're still negotiation a channel
			if ("state" in peers[key]){
				channel_html += "<div class='alt'>";
				channel_html += "Alias: " + peers[key].alias + "<br />";
				channel_html += "State: " + peers[key].state + "<br />";
				channel_html += "Peer ID: " + peers[key].id;
				channel_html += "</div><br />";
			}else if ("channels" in peers[key]){
				var channels = JSON.parse(JSON.stringify(peers[key].channels));
				for (var ckey in channels){
					// If the channel state is ONCHAIN,
					// that means it's closed. Ignore it
					if (channels[ckey].state != "ONCHAIN"){
						channel_html += "<div class='alt'>";
						channel_html += "Alias: " + peers[key].alias + "<br />";
						channel_html += "State: " + channels[ckey].state + "<br />";
						channel_html += "Balance: " + channels[ckey].msatoshi_to_us.toLocaleString() + " msatoshis<br />";
						channel_html += "Channel ID: " + channels[ckey].channel_id + "<br />"
						channel_html += "Peer ID: " + peers[key].id + "<br />";
						channel_html += "Funding TXID: <a href='https://www.smartbit.com.au/tx/" + channels[ckey].funding_txid + "'>"+ channels[ckey].funding_txid + "</a><br />";
						channel_html += "<input id='" + channels[ckey].channel_id + "' type='button' class='close_channel' value='Close this Channel'><br />";
						channel_html += "</div><br />";
					}
				}
			}
		}

		$('#channelText').html(channel_html);

		// close channel button event
		// this is seemingly hidden down here because the listener function
		// needs to be defined after the buttons are created
		$('.close_channel').click(function() {
			closeChannel(this.id);
		});
	})
}

function clear(){
	$('#invoiceText').html("");
	$('#fundingText').html("");
	$('#connectionText').html("");
	$('#paymentText').html("");
}

function help(){
	$.get( "help/", function( data ) {
		console.log( "LN Help: " + data );
	});
}

function stop(){
	$.get( "stop/", function( data ) {
		console.log( "c-lightning daemon stopped: ");
		noDaemon();
	});
}
