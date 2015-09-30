var connect_mongo = function (callback) {
    var mongo_client = require ('mongodb').MongoClient
    server = require ('mongodb').Server
    client = new mongo_client (new server ('localhost', 27017), {native_parser: true})
    client.open (function (err, mongoClient) {
        if (err)
            callback (err, null)
        else
            callback (null, mongoClient)
    })
}

exports.connect_mongo = module.exports.connect_mongo = connect_mongo
