const axios = require("axios");
const router = require("express").Router();
const FormData = require('form-data');
router.get("/sso", (req,res) => {
    try{
        res.statusCode = 200;
        const config = req.app.get('app_config');
        const oauthEndPoint = process.env.EVE_API_OAUTH_END_POINT + 'authorize?';
        const parameters = new URLSearchParams({
            response_type:"code",
            redirect_uri:"http://" + req.headers.host + "/auth/sso-callback",
            client_id:config.client_id,
            scope:config.scope,
            state:process.env.EVE_API_CLIENT_NAME
        });
        console.log("http://" + req.headers.host + "/auth/sso-callback");

        return res.redirect(oauthEndPoint + parameters);
    }
    catch(error){
        console.log(error);
    }

})

router.get("/sso-callback", (req,res) => {
    try{
        const config = req.app.get('app_config');
        if (req.query.code && req.query.state === process.env.EVE_API_CLIENT_NAME){
            let formData = new URLSearchParams();
            formData.append('code', req.query.code);
            formData.append('grant_type', 'authorization_code');
            const options = {
                method: 'POST',
                headers: {
                    'Authorization' : 'Basic ' + btoa(config.client_id + ':' + config.secret_key),
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Host': 'login.eveonline.com',
                    'Cache-Control': 'no-store',
                    'Pragma': 'no-cache',
                },
                data: {
                    code: req.query.code,
                    'grant_type': 'authorization_code'
                },
                url: (process.env.EVE_API_OAUTH_END_POINT + 'token'),
            };
            return axios(options).then((response) => {
                if (response.status === 200){
                    const access = response.data;
                    //verify token

                }
            }).catch((error) => {
                res.statusCode = 500;
                console.log(error.response.data);
                res.send({status: res.statusCode, error: 'Cannot POST to Basic authentication', message: 'something went wrong with the POST sent to basic authentication :(', details: error});
                return error;
            });
        }
        else{
            res.statusCode = 500;
            res.send({status: res.statusCode, error: 'Wrong API Callback', message: 'something went wrong with the API Callback'});
            return res.redirect("http://localhost:3000");
        }
    }
    catch(error){
        console.log(error);
    }

})

module.exports = router