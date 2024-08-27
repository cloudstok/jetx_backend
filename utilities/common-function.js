const axios = require('axios');
const crypto = require('crypto');
const getLogger = require('../utilities/logger');
const failedLogger = getLogger('FailedThirdPartyAPICalls', 'jsonl');

function generateUUIDv7() {
    const timestamp = Date.now();
    const timeHex = timestamp.toString(16).padStart(12, '0');
    const randomBits = crypto.randomBytes(8).toString('hex').slice(2);
    const uuid = [
        timeHex.slice(0, 8),  
        timeHex.slice(8) + randomBits.slice(0, 4),  
        '7' + randomBits.slice(4, 7),  
        (parseInt(randomBits.slice(7, 8), 16) & 0x3f | 0x80).toString(16) + randomBits.slice(8, 12),  
        randomBits.slice(12) 
    ];

    return uuid.join('-');
}


const postDataToSourceForBet = async (data) => {
    try {
        return new Promise((resolve, reject) => {
            let { webhookData, token, socket_id, bet_id } = data;
            const url = process.env.service_base_url;
            let clientServerOptions = {
                method: 'POST',
                url: `${url}/service/operator/user/balance`,
                headers: {
                    token
                },
                data: webhookData,
                timeout: 1000 * 2
            };
            axios(clientServerOptions).then((result) => {
                resolve({ status: result.status, ...data })
            }).catch((err) => {
                console.log(`[ERR] received from upstream server`, err);
                let response = err.response ? err.response?.message : null;
                failedLogger.error(JSON.stringify({ req: { webhookData, token, socket_id, bet_id }, res: response}));
                reject({
                    response, token, socket_id, bet_id
                })
            })
        })
    } catch (err) {
        console.error(`[ERR] while posting data to source is:::`, err);
        failedLogger.error(JSON.stringify({ req: data, res: `Something went wrong`}));
        return false
    }
}


const prepareDataForWebhook = async(betObj, key, socket)=> {
    try{
        let {webhookData, lobby_id, bet_amount, game_id, bet_id, final_amount, socket_id, user_id} = betObj;
        let userIP = socket.handshake.address;
        if (socket.handshake.headers['x-forwarded-for']) {
            userIP = socket.handshake.headers['x-forwarded-for'].split(',')[0].trim();
        }
        let obj = {
            amount: Number(bet_amount).toFixed(2),
            txn_id: generateUUIDv7(),
            ip : userIP,
            game_id,
            user_id: decodeURIComponent(user_id)
        }
        switch (key) {
            case "DEBIT":
                obj.description = `${obj.amount} debited for JetX game for Round ${lobby_id}`;
                obj.bet_id = bet_id;
                obj.socket_id = socket_id;
                obj.txn_type = 0;
                break;
            case "CREDIT":
                obj.amount = final_amount;
                obj.txn_ref_id = webhookData.txn_id;
                obj.description = `${final_amount} credited for JetX game for Round ${lobby_id}`;
                obj.txn_type = 1;
                break;
            default:
                obj
        }
        return obj;
    } catch (err) {
        console.error(`[ERR] while trying to prepare data for webhook is::`, err);
        return false
    }
}

module.exports = { postDataToSourceForBet, prepareDataForWebhook, generateUUIDv7 }