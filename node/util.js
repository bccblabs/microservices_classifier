var _ = require ('underscore-node'),
    fs = require ('fs'),
	mongo = require ('mongodb')

var connect_mongo = function (callback) {
    var mongo_client = mongo.MongoClient
    server = mongo.Server
    client = new mongo_client (new server ('localhost', 27017), {native_parser: true})
    client.open (function (err, mongoClient) {
        if (err)
            callback (err, null)
        else
            callback (null, mongoClient)
    })
}

var decode_base64_image = function (dataString) {
	var response = {};
	response.data = new Buffer(dataString, 'base64');
	return response;
}

var store_to_mongo = function (socket_client, data, callback) {
    connect_mongo (function (err, mongoClient) {
        mongoClient.db ('hdd')
                   .collection ('classifications')
                   .insert (_.omit (data, 'imageData'), function (err, docs) {
                        if (err) {
                            socket_client.emit ('err', 'cannot store to mongo')
                            callback (err, null)
                        } else {
                            socket_client.emit ('progress', 'object persisted in db')
                            callback (null, {object_id: docs[0]._id})
                        }
                   })
	})
}

var store_to_disk = function (socket_client, data, callback, temp) {
	var tmp_file_path = 'hdd_uploads/',
		image_buffer = decode_base64_image (data.imageData)
        temp.open (tmp_file_path, function (err, info) {
            if (!err) {
                fs.write (info.fd, image_buffer.data, function (err) {
			if (err) callback (err)
			fs.close (info.fd, function (err) {
			    if (err) {
				client.emit ('err', 'cannot store to server')
				callback (err)                                
			    } else {
				client.emit ('progress', 'stored_on_server')
				callback (null, {tmp_path: info.path})
			    }
			})
		})
            } else {
	    	callback (err)
	    }
        })                
}


exports.connect_mongo = module.exports.connect_mongo = connect_mongo
exports.store_to_mongo = module.exports.store_to_mongo = store_to_mongo
exports.store_to_disk = module.exports.store_to_disk = store_to_disk
