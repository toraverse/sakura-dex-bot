////THIS IS IN WIP ////

const tradingBotLib = require('../common/trading-lib');
const geckoTerminalLib = require("../common/gecko-terminal");

const chain = "base";
const sourceTokenAddress = "0x4200000000000000000000000000000000000006";//Uniswap market GeckoTerminal (source)
const marketSymbol = "BONE_USDT"; //Tegro market (target)

async function fetchCurrentPriceInPrecision() {
    floatPrice = await geckoTerminalLib.getPrice(chain, sourceTokenAddress);
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
        console.log(`Evaluating price level ${price} with quantity ${quantity}`);
        const tolerance = price * 0.001; // 1% of the price level
        console.log(`Calculated tolerance: ${tolerance}`);
        console.log(`Price range for valid orders: [${price - tolerance}, ${price + tolerance}]`);

        while (orderIndex < filteredOrders.length && filteredOrders[orderIndex].pricePrecision < price - tolerance) {
            // Cancel all orders that are below the current price level minus tolerance
            await tradingBotLib.cancelOrder(filteredOrders[orderIndex].orderId).catch(console.error);
            console.log(`Cancelled order ${filteredOrders[orderIndex].orderId} at price ${filteredOrders[orderIndex].pricePrecision}, out of current price range.`);
            orderIndex++;
        }

        if (orderIndex < filteredOrders.length && Math.abs(filteredOrders[orderIndex].pricePrecision - price) <= tolerance) {
            // Existing order is within tolerance, check quantity
            if (Math.abs(filteredOrders[orderIndex].volumePrecision - quantity) / quantity < 0.10) { // Assuming 10% tolerance for quantity
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

    const buyPriceLevels = calculatePriceLevels(basePrice, [0.01, 0.02, 5], 'buy');
    const sellPriceLevels = calculatePriceLevels(basePrice, [0.01, 0.02, 5], 'sell');

    const quoteBalance = await tradingBotLib.getBalance(tradingBotLib.quoteTokenAddress) * 10 ** tradingBotLib.quoteDecimals;
    const baseBalance = await tradingBotLib.getBalance(tradingBotLib.baseTokenAddress) * 10 ** tradingBotLib.baseDecimals;

    const buyQuantities = calculateQuantities(buyPriceLevels, quoteBalance, [20, 20, 60]);
    const sellQuantities = calculateSellQuantities(sellPriceLevels, baseBalance, [20, 20, 60]);

    await manageOrders(buyPriceLevels, buyQuantities, 'buy');
    await manageOrders(sellPriceLevels, sellQuantities, 'sell');

    setTimeout(runBot, 5000); // Run the bot every 5 seconds
}

runBot().catch(console.error);