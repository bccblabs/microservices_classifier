var _ = require ('underscore-node'),
    fs = require ('fs'),
	mongo = require ('mongodb'),
    aws = require ('aws-sdk')

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

var store_to_mongo = function (socket_client, data, callback) {
    connect_mongo (function (err, mongoClient) {
        mongoClient.db ('hdd')
                   .collection ('classifications')
                   .insert (_.omit (data, 'imageData'), function (err, docs) {
                        mongoClient.close()
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
	var tmp_file_path = 'hdd_uploads/'
        temp.open (tmp_file_path, function (err, info) {
            if (!err) {
                fs.writeFile (info.path, data.imageData, 'base64', function (err) {
                    if (err) {
                        callback (err)
                    } else {
                        console.log ("file written")
                        fs.close (info.fd, function (err) {
                            if (err) {
                                client.emit ('err', 'cannot store to server')
                                callback (err)                                
                            } else {
                                client.emit ('progress', 'stored_on_server')
                                callback (null, {tmp_path: info.path})
                            }
                        })

                    }
                })
            } else {
    	    	callback (err)
    	    }
        })                
}

var push_to_s3 = function (msg) {
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

var write_classifier_result = function (classification_result, _id, callback) {
    connect_mongo (function (err, mongoClient) {
        mongoClient.db ('hdd')
               .collection ('classifications')
               .update ({'_id': require('mongodb').ObjectID(_id)},
                        { $set: {'classifications': classification_result} },
                        function (err, result) {
                            mongoClient.close()
                            console.log ('[util] result in db')
                            callback (err, result)
                        })
    })
}

exports.connect_mongo = module.exports.connect_mongo = connect_mongo
exports.store_to_mongo = module.exports.store_to_mongo = store_to_mongo
exports.store_to_disk = module.exports.store_to_disk = store_to_disk
exports.push_to_s3 = module.exports.push_to_s3 = push_to_s3
exports.write_classifier_result = module.exports.write_classifier_result = write_classifier_result
