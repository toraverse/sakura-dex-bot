const { ethers } = require("ethers");
const axios = require('axios');
const TegroConnector = require('../common/tegroConnector');
const BaseStrategy = require("../common/baseStrategy");
const logger = require('./lib');

BigInt.prototype.toJSON = function () {
  return this.toString();
};


class VolumeTrade extends BaseStrategy {
    marketSymbol;
    tegroConnector;
    orderRefreshFrequency;
    maxQuoteBalanceUtilization;
    maxBaseBalanceUtilization;
    type;

    constructor(config) {
        super();
        this.marketSymbol = config.marketSymbol;
        this.orderRefreshFrequency = config.orderRefreshFrequency;
        this.tegroConnector = new TegroConnector(this.marketSymbol, config.Wallet);
        this.maxQuoteBalanceUtilization = config.maxQuoteBalanceUtilization;
        this.maxBaseBalanceUtilization = config.maxBaseBalanceUtilization;
        this.type = "volume trade"
    }

    async init() {
        logger.info(`initializing volume trade strategy for ${this.marketSymbol}`);
        await this.tegroConnector.initMarket(this.marketSymbol);
    }

    async run() {
        await this.counterTrade();
    }

    async getBaseBalance() {
        const balance = await this.tegroConnector.getBalanceInFloat(this.tegroConnector.baseTokenAddress);
        return balance > this.maxBaseBalanceUtilization ? this.maxBaseBalanceUtilization : balance;
    }

    async getQuoteBalance() {
        const balance = await this.tegroConnector.getBalanceInFloat(this.tegroConnector.quoteTokenAddress);
        return balance > this.maxQuoteBalanceUtilization ? this.maxQuoteBalanceUtilization : balance;
    }

    async cancelOrders() {
        let openOrders = await this.tegroConnector.getActiveOrders();
        for (const order of openOrders) {
            logger.info(`Cancelling order ${order.orderId}`);
            await this.tegroConnector.cancelOrder(order.orderId);
        }
    }

    async counterTrade() {
        logger.info("starting counter trade for " + this.marketSymbol);
        try {
            //First cancel all existing orders
            await this.cancelOrders();

            //Get the current depth
            const depth = await this.tegroConnector.getDepth();
            logger.info(`fetched depth : ${JSON.stringify(depth)}`);
            //Return if there is no liquidity in the orderbook
            if (!depth.Asks?.length >= 1 && !depth.Bids?.length >= 1) {
                logger.error("no liquidity in the orderbook");
                return;
            }

            //Fetch the balances
            let quoteBalance = await this.getQuoteBalance() * 10 ** this.tegroConnector.quoteDecimals;
            let baseBalance = await this.getBaseBalance();
            logger.info(`fetched balance for ${this.marketSymbol} ==> Quote : ${quoteBalance}  Base : ${baseBalance}`);
            baseBalance.toFixed(4); //To help with ethers error of too long numbers
            baseBalance = BigInt(baseBalance * 10 ** this.tegroConnector.baseDecimals);

            //Calculate the best bid and ask
            const bestBid = Number(depth.Bids[0].price);
            const bestAsk = Number(depth.Asks[depth.Asks.length - 1].price);
            logger.info(`fetched best bid and ask for ${this.marketSymbol} is ${bestBid} and ${bestAsk}`);
            //Calculate the mid price
            let midPrice = Math.floor((bestBid + bestAsk) / 2);
            logger.info(`fetched mid price : ${midPrice}`);

            //Calculate buy quantity based on available balance
            let quantity = quoteBalance / midPrice * (10 ** this.tegroConnector.baseDecimals);
            //Set the quantity to be bought and sold to be the min of MaxBuyingPower/MaxSellingPower
            quantity = quantity < baseBalance ? quantity : baseBalance;
            
            logger.info(`calculated buy quantity is : ${quantity} for token ${this.marketSymbol}`);

            //Place the orders
            await this.tegroConnector.placeOrder("buy", midPrice, quantity);
            await this.tegroConnector.placeOrder("sell", midPrice, quantity);
        }

        catch (error) {
            logger.info(`error in counterTrade : ", ${error}`);
        }
        setTimeout(() => this.counterTrade(), this.orderRefreshFrequency);
    }
}

module.exports = VolumeTrade;