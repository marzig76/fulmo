# fulmo
a minimalist c-lightning UI

Dependencies
============

You must have a [bitcoin full node](https://github.com/bitcoin/bitcoin) and [c-lightning](https://github.com/ElementsProject/lightning) installed and running.

Make sure python, pip, and git are installed:

```shell
sudo apt-get install python python-pip python-dev build-essential git
```

Install the following python modules:
```shell
sudo pip install pylightning Flask qrcode[pil]
```

Installation
============

Add this to your ~/.lightning/config file and restart your c-lightning node:
```shell
rpc-file=/tmp/lightning-rpc
```

Then run:

```shell
git clone https://github.com/marzig76/fulmo
cd fulmo
./fulmo
```

Then just open a web browser to https://localhost:5000

Notes
============
This will set up a web UI for your locally running c-lightning node.  By default, it will use automatically generated self-signed certs for SSL encryption.  If you don't want encryption, you can specify the ```--no-ssl``` command line argument.

The service binds to all local interfaces, so it will be accessable to your entire local network.  This is ideal for running it on a raspberry pi, then accessing it from another device on your network like your laptop or phone.
