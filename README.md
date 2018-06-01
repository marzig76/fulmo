# fulmo
a minimalist c-lightning UI

Dependencies
============

You must have a [bitcoin full node](https://github.com/bitcoin/bitcoin) and [c-lightning](https://github.com/ElementsProject/lightning) installed and running.

Install the following python modules:
```shell
sudo pip install pylightning Flask qrcode[pil]
```

Installation
============

Add this to your ~/.lightning/config file:
```shell
rpc-file=/tmp/lightning-rpc
```

Then run:

```shell
git clone https://github.com/marzig76/fulmo
cd fulmo
./fulmo
```

This just open a web browser to http://localhost:5000

Notes
============
This will set up a web UI for you locally running c-lightning node.  By default, it will only be accessible through your localhost.  If you want to access it from another computer on your network (like running it on a raspberrypi, but accessing it from your laptop), then add your IP address to the fulmo batch file before you run ./fulmo:

```script
FLASK_APP=fulmo.py flask run --host=192.168.0.100
```

Then you can access it from anywhere in your local network by pointing your browser to it, like http://192.168.0.100:5000
