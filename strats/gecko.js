const tradingBotLib = require('../common/trading-lib');
const geckoTerminalLib = require("../common/gecko-terminal");

const chain = "base";
const baseTokenAddress = "0x4200000000000000000000000000000000000006";  //Uniswap market GeckoTerminal (source)
const quoteTokenAddress = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
const marketSymbol = "WETH_USDC"; //Tegro market (target)
const baseWalletBalance = 0;
const quoteWalletBalance = 0;


async function fetchCurrentPriceInPrecision() {
    floatPrice = await geckoTerminalLib.getPrice(chain, baseTokenAddress);
    return floatPrice * 10 ** tradingBotLib.quoteDecimals;
}

async function fetchCurrentPriceInFloat() {
    return await geckoTerminalLib.getPrice(chain, tokenAddress);
}

function calculatePriceLevels(basePrice, percentages, type) {
    return percentages.map(percentage => basePrice * (1 + (type === 'sell' ? 1 : -1) * percentage / 100));
}

function calculateQuantities(priceLevels, balance, percentages) {
    return priceLevels.map((priceLevel, index) => {
        const totalPrice = (balance * (percentages[index] / 100));
        const quantity = (totalPrice / priceLevel) * (10 ** tradingBotLib.baseDecimals);
        console.log("Total price: " + totalPrice + "\t" + "Quantity: " + quantity);
        return quantity;
    });
}

function calculateSellQuantities(priceLevels, balance, percentages) {
    return priceLevels.map((priceLevel, index) => {
        const quantity = (balance * (percentages[index] / 100));
        return quantity;
    });
}

async function manageOrders(priceLevels, quantities, type) {
    const openOrders = await tradingBotLib.getActiveOrders();
    const filteredOrders = tradingBotLib.filterActiveOrders(openOrders, type);

    // Cancel out-of-bound orders
    await cancelOutofBoundOrders(filteredOrders, priceLevels);

    // Place necessary orders
    await placeOrdersIfNecessary(priceLevels, quantities, type);
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

async function placeOrdersIfNecessary(priceLevels, quantities, type) {
    const openOrders = await tradingBotLib.getActiveOrders();
    const filteredOrders = tradingBotLib.filterActiveOrders(openOrders, type);

    priceLevels.forEach((price, index) => {
        const quantity = quantities[index];
        const existingOrder = filteredOrders.find(order => Math.abs(order.price - price) / price < 0.01 && Math.abs(order.quantity - quantity) / quantity < 0.1);

        if (!existingOrder) {
            tradingBotLib.placeOrder(type, price, quantity).then(() => {
                console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} order placed: ${quantity} at ${price}`);
            }).catch(console.error);
        }
    });
}

async function runBot() {
    await tradingBotLib.initMarket(marketSymbol);
    const basePrice = await fetchCurrentPriceInPrecision();
    console.log("Base price: " + basePrice);

    const buyPriceLevels = calculatePriceLevels(basePrice, [0.1, 0.2, 0.3, 0.4, 0.5], 'buy');
    const sellPriceLevels = calculatePriceLevels(basePrice, [0.1, 0.2, 0.3, 0.4, 0.5], 'sell');

    const quoteBalance = await tradingBotLib.getBalance(quoteTokenAddress) * 10 ** tradingBotLib.quoteDecimals;
    const baseBalance = await tradingBotLib.getBalance(baseTokenAddress) * 10 ** tradingBotLib.baseDecimals;

    const buyQuantities = calculateQuantities(buyPriceLevels, quoteBalance, [20, 20, 20, 20, 20]);
    const sellQuantities = calculateSellQuantities(sellPriceLevels, baseBalance, [20, 20, 20, 20, 20]);

    await manageOrders(buyPriceLevels, buyQuantities, 'buy');
    await manageOrders(sellPriceLevels, sellQuantities, 'sell');

    setTimeout(runBot, 5000); // Run the bot every 5 seconds
}

runBot().catch(console.error);