const axios = require('axios');
const constants = require('./constants');
const { handleNetworkError } = require('./utils'); // Import the handleNetworkError function
require('dotenv').config();

const baseUrl = constants.GECKO_TERMINAL_BASE_URL;

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
            handleNetworkError('Failed to fetch price: ' + error); // Use the handleNetworkError function to log errors
        }
    }
};

module.exports = geckoTerminalLib;
