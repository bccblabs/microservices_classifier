var amqp = require('amqplib/callback_api'),
	channel = "",
    hdd_exchange = 'hdd',
    channel_opts = {durable: false},
    util = require ('../util')

amqp.connect ('amqp://localhost:5672', function (err, conn) {
	if (err !== null) {
		console.log ("amqp conn error")
	}
	conn.createChannel (function(err, ch) {
		ch.assertExchange(hdd_exchange, 'topic', channel_opts)
	    ch.assertQueue('', {exclusive: true}, function(err, ok) {
      		if (err !== null) {
      			console.log ('queue error')	      			
      		} else {
				var queue = ok.queue
				function sub (err) {
					if (err !== null) {
						console.log ('subscribe queue error');						
					} else {
						ch.bindQueue(queue, hdd_exchange, 's3', {}, sub);
					}
				}
				ch.consume(queue, util.push_to_s3, {noAck: true}, function(err) {
						if (err)
							console.log ('bind queue err')
						else {
					        sub(null);
						}
				})
      		}
		})
	})
})
