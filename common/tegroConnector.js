const {
  ethers,
  TypedDataEncoder,
  JsonRpcApiProvider,
  Typed,
} = require("ethers");
const axios = require("axios");
require("dotenv").config();
const constants = require("./constants");
const logger = require("../strats/lib");
const { stringify } = require("flatted");

class TegroConnector {
  marketSymbol;
  baseTokenAddress;
  quoteTokenAddress;
  baseDecimals;
  quoteDecimals;
  marketId;
  wallet;
  verifyingContract;
  basePrecision;
  quotePrecision;

  constructor(marketSymbol, privateKeyVariableName = "PRIVATE_KEY") {
    this.marketSymbol = marketSymbol;
    const privateKey = process.env[privateKeyVariableName];
    const provider = ethers.getDefaultProvider();
    this.wallet = new ethers.Wallet(privateKey, provider);
  }

  async initMarket() {
    //Get the verifying contract address
    try {
      console.log("constants.CHAIN_LIST_URL ", constants.CHAIN_LIST_URL);
      const chainList = await axios.get(constants.CHAIN_LIST_URL);

      const chainData = chainList.data;
      const chainInfo = chainData.filter(
        (item) => item.id === constants.CHAIN_ID
      );
      this.verifyingContract = chainInfo[0].exchange_contract;
    } catch (error) {
      logger.error("Error in initMarket for fetching chain infor :", error);
    }

    try {
      logger.info("Trying to fetch market details for " + this.marketSymbol);
      console.log(
        "constants.GetMarketInfoUrl(this.marketSymbol) ",
        constants.GetMarketInfoUrl(this.marketSymbol)
      );
      const marketInfoReq = await axios.get(
        constants.GetMarketInfoUrl(this.marketSymbol)
      );
      // console.log('marketInfoReq')
      const marketData = marketInfoReq.data[0]; // fix this.. change it to 0th index
      console.log("marketData ", marketData);
      this.baseDecimals = marketData.base_decimal;
      this.quoteDecimals = marketData.quote_decimal;
      this.baseTokenAddress = marketData.base_contract_address;
      this.quoteTokenAddress = marketData.quote_contract_address;
      this.marketId = marketData.id;
      this.basePrecision = marketData.base_precision;
      this.quotePrecision = marketData.quote_precision;
      logger.info("Market data fetch success");
      return marketData;
    } catch (error) {
      logger.error(`Error in initMarket : ${error}`);
    }
    logger.info("Successfully fetched market details for " + this.marketSymbol);
  }

  getDomain() {
    const domain = {
      name: "TegroDEX",
      version: "1",
      chainId: constants.CHAIN_ID,
      verifyingContract: this.verifyingContract,
    };

    return domain;
  }

  async signOrder(rawData, type) {
    try {
      return await this.wallet.signTypedData(this.getDomain(), type, rawData);
    } catch (error) {
      logger.error(`Error in signOrder : ${error}`);
    }
  }

  async placeOrder(side, precisionPrice, precisionVolume) {
    if (precisionPrice <= 0 || precisionVolume <= 0) {
      logger.info("Invalid order price or volume");
    }

    logger.info(
      `Trying to place a ${side} order for price ==> ${precisionPrice} and volume ==> ${precisionVolume} in ${this.marketSymbol}`
    );

    let rawData;

    if (side === "buy") {
      side = 1;
    } else if (side === "sell") {
      side = 0;
    } else {
      logger.error("Invalid order side: " + side);
      throw new Error(`Invalid order side: ${side}`);
    }

    console.log("precisionVolume ", precisionVolume.toString());
    console.log("precisionPrice ", precisionPrice.toString());

    rawData = {
      baseToken: this.baseTokenAddress,
      isBuy: side === 1 ? true : false,
      maker: this.wallet.address,
      price: precisionPrice.toString(),
      quoteToken: this.quoteTokenAddress,
      salt: this.generateSalt(),
      totalQuantity: precisionVolume.toString(),
      expiryTime: "0",
    };
    const signature = await this.signOrder(rawData, constants.TYPE);

    const orderHash = TypedDataEncoder.hash(
      this.getDomain(),
      constants.TYPE,
      rawData
    ).toString();
    const limit_order = {
      chain_id: constants.CHAIN_ID,
      base_asset: side == 1 ? this.quoteTokenAddress : this.baseTokenAddress,
      quote_asset: side == 1 ? this.baseTokenAddress : this.quoteTokenAddress,
      side: side,
      volume_precision: precisionVolume.toString(),
      price_precision: precisionPrice.toString(),
      order_hash: orderHash,
      raw_order_data: JSON.stringify(rawData),
      signature: signature,
      signed_order_type: "tegro",
      market_id: this.marketId,
      market_symbol: this.marketSymbol,
    };

    let createOrderRequest;
    try {
      logger.info("Trying to create order");
      createOrderRequest = await axios.post(
        constants.CREATE_ORDER_URL,
        limit_order
      );
      logger.info(`order request sent ${JSON.stringify(createOrderRequest)}`);
      //return createOrderRequest.response.data;
    } catch (error) {
      logger.error(
        `Error in creating order json: ${JSON.stringify(limit_order)}`
      );
      //   logger.info(`Order request sent: ${JSON.stringify(createOrderRequest)}`);
      //   logger.error(`Error in creating order here 1 :  ${error}`);
      //   logger.error(`Error in creating order message:  ${error.message}`);
      console.log(`error in creating order ===>  ${error}`);
    }
  }

