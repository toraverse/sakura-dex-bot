const { ethers } = require("ethers");
const axios = require('axios');
const tradingBotLib = require("../common/trading-lib");
require('dotenv').config();

const marketSymbol = "WETH_USDT"; //Tegro market (target)

async function main() {
    const marketInfoReq = await tradingBotLib.initMarket(marketSymbol);
    console.log('counter trade started ')
    setInterval(counterTrade, 1000); 
}

async function counterTrade() {

    try {
        const depth = await tradingBotLib.getDepth();
        console.log('counter trade ', depth);
        if (depth.Asks?.length >= 1) {
            
            await tradingBotLib.placeOrder("buy", depth.Asks[0].price, depth.Asks[0].quantity);
        }

        if (depth.Bids?.length >= 1) {

            await tradingBotLib.placeOrder("sell", depth.Bids[0].price, depth.Bids[0].quantity);
        }

     }
     catch (error) {
         console.log("Error in counterTrade:", error);
     }
}

main()
    .catch(error => {
        console.error(error);
    });