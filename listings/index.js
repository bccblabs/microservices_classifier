var amqp = require('amqplib/callback_api'),
    aws = require ('aws-sdk'),    
	channel = "",
    car_exchange = 'cars',
    channel_opts = {durable: true},

var	get_token = function (callback, results) {  
	    var edmunds_client_key="d442cka8a6mvgfnjcdt5fbns",
	        edmunds_client_secret="tVsB2tChr7wXqk47ZZMQneKq",
            OAuth2 = require ('oauth').OAuth2

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

var	fetch_edmunds_listings = function (request_opts, styleId, client_socket_id, callback) {
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
	            var returned_data = {
	                socket_id: client_socket_id,
	                listings: data.inventories
	            },
	                post_opts = {
	                url: 'http://localhost:8080/notifyListings',
	                method: 'POST',
	                body: returned_data,
	                json: true
	            },
	                received_vins = _.pick (data.inventories, 'vin')

	            request.post (post_opts, function (err, res, body) {
	                if (err)
	                    callback (err)
	                else
	                    callback (null, received_vins)

	            })
	        }
	    })
}

var	fetch_listings = function (msg) {
	    var query = JSON.parse (msg)
	        connect_mongo (function (err, mongoClient) {
	        mongoClient.db ('vehicle_data')
	            .collection ('trims')
	            .distinct ('styleId', car_query, function (err, styleIds) {
	                if (err) {
	                    console.log (err)                    
	                } else {
	                    var listing_tasks = []
	                    async.retry (3, get_token, function (err, access_token_) {
	                        if (err) {
	                            console.log (err)
	                        } else {
	                            var res_per_req = 5
	                            if (styleIds.length > 0) {
	                                res_per_req = query.car_query.pagesize / (styleIds.length)
	                                if (res_per_req < 5)
	                                    res_per_req = 5
	                            }
	                            var request_opts = {
	                                    method: "GET",
	                                    followRedirect: true,
	                                    qs: {
	                                        access_token: access_token_,
	                                        fmt: 'json',
	                                        view: 'basic',
	                                        zipcode: query.car_query.zipcode,
	                                        radius: query.car_query.radius,
	                                        pagenum: query.car_query.pagenum,
	                                        pagesize: res_per_req
	                                    }
	                            }
	                            _.each (styleIds, function (styleId) {
	                                var listing_worker = function (callback) {
	                                    fetch_edmunds_listings (request_opts, styleId, query.socket_id, callback)
	                                }.bind (this)
	                                listing_tasks.push (listing_worker)
	                            })

	                            async.parallelLimit (listing_tasks, 10, function (err, results) {
	                                mongoClient.db('user_info').collection ('listing_queries').insert (results, function (err, res) {
	                                    if (err)
	                                        console.log (err)
	                                    mongoClient.close()
	                                })
	                            })
	                        }
	                    })
	                }           
	            })
	    })
}

amqp.connect ('amqp://0.0.0.0:5672', function (err, conn) {
	if (err) {
		console.log ("amqp conn error")
		process.exit()
	} else {
		conn.createChannel (function(err, ch) {
			ch.assertExchange(car_exchange, 'topic', channel_opts)
			ch.assertQueue ('', {exclusive: false}, function (err, ok) {
	      		if (err !== null) {
	      			console.log ('queue error')	      			
	      		} else {
					var queue = ok.queue
					function sub (err) {
						if (err !== null) {
							console.log ('subscribe queue error');						
						} else {
							ch.bindQueue(queue, car_exchange, 'listings', {}, sub);
						}
					}
					ch.consume(queue, fetch_listings, {noAck: false}, function(err) {
				        sub(err);
					})
	      		}
			})
		})		
	}

})
