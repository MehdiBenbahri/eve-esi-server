const express = require("express");
const authRoute = require("./routes/auth");
const db = require('./models/index');
require('dotenv').config();
const corsHeader = require("./middleware/cors");
const appController = require("./controller/app");

const app = express();

const conf = appController.getApiConfig();

conf.then((res) => {
    if (res.dataValues){
        app.set('app_config', res.dataValues);
    }
}).catch((res) => {
    console.log("Error while getting application config from database :(");
});

app.options("*",corsHeader);
app.use(corsHeader);
app.use("/auth",authRoute);
app.listen(8080,() => console.log("server lancé"));

module.export = app;