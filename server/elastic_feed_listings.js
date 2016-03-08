var api = require ('./api'),
	util = require ('./util'),
	_ = require ('underscore-node'),
	async = require ('async')

var push_to_mongodb = function (err, listings) {
	console.log ("[ pushing to mongodb... ]")
	if (err)
		throw new Error (err)
	else {
		if (listings !== null && listings !== undefined 
			&& listings.hasOwnProperty ("totalCount") 
			&& listings.totalCount >= 1) {
				var db_name = "cities_listings_"+ new Date().toString().replace (/\s+/g, '')
				connect_mongo (function (err, mongo_Client) {
					mongo_Client
					.db (db_name)
					.collection ("edmunds")
					.insert (listings.inventories, function (err, records) {
						mongo_Client.close()
						if (err)
							throw new Error (err)
						else {
							console.log ("[" + records[0].model.niceName +"] " + records.length + " inserted")
						}
					})
				})
		} else {
			console.log ("[ skip ]")

		}
	}
}

var listings_callback = function (err, listings) {
}

var collect_cities_listings_edmunds = function(){
	// try {
		util.connect_mongo (function (err, mongo_Client) {
			if (err)
				throw new Error (err)
			else {
				console.log ('mongo_Client')
				mongo_Client.db ('zipcodes')
				.collection ('cities')
				.find ({}, {'_id': 0})
				.toArray (function (err, zipcodes) {
					mongo_Client.close ()
					if (err) {
						throw new Error (err)
					} else {
						_.each (zipcodes, function (zipcode) {
					        async.retry (3, api.get_token, function (err, access_token_) {
				            if (err) {
				                api_callback (null, {'count':0, 'listings': [], remaining_ids: []})
				            } else {
				            	util.connect_mongo (function (err, mongo_Client) {
									if (err || mongo_Client === undefined || mongo_Client === null) {
										throw new Error (err)
									} else {
										mongo_Client.db ('vehicle_data')
										.collection ('styleIds')
										.distinct ('styleId', function (err, styleIds) {
											mongo_Client.close()
						                	if (err) {
						                		throw new Error (err)
						                	}
						                	else {
						                		var task_array = []
						                		console.log ("[ " + zipcode.city + " start getting " + styleIds.length + " styleIds ]")
							                	_.each (styleIds, function (styleId) {
							                		_.each (zipcodes, function (zipcode) {
										                var request_opts = {
										                        method: "GET",
										                        followRedirect: true,
										                        qs: {
										                            access_token: access_token_,
										                            fmt: 'json',
										                            view: 'full',
										                            zipcode: zipcode.zipcode,
										                            styleId: styleId.styleId,
										                            radius: 50,
										                            pagenum: 1,
										                            pagesize: 50
										                        }
										                }
							                			var listings_worker = function (callback) {
							                				console.log ("[" + zipcode.city + "] @ " + styleId.styleId)
								                			api.fetch_edmunds_listings (request_opts, styleId, push_to_mongodb)
							                			}.bind (this)
							                			task_array.push (async.ensureAsync(listings_worker))
							                		})
							                	})
												async.parallelLimit (task_array, 20, function (err, res) {
													if (err)
														throw new Error (err)
													else {
														console.log ("[==== done ====]")
														process.exit()
													}
												})
						                	}
						                })

									}				            		
				            	})
				            }
							})
				        })
				    }
				})
			}
		})
	// } catch (err) {
	// 	console.log (err)
	// 	process.exit ()
	// }
}()


