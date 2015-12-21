var OAuth = require ('oauth'),
    OAuth2 = OAuth.OAuth2,
    request = require ('request')


var get_token = function (callback, results) {  
        var edmunds_client_key="d442cka8a6mvgfnjcdt5fbns",
            edmunds_client_secret="tVsB2tChr7wXqk47ZZMQneKq",
            OAuth2 = require ('oauth').OAuth2,
            oauth2 = new OAuth2 (   
                                    edmunds_client_key, 
                                    edmunds_client_secret,
                                    'https://api.edmunds.com/inventory/token',
                                    null, 'oauth/token', null
                                )

        oauth2.getOAuthAccessToken ('', 
                                    {'grant_type': 'client_credentials'}, 
                                    function (err, access_token, refresh_token, results) {
                                    if (err) {
                                        console.log (err)
                                        callback (err, null)
                                    } else {
                                        callback (null, access_token)
                                    }
                                    });
}

var fetch_franchise_listings = function (request_opts, franchise_id ,callback) {
    request_opts.url = 'https://api.edmunds.com/api/inventory/v2/franchises/' + franchise_id
    request (request_opts, function (err, res, body) {
        if (err) {
            callback (err, null)
        } else if (res.statusCode != 200) {
            callback ({status: res.statusCode}, null)
        } else {
            try {
                var data = JSON.parse (body)
                console.dir ("[franchise inventories count] " + data.inventoriesCount)
                callback (null, data)
            } catch (e) {
                console.log ("[exception caught ]" + e)
                callback (err, null)
            }
        }
    })
}

var fetch_edmunds_listings = function (request_opts, styleId, callback) {
    request_opts.url = 'https://api.edmunds.com/api/inventory/v2/styles/' + styleId
    request (request_opts, function (err, res, body) {
        if (err) {
            console.error (err)
            callback (null, {'count':0,'inventories': []})
        } else if (res.statusCode != 200) {
            callback (null, {'count':0,'inventories': []})
        } else {
            try {
                var data = JSON.parse (body)
                callback (null, data)
            } catch (e) {
                callback (null, {'count':0,'inventories': []})
            }
        }
    })
}

exports.fetch_edmunds_listings = module.exports.fetch_edmunds_listings = fetch_edmunds_listings
exports.fetch_franchise_listings = module.exports.fetch_franchise_listings = fetch_franchise_listings
exports.get_token = module.exports.get_token = get_token

