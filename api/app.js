var app = require ('express')(),
    bodyParser = require ('body-parser')
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded());

var server = require ('http').createServer(app).listen(8080),
    io = require ('socket.io').listen(server),
    util = require ('./util'),
    amqp = require ('amqplib/callback_api'),
    _ = require ('underscore-node'),
    async = require ('async'),
    temp = require ('temp')

console.log ("Socket server listening on 8080")
temp.track()

var channel = "",
    hdd_exchange = 'hdd',
    channel_opts = {durable: true}

amqp.connect ('amqp://localhost:5672', function (err, conn) {
    if (err) {
        console.log ("amqp conn error")
    } else {
    	conn.createChannel (function (err, ch) {
        	ch.assertExchange(hdd_exchange, 'topic', channel_opts, function(err, ok) {
        		if (err) {
            		console.log ('amqp channel creation err')
        		} else {
        			channel = ch
        		}
    		})

    	})

    }
})

io.sockets.on ('connection', function (client) {
	client.emit ('register', client.id)
	console.log ("client connected: " + client.id)
	client.on ('clz_data', function (data) {
		console.log ("client " + client.id + " sent clz data ")
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
                    file_path: _.first(_.filter(_.pluck (res, 'tmp_path'), function (val) {return val !== null && val !== undefined}))
                }
                channel.publish (hdd_exchange, 'classify', new Buffer (JSON.stringify(channel_msg)))
                channel.publish (hdd_exchange, 's3', new Buffer (JSON.stringify(channel_msg)))
            }
       })
    })
	client.on ('disconnect', function () {
        console.log ("client " + client.id + " disconnected")
    })
}) 

app.post ('/classify', function (req, res) {
    var data = JSON.parse (req.body),
        mongo_store_minitask = function (callback) {
            util.store_to_mongo (data, callback)
        },
        local_store_minitask = function (callback) {
            util.store_to_disk (data, callback, temp)
        }

    async.parallel ([mongo_store_minitask, local_store_minitask], function (err, res) {
        if (err) {
            console.log (err)
            client.emit ('err', 'init_task_error')                    
        } else {
            var channel_msg = {
                socket_id: client.id,
                object_id: _.first(_.filter(_.pluck (res, 'object_id'), function (val) {return val!==null && val!== undefined})), 
                file_path: _.first(_.filter(_.pluck (res, 'tmp_path'), function (val) {return val !== null && val !== undefined}))
            }
            channel.publish (hdd_exchange, 'classify', new Buffer (JSON.stringify(channel_msg)))
            channel.publish (hdd_exchange, 's3', new Buffer (JSON.stringify(channel_msg)))
        }
   })

})

app.post ('/notify', function (req, res) {
    util.write_classifier_result (req.body.classification_result, 
                                  req.body.object_id,
        function (err, result) {
            if (err) {
        		res.status(500).end()
            } else {
        		console.log ( "socket id: " + req.body.socket_id)
                var client = io.sockets.connected[req.body.socket_id]
                client.emit ('classification_result', req.body.classification_result)
                res.status(201).send ('[app.js] sent result to client ' + req.body.socket_id + ']')
            }
        })    
})

app.post ('/listings', function (req, res) {
    util.fetch_listings (req.body.label, req.body, function (err, result) {
        if (err)
            res.status (500).end()
        else
            res.json (result)
    })
})

app.post ('/classifications', function (req, res) {
    console.log (req.body)
    util.connect_mongo (function (err, mongoClient) {
        var clz_coll = mongoClient.db ('hdd').collection ('classifications'),
    	query_obj = {}
        clz_coll.find (query_obj)
                .limit(req.body.pageSize)
                .sort ({'date_created': -1})
                .toArray (function (err, results) {
        	    mongoClient.close()
                    if (err) {
            			console.log (err)
            			res.status (500).end()
        		    } else {
                        res.json ({samples: results})
                    }
		})
    })
})
