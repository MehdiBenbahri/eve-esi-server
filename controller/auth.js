const db = require("../models");

async function createUser(user){
    return db["user"].create(user);
}

async function getUserByAccessToken(token){
    return db["user"].findOne({access_token: token});
}



module.exports.createUser = createUser;
module.exports.getUserByAccessToken = getUserByAccessToken;