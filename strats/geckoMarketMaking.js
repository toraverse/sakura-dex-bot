const TegroConnector = require('../common/tegroConnector');
const geckoTerminalLib = require("../common/geckoTerminal");
const BaseStrategy = require("../common/baseStrategy");
const logger = require('./lib');

class GeckoMarketMaking extends BaseStrategy {

    chain;
    marketSymbol; // Tegro market (target)
    tegroConnector;
    maxQuoteBalanceUtilization;
    maxBaseBalanceUtilization;
    priceStepLevels; // Percentage steps for price levels (buy & sell)
    walletAllocation; // Percentage allocation of the wallet for each order
    orderRefreshFrequency;
    type;
    
    constructor(config) {
        super();
        this.chain = config.chain;
        this.marketSymbol = config.marketSymbol;
        this.maxQuoteBalanceUtilization = config.maxQuoteBalanceUtilization;
        this.maxBaseBalanceUtilization = config.maxBaseBalanceUtilization;
        this.priceStepLevels = config.priceStepLevels;
        this.walletAllocation = config.walletAllocation;
        this.orderRefreshFrequency = config.orderRefreshFrequency;
        this.tegroConnector = new TegroConnector(this.marketSymbol, config.Wallet);
        this.type = "geckoMarketMaking"
    }

    async init() {
        logger.info('initializing geckoMarketMaking strategy for '+ this.marketSymbol);
        await this.tegroConnector.initMarket(this.marketSymbol);
    }


    async fetchCurrentPriceInPrecision() {
        logger.info('fetching current price for market '+ this.tegroConnector.marketSymbol);
        let floatPrice = await geckoTerminalLib.getPrice(this.chain, this.tegroConnector.baseTokenAddress);
        if (floatPrice === undefined || floatPrice === 0) {
            logger.error("Failed to fetch price from CoinGecko.");
            return;
        }
        logger.info(`Fetched current price: ${floatPrice} for ${this.tegroConnector.marketSymbol}`);
        return floatPrice * 10 ** this.tegroConnector.quoteDecimals;
    }

    calculatePriceLevels(basePrice, percentages, type) {
        const priceLevels = percentages.map(percentage => BigInt(Math.floor(basePrice * (1 + (type === 'sell' ? 1 : -1) * percentage / 100))));
        logger.info(`Calculated ${type} price levels for ${this.tegroConnector.marketSymbol}: ${priceLevels}`);
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

    async cancelOrders(priceLevels, type) {
        logger.info(`Cancelling ${type} orders for ${this.tegroConnector.marketSymbol}`);
        logger.info(`priceLevels for cancelling ${JSON.stringify(priceLevels)}` );
        logger.info(`length of priceLevels for cancelling ${priceLevels.length}` );
        let openOrders = await this.tegroConnector.getActiveOrders();
        let filteredOrders = this.tegroConnector.filterActiveOrdersBySide(openOrders, type);
        const initialPriceLevels = priceLevels.length;

        let minPrice;
        let maxPrice;

        if (type === 'buy') {
            minPrice = priceLevels[priceLevels.length - 1];
            maxPrice = priceLevels[0];
        } else {
            minPrice = priceLevels[0];
            maxPrice = priceLevels[priceLevels.length - 1];
        }

        let ordersCancelled = 0;

        for (const order of filteredOrders) {
            const orderPrice = BigInt(order.pricePrecision);
            if (orderPrice < minPrice || orderPrice > maxPrice) {
                logger.info('order id for cancelling ===> ',order.orderId);
                logger.info(`Cancelling ${type} order for ${Number(order.price)} because it is outside of the price range [${Number(minPrice) / 10 ** this.tegroConnector.quoteDecimals}, ${Number(maxPrice) / 10 ** this.tegroConnector.quoteDecimals}]`);
                await this.tegroConnector.cancelOrder(order.orderId).catch(err => logger.error(`Failed to cancel order ${order.orderId}: `, err));
                ordersCancelled++;
            }
            else {
                priceLevels.shift();
                logger.info(`NOT cancelling order ${order.price} because it is inside of the price range [${Number(minPrice) / 10 ** this.tegroConnector.quoteDecimals}, ${Number(maxPrice) / 10 ** this.tegroConnector.quoteDecimals}]`);
            }
        }

        logger.info(`${type} Orders to create: ${priceLevels.length}`);
        return priceLevels;
    }

    async manageOrders(priceLevels, quantities, type) {
        let ordersToPlace = priceLevels.length;

        // Place new orders based on type
        for (let i = 0; i < ordersToPlace; i++) {
            logger.info(`Placing new ${type} order at price ${priceLevels[i]} with quantity ${quantities[i]} for ${this.tegroConnector.marketSymbol}...`);
            await this.tegroConnector.placeOrder(type, priceLevels[i], quantities[i])
                .catch(err => logger.error(`Failed to place ${type} order at ${priceLevels[i]}:${quantities[i]} `, err));
        }
    }

    async getBaseBalance() {
        const balance = await this.tegroConnector.getBalanceInFloat(this.tegroConnector.baseTokenAddress);
        return balance > this.maxBaseBalanceUtilization ? this.maxBaseBalanceUtilization : balance;
    }

    async getQuoteBalance() {
        const balance = await this.tegroConnector.getBalanceInFloat(this.tegroConnector.quoteTokenAddress);
        return balance > this.maxQuoteBalanceUtilization ? this.maxQuoteBalanceUtilization : balance;
    }

    async run() {
        await this.runMM();
    }

    async runMM() {
        logger.info('Starting market making...');

        const basePrice = await this.fetchCurrentPriceInPrecision();

        if (!basePrice) {
            logger.error('Failed to fetch price. Retrying after some time...');
            return;
        }
        logger.info(`Current price: ${basePrice} for ${this.tegroConnector.marketSymbol}`);
        let buyPriceLevels = this.calculatePriceLevels(basePrice, this.priceStepLevels, 'buy');
        let sellPriceLevels = this.calculatePriceLevels(basePrice, this.priceStepLevels, 'sell');

        let quoteBalance = await this.getQuoteBalance();
        let baseBalance = await this.getBaseBalance();
        logger.info(`Base balance: ${baseBalance} for token ${this.tegroConnector.baseTokenAddress}`);
        logger.info(`Quote balance: ${baseBalance} for token ${this.tegroConnector.quoteTokenAddress}`);

        baseBalance = baseBalance.toFixed(4); //To help with too many decimals error in Ethers library

        quoteBalance *= 10 ** this.tegroConnector.quoteDecimals;
        baseBalance *= 10 ** this.tegroConnector.baseDecimals;

        const buyQuantities = this.calculateQuantities(buyPriceLevels, quoteBalance, this.walletAllocation);
        const sellQuantities = this.calculateSellQuantities(sellPriceLevels, baseBalance, this.walletAllocation);

        buyPriceLevels = await this.cancelOrders(buyPriceLevels, 'buy');
        sellPriceLevels = await this.cancelOrders(sellPriceLevels, 'sell');

        logger.info('Buy price levels: ', buyPriceLevels);
        logger.info("Sell price levels: ", sellPriceLevels);

        await this.manageOrders(buyPriceLevels, buyQuantities, 'buy');
        await this.manageOrders(sellPriceLevels, sellQuantities, 'sell');

        setTimeout(() => this.runMM(), this.orderRefreshFrequency);
    }
}

module.exports = GeckoMarketMaking;