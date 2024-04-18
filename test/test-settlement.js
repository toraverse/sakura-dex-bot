const { ethers } = require("ethers");
require('dotenv').config();

const settlementAddress = "0xbC4A5cb535d8DF440Ef2788B066fF96b9ad47EF5";
const USDTAddress = "0xE5Ae73187d0fed71bda83089488736CAdcbf072d";
const KryptoniteAddress = "0x6464E14854D58FEb60E130873329d77fCD2d8eb7"
const PokeballsAddress = "0xEC8E3f97AF8d451e9D15AE09428cbd2A6931e0Ba";
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const domain = {
    name: 'Tegro',
    version: '5',
    chainId: 80001,
    verifyingContract: '0xa6bb5cfe9cc68e0affb0bb1785b6efdc2fe8d326'
};

const type = {
    Order: [
        { name: 'salt', type: 'uint256' },
        { name: 'makerAsset', type: 'address' },
        { name: 'takerAsset', type: 'address' },
        { name: 'maker', type: 'address' },
        { name: 'receiver', type: 'address' },
        { name: 'allowedSender', type: 'address' },
        { name: 'makingAmount', type: 'uint256' },
        { name: 'takingAmount', type: 'uint256' },
        { name: 'offsets', type: 'uint256' },
        { name: 'interactions', type: 'bytes' }
    ]
};

const orderExecution = {
    Order: [
        { name: 'orderDetails', type: type.Order },
        { name: 'interaction', type: 'bytes' },
        { name: 'makingAmount', type: 'uint256' },
        { name: 'takingAmount', type: 'uint256' },
        { name: 'signature', type: 'bytes' },
        { name: 'thresholdAmount', type: 'uint256' },
    ]
}

