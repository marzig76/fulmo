$(document).ready(function() {

	console.log('Document Ready');

	refresh();

	// create invoice button event
	$('#createInvoice').click(function() {
		createInvoice();
	});

	// funding button event
        $('#fundingButton').click(function() {
                getNewAddr();
        });

	// help button event
        $('#help').click(function() {
                help();
        });

	// refresh statuses
	window.setInterval(refresh, 30000);
});

function refresh(){
	console.log("refresh");	
	getinfo();
	listchannels();
}

function getinfo(){
        $.get( "getinfo/", function( data ) {
                $('#getinfoText').html(data);
		console.log( "LN node stats: " + data );
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
                $('#channelText').html(data);
                console.log( "LN list channels: " + data );
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

function help(){
	$.get( "help/", function( data ) {
		console.log( "LN Help: " + data );
	});
}
