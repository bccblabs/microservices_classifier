var app = require ('express').createServer(),
    io = require ('socker.io')(app),
    bodyParser = require ('body-parser')

app.use (bodyParser.urlencoded ({ extended: true }))
app.listen (80)

io.of('/stream_classify')
	.on ('connection', function (client) {
  	
   	})
	.on ('raw_image_data', function (data) {
		/* reads image as a buffer */
		
	})
	.on ('image_s3_url', function (url) {
	})
  