const ABI = [{ "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint8", "name": "version", "type": "uint8" }], "name": "Initialized", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "bytes", "name": "", "type": "bytes" }], "name": "fillOrderInteraction", "outputs": [{ "internalType": "uint256", "name": "offeredTakingAmount", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_tradingContract", "type": "address" }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "isTokenApproved", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "components": [{ "components": [{ "internalType": "uint256", "name": "salt", "type": "uint256" }, { "internalType": "address", "name": "makerAsset", "type": "address" }, { "internalType": "address", "name": "takerAsset", "type": "address" }, { "internalType": "address", "name": "maker", "type": "address" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address", "name": "allowedSender", "type": "address" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "offsets", "type": "uint256" }, { "internalType": "bytes", "name": "interactions", "type": "bytes" }], "internalType": "struct ITradingContract.Order", "name": "orderDetails", "type": "tuple" }, { "internalType": "bytes", "name": "signature", "type": "bytes" }, { "internalType": "bytes", "name": "interaction", "type": "bytes" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "thresholdAmount", "type": "uint256" }], "internalType": "struct TegroSettlement.OrderExecution[]", "name": "makerOrders", "type": "tuple[]" }, { "components": [{ "components": [{ "internalType": "uint256", "name": "salt", "type": "uint256" }, { "internalType": "address", "name": "makerAsset", "type": "address" }, { "internalType": "address", "name": "takerAsset", "type": "address" }, { "internalType": "address", "name": "maker", "type": "address" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address", "name": "allowedSender", "type": "address" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "offsets", "type": "uint256" }, { "internalType": "bytes", "name": "interactions", "type": "bytes" }], "internalType": "struct ITradingContract.Order", "name": "orderDetails", "type": "tuple" }, { "internalType": "bytes", "name": "signature", "type": "bytes" }, { "internalType": "bytes", "name": "interaction", "type": "bytes" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "thresholdAmount", "type": "uint256" }], "internalType": "struct TegroSettlement.OrderExecution[]", "name": "takerOrders", "type": "tuple[]" }], "name": "settleBatchOrders", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "tradingContract", "outputs": [{ "internalType": "contract ITradingContract", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }]
const decodeABI = [{ "inputs": [{ "internalType": "address", "name": "_tradingContract", "type": "address" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "maker", "type": "address" }, { "indexed": true, "internalType": "address", "name": "taker", "type": "address" }, { "indexed": false, "internalType": "address", "name": "makerAsset", "type": "address" }, { "indexed": false, "internalType": "address", "name": "takerAsset", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "makerAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "takerAmount", "type": "uint256" }, { "indexed": false, "internalType": "bytes32", "name": "makerOrderHash", "type": "bytes32" }, { "indexed": false, "internalType": "bytes32", "name": "takerOrderHash", "type": "bytes32" }], "name": "TradeFailed", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "maker", "type": "address" }, { "indexed": true, "internalType": "address", "name": "taker", "type": "address" }, { "indexed": false, "internalType": "address", "name": "makerAsset", "type": "address" }, { "indexed": false, "internalType": "address", "name": "takerAsset", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "makerAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "takerAmount", "type": "uint256" }, { "indexed": false, "internalType": "bytes32", "name": "orderHash", "type": "bytes32" }], "name": "TradeSuccessful", "type": "event" }, { "inputs": [{ "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "DecodeOrderData", "outputs": [{ "components": [{ "components": [{ "internalType": "uint256", "name": "salt", "type": "uint256" }, { "internalType": "address", "name": "makerAsset", "type": "address" }, { "internalType": "address", "name": "takerAsset", "type": "address" }, { "internalType": "address", "name": "maker", "type": "address" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address", "name": "allowedSender", "type": "address" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "offsets", "type": "uint256" }, { "internalType": "bytes", "name": "interactions", "type": "bytes" }], "internalType": "struct ITradingContract.Order", "name": "orderDetails", "type": "tuple" }, { "internalType": "bytes", "name": "signature", "type": "bytes" }, { "internalType": "bytes", "name": "interaction", "type": "bytes" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "thresholdAmount", "type": "uint256" }], "internalType": "struct TegroInteractionSettler.OrderExecution", "name": "", "type": "tuple" }], "stateMutability": "pure", "type": "function" }, { "inputs": [{ "components": [{ "components": [{ "internalType": "uint256", "name": "salt", "type": "uint256" }, { "internalType": "address", "name": "makerAsset", "type": "address" }, { "internalType": "address", "name": "takerAsset", "type": "address" }, { "internalType": "address", "name": "maker", "type": "address" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address", "name": "allowedSender", "type": "address" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "offsets", "type": "uint256" }, { "internalType": "bytes", "name": "interactions", "type": "bytes" }], "internalType": "struct ITradingContract.Order", "name": "orderDetails", "type": "tuple" }, { "internalType": "bytes", "name": "signature", "type": "bytes" }, { "internalType": "bytes", "name": "interaction", "type": "bytes" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "thresholdAmount", "type": "uint256" }], "internalType": "struct TegroInteractionSettler.OrderExecution", "name": "order", "type": "tuple" }], "name": "EncodeOrderData", "outputs": [{ "internalType": "bytes", "name": "", "type": "bytes" }], "stateMutability": "pure", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "bytes", "name": "interactionData", "type": "bytes" }], "name": "fillOrderInteraction", "outputs": [{ "internalType": "uint256", "name": "offeredTakingAmount", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "isTokenApproved", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "components": [{ "components": [{ "internalType": "uint256", "name": "salt", "type": "uint256" }, { "internalType": "address", "name": "makerAsset", "type": "address" }, { "internalType": "address", "name": "takerAsset", "type": "address" }, { "internalType": "address", "name": "maker", "type": "address" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address", "name": "allowedSender", "type": "address" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "offsets", "type": "uint256" }, { "internalType": "bytes", "name": "interactions", "type": "bytes" }], "internalType": "struct ITradingContract.Order", "name": "orderDetails", "type": "tuple" }, { "internalType": "bytes", "name": "signature", "type": "bytes" }, { "internalType": "bytes", "name": "interaction", "type": "bytes" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "thresholdAmount", "type": "uint256" }], "internalType": "struct TegroInteractionSettler.OrderExecution[]", "name": "makerOrders", "type": "tuple[]" }, { "components": [{ "components": [{ "internalType": "uint256", "name": "salt", "type": "uint256" }, { "internalType": "address", "name": "makerAsset", "type": "address" }, { "internalType": "address", "name": "takerAsset", "type": "address" }, { "internalType": "address", "name": "maker", "type": "address" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address", "name": "allowedSender", "type": "address" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "offsets", "type": "uint256" }, { "internalType": "bytes", "name": "interactions", "type": "bytes" }], "internalType": "struct ITradingContract.Order", "name": "orderDetails", "type": "tuple" }, { "internalType": "bytes", "name": "signature", "type": "bytes" }, { "internalType": "bytes", "name": "interaction", "type": "bytes" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "thresholdAmount", "type": "uint256" }], "internalType": "struct TegroInteractionSettler.OrderExecution[]", "name": "takerOrders", "type": "tuple[]" }], "name": "settleBatchOrders", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "tradingContract", "outputs": [{ "internalType": "contract ITradingContract", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }];
const settlementContract = new ethers.Contract(settlementAddress, decodeABI, wallet);

async function main() {

    console.log(ethers.version);

    order = await placeOrder(USDTAddress, KryptoniteAddress, settlementAddress);
    //encode = ethers.AbiCoder.encode([orderExecution], order);
    //console.log("encode")
    //encodedOrderData = await EncodeOrderData(order);

    //console.log(encodedOrderData);

    //decodedOrderData = await settlementContract.DecodeOrderData(byteOrder);
    //console.log(await settlementContract.EncodeOrderData(_order));


    // buyOrder = []
    // sellOrder = []
    // for (i = 0; i < 1; i++) {
    //     buyOrder.push(await placeOrder(USDTAddress, KryptoniteAddress, settlementAddress));
    //     sellOrder.push(await placeOrder(KryptoniteAddress, USDTAddress, "0x"));
    // }

    // //console.log(buyOrder);
    // settler = await settlementContract.settleBatchOrders(buyOrder, sellOrder);
    // console.log(settler);
}


async function EncodeOrderData(order) {
    const encoded = await settlementContract.EncodeOrderData(order);
    return encoded;
}
async function placeOrder(_makerToken, _takerToken, _interaction) {

    rawOrder =
    {
        "allowedSender": "0x0000000000000000000000000000000000000000",
        "interactions": "0x",
        "maker": wallet.address,
        "makerAsset": _makerToken,
        "makingAmount": "10",
        "offsets": "0",
        "receiver": "0x0000000000000000000000000000000000000000",
        "salt": generateSalt(),
        "takerAsset": _takerToken,
        "takingAmount": 10
    }

    const signature = await wallet.signTypedData(domain, type, rawOrder);

    limit_order = {
        "orderDetails": rawOrder,
        "interaction": _interaction,
        "makingAmount": 10,
        "takingAmount": 0,
        "signature": signature,
        "thresholdAmount": "10"
    }

    return limit_order;

}


function generateSalt() {
    const currentTimeMillis = new Date().getTime();
    const randNum = Math.round(Math.random() * currentTimeMillis);
    return randNum.toString();
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });