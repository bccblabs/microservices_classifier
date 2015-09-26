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
