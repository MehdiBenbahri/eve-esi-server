const cors = require('cors');

const whiteList = new Set(['http://localhost:3000'])

const corsOptions = {
    optionsSuccessStatus: 200,
    origin: function (origin, callback){
        if (!origin || whiteList.has(origin)){
            callback(null,true);
        }
        else{
            callback(new Error(`Blocked by CORS (${origin} is not in WhiteList)`));
        }
    },
    credential:true,
}

module.exports = cors(corsOptions);