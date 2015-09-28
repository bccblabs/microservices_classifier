var app = require ('express')(),
    server = require ('http').createServer(app),
    io = require ('socket.io')(server),
    fs = require ('fs'),
    bodyParser = require ('body-parser'),
    file_path = '/tmp/hdd_uploads',
    temp = require ('temp')


app.use (bodyParser.urlencoded ({ extended: true }))
server.listen (80)
temp.track()

//io.of('/stream_classify')
io.on ('connection', function (socket) {
    socket.on ('connection', function (id, msg) {
		/* emit the register event, give client its id */
        var socket_id = { socket_id: id}
		client.emit ('register', socket_id)  	
	})
	.on ('clz_data', function (id, data) {
        console.log (id + ": " + data)
			/* reads image as a buffer */
			/* try pass the original id for testing */
            // temp.open ({dir: file_path, suffix: '.jpg'}, function (err, info) {
            //     if (err)
            //         throw err;
            //     fs.write (info.fd, data)
            //     fs.close (info.fd, function (err) {
            //         if (err) throw err
            //         /* passing info.path on to the queue */
            //     })
            // })
	})
	.on ('image_s3_url', function (id, url) {
            /* passing s3.url directly onto the queue */
	})
	.on ('disconnect', function () {
        
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
