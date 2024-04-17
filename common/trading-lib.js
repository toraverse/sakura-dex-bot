const { ethers } = require("ethers");
const axios = require('axios');
require('dotenv').config();
const constants = require('./constants');

const providerUrl = process.env.PROVIDER_URL;
const privateKey = process.env.PRIVATE_KEY;

let marketSymbol = "";
let baseTokenAddress = "";
let quoteTokenAddress = "";
let baseDecimals = 0;
let quoteDecimals = 0;

const provider = new ethers.JsonRpcProvider(providerUrl);
const wallet = new ethers.Wallet(privateKey, provider);

const tradingBotLib = {
    async initMarket(_marketSymbol) {
        marketSymbol = _marketSymbol;
        try {
            const marketInfoReq = await axios.get(constants.GetMarketInfoUrl(marketSymbol));
            
            console.log("marketInfoReq:", marketInfoReq.data);
            
            const marketData = marketInfoReq.data.data[0];

            console.log("marketData ", marketData);
            this.baseDecimals = marketData.base_decimal;
            this.quoteDecimals = marketData.quote_decimal;
            this.baseTokenAddress = marketData.base_contract_address;
            this.quoteTokenAddress = marketData.quote_contract_address;
            return marketData;
        } catch (error) {
            console.error("Error in initMarket:", error);
            throw error;
        }
    },

    async signOrder(rawData) {
        try {
            console.log(' wallet ', wallet);
            console.log("rawData ", rawData);
            return await wallet.signTypedData(constants.DOMAIN, constants.TYPE, rawData);
        } catch (error) {
            console.error("Error in signOrder:", error);
            throw error;
        }
    },

    async placeOrder(side, precisionPrice, precisionVolume) {
        console.log(`Trying to place an order for: ${precisionPrice} ${precisionVolume}`);

        if (precisionPrice <= 0 || precisionVolume <= 0) {
            console.log("Invalid order price or volume");
        }

        const realPrice = precisionPrice / (10 ** this.quoteDecimals);
        const realVolume = precisionVolume / (10 ** this.baseDecimals);

        let makingAmount, takingAmount, rawData;

        if (side === "buy") {
            makingAmount = Math.floor(precisionPrice * realVolume);
            takingAmount = precisionVolume;
        } else if (side === "sell") {
            takingAmount = Math.floor(precisionPrice * realVolume);
            makingAmount = precisionVolume;
        } else {
            throw new Error(`Invalid order side: ${side}`);
        }

        const generateRequest = {
            chain_id: constants.CHAIN_ID,
            wallet_address: wallet.address.toLowerCase(),
            market_symbol: marketSymbol,
            side: side === "buy" ? "buy" : "sell",
            price: realPrice,
            amount: realVolume,
        };

        console.log("generateRequest  ", generateRequest);

        const generateReponse = await axios.post(
          constants.GENERATE_ORDER_URL,
          generateRequest
        );

        console.log('response ', JSON.stringify(generateReponse.data))
        
        const data = generateReponse.data.data;
        const limit_order_from_data = data.limit_order;
        console.log("limit_order_from_data  ", limit_order_from_data);
        const raw_order_parsed = JSON.parse(limit_order_from_data.raw_order_data);
        const raw_order_data = {
          baseToken: raw_order_parsed.baseToken,
          quoteToken: raw_order_parsed.quoteToken,
          isBuy: side === "buy" ? true : false,
          price: limit_order_from_data.price_precision,
          totalQuantity: limit_order_from_data.volume_precision,
          salt: raw_order_parsed.salt,
          maker: wallet.address.toLowerCase(),
          expiryTimestamp: raw_order_parsed.expiryTimestamp
        };

        console.log("raw_order_data  ", raw_order_data);
        
        const user_order_data_signature = await this.signOrder(raw_order_data);

        console.log('signature : ',user_order_data_signature)

        marketId =
          limit_order_from_data.chain_id +
          "_" +
          raw_order_parsed.baseToken.toLowerCase() +
          "_" +
          raw_order_parsed.quoteToken.toLowerCase();

        const limit_order_request = {
          base_asset: limit_order_from_data.base_asset.toLowerCase(),
          quote_asset:
            limit_order_from_data.quote_asset.toLowerCase(),
          chain_id: limit_order_from_data.chain_id,
          market_symbol: limit_order_from_data.market_symbol,
          side: limit_order_from_data.side,
          volume_precision: limit_order_from_data.volume_precision,
          price_precision: limit_order_from_data.price_precision,
          raw_order_data: JSON.stringify(raw_order_data),
          signature: user_order_data_signature,
          order_hash: limit_order_from_data.order_hash,
          signed_order_type: "tegro",
          market_id: marketId,
        };

        console.log("limit_order_request ", limit_order_request);

        try {
            const createOrderRequest = await axios.post(
              constants.CREATE_ORDER_URL,
              limit_order_request
            );
            return createOrderRequest.data;
        } catch (error) {
            console.error("Error in placeOrder:", error);
            throw error;
        }
    },

    generateSalt() {
        const currentTimeMillis = new Date().getTime();
        const randNum = Math.round(Math.random() * currentTimeMillis);
        return randNum.toString();
    },

    async cancelAllOrders() {
        const cancelAllObject = {
            chain_id: constants.CHAIN_ID,
            signature: await wallet.signMessage(wallet.address.toLowerCase()),
            wallet: wallet.address.toLowerCase(),
        };
        try {
            await axios.post(constants.CANCEL_ALL_ORDERS_URL, cancelAllObject);
        } catch (error) {
            console.error("Error in cancelAllOrders:", error);
            throw error;
        }
    },

    async getAllOrders() {
        try {
            const myOrdersRequest = await axios.get(constants.GetUserOrdersURL(wallet.address));
            return myOrdersRequest.data;
        } catch (error) {
            console.error("Error in getAllOrders:", error);
            throw error;
        }
    },

    async getActiveOrders() {
        try {
            const activeOrdersRequest = await axios.get(constants.GetActiveOrdersUrl(wallet.address));
            return activeOrdersRequest.data;
        } catch (error) {
            console.error("Error in getActiveOrders:", error);
            throw error;
        }
    },

    filterActiveOrders(jsonArray) {
        return jsonArray.filter(item => item.status === "Active");
    },

    async getLastTradedPrice() {
        const marketInfoReq = await axios.get(constants.GetMarketInfoUrl(marketSymbol));
        const getLastTradedPrice = marketInfoReq.data.ticker.price;
        return getLastTradedPrice * (10 ** this.quoteDecimals);
    },

    async getDepth() {
        try {
            const depthRequest = await axios.get(constants.GetMarketDepthUrl(marketSymbol));
            return depthRequest.data;
        } catch (error) {
            console.error("Error in getDepth:", error);
        }
    },

    countOrderTypes(orders) {
        let buyCount = 0;
        let sellCount = 0;

        orders.forEach(order => {
            if (order.side === 'buy') {
                buyCount++;
            } else if (order.side === 'sell') {
                sellCount++;
            }
        });

        return { buyCount, sellCount };
    }

};

module.exports = tradingBotLib;