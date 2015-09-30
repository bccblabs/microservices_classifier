var app = require ('express')(),
    server = require ('http').createServer(app).listen(8080),
    io = require ('socket.io').listen(server),
    fs = require ('fs'),
    bodyParser = require ('body-parser'),
    file_path = '/tmp/hdd_uploads',
    temp = require ('temp'),
    util = require ('./util')

app.use (bodyParser.urlencoded ({ extended: true }))
console.log ("Socket server listening on 8080")
temp.track()
console.log ("created mq connection")

mq_connection.on ('ready', function () {
    console.log (mq_host + " mq ready")
    clz_exchange = mq_connection.exchange ('clzX', {'type': 'fanout'})
    mq_connection.queue ('clz_pipeline', function (q) {
        q.bind ('#')
        q.subscribe (function (msg) {
            console.log (msg)
        })
    })
})


io.on ('connection', function (socket) {
	console.log ("connected " + socket)
})

io.sockets.on ('connection', function (client) {
		/* emit the register event, give client its id */
	client.emit ('register', client.id)
	console.log ("client connected: " + client.id)
	
	client.on ('clz_data', function (data) {
		console.log ("client " + client.id + " sent clz data ")
		console.dir (data)
        var rk_clz = 'hdd_image'
        clz_exchange.publish (rk_clz, data)
	})
	client.on ('image_s3_url', function (s3_url) {
		console.log ("client " + client.id + " sent url " + s3_url)
	})
	client.on ('disconnect', function () {
        	console.log ("client " + client.id + " disconnected")
    })
}) 

app.post ('/notify', function (req, res) {
    var client = io.sockets[req.body.socket_id]
    console.log (client.sockets)
    client.emit ('classification_result', req.body.classification_result)
    res.type ('text/plain')
    res.send ('Response Sent To Mobile socket[' + req.body.socket_id + ']')
})

app.get ('/classifications', function (req, res) {
    util.connect_mongo (function (err, mongoClient) {
    var clz_coll = mongoClient.db ('hdd').collection ('classifications')
        clz_coll.find ({'tester_id': req.params.tester_id})
                .limit(req.params.pagesize)
                .skip(req.params.pagenum * req.params.pagesize)
                .sort ({'date_created': -1})
                .toArray (function (err, results) {
                    if (err)
                        res.status (500)
                    else
                        res.json ({classifications: results})
                })
    })
})
