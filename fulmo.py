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

	try:
		result = ln.withdraw(addr, amount)
	except ValueError, e:
		result = parse_exception(e)

	return json.dumps(result)

@app.route("/getinfo/")
def get_info():
	return json.dumps(ln.getinfo())

@app.route("/listfunds/")
def list_funds():
	balance = 0;
	funds = ln.listfunds()
	for item in funds['outputs']:
		balance = balance + item["value"]

	return str(balance)

@app.route("/invoice/")
def invoice():
	make_qr = request.args.get("qr")
	satoshis = request.args.get("amount")
	description = request.args.get("description")
	result = {}

	try:
		invoice = ln.invoice(satoshis, "lbl{}".format(random.random()), description)
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

	try:
		if action == "pay":
			result = ln.pay(bolt11)
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

@app.route("/listchannels/")
def list_channels():
	peers = ln.listpeers()
	data = {}
	total_balance = 0

	# Relevant peers are ones that we have an open channel with, 
	# or we're still negotiation a channel with.
	# If our only relationship to a peer is that we have a closed channel, 
	# then we don't care about him for now.
	relevant_peer = {}

	# loop through all peers
	# get either the peer state, or channel state (if it exists)
	for key, value in peers.iteritems():
		for i, val in enumerate(value):
			data[i] = {}
			relevant_peer[i] = False

			if "alias" in val:
				data[i]["alias"] = val["alias"]

			data[i]["peer_id"] = val["id"]

			# If there is a state key in the peer dict, 
			# that means there is no channel yet, so just use that.
			# Otherwise, loop through the channels to get their states
			if "state" in val:
				# We have a current state with this peer, so he is relevantt
				relevant_peer[i] = True
				data[i]["state"] = val["state"]
			else:
				for j, channels in enumerate(val["channels"]):
					data[i][j] = {}

					# ONCHAIN means the channel is closed
					# So if the channel state is not "ONCHAIN",
					# then this peer is relevant.
					if channels["state"] != "ONCHAIN":
						relevant_peer[i] = True
						data[i][j]["channel_id"] = channels["channel_id"]
						data[i][j]["balance"] = channels["msatoshi_to_us"]
						data[i][j]["state"] = channels["state"]
						total_balance = total_balance + channels["msatoshi_to_us"]

			# If the peer is irrelevant, just remove him from the list
			if not relevant_peer[i]:
				del data[i]

			if total_balance > 0:
				data["balance"] = total_balance

	json_data = json.dumps(data)
	return json_data

@app.route("/connect/")
def connect():
	satoshis = request.args.get("satoshis")
	connection_string = request.args.get("c")
	if re.search(r".*@[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*:[0-9]*", connection_string) is None:
		return "Node must be in this format: NodeID@IPaddress:Port"

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

def qr(data): 
	img = qrcode.make(data)
	filename = "static/qrcodes/" + data + ".png"
	img.save(filename)
	return filename

def parse_exception(e):
	# The ValueError that's thrown from the Lightning RPC library
	# contains (among other text) a string representation of a dict object.
	# This is a little hacky, but the goal here is to extract that dict
	# and return it, so it can be used as an actual dict, not a string
	error = str(e)

	# Trying to extract the dict based on the presence of curly braces
	msg_str = error[error.find("{"):error.find("}")+1]

	# Sometimes a SyntaxError is thrown because there are
	# multiple sets of braces, and the above code stops one brace short..
	# If that happens, add an extra curly brace and call it a day
	try:
		final_dict = ast.literal_eval(msg_str)
	except SyntaxError:
		final_dict = ast.literal_eval(msg_str + "}")

	return final_dict

if __name__ == "__main__":
	app.run(host="192.168.0.100",ssl_context='adhoc')
