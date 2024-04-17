const BASE_URL = "https://api.pre-dev.tegro.com";
const CHAIN_ID = 80002;
const verifyingContract = "0x67329295F50e6aB7B90d9a2Dccb7E036cf39D9D6";

const CREATE_ORDER_URL = `${BASE_URL}/api/v1/trading/market/orders/place`;

const GENERATE_ORDER_URL = `${BASE_URL}/api/v1/trading/market/orders/typedData/generate`;

const CANCEL_ALL_ORDERS_URL = `${BASE_URL}/market/orders/cancelAll`;

function GetUserOrdersUrl(userAddress) {
    return `${BASE_URL}/api/v1/trading/market/orders/user?chain_id=${CHAIN_ID}&user_address=${userAddress.toLowerCase()}`;
}

function GetActiveOrdersUrl(userAddress) {
    return `${BASE_URL}/api/v1/trading/market/orders/user/${userAddress}?chain_id=${CHAIN_ID}&statuses=active`;
}

function GetMarketInfoUrl(marketSymbol) {
    return `${BASE_URL}/api/v1/exchange/${CHAIN_ID}/market/list?symbol=${marketSymbol}`;
}

function GetMarketDepthUrl(marketSymbol) {
    return `${BASE_URL}/api/v1/trading/market/orderbook/depth?chain_id=${CHAIN_ID}&market_symbol=${marketSymbol}`;
}

function GetUserOrdersURL(wallet) {
    return `${BASE_URL}/api/v1/trading/market/orders/user?chain_id=${CHAIN_ID}&user_address=${wallet.address.toLowerCase()}`;
}

const DOMAIN = {
  name: "TegroDEX",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: verifyingContract,
};

const TYPE = {
    Order: [
        {
            "name": "baseToken",
            "type": "address"
        },
        {
            "name": "quoteToken",
            "type": "address"
        },
        {
            "name": "price",
            "type": "uint256"
        },
        {
            "name": "totalQuantity",
            "type": "uint256"
        },
        {
            "name": "isBuy",
            "type": "bool"
        },
        {
            "name": "salt",
            "type": "uint256"
        },
        {
            "name": "maker",
            "type": "address"
        },
        {
            "name": "expiryTimestamp",
            "type": "uint256"
        }
    ]
}


module.exports = {
    BASE_URL,
    CREATE_ORDER_URL,
    GENERATE_ORDER_URL,
    CANCEL_ALL_ORDERS_URL,
    DOMAIN,
    TYPE,
    GetUserOrdersUrl,
    GetActiveOrdersUrl,
    GetMarketInfoUrl,
    GetUserOrdersURL,
    GetMarketDepthUrl,
    CHAIN_ID
};