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


    // Sort both priceLevels and filteredOrders by price for efficient comparison
    priceLevels.sort((a, b) => a - b);
    filteredOrders.sort((a, b) => a.price - b.price);

    let orderIndex = 0; // Index for existing orders
    let levelIndex = 0; // Index for new price levels
    
    while (levelIndex < priceLevels.length) {
        const price = priceLevels[levelIndex];
        const quantity = quantities[levelIndex];
        const tolerance = price * 0.01;

        while (orderIndex < filteredOrders.length && filteredOrders[orderIndex].price < price * (1 - tolerance)) {
            // Cancel all orders that are below the current price level minus tolerance
            await tradingBotLib.cancelOrder(filteredOrders[orderIndex].orderId).catch(console.error);
            console.log(`Cancelled order ${filteredOrders[orderIndex].orderId} at price ${filteredOrders[orderIndex].price}, out of current price range.`);
            orderIndex++;
        }

        if (orderIndex < filteredOrders.length && Math.abs(filteredOrders[orderIndex].price - price) / price < tolerance) {
            // Existing order is within tolerance, check quantity
            if (Math.abs(filteredOrders[orderIndex].quantity - quantity) / quantity < tolerance) {
                // Order is valid, skip placing a new one
                orderIndex++;
            } else {
                // Quantity differs, place new order
                await tradingBotLib.placeOrder(type, price, quantity).then(() => {
                    console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} order placed: ${quantity} at ${price}`);
                }).catch(console.error);
            }
        } else {
            // No valid order exists, place a new one
            await tradingBotLib.placeOrder(type, price, quantity).then(() => {
                console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} order placed: ${quantity} at ${price}`);
            }).catch(console.error);
        }

        levelIndex++;
    }

    // Cancel any remaining out-of-bound orders
    while (orderIndex < filteredOrders.length) {
        await tradingBotLib.cancelOrder(filteredOrders[orderIndex].orderId).catch(console.error);
        console.log(`Cancelled order ${filteredOrders[orderIndex].orderId} at price ${filteredOrders[orderIndex].price}, out of current price range.`);
        orderIndex++;
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