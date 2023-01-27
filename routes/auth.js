const axios = require("axios");
const router = require("express").Router();
const auth = require('../controller/auth');
const jwtDecode = require("jwt-decode");
const moment = require("moment");
const {getUserByAccessToken} = require("../controller/auth");
router.get("/sso", (req, res) => {
    try {
        res.statusCode = 200;
        const config = req.app.get('app_config');
        const oauthEndPoint = process.env.EVE_API_OAUTH_END_POINT + 'authorize?';
        const parameters = new URLSearchParams({
            response_type: "code",
            redirect_uri: "http://" + req.headers.host + "/auth/sso-callback",
            client_id: config.client_id,
            scope: config.scope,
            state: process.env.EVE_API_CLIENT_NAME
        });

        return res.redirect(oauthEndPoint + parameters);
    } catch (error) {
        console.log(error);
    }

})

router.get("/sso-callback", (req, res) => {
    try {
        const config = req.app.get('app_config');
        if (req.query.code && req.query.state === process.env.EVE_API_CLIENT_NAME) {
            let formData = new URLSearchParams();
            formData.append('code', req.query.code);
            formData.append('grant_type', 'authorization_code');
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(config.client_id + ':' + config.secret_key),
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
                if (response.status === 200) {
                    const data = response.data;
                    //verify token
                    const tokenBody = jwtDecode(data.access_token);
                    const name = tokenBody.name;
                    const sub = tokenBody.sub;
                    const token_exp = tokenBody.exp;
                    const access_token = data.access_token;
                    const refresh_token = data.refresh_token;
                    auth.createUser({
                        name: name,
                        sub: parseInt(sub.replace('CHARACTER:EVE:', '')),
                        token_exp: moment.unix(token_exp).format('YYYY-MM-DD HH:mm:ss'),
                        access_token: access_token,
                        refresh_token: refresh_token
                    }).then(() => {
                        return res.redirect("http://localhost:3000/register?" + new URLSearchParams({
                            access_token: access_token,
                            name: name,
                            player_id: parseInt(sub.replace('CHARACTER:EVE:', ''))
                        }));
                    }).catch((res) => {
                        console.log(res);
                    });
                }
            }).catch((error) => {
                res.statusCode = 500;
                console.log(error.response.data);
                res.send({
                    status: res.statusCode,
                    error: 'Cannot POST to Basic authentication',
                    message: 'something went wrong with the POST sent to basic authentication :(',
                    details: error
                });
                return error;
            });
        } else {
            res.statusCode = 500;
            res.send({
                status: res.statusCode,
                error: 'Wrong API Callback',
                message: 'something went wrong with the API Callback'
            });
            return res.redirect("http://localhost:3000");
        }
    } catch (error) {
        console.log(error);
    }

})

router.get('/refresh-token', async (req, res) => {
    res.statusCode = 200;
    if (req.query.access_token) {
        const userData = await getUserByAccessToken(req.query.access_token);
        if (userData.dataValues) {
            const config = req.app.get('app_config');
            const data = userData.dataValues;
            let formData = new URLSearchParams();
            formData.append('refresh_token', data.refresh_token);
            formData.append('grant_type', 'refresh_token');
            formData.append('scope', config.scope);
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(config.client_id + ':' + config.secret_key),
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Host': 'login.eveonline.com',
                    'Cache-Control': 'no-store',
                    'Pragma': 'no-cache',
                },
                data: formData,
                url: (process.env.EVE_API_OAUTH_END_POINT + 'token'),
            };
            axios(options).then((response) => {
                if (response.status === 200){
                    if (response.data.access_token){
                        userData.access_token = response.data.access_token;
                        userData.save();
                        res.send({newToken: response.data.access_token});
                    }
                    else{
                        res.send({newToken: null});
                    }
                }
            });
        } else {
            res.send({newToken: null});
        }
    }
})

module.exports = router