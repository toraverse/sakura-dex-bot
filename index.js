// const { ethers } = require("ethers");
// const axios = require('axios');
// require('dotenv').config();

// const dataType = {
//     Order: [
//         { name: 'salt', type: 'uint256' },
//         { name: 'makerAsset', type: 'address' },
//         { name: 'takerAsset', type: 'address' },
//         { name: 'maker', type: 'address' },
//         { name: 'receiver', type: 'address' },
//         { name: 'allowedSender', type: 'address' },
//         { name: 'makingAmount', type: 'uint256' },
//         { name: 'takingAmount', type: 'uint256' },
//         { name: 'offsets', type: 'uint256' },
//         { name: 'interactions', type: 'bytes' }
//     ]
// };

// const privateKey = process.env.PRIVATE_KEY;
// const providerUrl = process.env.MUMBAI_API_URL;
// const typedDataURL = "http://localhost:3001/v2/market/orders/typedData/generate";

// const provider = new ethers.providers.JsonRpcProvider(providerUrl);
// const wallet = new ethers.Wallet(privateKey, provider);

// const contractABI = [{ "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint8", "name": "version", "type": "uint8" }], "name": "Initialized", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "bytes", "name": "interactionData", "type": "bytes" }], "name": "fillOrderInteraction", "outputs": [{ "internalType": "uint256", "name": "offeredTakingAmount", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_tradingContract", "type": "address" }], "name": "initialize", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }], "name": "isTokenApproved", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "components": [{ "components": [{ "internalType": "uint256", "name": "salt", "type": "uint256" }, { "internalType": "address", "name": "makerAsset", "type": "address" }, { "internalType": "address", "name": "takerAsset", "type": "address" }, { "internalType": "address", "name": "maker", "type": "address" }, { "internalType": "address", "name": "receiver", "type": "address" }, { "internalType": "address", "name": "allowedSender", "type": "address" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "offsets", "type": "uint256" }, { "internalType": "bytes", "name": "interactions", "type": "bytes" }], "internalType": "struct ITradingContract.Order", "name": "orderDetails", "type": "tuple" }, { "internalType": "bytes", "name": "signature", "type": "bytes" }, { "internalType": "bytes", "name": "interaction", "type": "bytes" }, { "internalType": "uint256", "name": "makingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "takingAmount", "type": "uint256" }, { "internalType": "uint256", "name": "thresholdAmount", "type": "uint256" }], "internalType": "struct TegroSettlement.OrderExecution[]", "name": "makerOrders", "type": "tuple[]" }], "name": "settleBatchOrders", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "tradingContract", "outputs": [{ "internalType": "contract ITradingContract", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }];
// const contractAddress = "0x530Ba6884f0761AA864699881b716B6A18F0fABa";

// async function main() {


//     const numberOfIterations = process.argv[2] ? parseInt(process.argv[2], 10) : 5; // Default to 5 if not provided

//     // Ensure the input is a valid number
//     if (isNaN(numberOfIterations)) {
//         console.error("Please provide a valid number for iterations.");
//         process.exit(1);
//     }

//     console.log("Using the account:", await wallet.getAddress());

//     const makerOrderArray = [];
//     const takerOrderArray = [];
//     for (let i = 0; i < numberOfIterations; i++) {
//         const rawMakerOrder = {
//             allowedSender: '0x0000000000000000000000000000000000000000',
//             maker: await wallet.getAddress(),
//             makerAsset: '0x216d17a5896b649f08c32bc759807a3092bf4fe2',
//             takerAsset: '0x4e0d0d07619f4b8464b9f303770569e1f491ad70',
//             makingAmount: '1000000',
//             offsets: '0',
//             interactions: '0x',
//             receiver: '0x0000000000000000000000000000000000000000',
//             salt: generateSalt(),
//             takingAmount: '1'
//         }

//         const rawTakerOrder = {
//             allowedSender: '0x0000000000000000000000000000000000000000',
//             maker: await wallet.getAddress(),
//             makerAsset: '0x4e0d0d07619f4b8464b9f303770569e1f491ad70',
//             takerAsset: '0x216d17a5896b649f08c32bc759807a3092bf4fe2',
//             makingAmount: '100000000',
//             offsets: '0',
//             interactions: '0x',
//             receiver: '0x0000000000000000000000000000000000000000',
//             salt: generateSalt(),
//             takingAmount: '1000000'
//         }

//         const takerOrder = {
//           chain_id: 80001,
//           wallet_address: await wallet.getAddress(),
//           market_symbol: "KRYPTONITE_USDT",
//           side: "sell",
//           price: 1,
//           amount: 1,
//         };

