const BASE_URL = process.env.BASE_URL;
const CHAIN_ID = parseInt(process.env.CHAIN_ID);
const verifyingContract = process.env.verifyingContract;

const GECKO_TERMINAL_BASE_URL = process.env.GECKO_TERMINAL_BASE_URL;

const CREATE_ORDER_URL = `${BASE_URL}/api/v1/trading/market/orders/place`;

const GENERATE_ORDER_URL = `${BASE_URL}/api/v1/trading/market/orders/typedData/generate`;

const CANCEL_ALL_ORDERS_URL = `${BASE_URL}/api/v1/trading/market/orders/cancel-all`;

const CANCEL_ORDER_URL = `${BASE_URL}/api/v1/trading/market/orders/cancel`;


function GetBalanceForToken(userAddress, tokenAddress) {
    return `${BASE_URL}/api/v1/accounts/${CHAIN_ID}/balances/${userAddress.toLowerCase()}/${tokenAddress}`;
}

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
            "name": "expiryTime",
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
    CANCEL_ORDER_URL,
    TYPE,
    GetUserOrdersUrl,
    GetActiveOrdersUrl,
    GetMarketInfoUrl,
    GetMarketDepthUrl,
    GetBalanceForToken,
    CHAIN_ID
};