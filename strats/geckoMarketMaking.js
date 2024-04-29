const TegroConnector = require('../common/tegroConnector');
const geckoTerminalLib = require("../common/geckoTerminal");

class GeckoMarketMaking {

    chain;
    marketSymbol; // Tegro market (target)
    tegroConnector;
    maxQuoteBalanceUtilization;
    maxBaseBalanceUtilization;
    priceStepLevels; // Percentage steps for price levels (buy & sell)
    walletAllocation; // Percentage allocation of the wallet for each order
    orderRefreshFrequency;

    constructor(chain, marketSymbol, maxQuoteBalanceUtilization, maxBaseBalanceUtilization, priceStepLevels, walletAllocation, orderRefreshFrequency) {
        this.chain = chain;
        this.marketSymbol = marketSymbol;
        this.maxQuoteBalanceUtilization = maxQuoteBalanceUtilization;
        this.maxBaseBalanceUtilization = maxBaseBalanceUtilization;
        this.priceStepLevels = priceStepLevels;
        this.walletAllocation = walletAllocation;
        this.orderRefreshFrequency = orderRefreshFrequency;
        this.tegroConnector = new TegroConnector(this.marketSymbol);
    }

    async fetchCurrentPriceInPrecision() {
        let floatPrice = await geckoTerminalLib.getPrice(this.chain, this.tegroConnector.baseTokenAddress);
        if (floatPrice === undefined || floatPrice === 0) {
            console.error("Failed to fetch price from CoinGecko.");
            return;
        }
        console.log(`Fetched current price: ${floatPrice} for ${this.tegroConnector.marketSymbol}`);
        return floatPrice * 10 ** this.tegroConnector.quoteDecimals;
    }

    calculatePriceLevels(basePrice, percentages, type) {
        const priceLevels = percentages.map(percentage => BigInt(Math.floor(basePrice * (1 + (type === 'sell' ? 1 : -1) * percentage / 100))));
        console.log(`Calculated ${type} price levels for ${this.tegroConnector.marketSymbol}: ${priceLevels}`);
        return priceLevels;
    }

    calculateQuantities(priceLevels, balance, percentages) {
        const quantities = priceLevels.map((priceLevel, index) => {
            const totalPrice = balance * (percentages[index] / 100);
            const quantity = totalPrice / Number(priceLevel) * (10 ** this.tegroConnector.baseDecimals);
            return BigInt(Math.floor(quantity));
        });
        return quantities;
    }

    calculateSellQuantities(priceLevels, balance, percentages) {
        const quantities = priceLevels.map((priceLevel, index) => {
            const quantity = BigInt(Math.floor(balance * (percentages[index] / 100)));
            return quantity;
        });
        return quantities;
    }

    async cancelOrders() {
        const openOrders = await this.tegroConnector.getActiveOrders();
        console.log(`Fetched ${openOrders.length} active orders from the market.`);

        // Cancel all existing orders of the same type
        for (const order of openOrders) {
            console.log(`Cancelling order ${order.orderId} for ${this.tegroConnector.marketSymbol}...`);
            await this.tegroConnector.cancelOrder(order.orderId).catch(err => console.error(`Failed to cancel order ${order.orderId}:`, err));
        }
    }

    async manageOrders(priceLevels, quantities, type) {
        // Place new orders based on type
        for (let i = 0; i < priceLevels.length; i++) {
            console.log(`Placing new ${type} order at price ${priceLevels[i]} with quantity ${quantities[i]} for ${this.tegroConnector.marketSymbol}...`);
            await this.tegroConnector.placeOrder(type, priceLevels[i], quantities[i])
                .catch(err => console.error(`Failed to place ${type} order at ${priceLevels[i]}:${quantities[i]}`, err));
        }
    }

    async initBot() {
        await this.tegroConnector.initMarket(this.marketSymbol);
    }

    async getBaseBalance() {
        const balance = await this.tegroConnector.getBalance(this.tegroConnector.baseTokenAddress);
        return balance > this.maxBaseBalanceUtilization ? this.maxBaseBalanceUtilization : balance;
    }

    async getQuoteBalance() {
        const balance = await this.tegroConnector.getBalance(this.tegroConnector.quoteTokenAddress);
        return balance > this.maxQuoteBalanceUtilization ? this.maxQuoteBalanceUtilization : balance;
    }

    async runMM() {
        const basePrice = await this.fetchCurrentPriceInPrecision();

        const buyPriceLevels = this.calculatePriceLevels(basePrice, this.priceStepLevels, 'buy');
        const sellPriceLevels = this.calculatePriceLevels(basePrice, this.priceStepLevels, 'sell');

        let quoteBalance = await this.getQuoteBalance();
        let baseBalance = await this.getBaseBalance();

        baseBalance = baseBalance.toFixed(4); //To help with too many decimals error in Ethers library

        quoteBalance *= 10 ** this.tegroConnector.quoteDecimals;
        baseBalance *= 10 ** this.tegroConnector.baseDecimals;

        const buyQuantities = this.calculateQuantities(buyPriceLevels, quoteBalance, this.walletAllocation);
        const sellQuantities = this.calculateSellQuantities(sellPriceLevels, baseBalance, this.walletAllocation);

        await this.cancelOrders();

        await this.manageOrders(buyPriceLevels, buyQuantities, 'buy');
        await this.manageOrders(sellPriceLevels, sellQuantities, 'sell');

        setTimeout(() => this.runMM(), this.orderRefreshFrequency); // Correctly bind `this` to the instance
    }
}

module.exports = GeckoMarketMaking;