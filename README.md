Here is the updated README file:
```
**Trading Bot on Tegro Dex**
=====================

**Installation**
---------------
To get started, simply install the required packages by running:

`npm install`


**Environment Variables**
-------------------
Make sure to add your private key to an environment file (e.g. `.env`) with the following format:

```
PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
```
Replace `YOUR_PRIVATE_KEY_HERE` with your actual private key.

**Running the Bot**
---------------
To run the bot, execute the following command in your terminal:

`node strats/Gecko.js`


**Bot Configuration**
-----------------
The bot configuration can be found in `strats/Gecko.js`. You can adjust the following settings to customize the bot's behavior:

* **Chain**: The source chain (currently set to `"base"`).
* **Source Token Address**: The address of the token on Uniswap market GeckoTerminal (currently set to `"0x420000000000000000000000000000000000000000006"`).
* **Market Symbol**: The symbol of the Tegro market (currently set to `"WETH_USDC"`).
* **Max Quote Balance Utilization**: The maximum sum of all bid orders in quote currency (currently set to `1000`).
* **Max Base Balance Utilization**: The maximum sum of all ask orders in base currency (currently set to `0.5`).
* **Refresh Orders**: The interval at which the bot refreshes its orders (currently set to `21000` milliseconds).

**Note**: This is a basic README file, you may want to add more information such as how to configure the bot, troubleshooting tips, and any other relevant details.
```