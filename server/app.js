var app = require ('express')(),
    bodyParser = require ('body-parser')
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb'}));

var server = require ('http').createServer(app).listen(8080),
    io = require ('socket.io').listen(server),
    util = require ('./util'),
    _ = require ('underscore-node'),
    async = require ('async'),
    temp = require ('temp'),
    request = require ('request'),
    fs = require ('fs')

var conn_amqp_wrapper = function (callback, results) {
    var channel = "",
        car_exchange = 'cars',
        channel_opts = {durable: true},
        AMQP_HOST = process.env['RABBITMQ_PORT_5672_TCP_ADDR'] || 'localhost',
        AMQP_PORT = process.env['MICROSERVICESCLASSIFIER_RABBITMQ_1_PORT_5672_TCP_PORT'] || '5672',
        amqp_addr = 'amqp://' + AMQP_HOST + ':' + AMQP_PORT

    var conn_amqp = function (ex, ex_type, channel_opts, amqp_addr, callback) {
        require ('amqplib/callback_api').connect (amqp_addr, function (err, conn) {
            if (err) {
                console.error (err)
                console.log ("amqp conn error")
                callback (err, null)
            } else {
                conn.createChannel (function (err, ch) {
                    ch.assertExchange(ex, ex_type, channel_opts, function(err, ok) {
                        if (err) {
                            console.error ('amqp channel creation err')
                            console.error (err)
                            callback (err, null)
                        } else {
                            channel = ch
                            callback (null, channel)
                        }
                    })

                })

            }
        })
    }(car_exchange, 'topic', channel_opts, amqp_addr, callback)
}


console.log ("Socket server listening on 8080")
temp.track()

async.retry ({times: 10, interval: 1000}, conn_amqp_wrapper, function (err, channel) {
    if (err) {
        console.error (err)
        console.log ("amqp conn error, exiting")
        // process.exit()
    } else {
        console.log ("[## rabbitmq connected ##]")
        io.sockets.on ('connection', function (client) {
            console.log ('client ' + client.id + ' connected')
            client.on ('clz_data', function (data) {
                console.dir ("[* app] receiving data from client " + client.id)
                data = JSON.parse (data)
                var mongo_store_minitask = function (callback) {
                    util.store_to_mongo (data, callback)
                }

                var local_store_minitask = function (callback) {
                    util.store_to_disk (data, callback, temp)
                }

                async.parallel ([mongo_store_minitask, local_store_minitask], function (err, res) {
                    console.log ("init task returned")
                    if (err) {
                        console.log (err)
                        client.emit ('err', 'init_task_error')                    
                    } else {
                        var channel_msg = {
                            socket_id: client.id,
                            object_id: _.first(_.filter(_.pluck (res, 'object_id'), function (val) {return val!==null && val!== undefined})), 
                            file_path: _.first(_.filter(_.pluck (res, 'tmp_path'), function (val) {return val !== null && val !== undefined})),
                            api_query: _.first(_.filter(_.pluck (res, 'query'), function (val) {return val !== null && val !== undefined}))
                        }
                        channel.publish ('cars', 'classify', new Buffer (JSON.stringify(channel_msg)))
                        channel.publish ('cars', 's3', new Buffer (JSON.stringify(channel_msg)))
                    }
               })
            })

            client.on ('disconnect', function () {
                console.log ("client " + client.id + " disconnected")
            })
        }) 

    }
})

