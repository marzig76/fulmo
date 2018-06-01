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

This just open a webbrowser to http://192.x.x.x:5000

Notes
============
You'll have to modify the fulmo batch file with your local ip.
