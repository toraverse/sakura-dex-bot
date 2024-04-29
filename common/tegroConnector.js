const { ethers, TypedDataEncoder, JsonRpcApiProvider, Typed } = require("ethers");
const axios = require('axios');
require('dotenv').config();
const constants = require('./constants');

class TegroConnector {

    marketSymbol;
    baseTokenAddress;
    quoteTokenAddress;
    baseDecimals;
    quoteDecimals;
    marketId;
    wallet;

    constructor(marketSymbol) {
        this.marketSymbol = marketSymbol;
        const providerUrl = process.env.PROVIDER_URL;
        const privateKey = process.env.PRIVATE_KEY;
        const provider = new ethers.JsonRpcProvider(providerUrl);
        this.wallet = new ethers.Wallet(privateKey, provider);
    }

    async initMarket() {
        try {
            console.log("Trying to fetch market details for " + this.marketSymbol);
            const marketInfoReq = await axios.get(constants.GetMarketInfoUrl(this.marketSymbol));
            const marketData = marketInfoReq.data.data[0];
            this.baseDecimals = marketData.base_decimal;
            this.quoteDecimals = marketData.quote_decimal;
            this.baseTokenAddress = marketData.base_contract_address;
            this.quoteTokenAddress = marketData.quote_contract_address;
            this.marketId = marketData.id;
            console.log("Market data fetch success");
            return marketData;
        } catch (error) {
            console.error("Error in initMarket:", error);
            throw error;
        }
        console.log("Successfully fetched market details for " + this.marketSymbol);
    }

    async signOrder(rawData) {
        try {
            return await this.wallet.signTypedData(constants.DOMAIN, constants.TYPE, rawData);
        } catch (error) {
            console.error("Error in signOrder:", error);
            throw error;
        }
    }

    async placeOrder(side, precisionPrice, precisionVolume) {

        if (precisionPrice <= 0 || precisionVolume <= 0) {
            console.log("Invalid order price or volume");
        }

        //precisionPrice = Math.floor(precisionPrice);
        //precisionVolume = Math.floor(precisionVolume);

        console.log(`Trying to place an order for: ${precisionPrice} ${precisionVolume}`);

        let rawData;

        if (side === "buy") {
            side = 1;
        } else if (side === "sell") {
            side = 0;
        } else {
            throw new Error(`Invalid order side: ${side}`);
        }

        rawData = {
            baseToken: this.baseTokenAddress,
            isBuy: side === 1 ? true : false,
            maker: this.wallet.address,
            price: precisionPrice.toString(),
            quoteToken: this.quoteTokenAddress,
            salt: this.generateSalt(),
            totalQuantity: precisionVolume.toString(),
            expiryTime: '0'
        };
        const signature = await this.signOrder(rawData);

        const orderHash = TypedDataEncoder.hash(constants.DOMAIN, constants.TYPE, rawData).toString();
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

        try {
            const createOrderRequest = await axios.post(constants.CREATE_ORDER_URL, limit_order);
            return createOrderRequest.data;
        } catch (error) {
            console.log(JSON.stringify(limit_order));
            //console.error("Error in placeOrder");
            throw error;
        }
    }

    generateSalt() {
        const currentTimeMillis = new Date().getTime();
        const randNum = Math.round(Math.random() * currentTimeMillis);
        return randNum.toString();
    }

    async cancelOrder(orderID) {
        const cancelOrderObject = {
            chain_id: constants.CHAIN_ID,
            id: orderID,
            signature: await this.wallet.signMessage(this.wallet.address.toLowerCase()),
        };
        try {
            await axios.post(constants.CANCEL_ORDER_URL, cancelOrderObject);
        }
        catch (error) {
            console.error("Error in cancelOrder:", error);
            throw error;
        }
    }

    async cancelAllOrders() {
        const cancelAllObject = {
            chain_id: constants.CHAIN_ID,
            signature: await this.wallet.signMessage(this.wallet.address.toLowerCase()),
            wallet_address: this.wallet.address.toLowerCase(),
        };
        try {
            await axios.post(constants.CANCEL_ALL_ORDERS_URL, cancelAllObject);
        } catch (error) {
            console.error("Error in cancelAllOrders:", error);
            throw error;
        }
    }

    async getAllOrders() {
        try {
            const myOrdersRequest = await axios.get(constants.GetUserOrdersURL(this.wallet.address));
            const filteredOrders = myOrdersRequest.data.filter(item => item.marketId === this.marketId);
            return filteredOrders;
        } catch (error) {
            console.error("Error in getAllOrders:", error);
            throw error;
        }
    }

    async getActiveOrders() {
        try {
            const activeOrdersRequest = await axios.get(constants.GetActiveOrdersUrl(this.wallet.address));
            const filteredOrders = activeOrdersRequest.data.filter(item => item.marketId === this.marketId);
            return filteredOrders;
        } catch (error) {
            console.error("Error in getActiveOrders:", error);
            throw error;
        }
    }

    filterActiveOrdersBySide(jsonArray, type) {
        return jsonArray.filter(item => item.side === type);
    }

    sortOrdersByPrice(jsonArray) {
        return jsonArray.sort((a, b) => a.price - b.price);
    }

    async getLastTradedPrice() {
        const marketInfoReq = await axios.get(constants.GetMarketInfoUrl(this.marketSymbol));
        const getLastTradedPrice = marketInfoReq.data.ticker.price;
        return getLastTradedPrice * (10 ** this.quoteDecimals);
    }

    async getDepth() {
        try {
            const depthRequest = await axios.get(constants.GetMarketDepthUrl(this.marketSymbol));
            return depthRequest.data;
        } catch (error) {
            console.error("Error in getDepth:", error);
        }
    }

    //Uses Tegro for balance
    async getBalance(tokenAddress) {
        const balance = await axios.get(constants.GetBalanceForToken(this.wallet.address, tokenAddress));
        return Number(balance.data.data);
    }

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
}

module.exports = TegroConnector;