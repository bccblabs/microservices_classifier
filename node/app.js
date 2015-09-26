var app = require ('express')(),
    server = require ('http').createServer(app),
    io = require ('socker.io')(server),
    bodyParser = require ('body-parser')

app.use (bodyParser.urlencoded ({ extended: true }))
server.listen (80)

io.of('/stream_classify')
	.on ('connection', function (socket) {
		socket.on ('raw_image_data', function (id, msg) {
		/* emit the register event, give client its id */
			client.emit ('register', id)  	
		})
		.on ('raw_image_data', function (id, data) {
			/* reads image as a buffer */
			/* try pass the original id for testing */
			
		})
		.on ('image_s3_url', function (id, url) {
		})
		.on ('disconnect', function () {})
 	}) 

app.post ('/notify', function (req, res) {
    var client = io.sockets[req.body.socket_id]
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
