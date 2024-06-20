const TegroConnector = require('../common/tegroConnector');
const geckoTerminalLib = require("../common/geckoTerminal");
const BaseStrategy = require("../common/baseStrategy");
const logger = require('./lib');
const constants = require('../common/constants');

const Decimal = require("decimal.js");


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
    this.type = "geckoMarketMaking";
  }

  async init() {
    logger.info(
      `initializing geckoMarketMaking strategy for ${this.marketSymbol}`
    );
    await this.tegroConnector.initMarket(this.marketSymbol);
  }

  async fetchCurrentPriceInPrecision() {
    logger.info(
      "fetching current price for market " + this.tegroConnector.marketSymbol
    );
    let floatPrice = await geckoTerminalLib.getPrice(
      this.chain,
      this.tegroConnector.baseTokenAddress
    );
    if (floatPrice === undefined || floatPrice === 0) {
      logger.error("Failed to fetch price from CoinGecko.");
      return;
    }
    logger.info(`floatPrice ${floatPrice}`);

    let floatPriceAcceptableValue = parseFloat(
      parseFloat(floatPrice).toFixed(this.tegroConnector.quotePrecision)
    );

    logger.info(`floatPriceAcceptableValue  ${ floatPriceAcceptableValue }`);

    logger.info(
      `Fetched current price: ${floatPrice} for ${this.tegroConnector.marketSymbol}`
    );
    return floatPriceAcceptableValue;
  }

  calculatePriceLevels(basePrice, percentages, type) {
    let priceLevels = [];
    for (let i = 0; i < percentages.length; i++) {
      // percentages[i] = parseFloat(percentages[i]);
      let percentage = percentages[i];

      let value =
        basePrice * (1 + ((type === "buy" ? 1 : -1) * percentage) / 100);

      value = parseFloat(
        parseFloat(value).toFixed(this.tegroConnector.quotePrecision)
      );

      console.log("value after toFixed ", value);

      let powFactor = new Decimal(10).pow(constants.PRICE_EXPONENT);

      let result = new Decimal(value);

      let finalPriceValue = result.mul(powFactor);

      priceLevels.push(finalPriceValue);
    }

    // const priceLevels = percentages.map(percentage => BigInt(Math.floor(basePrice * (1 + (type === 'sell' ? 1 : -1) * percentage / 100))));
    logger.info(
      `Calculated ${type} price levels for ${this.tegroConnector.marketSymbol}: ${priceLevels}`
    );
    return priceLevels;
  }

  // calculateQuantities(priceLevels, balance, percentages) {
  //   const quantities = priceLevels.map((priceLevel, index) => {
  //     console.log("balance ", balance);
  //     console.log("index ", index);
  //     console.log("percentages[index] ", percentages[index]);
  //     const totalPrice = balance * (percentages[index] / 100);
  //     console.log("totalPrice ", totalPrice);
  //     let totalPriceAcceptable = parseFloat(
  //       parseFloat(totalPrice).toFixed(this.tegroConnector.quotePrecision)
  //     );

  //     console.log("totalPriceAcceptable : ", totalPriceAcceptable);
  //     console.log(
  //       "this.tegroConnector.basePrecision : ",
  //       this.tegroConnector.basePrecision
  //     );

  //     console.log("priceLevel ", priceLevel);

  //     // console.log(
  //     //   "(totalPriceAcceptable / Number(priceLevel)).toFixed(this.tegroConnector.basePrecision) ",
  //     //   (totalPriceAcceptable / Number(priceLevel)).toFixed(
  //     //     this.tegroConnector.basePrecision
  //     //   )
  //     // );

  //     //   let bigtotalPriceAcceptable = new BigDecimal(totalPriceAcceptable);
  //     //   let bigpriceLevel = new BigDecimal(priceLevel);

  //     //   const div = bigtotalPriceAcceptable.divide(bigpriceLevel);

  //     // Create Decimal instances
  //     let bigtotalPriceAcceptable = new Decimal(
  //       totalPriceAcceptable.toString()
  //     );
  //     let bigpriceLevel = new Decimal(priceLevel.toString());

  //     // Perform division
  //     const result = bigtotalPriceAcceptable.div(bigpriceLevel).toFixed(this.tegroConnector.basePrecision);
  //     console.log("result ", result);
  //     // console.log(
  //     //   "result to fixed ",
  //     //   result.toFixed(this.tegroConnector.basePrecision)
  //     // );

  //     let powFactor = new Decimal(10).pow(this.tegroConnector.baseDecimals);
  //     let resultString = result.mul(powFactor);
  //     console.log("decimal power ", resultString.toFixed().toString());

  //     // const formattedResult = resultString.replace(
  //     //   /(\.\d*?[1-9])0+|\.0*$/,
  //     //   "$1"
  //     // );

  //     // console.log("formattedResult ", formattedResult.toFixed());

  //     const quantity =
  //       (totalPriceAcceptable / Number(priceLevel)).toFixed(
  //         this.tegroConnector.basePrecision
  //       ) *
  //       10 ** this.tegroConnector.baseDecimals;

  //     console.log("quantity ", quantity);
  //     console.log("Math.floor(quantity) ", Math.floor(quantity));
  //     console.log("quantity toString ", quantity.toString());
  //     //   console.log(
  //     //     "BigInt(Math.floor(quantity) ",
  //     //     BigInt(Math.floor(quantity))
  //     //   );
  //     return resultString.toFixed();
  //   });
  //   return quantities;
  // }

  // calculateQuantities(priceLevels, balance, percentages) {
  //   const quantities = priceLevels.map((priceLevel, index) => {
  //     let balanceInDecimal = new Decimal(balance);

  //     console.log("percentages[index] ", percentages[index]);
  //     console.log("balanceInDecimal ", balanceInDecimal);

  //     const totalPrice = balanceInDecimal.mul(percentages[index] / 100);

  //     // const totalPrice = balance * (percentages[index] / 100);
  //     console.log("total price ", totalPrice)
  //     console.log("price level ",priceLevel)
  //     const quantity =
  //     (totalPrice / Number(priceLevel)) *
  //     10 ** this.tegroConnector.baseDecimals;
  //     console.log("quantity ", quantity);

  //     let quantityInDecimal = new Decimal(quantity);
  //     console.log("quantityInDecimal ", quantityInDecimal);
  //     return BigInt(Math.floor(quantity));
  //   });
  //   return quantities;
  // }

  calculateQuantities(priceLevels, balance, percentages) {
    const quantities = priceLevels.map((priceLevel, index) => {
      console.log("priceLevel ",priceLevel)
      console.log("balance ",balance)
      console.log("percentages[index] ", percentages[index]);
      const totalPrice = balance * (percentages[index] / 100);
      console.log("totalPrice ", totalPrice);

      console.log("Number(priceLevel/1e18) ", Number(priceLevel / 1e18));
      const quantity =
        (totalPrice / Number(priceLevel/1e18)) ;
      
      logger.info(`quantity ${quantity}`);

      let actualQuantity = (quantity / 1e6).toFixed(this.tegroConnector.basePrecision);  // base precision decimal
      logger.info(`actualQuantity ${actualQuantity}`);

      let finalQuantity = new Decimal(actualQuantity);
      let basePowerMultiplier = new Decimal(10).pow(
        this.tegroConnector.baseDecimals
      );

      finalQuantity = finalQuantity.mul(basePowerMultiplier); // base token decimal mul
      // const finalQuantity = actualQuantity * 1e18;
      logger.info(`finalQuantity  ${finalQuantity.toFixed()}`);
      
      return finalQuantity.toFixed();
    });
    return quantities;
  }

  calculateSellQuantities(priceLevels, balance, percentages) {
    console.log("sell priceLevels ", priceLevels);
    const quantities = priceLevels.map((priceLevel, index) => {
      const quantity = BigInt(Math.floor(balance * (percentages[index] / 100)));
      
      let quantityInDecimal = new Decimal(quantity.toString());

      let basePowerMultiplier = new Decimal(10).pow(this.tegroConnector.baseDecimals);

      quantityInDecimal = new Decimal(
        quantityInDecimal
          .div(basePowerMultiplier)
          .toFixed(this.tegroConnector.basePrecision)
      );
      logger.info(`sell quantity Decimal ${quantityInDecimal}`)
      quantityInDecimal = quantityInDecimal.mul(basePowerMultiplier);

      return quantityInDecimal.toFixed();
    });
    return quantities;
  }

  async cancelOrders(priceLevels, type) {
    logger.info(
      `Cancelling ${type} orders for ${this.tegroConnector.marketSymbol}`
    );
    logger.info(`priceLevels for cancelling ${JSON.stringify(priceLevels)}`);
    logger.info(`length of priceLevels for cancelling ${priceLevels.length}`);
    let openOrders = await this.tegroConnector.getActiveOrders();
    let filteredOrders = this.tegroConnector.filterActiveOrdersBySide(
      openOrders,
      type
    );
    const initialPriceLevels = priceLevels.length;

    let minPrice;
    let maxPrice;

    if (type === "buy") {
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
        logger.info(`order id for cancelling ===> ${order.orderId}`);
        logger.info(
          `Cancelling ${type} order for ${Number(
            order.price
          )} because it is outside of the price range [${
            Number(minPrice) / 10 ** this.tegroConnector.quoteDecimals
          }, ${Number(maxPrice) / 10 ** this.tegroConnector.quoteDecimals}]`
        );
        await this.tegroConnector
          .cancelOrder(order.orderId)
          .catch((err) =>
            logger.error(`Failed to cancel order ${order.orderId}: `, err)
          );
        ordersCancelled++;
      } else {
        priceLevels.shift();
        logger.info(
          `NOT cancelling order ${
            order.price
          } because it is inside of the price range [${
            Number(minPrice) / 10 ** this.tegroConnector.quoteDecimals
          }, ${Number(maxPrice) / 10 ** this.tegroConnector.quoteDecimals}]`
        );
      }
    }

    logger.info(`${type} Orders to create: ${priceLevels.length}`);
    return priceLevels;
  }

  async manageOrders(priceLevels, quantities, type) {
    let ordersToPlace = priceLevels.length;

    // Place new orders based on type
    for (let i = 0; i < ordersToPlace; i++) {
      logger.info(
        `Placing new ${type} order at price ${priceLevels[i]} with quantity ${quantities[i]} for ${this.tegroConnector.marketSymbol}...`
      );
      await this.tegroConnector
        .placeOrder(type, priceLevels[i], quantities[i])
        .catch((err) =>
          logger.error(
            `Failed to place ${type} order at ${priceLevels[i]}:${quantities[i]} `,
            err
          )
        );
    }
  }

  async getBaseBalance() {
    const balance = await this.tegroConnector.getBalanceInFloat(
      this.tegroConnector.baseTokenAddress
    );

    return balance > this.maxBaseBalanceUtilization
      ? this.maxBaseBalanceUtilization
      : balance;
  }

  async getQuoteBalance() {
    const balance = await this.tegroConnector.getBalanceInFloat(
      this.tegroConnector.quoteTokenAddress
    );

    return balance > this.maxQuoteBalanceUtilization
      ? this.maxQuoteBalanceUtilization
      : balance;
  }

  async run() {
    await this.runMM();
  }

  async runMM() {
    logger.info("Starting market making...");

    const basePrice = await this.fetchCurrentPriceInPrecision();

    if (!basePrice) {
      logger.error("Failed to fetch price. Retrying after some time...");
      return;
    }
    logger.info(
      `Current price: ${basePrice} for ${this.tegroConnector.marketSymbol}`
    );
    let buyPriceLevels = this.calculatePriceLevels(
      basePrice,
      this.priceStepLevels,
      "buy"
    );
    let sellPriceLevels = this.calculatePriceLevels(
      basePrice,
      this.priceStepLevels,
      "sell"
    );

    let quoteBalance = await this.getQuoteBalance();
    let baseBalance = await this.getBaseBalance();
    logger.info(
      `Base balance: ${baseBalance} for token ${this.tegroConnector.baseTokenAddress}`
    );
    logger.info(
      `Quote balance: ${quoteBalance} for token ${this.tegroConnector.quoteTokenAddress}`
    );

    // baseBalance = baseBalance.toFixed(4); //To help with too many decimals error in Ethers library

    quoteBalance *= 10 ** this.tegroConnector.quoteDecimals;
    baseBalance *= 10 ** this.tegroConnector.baseDecimals;

    const buyQuantities = this.calculateQuantities(
      buyPriceLevels,
      quoteBalance,
      this.walletAllocation
    );
    const sellQuantities = this.calculateSellQuantities(
      sellPriceLevels,
      baseBalance,
      this.walletAllocation
    );

    buyPriceLevels = await this.cancelOrders(buyPriceLevels, "buy");
    sellPriceLevels = await this.cancelOrders(sellPriceLevels, "sell");

    logger.info(`Buy price levels:  ${JSON.stringify(buyPriceLevels)}`);
    logger.info(`Sell price levels: ${JSON.stringify(sellPriceLevels)}`);
    logger.info(`buyQuantities  ${buyQuantities}`);
    console.log(`sellQuantities ${sellQuantities}`);
    await this.manageOrders(buyPriceLevels, buyQuantities, "buy");
    await this.manageOrders(sellPriceLevels, sellQuantities, "sell");

    setTimeout(() => this.runMM(), this.orderRefreshFrequency);
  }
}

module.exports = GeckoMarketMaking;