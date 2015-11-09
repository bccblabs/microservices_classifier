var app = require ('express')(),
    bodyParser = require ('body-parser')
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb'}));

var server = require ('http').createServer(app).listen(8080),
    io = require ('socket.io').listen(server),
    util = require ('./util'),
    _ = require ('underscore-node'),
    async = require ('async'),
    temp = require ('temp')


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
        process.exit()
    } else {
        console.log ("[## rabbitmq connected ##]")
        io.sockets.on ('connection', function (client) {
            client.emit ('register', client.id)

            client.on ('clz_data', function (data) {
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
    util.fetch_listings (   {
                                'compact_label': req.body.classification_result['top_1'].class_name.replace (/[^a-zA-Z0-9]/g, '').toLowerCase()
                            }, 
                            req.body.query, 
                            function (err, listings) {
                                if (err) {
                                    res.status(500).send ({'msg': 'server error'})
                                } else {
                                    res.status(201).send ('[app.js] sent listings to client ' + req.body.socket_id + ']')
                                    client.emit ('listings_results', _.flatten(_.pluck(listings, 'inventories')))
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
        cars_query = util.parse_car_query (req.body.car)
    console.log (listings_query, cars_query)
    util.fetch_listings (cars_query, listings_query, function (err, listings) {
        if (err) {
            res.status (500).json (err)
        } else {
            var listings_data = {
                'cars': _.flatten(_.pluck(listings, 'inventories'))
            }
            console.dir (listings_data)
            res.status (201).json (listings_data)
        }
    })
})
