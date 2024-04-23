const tradingBotLib = require('../common/trading-lib');
const geckoTerminalLib = require("../common/gecko-terminal");

const chain = "base";
const baseTokenAddress = "0x4200000000000000000000000000000000000006";  //Uniswap market GeckoTerminal (source)
const quoteTokenAddress = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"
const marketSymbol = "WETH_USDC"; //Tegro market (target)

async function fetchCurrentPriceInPrecision() {
    floatPrice = await geckoTerminalLib.getPrice(chain, baseTokenAddress);
    return floatPrice * 10 ** tradingBotLib.quoteDecimals;
}

function calculatePriceLevels(basePrice, percentages, type) {
    return percentages.map(percentage => basePrice * (1 + (type === 'sell' ? 1 : -1) * percentage / 100));
}

function calculateQuantities(priceLevels, balance, percentages) {
    return priceLevels.map((priceLevel, index) => {
        const totalPrice = (balance * (percentages[index] / 100));
        const quantity = (totalPrice / priceLevel) * (10 ** tradingBotLib.baseDecimals);
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
    const filteredOrders = tradingBotLib.filterActiveOrdersBySide(openOrders, type);

    const priceRange = {
        min: Math.min(...priceLevels),
        max: Math.max(...priceLevels)
    };

    console.log("Maximum price level for: " + type + " " + Math.max(...priceLevels));
    console.log("Minimum price level for: " + type + " " + Math.min(...priceLevels));

    const ordersToPlace = [];

    // Determine which orders to cancel and which to place
    for (let order of filteredOrders) {
        let order_price = (order.price / order.quantity) * 10 ** tradingBotLib.quoteDecimals;
        if (order_price < priceRange.min || order_price > priceRange.max) {
            await tradingBotLib.cancelOrder(order.orderId).catch(console.error);
            console.log(`Cancelled order ${order.orderId} at price ${order_price}, out of current price range.`);
        } else {
            // Check if the order still fits within the desired parameters
            const index = priceLevels.findIndex(price => Math.abs(order.price - price) / price < 0.01);
            if (index !== -1 && Math.abs(order.quantity * 10 ** tradingBotLib.baseDecimals - quantities[index]) / quantities[index] < 0.1) {
                priceLevels.splice(index, 1);
                quantities.splice(index, 1);
            }
            console.log(`Order ${order.orderId} is valid at price ${order_price}.`);
        }
    }

    // Place new orders for remaining price levels
    for (let i = 0; i < priceLevels.length; i++) {
        const price = priceLevels[i];
        const quantity = quantities[i];
        await tradingBotLib.placeOrder(type, price, quantity).then(() => {
            console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} order placed: ${quantity} at ${price}`);
        }).catch(console.error);
    }
}

async function runBot() {
    await tradingBotLib.initMarket(marketSymbol);
    const basePrice = await fetchCurrentPriceInPrecision();
    console.log("Base price: " + basePrice);

    const buyPriceLevels = calculatePriceLevels(basePrice, [0.1, 0.2, 2, 4, 5], 'buy');
    const sellPriceLevels = calculatePriceLevels(basePrice, [0.1, 0.2, 2, 4, 5], 'sell');

    const quoteBalance = await tradingBotLib.getBalance(quoteTokenAddress) * 10 ** tradingBotLib.quoteDecimals;
    const baseBalance = await tradingBotLib.getBalance(baseTokenAddress) * 10 ** tradingBotLib.baseDecimals;

    const buyQuantities = calculateQuantities(buyPriceLevels, quoteBalance, [20, 20, 20, 20, 20]);
    const sellQuantities = calculateSellQuantities(sellPriceLevels, baseBalance, [20, 20, 20, 20, 20]);

    await manageOrders(buyPriceLevels, buyQuantities, 'buy');
    await manageOrders(sellPriceLevels, sellQuantities, 'sell');

    setTimeout(runBot, 5000); // Run the bot every 5 seconds
}

runBot().catch(console.error);