//         const onChainMakerOrder = await getOnChainOrder(takerOrder, rawMakerOrder, "0xe3c1a13e14c986ea363f9e83ddb6333c9d82f9aa000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000c0000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000002a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000009129ae358f0000000000000000000000004e0d0d07619f4b8464b9f303770569e1f491ad70000000000000000000000000216d17a5896b649f08c32bc759807a3092bf4fe2000000000000000000000000113128f65d830b5295cef847597f4655f3d8e47c000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005f5e10000000000000000000000000000000000000000000000000000000000000f42400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000014000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000041faa407180841884ec497481aa96a6058d26e38c9762f2a90108a598e320eec2b359db2090e40de02efb47d20033641283cd184239a1a7b9cb02503dec58ea4a21b000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000");
//         const onChainTakerOrder = await getOnChainOrder(takerOrder, rawTakerOrder, "0x");

//         const types = [
//             // Order struct
//             {
//                 components: [
//                     { type: 'uint256', name: 'salt' },
//                     { type: 'address', name: 'makerAsset' },
//                     { type: 'address', name: 'takerAsset' },
//                     { type: 'address', name: 'maker' },
//                     { type: 'address', name: 'receiver' },
//                     { type: 'address', name: 'allowedSender' },
//                     { type: 'uint256', name: 'makingAmount' },
//                     { type: 'uint256', name: 'takingAmount' },
//                     { type: 'uint256', name: 'offsets' },
//                     { type: 'bytes', name: 'interactions' }
//                 ],
//                 type: 'tuple',
//                 name: 'orderDetails'
//             },
//             { type: 'bytes', name: 'signature' },
//             { type: 'bytes', name: 'interaction' },
//             { type: 'uint256', name: 'makingAmount' },
//             { type: 'uint256', name: 'takingAmount' },
//             { type: 'uint256', name: 'thresholdAmount' }
//         ];

//         const values = [
//             {
//                 // Order struct values
//                 salt: onChainTakerOrder.orderDetails.salt,
//                 makerAsset: onChainTakerOrder.orderDetails.makerAsset,
//                 takerAsset: onChainTakerOrder.orderDetails.takerAsset,
//                 maker: onChainTakerOrder.orderDetails.maker,
//                 receiver: onChainTakerOrder.orderDetails.receiver,
//                 allowedSender: onChainTakerOrder.orderDetails.allowedSender,
//                 makingAmount: onChainTakerOrder.orderDetails.makingAmount,
//                 takingAmount: onChainTakerOrder.orderDetails.takingAmount,
//                 offsets: onChainTakerOrder.orderDetails.offsets,
//                 interactions: onChainTakerOrder.orderDetails.interactions
//             },
//             onChainTakerOrder.signature,
//             onChainTakerOrder.interaction,
//             onChainTakerOrder.makingAmount,
//             onChainTakerOrder.takingAmount,
//             onChainTakerOrder.thresholdAmount
//         ];
//         //const encodedData = ethers.utils.defaultAbiCoder.encode(types, values);
//         //onChainMakerOrder.interaction = "0xe3c1A13E14c986EA363F9e83ddB6333c9d82F9AA" + encodedData.slice(2);
//         //console.log(onChainMakerOrder);
//         //console.log(onChainTakerOrder);
//         //console.log(ethers.utils.defaultAbiCoder.decode(types,encodedData));

//         makerOrderArray.push(onChainMakerOrder);
//     }



//     const contract = new ethers.Contract(contractAddress, contractABI, wallet);

//     const transactionResponse = await contract.settleBatchOrders(makerOrderArray);
//     const receipt = await transactionResponse.wait();
//     console.log(transactionResponse.hash);
//     //console.log(transactionResponse.receipt.gasUsed);
// }

// async function getOnChainOrder(order, rawOrder, interaction) {
//     // Call the API
//     const orderRequest = await axios.post(typedDataURL, order);
//     const orderResult = orderRequest.data;

//     const { domain } = orderResult.data.sign_data;

//     // Sign the data using EIP-712
//     const signature = await wallet._signTypedData(domain, dataType, rawOrder);



//     // Parse the orderDetails JSON string
//     const orderDetailsParsed = rawOrder;

//     const makerOrder = {
//         orderDetails: orderDetailsParsed,
//         signature: signature,
//         interaction: interaction,
//         makingAmount: orderDetailsParsed.makingAmount,
//         takingAmount: 0,
//         thresholdAmount: orderDetailsParsed.takingAmount
//     };
//     return makerOrder;
// }

// function generateSalt() {
//     const currentTimeMillis = new Date().getTime();
//     const randNum = Math.round(Math.random() * currentTimeMillis);
//     return randNum.toString();
// }


// main()
//     .then(() => process.exit(0))
//     .catch(error => {
//         console.error(error);
//         process.exit(1);
//     });
