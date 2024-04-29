const axios = require('axios');
const constants = require('./constants');
require('dotenv').config();

const baseUrl = process.env.GECKO_TERMINAL_BASE_URL;

const geckoTerminalLib = {
    async getPrice(chain, tokenAddress) {
        try {
            const url = baseUrl + "/networks/" + chain + "/tokens/" + tokenAddress;
            const response = await axios.get(url);
            if (response.data && response.data.data.attributes && response.data.data.attributes.price_usd) {
                return parseFloat(response.data.data.attributes.price_usd);
            } else {
                console.error('Price data is missing in the response');
            }
        } catch (error) {
            console.log('Failed to fetch price: ' + error);
        }
    }
};

module.exports = geckoTerminalLib;