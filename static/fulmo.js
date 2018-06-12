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
        });
	
	// create invoice button event
	$('#createInvoice').click(function() {
		createInvoice();
	});

	// funding button event
        $('#fundingButton').click(function() {
                getNewAddr();
        });
	
	// make payment button event
	$('#paybolt11').click(function() {
                paybolt11();
        });

	// clear button event
        $('#clear').click(function() {
                clear();
        });
	
	// help button event
        $('#help').click(function() {
                help();
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
                $('#channels').show();
		$('#buttons').show();
		$('#connections').show();
	});

        // show payments and invoices
        $('#showpayments').click(function() {
                hideAll();
                $('#funding').show();
                $('#invoices').show();
		$('#payment').show();
		$('#buttons').show();
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
	$('#getinfo').show();
}

function hideAll(){
	// hide all divs, but still show the navigation tabs
	$('#getinfo').hide();
        $('#channels').hide();
        $('#funding').hide();
        $('#invoices').hide();
        $('#buttons').hide();
        $('#connections').hide();
        $('#payment').hide();
}

function showAll(){
	$('#getinfo').show();
	$('#channels').show();
	$('#funding').show();
	$('#invoices').show();
	$('#buttons').show();
	$('#connections').show();
	$('#payment').show();
}

function refresh(){
	console.log("refresh");	
	getinfo();
	listchannels();
}

function getinfo(){
        $.get( "getinfo/", function( data ) {
 		var getinfo = JSON.parse(data);
		var getinfoHTML = "";               
		for (var key in getinfo){
			getinfoHTML += key + ": " + getinfo[key] + "<br />";
		}
		$('#getinfoText').html(getinfoHTML);
        });	
}

function connect(){
	var connectEndpoint = "connect/";
	var node = $('#connection').val();
	var connectURL = connectEndpoint + "?c=" + node
	var satoshis = Number($('#connectionAmount').val());
	connectURL = connectURL + "&satoshis=" + satoshis;
	
        $.get( connectURL, function( data ) {
                $('#connectionText').html(data);
		listchannels();
		// console.log( "Connection: " + data );
        });
}

function closeChannel(channel_id){
	var closeURL = "close/?channel_id=" + channel_id;
	$.get( closeURL, function( data ) {
		$('#connectionText').html(data);
	});
}

function getNewAddr(){
	var addrURL = "newaddr/";
        if ($('#bech32').is(':checked')){
                addrURL = addrURL + "?type=bech32";
        }
	$.get( addrURL, function( data ) {
                $('#fundingText').html(data);
                console.log( "New Address: " + data );
        });
}

function listchannels(){
        $.get( "listchannels/", function( data ) {
		var peers = JSON.parse(data);
		var channel_html = "";
		for (var key in peers) {
			channel_html += "<div style='border:1px solid black;'>";
			var channels = JSON.parse(JSON.stringify(peers[key]));
			for (var subkey in channels) {
				if ($.isNumeric(subkey)){
					var channel = JSON.parse(JSON.stringify(channels[subkey]));
					for (var channel_key in channel) {
						if (channel_key == "channel_id"){
							channel_html += "<input id='4500" + channel[channel_key] + "' type='button' class='close_channel' value='Close this Channel'><br />";
						}
						channel_html += channel_key + ": " + channel[channel_key] + "<br />";
					}
				}else {
					channel_html += subkey + ": " + channels[subkey] + "<br />";
				}
			}
			channel_html += "</div>"
			channel_html += "<br />";
		}
		$('#channelText').html(channel_html);
                console.log( "LN list channels: " + data );
        
		// close channel button event
		// this is seemingly hidden down here because the listener needs to be defined after the buttons are created
        	$('.close_channel').click(function() {
        		closeChannel(this.id);
		});
	});
}

function createInvoice(){
	var amount = $('#invoiceAmount').val();
	var description = $('#invoiceDescription').val();
	var invoiceURL = "invoice/?amount=" + amount + "&description=" + description;

	if ($('#invoiceQR').is(':checked')){
		invoiceURL = invoiceURL + "&qr";
	}

	$.get( invoiceURL, function( data ) {
		$('#invoiceText').html(data);
		console.log( "Invoice: " + data );
        });
}

function paybolt11(){
	var bolt11 = $('#bolt11').val();
	var paymentURL = "pay/?bolt11=" + bolt11;

	$.get( paymentURL, function( data ) {
                $('#paymentText').html(data);
                console.log( "Lightning Payment: " + data );
        });
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
