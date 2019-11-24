from lightning import LightningRpc
from flask import Flask, request, render_template
import random
import qrcode
import json
import re
import ast
app = Flask(__name__)

# Connect to local LN node
ln = LightningRpc("/tmp/lightning-rpc")

@app.route("/")
def fulmo():
	return render_template('index.html')

@app.route("/newaddr/")
def new_address():
	addr_type = request.args.get('type')
	make_qr = request.args.get('qr')

	try:
		addr = ln.newaddr(addr_type)
		result = {}
		result["address"] = addr["address"]

		if make_qr is not None:
			result["qr"] = qr(addr['address'])

	except ValueError, e:
		result = parse_exception(e)

	return json.dumps(result)

@app.route("/withdraw/")
def withdraw():
	addr = request.args.get("addr")
	amount = request.args.get("amount")
	feerate = request.args.get('feerate')

	try:
		result = ln.withdraw(addr, amount, feerate)
	except ValueError, e:
		result = parse_exception(e)

	return json.dumps(result)

@app.route("/getinfo/")
def get_info():
	try:
		result = ln.getinfo()
	except Exception, e:
		result = {"message":"Connection refused"}

	return json.dumps(result)

@app.route("/listpayments/")
def list_payments():
        return json.dumps(ln.listsendpays())

@app.route("/listinvoices/")
def list_invoices():
        return json.dumps(ln.listinvoices())

@app.route("/delexpiredinvoice/")
def del_expired_invoice():
        return json.dumps(ln.delexpiredinvoice())

@app.route("/earnedfees/")
def earned_fees():
	earned_fees = 0
	forwards = ln.listforwards()
	for details in forwards["forwards"]:
		if details["status"] == "settled":
			earned_fees = earned_fees + details["fee"]
        return json.dumps({"earned_fees": earned_fees})

@app.route("/listfunds/")
def list_funds():
	balance = 0;
	funds = ln.listfunds()
	for item in funds['outputs']:
		balance = balance + item["value"]

	return json.dumps({"balance": balance})

@app.route("/invoice/")
def invoice():
	make_qr = request.args.get("qr")
	satoshis = request.args.get("amount")
	description = request.args.get("description")
	expire = request.args.get("expire")
	result = {}

	# Make an invoice for any amount
	if satoshis == "":
		satoshis = "any"

	try:
		invoice = ln.invoice(satoshis, "lbl{}".format(random.random()), description, expire)
		bolt11 = invoice["bolt11"]
		result["bolt11"] = bolt11

		if make_qr is not None:
			result["qr"] = qr("lightning:" + bolt11)

	except ValueError, e:
		result = parse_exception(e)

	return json.dumps(result)

@app.route("/bolt11/<action>")
def bolt11(action):
	bolt11 = request.args.get("bolt11")
	amount = request.args.get("amount")

	try:
		if action == "pay":
			result = ln.pay(bolt11, amount)
		elif action == "decode":
			result = ln.decodepay(bolt11)
		else:
			result = {"error": "bad action"}

	except ValueError, e:
		result = parse_exception(e)

	return json.dumps(result)

@app.route("/help/")
def help():
	help_result = ln.help()
	return json.dumps(help_result)

@app.route("/lightningbalance/")
def lightning_balance():
	# Simply loop through all peers,
	# then loop through all the channels with each peer.
	# If we have an open channel with that peer,
	# add that channel balance to our running total
	get_peers = ln.listpeers()
	total_balance = 0
	for peers_key, peers in get_peers.iteritems():
		for peer_key, peer in enumerate(peers):
			if "channels" in peer:
				for channel_key, channel in enumerate(peer["channels"]):
					if channel["state"] == "CHANNELD_NORMAL":
						total_balance = total_balance + channel["msatoshi_to_us"]

	return json.dumps({"balance": total_balance})

@app.route("/listchannels/")
def list_channels():
	return json.dumps(ln.listpeers())

@app.route("/connect/")
def connect():
	satoshis = request.args.get("satoshis")
	connection_string = request.args.get("c")
	if re.search(r".*@[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*:[0-9]*", connection_string) is None:
		return json.dumps({"message": "Node must be in this format: NodeID@IPaddress:Port"})

	node_id = connection_string[:connection_string.find("@")]
	ip = connection_string[connection_string.find("@")+1:connection_string.find(":")]
	port = connection_string[connection_string.find(":")+1:]

	try:
		connect = ln.connect(node_id, ip, port)
		result = fund_channel(connect["id"], satoshis)
	except ValueError, e:
		result = parse_exception(e)

	return json.dumps(result)

@app.route("/close/")
def close():
	channel_id = request.args.get("channel_id")

	try:
		result = ln.close(channel_id)
	except ValueError, e:
		result = parse_exception(e)

	return json.dumps(result)

def fund_channel(node_id, satoshis):
	fund_result = ln.fundchannel(node_id, satoshis)
	return str(fund_result)

@app.route("/stop/")
def stop():
        return(json.dumps(ln.stop()))

def qr(data): 
	img = qrcode.make(data)
	# Using the invoice for the filename was causing i/o errors because of the length.
	# Shorten the filename if it's an invoice.
	if data[:9] == "lightning":
		basename = data[15:47]
	else:
		basename = data
	filename = "static/qrcodes/" + basename + ".png"
	img.save(filename)
	return filename

def parse_exception(e):
	# The ValueError that's raised from the Lightning RPC library
	# contains (among other text) a string representation of multiple dict objects.
	# This is a little hacky, but the goal here is to extract the dict containing the error
	# and return it, so it can be used as an actual python dict object, not a string
	error = str(e)

	# Trying to extract the dict based on the presence of curly braces
	msg_str = error[error.find("{u'message"):]

	# Sometimes a SyntaxError is raised when we fail to extract the dict perfectly
	# In that case we just return the original error message
	try:
		final_dict = ast.literal_eval(msg_str)
	except SyntaxError:
		final_dict = {"Parse Error": error}

	return final_dict

if __name__ == "__main__":
	app.run(host="0.0.0.0",ssl_context=None)