app.post ('/notify', function (req, res) {
    console.log ("received from classifier: " + req.body)
    console.log ('client id:' + req.body.socket_id)
    console.log ("classified label : " + req.body.classification_result['top_1'].class_name.replace (/[^a-zA-Z0-9]/g, '').toLowerCase())
    var client = io.sockets.connected[req.body.socket_id],
        top_n = 1,
        pagesize = 20
    if (req.body.classification_result.top_1.prob < 0.3) {
        top_n = 3
        pagesize = 5        
    }

    console.log (JSON.stringify (req.body, null, 2))
    var request_opts = {
        'method': 'POST',
        'url': 'http://localhost:8080/listings',
        'headers': {'content-type': 'application/json'},
        'json': true,
        'body': {
            'api': {
                'zipcode': 92612,
                'pagenum': 1,
                'pagesize': pagesize,
                'radius': 100,
            },
            'car': {
                'labels': _.pluck (req.body.classification_result.top_5.slice (0, top_n), 'class_name')
            }
        }
    }
    request( request_opts, function (err, response, body) {
        if (err || response.statusCode != 201) {
            console.error (err)
            client.emit ('listings_error', JSON.stringify (err))
            res.status (500).json (err)            
        } else {
            client.emit ('listings', JSON.stringify (body))
            res.status (201).json ({'message': 'listings emitted'})
        }
    })
})

app.get ('/vehicle_info', function (req, res) {
    if (req.hasOwnProperty ('query') && req.query.hasOwnProperty ('styleId')) {
        var styleId = parseInt (req.query.styleId)
        util.connect_mongo (function (err, mongoClient) {
            mongoClient.db('trims').collection('car_data')
                                    .findOne ({'styleId': styleId}, function (err, doc) {
                if (err) {
                    res.status (500).send ({'msg': 'server error'})
                }
                res.status (200).json (_.omit(doc, '_id'))
            })
        })
    }
})

app.post ('/listings', function (req, res) {
    var listings_query = util.parse_listings_query (req.body.api),
        cars_query = util.parse_car_query (req.body.car, req.body.min_price, req.body.max_price, req.body.sortBy)
    console.log ('[* server] app query:')
    console.dir (JSON.stringify(req.body))
    this.res = res
    this.body = req.body
    util.fetch_listings (cars_query, listings_query, util.listings_request_callback.bind (this))
})


app.post ('/classifyCar', function (req, res) {
    var tmp_file_path = '',
        data = req.body
        temp.open (tmp_file_path, function (err, info) {
            if (!err) {
                fs.writeFile (info.path, data.imageData, 'base64', function (err) {
                    if (err) {
                        callback (err)
                    } else {
                        fs.close (info.fd, function (err) {
                            if (err) {
                                console.error (err)
                            } else {
                                console.log ("[* store task] file written")
                                var request_opts = {
                                    url: 'http://0.0.0.0:5000/classify',
                                    method: "GET",
                                    followRedirect: true,
                                    qs: {
                                        image_path: (info.path).replace ('/tmp/', '')
                                    }
                                }
                                request (request_opts, function (err, clz_res, clz_body) {
                                    if (err)
                                        res.status (500).json (clz_body)
                                    else {
                                        var top_n = 1,
                                            pagesize = 20
                                        console.dir (clz_body)
                                        if (clz_body.top_1.prob < 0.3) {
                                            top_n = 3
                                            pagesize = 5        
                                        }

                                        var listings_opts = {
                                            'method': 'POST',
                                            'url': 'http://localhost:8080/listings',
                                            'headers': {'content-type': 'application/json'},
                                            'json': true,
                                            'body': {
                                                'api': {
                                                    'zipcode': 92612,
                                                    'pagenum': 1,
                                                    'pagesize': pagesize,
                                                    'radius': 100,
                                                },
                                                'car': {
                                                    'labels': _.pluck (clz_body.top_5.slice (0, top_n), 'class_name')
                                                }
                                            }
                                        }
                                        request( listings_opts, function (err, response, body) {
                                            if (err || response.statusCode != 201) {
                                                console.error (err)
                                                client.emit ('listings_error', JSON.stringify (err))
                                                res.status (500).json (err)            
                                            } else {
                                                console.log (JSON.stringify (body, null, 2))
                                                res.status (201).json (body)
                                            }
                                        })
                                    }
                                })
                            }
                        })
                    }
                })
            } else {
                callback (err)
            }
        })                
})

app.post ('/dealerListings', function (req, res) {
    this.res = res
    this.body = req.body
    util.fetch_listings_by_franchise_id (req.body, util.franchise_listings_callback.bind (this))
})
