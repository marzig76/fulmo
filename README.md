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
sudo pip install pylightning==0.0.6 Flask qrcode[pil]
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

Then just open a web browser to http://localhost:5000

Notes
============
This will set up a web UI for your locally running c-lightning node.  By default, it will use an unencrypted connection.  If you want an encrypted connection with automatically generated self-signed certs, you can specify the ```--ssl``` command line argument: ```./fulmo --ssl```.  Then use https when connecting.

The service binds to all local interfaces, so it will be accessable to your entire local network.  This is ideal for running it on a raspberry pi, then accessing it from another device on your network like your laptop or smart phone.

This uses python2, so if you're having any errors, or if you know that your `python` command maps to python3, try installing the dependencies with pip2 instead of pip, and running with python2, instead of python.
