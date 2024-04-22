const tradingBotLib = require('../common/trading-lib');
const geckoTerminalLib = require("../common/gecko-terminal");

const chain = "base";
const tokenAddress = "0x4200000000000000000000000000000000000006";  //Uniswap market GeckoTerminal (source)
const quoteWalletBalance = 15433546;
const marketSymbol = "WETH_USDC"; //Tegro market (target)
const baseWalletBalance = ;


async function fetchCurrentPriceInPrecision() {
    floatPrice = await geckoTerminalLib.getPrice(chain, tokenAddress);
    return floatPrice * 10 ** tradingBotLib.quoteDecimals;
}

async function fetchCurrentPriceInFloat() {
    return await geckoTerminalLib.getPrice(chain, tokenAddress);
}

function calculatePriceLevels(basePrice, percentages) {
    return percentages.map(percentage => basePrice * (1 + percentage / 100));
}

function calculateQuantities(priceLevels, balance, percentages) {
    return priceLevels.map((priceLevel, index) => {
        const totalPrice = (balance * (percentages[index] / 100));
        return (totalPrice / priceLevel) * (10 ** tradingBotLib.baseDecimals);
    });
}

async function cancelOutofBoundOrders(orders, priceLevels) {
    const priceRange = {
        min: Math.min(...priceLevels),
        max: Math.max(...priceLevels)
    };

    for (let order of orders) {
        if (order.price < priceRange.min || order.price > priceRange.max) {
            await tradingBotLib.cancelOrder(order.orderId).catch(console.error);
            console.log(`Cancelled order ${order.orderId} at price ${order.price}, out of current price range.`);
        }
    }
}

async function adjustOrders(priceLevels, quantities) {
    const openOrders = await tradingBotLib.getActiveOrders();
    const filteredOrders = tradingBotLib.filterActiveOrders(openOrders);

    // Cancel out-of-bound orders
    await cancelOutofBoundOrders(filteredOrders, priceLevels);

    // Place necessary orders
    await createOrdersIfNecessary(priceLevels, quantities);
}

async function createOrdersIfNecessary(priceLevels, quantities) {
    const openOrders = await tradingBotLib.getActiveOrders();
    const filteredOrders = tradingBotLib.filterActiveOrders(openOrders);

    priceLevels.forEach((price, index) => {
        const quantity = quantities[index];
        const existingOrder = filteredOrders.find(order =>
            Math.abs(order.price - price) / price < 0.01 && // Check if price is within 1%
            Math.abs(order.quantity - quantity) / quantity < 0.1 // Check if quantity is within 10%
        );

        if (!existingOrder) {
            tradingBotLib.placeOrder('buy', price, quantity).then(() => {
                console.log(`Order placed: ${quantity} at ${price}`);
            }).catch(console.error);
        }
    });
}

async function runBot() {
    const marketInfoReq = await tradingBotLib.initMarket(marketSymbol);
    const basePrice = await fetchCurrentPriceInPrecision();
    console.log("Base price: " + basePrice);
    const priceLevels = calculatePriceLevels(basePrice, [1, 2, 3]);
    const quantities = calculateQuantities(priceLevels, walletBalance, [20, 30, 49]);
    await adjustOrders(priceLevels, quantities);

    setTimeout(runBot, 5000); // Run the bot every 5 seconds
}

runBot().catch(console.error);