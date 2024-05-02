**Trading Bot on Tegro Dex**
=====================

**Installation**
---------------
To get started, simply downlaod this repositry. Navigate to the folder using the command line and install the required packages by running:

`npm install`


**Environment Variables**
-------------------
Create a file named `.env` in the same folder and copy the follwing code into it

```
BASE_URL="https://api.tegro.com"
CHAIN_ID=8453
PRIVATE_KEY="YOUR_PRIVATE_KEY_HERE"
GECKO_TERMINAL_BASE_URL="https://api.geckoterminal.com/api/v2"
```

Make sure to replace `YOUR_PRIVATE_KEY_HERE` with your actual private key.

**Running the Bot**
---------------
To run the bot, execute the following command in your terminal:

`node strats/main.js`


**Bot Configuration**
-----------------
The bot configuration can be found in `config/prod.json`. You can adjust the following settings to customize the bot's behavior:

* **Chain**: The source chain (currently set to `"base"`).
* **Source Token Address**: The address of the token on Uniswap market GeckoTerminal (currently set to `"0x420000000000000000000000000000000000000000006"`).
* **Market Symbol**: The symbol of the Tegro market (currently set to `"WETH_USDC"`).
* **Max Quote Balance Utilization**: The maximum sum of all bid orders in quote currency (currently set to `300`).
* **Max Base Balance Utilization**: The maximum sum of all ask orders in base currency (currently set to `0.1`).
* **Refresh Orders**: The interval at which the bot refreshes its orders (currently set to `21000` milliseconds).

**Note**: This is a basic trading bot, feel free to add your stratergy to trade.
