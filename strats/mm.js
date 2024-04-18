const tradingBotLib = require('../common/trading-lib');
require('dotenv').config();

const marketSymbol = "WETH_USDT";

mutex = false;
const orderLevels = 10;
minOrderPrice = 1;
maxOrderPrice = 10;

async function main() {
    marketInfo = await tradingBotLib.initMarket(marketSymbol);
    minOrderPrice = Math.floor(1 * (10 ** (tradingBotLib.quoteDecimals)));
    maxOrderPrice = Math.floor(10 * (10 ** (tradingBotLib.quoteDecimals)));
    setInterval(MarketMake, 1000);
}

async function MarketMake() {

    if (mutex) {
        return;
    }

    mutex = true;

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

        midPrice = 0;

        //Calculate mid price
        if (depth.Asks?.length > 0 && depth.Bids?.length > 0) {
            midPrice = Math.floor((Number(depth.Asks[0].price) + Number(depth.Bids[0].price)) / 2);
        }
        else {
            midPrice = Math.floor(Math.random() * (maxOrderPrice - minOrderPrice + 1) + minOrderPrice);
        }

        const buyOrdersToCreate = orderLevels - buyOrdersCount;
        const sellOrdersToCreate = orderLevels - sellOrdersCount;

        priceStep = 5;
        buyPrice = Math.floor(midPrice - (priceStep * midPrice / 100));
        sellPrice = Math.floor(midPrice + (priceStep * midPrice / 100));

        console.log("Buy price:", buyPrice, "Sell price:", sellPrice);
        volume = (Math.round(Math.random() * (10 - 3) + 3)) * 10 ** tradingBotLib.baseDecimals;

        for (let i = 0; i < buyOrdersToCreate; i++) {
            random = Math.floor(Math.random() * 2) + 1;
            buyPrice -= Math.ceil(random * midPrice / 100);
            if (buyPrice > maxOrderPrice)
            {
                console.log("Buy price is greater than max order price. Resetting buy price to min price.");
                buyPrice = minOrderPrice;
            }
            await tradingBotLib.placeOrder("buy", buyPrice, volume);
        }

        for (let i = 0; i < sellOrdersToCreate; i++) {
            random = Math.floor(Math.random() * 2) + 1;
            sellPrice += Math.ceil(random * midPrice / 100);
            if (sellPrice > maxOrderPrice)
            {
                console.log("Sell price is greater than max order price. Resetting sell price to max price.");
                sellPrice = maxOrderPrice;
            }
            await tradingBotLib.placeOrder("sell", sellPrice, volume);
        }
    }
    catch (error)
    {
        console.log("Error occured while placing orders. Retrying...", error);
    } finally {
        mutex = false;
    }
}

main()
    .catch(error => {
        console.error(error);
    });