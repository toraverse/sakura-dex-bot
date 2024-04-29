const tradingBotLib = require('../common/trading-lib');
const geckoTerminalLib = require("../common/gecko-terminal");

const marketSymbol = "WETH_USDC";
const chain = "base";
const tokenAddress = "0x4200000000000000000000000000000000000006";
const orderLevels = 3;
const priceStep = 3; //In %

async function main() {
    marketInfo = await tradingBotLib.initMarket(marketSymbol);
    await MarketMake();
}

async function MarketMake() {
    try {
        activeOrders = tradingBotLib.countOrderTypes(await tradingBotLib.getActiveOrders());
        buyOrdersCount = activeOrders.buyCount;
        sellOrdersCount = activeOrders.sellCount;

        depth = await tradingBotLib.getDepth();

        //Return if orders already present
        if (buyOrdersCount >= orderLevels && sellOrdersCount >= orderLevels) {
            console.log("Orders already present. Wait for sometime.");
            mutex = false;
            return;
        }

        //Calculate mid price
        currentPrice = await geckoTerminalLib.getPrice(chain, tokenAddress);

        midPrice = currentPrice * 10 ** tradingBotLib.quoteDecimals;
        console.log("Current gecko price: " + currentPrice + ".  Quote decimal price: " + midPrice);

        const buyOrdersToCreate = orderLevels - buyOrdersCount;
        const sellOrdersToCreate = orderLevels - sellOrdersCount;

        buyPrice = Math.floor(midPrice - (priceStep * midPrice / 100));
        sellPrice = Math.floor(midPrice + (priceStep * midPrice / 100));

        volume = 0.01 * 10 ** tradingBotLib.baseDecimals;

        for (let i = 0; i < buyOrdersToCreate; i++) {
            console.log("Buy price:", buyPrice);
            await tradingBotLib.placeOrder("buy", buyPrice, volume);
            buyPrice = Math.floor(midPrice - (priceStep * midPrice / 100));
        }

        for (let i = 0; i < sellOrdersToCreate; i++) {
            console.log("Sell price:", sellPrice);
            await tradingBotLib.placeOrder("sell", sellPrice, volume);
            sellPrice = Math.floor(midPrice + (priceStep * midPrice / 100));
        }
    }
    catch (error) {
        console.log("Error occured while placing orders. Retrying...", error);
    }
}

main()
    .catch(error => {
        console.error(error);
    });