const tradingBotLib = require('../common/trading-lib');
const geckoTerminalLib = require("../common/gecko-terminal");

const chain = "base"; //source chain    
const sourceTokenAddress = "0x4200000000000000000000000000000000000006"; // Uniswap market GeckoTerminal (source)
const marketSymbol = "WETH_USDT"; // Tegro market (target)

const priceStepLevels = [0.01, 0.1, 0.2]; // Percentage steps for price levels (buy & sell)
const walletAllocation = [20, 30, 40]; // Percentage allocation of the wallet for each order

async function fetchCurrentPriceInPrecision() {
    const floatPrice = await geckoTerminalLib.getPrice(chain, sourceTokenAddress);
    console.log(`Fetched current price: ${floatPrice}`);
    return floatPrice * 10 ** tradingBotLib.quoteDecimals;
}

function calculatePriceLevels(basePrice, percentages, type) {
    const priceLevels = percentages.map(percentage => basePrice * (1 + (type === 'sell' ? 1 : -1) * percentage / 100));
    console.log(`Calculated ${type} price levels: ${priceLevels}`);
    return priceLevels;
}

function calculateQuantities(priceLevels, balance, percentages) {
    const quantities = priceLevels.map((priceLevel, index) => {
        const totalPrice = balance * (percentages[index] / 100);
        const quantity = totalPrice / priceLevel * (10 ** tradingBotLib.baseDecimals);
        return quantity;
    });
    console.log(`Calculated quantities: ${quantities}`);
    return quantities;
}

function calculateSellQuantities(priceLevels, balance, percentages) {
    const quantities = priceLevels.map((priceLevel, index) => balance * (percentages[index] / 100));
    console.log(`Calculated sell quantities: ${quantities}`);
    return quantities;
}

async function cancelOrders() {
    const openOrders = await tradingBotLib.getActiveOrders();
    console.log(`Fetched ${openOrders.length} active orders from the market.`);

    // Cancel all existing orders of the same type
    for (const order of openOrders) {
        console.log(`Cancelling order ${order.orderId}...`);
        await tradingBotLib.cancelOrder(order.orderId).catch(err => console.error(`Failed to cancel order ${order.orderId}:`, err));
    }
}

async function manageOrders(priceLevels, quantities, type) {

    // const openOrders = await tradingBotLib.getActiveOrders();
    // console.log(`Fetched ${openOrders.length} active orders from the market.`);

    // const filteredOrders = tradingBotLib.filterActiveOrdersBySide(openOrders, type);
    // console.log(`Filtered ${filteredOrders.length} ${type} orders to manage.`);

    // // Cancel all existing orders of the same type
    // for (const order of filteredOrders) {
    //     console.log(`Cancelling ${type} order ${order.orderId}...`);
    //     await tradingBotLib.cancelOrder(order.orderId).catch(err => console.error(`Failed to cancel ${type} order ${order.orderId}:`, err));
    // }

    // Place new orders based on type
    for (let i = 0; i < priceLevels.length; i++) {
        console.log(`Placing new ${type} order at price ${priceLevels[i]} with quantity ${quantities[i]}...`);
        await tradingBotLib.placeOrder(type, priceLevels[i], quantities[i])
            .catch(err => console.error(`Failed to place ${type} order at ${priceLevels[i]}:${quantities[i]}`, err));
    }
}

async function runBot() {
    console.log('Initializing market...');
    await tradingBotLib.initMarket(marketSymbol);

    runMM();
}

async function runMM() {
    const basePrice = await fetchCurrentPriceInPrecision();
    console.log(`Base price in precision: ${basePrice}`);

    const buyPriceLevels = calculatePriceLevels(basePrice, priceStepLevels, 'buy');
    const sellPriceLevels = calculatePriceLevels(basePrice, priceStepLevels, 'sell');

    quoteBalance = await tradingBotLib.getBalance(tradingBotLib.quoteTokenAddress);
    baseBalance = await tradingBotLib.getBalance(tradingBotLib.baseTokenAddress);

    baseBalance = baseBalance.toFixed(4); //To help with too many decimals error in Ethers library
    console.log(    `Base balance: ${baseBalance}`);

    quoteBalance *= 10 ** tradingBotLib.quoteDecimals;
    baseBalance *= 10 ** tradingBotLib.quoteDecimals;

    const buyQuantities = calculateQuantities(buyPriceLevels, quoteBalance, walletAllocation);
    const sellQuantities = calculateSellQuantities(sellPriceLevels, baseBalance, walletAllocation);

    await cancelOrders();

    await manageOrders(buyPriceLevels, buyQuantities, 'buy');
    await manageOrders(sellPriceLevels, sellQuantities, 'sell');

    setTimeout(runMM, 5000); // Run the bot every 5 seconds

}

runBot().catch(console.error);