const { ethers } = require("ethers");
const axios = require('axios');
const TegroConnector = require('../common/tegroConnector');
const BaseStrategy = require("../common/baseStrategy");

class VolumeTrade extends BaseStrategy {
    marketSymbol;
    tegroConnector;
    orderRefreshFrequency;
    maxQuoteBalanceUtilization;
    maxBaseBalanceUtilization;

    constructor(config) {
        super();
        this.marketSymbol = config.marketSymbol;
        this.orderRefreshFrequency = config.orderRefreshFrequency;
        this.tegroConnector = new TegroConnector(this.marketSymbol, config.Wallet);
        this.maxQuoteBalanceUtilization = config.maxQuoteBalanceUtilization;
        this.maxBaseBalanceUtilization = config.maxBaseBalanceUtilization;
    }

    async init() {
        await this.tegroConnector.initMarket(this.marketSymbol);
    }

    async run() {
        await this.counterTrade();
        setTimeout(() => this.counterTrade(), this.orderRefreshFrequency);
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
            await this.tegroConnector.cancelOrder(order.orderId);
        }
    }

    async counterTrade() {
        try {
            //First cancel all existing orders
            await this.cancelOrders();

            //Get the current depth
            const depth = await this.tegroConnector.getDepth();

            //Return if there is no liquidity in the orderbook
            if (!depth.Asks?.length >= 1 && !depth.Bids?.length >= 1) {
                return;
            }

            //Fetch the balances
            let quoteBalance = await this.getQuoteBalance() * 10 ** this.tegroConnector.quoteDecimals;
            let baseBalance = await this.getBaseBalance();
            console.log("Fetched balances: ", quoteBalance, baseBalance);
            baseBalance.toFixed(4); //To help with ethers error of too long numbers
            baseBalance = BigInt(baseBalance * 10 ** this.tegroConnector.baseDecimals);

            //Calculate the best bid and ask
            const bestBid = Number(depth.Bids[0].price);
            const bestAsk = Number(depth.Asks[depth.Asks.length - 1].price);

            //Calculate the mid price
            let midPrice = Math.floor((bestBid + bestAsk) / 2);
            console.log("Fetched mid price: ", midPrice);

            //Calculate buy quantity based on available balance
            let quantity = quoteBalance / midPrice * (10 ** this.tegroConnector.baseDecimals);

            //Set the quantity to be bought and sold to be the min of MaxBuyingPower/MaxSellingPower
            quantity = quantity < baseBalance ? quantity : baseBalance;

            //Place the orders
            await this.tegroConnector.placeOrder("buy", midPrice, quantity);
            await this.tegroConnector.placeOrder("sell", midPrice, quantity);
        }

        catch (error) {
            console.log("Error in counterTrade:", error);
        }
    }
}

module.exports = VolumeTrade;