  generateSalt() {
    const currentTimeMillis = new Date().getTime();
    const randNum = Math.round(Math.random() * currentTimeMillis);
    return randNum.toString();
  }

  async cancelOrder(orderID) {
    console.log("cancelling for order id ", orderID);
    let cancelOrderObjectSignObject = {
      orderIds: [orderID],
      user: this.wallet.address.toLowerCase(),
    };

    let signature = await this.signOrder(
      cancelOrderObjectSignObject,
      constants.CANCEL_ORDER_TYPE
    );

    const cancelOrderObject = {
      order_ids: [orderID],
      user_address: this.wallet.address.toLowerCase(),
      signature,
    };

    logger.info(`cancelOrderObject ${cancelOrderObject}`);

    try {
      await axios.post(constants.CANCEL_ORDER_URL, cancelOrderObject);
    } catch (error) {
      logger.error("Error in cancelOrder:", error);
    }
  }

  async cancelAllOrders() {
    const cancelAllObject = {
      chain_id: constants.CHAIN_ID,
      signature: await this.wallet.signMessage(
        this.wallet.address.toLowerCase()
      ),
      wallet_address: this.wallet.address.toLowerCase(),
    };
    try {
      await axios.post(constants.CANCEL_ALL_ORDERS_URL, cancelAllObject);
    } catch (error) {
      logger.error(`Error in cancelAllOrders : , ${error}`);
    }
  }

  async getAllOrders() {
    try {
      const myOrdersRequest = await axios.get(
        constants.GetUserOrdersURL(this.wallet.address)
      );
      const filteredOrders = myOrdersRequest.filter(
        (item) => item.market_id === this.marketId
      );
      return filteredOrders;
    } catch (error) {
      logger.error(`Error in getAllOrders :  ${error}`);
    }
  }

  async getActiveOrders() {
    try {
      const activeOrdersRequest = await axios.get(
        constants.GetActiveOrdersUrl(this.wallet.address)
      );
      // console.log("activeOrdersRequest ", activeOrdersRequest);
      // console.log("activeOrdersRequest.data ", activeOrdersRequest.data);
      console.log("this.marketId ", this.marketId);
      console.log("activeOrdersRequest.data ", activeOrdersRequest.data.length);
      // console.log("activeOrdersRequest.data ", JSON.stringify(activeOrdersRequest.data));
      const filteredOrders = activeOrdersRequest.data.filter(
        (item) => item.market_id === this.marketId
      );
      return filteredOrders;
    } catch (error) {
      logger.error(`Error in getActiveOrders : ${error}`);
    }
  }

  filterActiveOrdersBySide(jsonArray, type) {
    return jsonArray.filter((item) => item.side === type);
  }

  sortOrdersByPrice(jsonArray) {
    return jsonArray.sort((a, b) => a.price - b.price);
  }

  async getLastTradedPrice() {
    const marketInfoReq = await axios.get(
      constants.GetMarketInfoUrl(this.marketSymbol)
    );
    const getLastTradedPrice = marketInfoReq.data.ticker.price;
    return getLastTradedPrice * 10 ** this.quoteDecimals;
  }

  async getDepth() {
    try {
      const depthRequest = await axios.get(
        constants.GetMarketDepthUrl(this.marketSymbol)
      );
      return depthRequest.data;
    } catch (error) {
      logger.error(`Error in getDepth : ${error}`);
    }
  }

  //Uses Tegro for balance
  async getBalanceInFloat(tokenAddress) {
    const response = await axios.get(
      constants.GetBalanceForToken(this.wallet.address, tokenAddress)
    );

    return Number(response.data);
  }

  countOrderTypes(orders) {
    let buyCount = 0;
    let sellCount = 0;

    orders.forEach((order) => {
      if (order.side === "buy") {
        buyCount++;
      } else if (order.side === "sell") {
        sellCount++;
      }
    });

    return { buyCount, sellCount };
  }
}

module.exports = TegroConnector;
