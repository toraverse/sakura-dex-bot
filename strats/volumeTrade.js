const { ethers } = require("ethers");
const axios = require('axios');
const TegroConnector = require('../common/tegroConnector');
const BaseStrategy = require("../common/baseStrategy");
const logger = require('./lib');
const Decimal = require("decimal.js");
const constants = require('../common/constants')

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
        logger.info(`starting counter trade for  ${this.marketSymbol}`);
        try {
            //First cancel all existing orders
            await this.cancelOrders();

            //Get the current depth
            const depth = await this.tegroConnector.getDepth();
            logger.info(`fetched depth : ${JSON.stringify(depth)}`);
            //Return if there is no liquidity in the orderbook
            if (
              !(
                depth.asks &&
                depth.asks.length >= 1 &&
                depth.bids &&
                depth.bids.length >= 1
              )
            ) {
              logger.error(
                `no liquidity in the orderbook for market ${this.marketSymbol}`
              );
              return;
            }

            //Fetch the balances
            let quoteBalance = await this.getQuoteBalance() * 10 ** this.tegroConnector.quoteDecimals;
            let baseBalance = await this.getBaseBalance();
            logger.info(`fetched balance for ${this.marketSymbol} ==> Quote : ${quoteBalance}  Base : ${baseBalance}`);
            // baseBalance.toFixed(4); //To help with ethers error of too long numbers
            baseBalance = BigInt(baseBalance * 10 ** this.tegroConnector.baseDecimals);

            //Calculate the best bid and ask
            const bestBid = Number(depth.bids[0].price);
            const bestAsk = Number(depth.asks[depth.asks.length - 1].price);
            logger.info(`fetched best bid and ask for ${this.marketSymbol} is ${bestBid} and ${bestAsk}`);
            //Calculate the mid price
            let midPrice = (bestBid + bestAsk) / 2;
            logger.info(`fetched mid price : ${midPrice}`);

            //Calculate buy quantity based on available balance
            let quantity = quoteBalance / midPrice * (10 ** this.tegroConnector.baseDecimals);
            //Set the quantity to be bought and sold to be the min of MaxBuyingPower/MaxSellingPower
            quantity = quantity < baseBalance ? quantity : baseBalance;
            

             let basePowerMultiplier = new Decimal(10).pow(
               this.tegroConnector.baseDecimals
             );
            
            
            logger.info(` quantity , ${quantity}`);
            
            let calculatedQuantity = new Decimal(quantity.toString());
            
            logger.info(` calculatedQuantity  ${calculatedQuantity}`);
            calculatedQuantity = new Decimal(
                calculatedQuantity
                .div(basePowerMultiplier)
                .toFixed(this.tegroConnector.basePrecision)
                );
                const finalQuantity = calculatedQuantity.mul(basePowerMultiplier).toFixed()
                logger.info(` final calculatedQuantity  ${finalQuantity}`);

            let calculatedPrice = new Decimal(midPrice).toFixed(this.tegroConnector.quotePrecision);

            logger.info(`calculatedPrice  ${calculatedPrice.toString()}`);

            let quotePowerMultiplier = new Decimal(10).pow(constants.PRICE_EXPONENT)

            const finalPrice = new Decimal(calculatedPrice).mul(quotePowerMultiplier);

            logger.info(`final price : ${finalPrice}`)


            logger.info(`calculated buy quantity is : ${quantity} for token ${this.marketSymbol}`);
            // const calculatedPrice = midPrice * (10 ** PRICE_EXPONENT);
            // const calculatedQuantity = midPrice * (10 ** this.tegroConnector.baseDecimals);
            
            logger.info(`calculated price is : ${calculatedPrice} for token ${this.marketSymbol}`);
            //Place the orders
              await this.tegroConnector.placeOrder(
                "buy",
                finalPrice,
                finalQuantity
              );
            await this.tegroConnector.placeOrder(
              "sell",
              finalPrice,
              finalQuantity
            );
        }

        catch (error) {
            logger.error(`error in counterTrade : ", ${error}`);
            console.log(error)
      } finally {
          setTimeout(() => this.counterTrade(), this.orderRefreshFrequency);
        }
    }
}

module.exports = VolumeTrade;