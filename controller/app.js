const db = require("../models");
const {get} = require("axios");

async function getApiConfig(){
    return await db["apiconfig"].findOne({"application_name" : process.env.EVE_API_CLIENT_NAME});
}

module.exports.getApiConfig = getApiConfig;