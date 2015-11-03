var amqp = require('amqplib/callback_api'),
    aws = require ('aws-sdk'),    
	channel = "",
    car_exchange = 'cars',
    channel_opts = {durable: true}

var	connect_mongo = function (callback) {
    var mongo_client = require ('mongodb').MongoClient
    client = new mongo_client (new server ('localhost', 27017), {native_parser: true})
    client.open (function (err, mongoClient) {
        if (err)
            callback (err, null)
        else
            callback (null, mongoClient)
    })
}

var	push_to_s3 = function (msg) {
	    var s3 = new aws.S3(),
		s3_msg = JSON.parse (msg.content)
	        tmp_file_str = s3_msg.file_path.split('/'),
	        file_name = tmp_file_str[tmp_file_str.length -1] + '.png',
	        params = { 
	            ACL: 'public-read',
	            Bucket: 'hddimages', 
	            Key: file_name,
	            Body: require('fs').readFileSync (s3_msg.file_path)
	        }
	    s3.putObject(params, function (err, data) {
		if (err) {
			console.log (err)
		} else {
	        	connect_mongo (function (err, mongoClient) {
			if (err) console.log (err)
	            	mongoClient.db ('hdd')
	                       .collection ('classifications')
	                       .update ({'_id': require('mongodb').ObjectID(s3_msg.object_id)},
	                                { $set: {'image_url': 'https://s3-us-west-2.amazonaws.com/hddimages/' + file_name}},
	                                function (err, result) {
	                                    mongoClient.close()
	                                    if (err)
	                                        console.log (err)
	                                    else
	                                        console.log ('file saved to s3')
	                                })
	        	})
		}
	    })
}

amqp.connect ('amqp://localhost:5672', function (err, conn) {
	if (err) {
		console.log ("amqp conn error")
		process.exit()
	} else {
		conn.createChannel (function(err, ch) {
			ch.assertExchange(car_exchange, 'topic', channel_opts)
		    ch.assertQueue('', {exclusive: false}, function(err, ok) {
	      		if (err !== null) {
	      			console.log ('queue error')	      			
	      		} else {
					var queue = ok.queue
					function sub (err) {
						if (err !== null) {
							console.log ('subscribe queue error');						
						} else {
							ch.bindQueue(queue, car_exchange, 's3', {}, sub);
						}
					}
					ch.consume(queue, push_to_s3, {noAck: false}, function(err) {
				        sub(err);
					})
	      		}
			})
		})		
	}

})


