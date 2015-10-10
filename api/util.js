var _ = require ('underscore-node'),
    fs = require ('fs'),
	mongo = require ('mongodb'),
    async = require ('async')



var connect_mongo = function (callback) {
    var mongo_client = mongo.MongoClient
    server = mongo.Server
    client = new mongo_client (new server ('localhost', 27017), {native_parser: true})
    client.open (function (err, mongoClient) {
        if (err)
            callback (err, null)
        else
            callback (null, mongoClient)
    })
}

var store_to_mongo = function (data, callback) {
    connect_mongo (function (err, mongoClient) {
        mongoClient.db ('hdd')
                   .collection ('classifications')
                   .insert (_.omit (data, 'imageData'), function (err, docs) {
                        mongoClient.close()
                        if (err) {
                            callback (err, null)
                        } else {
                            callback (null, {object_id: docs[0]._id})
                        }
                   })
	})
}

var store_to_disk = function (data, callback, temp) {
	var tmp_file_path = 'hdd_uploads/'
        temp.open (tmp_file_path, function (err, info) {
            if (!err) {
                fs.writeFile (info.path, data.imageData, 'base64', function (err) {
                    if (err) {
                        callback (err)
                    } else {
                        console.log ("file written")
                        fs.close (info.fd, function (err) {
                            if (err) {
                                client.emit ('err', 'cannot store to server')
                                callback (err)                                
                            } else {
                                client.emit ('progress', 'stored_on_server')
                                callback (null, {tmp_path: info.path})
                            }
                        })

                    }
                })
            } else {
    	    	callback (err)
    	    }
        })                
}

var write_classifier_result = function (classification_result, _id, callback) {
    connect_mongo (function (err, mongoClient) {
        mongoClient.db ('hdd')
               .collection ('classifications')
               .update ({'_id': require('mongodb').ObjectID(_id)},
                        { $set: {'classifications': classification_result} },
                        function (err, result) {
                            mongoClient.close()
                            console.log ('[util] result in db')
                            callback (err, result)
                        })
    })
}

var get_token = function (callback, results) {  
    var edmunds_client_key="d442cka8a6mvgfnjcdt5fbns",
        edmunds_client_secret="tVsB2tChr7wXqk47ZZMQneKq",
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
                                    time_since_token = new Date().getTime()
                                    last_access_token = access_token
                                    callback (null, access_token)
                                }
                                });
}

var fetch_edmunds_listings = function (request_opts, styleId, callback) {
    request_opts.url = 'https://api.edmunds.com/api/inventory/v2/styles/' + styleId
    request (request_opts, function (err, res, body) {
        if (err) {
            callback (err, null)
        } else if (res.statusCode != 200) {
            callback ({status: res.statusCode}, null)
        } else {
            try {
                var data = JSON.parse (body)
            } catch (e) {
                callback (err, null)
            }
            callback (null, data.inventories)
        }
    })
}

var fetch_listings = function (label_string, car_query, callback) {
    connect_mongo (function (err, mongoClient) {
        mongoClient.db ('vehicle_data')
            .collection ('trims')
            .distinct ('styleId', car_query, function (err, styleIds) {
                if (err)
                    callback (err, null)
                else {
                    var listing_tasks = []
                    async.retry (3, get_token, function (err, access_token_) {
                        if (err) {
                            callback (err, null)
                        } else {
                            var request_opts = {
                                    method: "GET",
                                    followRedirect: true,
                                    qs: {
                                        access_token: access_token_,
                                        fmt: 'json',
                                        view: 'basic',
                                        zipcode: car_query.zipcode,
                                        radius: car_query.radius,
                                        pagenum: car_query.pagenum,
                                        pagesize: 30/car_query.pagesize
                                    }
                            }
                            _.each (styleIds, function (styleId) {
                                var listing_worker = function (callback) {
                                    fetch_edmunds_listings (request_opts, styleId, callback)
                                }.bind (this)
                                listing_tasks.push (listing_worker)
                            })
                            async.parallelLimit (listing_tasks, 10, function (err, response) {
                                    var final_listing_array = 
                                            _.union(
                                                _.flatten (
                                                    _.map (_.flatten(response), 
                                                        function (res_array) {
                                                            if (res_array !== null && res_array !== undefined)
                                                                return response
                                                        }
                                                   )
                                                )
                                            ) 
                                    if (err)
                                        callback (err, null)
                                    else
                                        callback (null, final_listing_array)
                            })
                        }
                    })
                }
            })
    })
}

exports.connect_mongo = module.exports.connect_mongo = connect_mongo
exports.store_to_mongo = module.exports.store_to_mongo = store_to_mongo
exports.store_to_disk = module.exports.store_to_disk = store_to_disk
exports.write_classifier_result = module.exports.write_classifier_result = write_classifier_result
exports.fetch_listings = module.exports.fetch_listings = fetch_listings