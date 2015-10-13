var amqp = require('amqplib/callback_api'),
	channel = "",
    car_exchange = 'cars',
    channel_opts = {durable: true},
    util = require ('../util')

amqp.connect ('amqp://localhost:5672', function (err, conn) {
	if (err !== null) {
		console.log ("amqp conn error")
	}
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
				ch.consume(queue, util.push_to_s3, {noAck: false}, function(err) {
			        sub(err);
				})
      		}
		})
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
				ch.consume(queue, util.fetch_listings, {noAck: false}, function(err) {
			        sub(err);
				})
      		}
		})
	})
})
