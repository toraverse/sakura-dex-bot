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


**Bot Configuration**
-----------------
The bot configuration can be found in `config/prod.json`. You can adjust the following settings to customize the bot's behavior:

* **Chain**: The source chain (currently set to `"base"`).
* **Source Token Address**: The address of the token on Uniswap market GeckoTerminal (currently set to `"0x420000000000000000000000000000000000000000006"`).
* **Market Symbol**: The symbol of the Tegro market (currently set to `"WETH_USDC"`).
* **Max Quote Balance Utilization**: The maximum sum of all bid orders in quote currency (currently set to `300`).
* **Max Base Balance Utilization**: The maximum sum of all ask orders in base currency (currently set to `0.1`).
* **Refresh Orders**: The interval at which the bot refreshes its orders (currently set to `21000` milliseconds).
* **Price Step Levels**: An array that tells the bot at what intervals from the mid price to place the orders (Currently set to [0.3,0.6,0.9], which will set the first order at a price 0.3% away from mid-price, second at 0.6% and third at 0.9%)
* **Wallet Allocation**: An array that tells the bot what should be the allocation for the corresponding price steps (Currently set to [30,30,40], which will give the first order at 30% allocation from the wallet balance, second also at 30% and third at 40%)

_Note 1: The number of items in the Price Step Levels array and the Wallet allocation array must be equal. The total sum of items in the wallet allocation array must be less than 100._

_Note 2: You must have either same or more approvals and balances in your wallet then what you have set for Max Quote Balance and Base Balance Utilization._


**Running the Bot**
---------------
To run the bot, execute the following command in your terminal:

`node strats/main.js`


**Note**: This is a basic trading bot, feel free to add your stratergy to trade.

