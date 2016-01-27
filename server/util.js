var _ = require ('underscore-node'),
    fs = require ('fs'),
	mongo = require ('mongodb'),
    async = require ('async'),
    request = require ('request'),
    MONGO_HOST = process.env['DB_PORT_27017_TCP_ADDR'] || 'localhost',
    MONGO_PORT = process.env['DB_1_PORT_27017_TCP_PORT'] || '27017',
    parser = require ('./parser.js'),
    api = require ('./api')

Array.prototype.pushUnique = function (item){
    if(this.indexOf(item) == -1) {
        this.push(item);
        return true;
    }
    return false;
}


var connect_mongo = function (callback) {
    var mongo_client = mongo.MongoClient
    server = mongo.Server
    client = new mongo_client (new server (MONGO_HOST, MONGO_PORT), {native_parser: true})
    client.open (function (err, mongoClient) {
        if (err)
            callback (err, null)
        else
            callback (null, mongoClient)
    })
}

var store_to_mongo = function (data, callback) {
    connect_mongo (function (err, mongoClient) {
        mongoClient.db ('user_tags_cars')
                   .collection ('classifications')
                   .insert (_.omit (data, 'imageData'), function (err, docs) {
                        mongoClient.close()
                        if (err) {
                            callback (err, null)
                        } else {
                            callback (null, {object_id: docs[0]._id})
                        }
                   })
	})
}

var store_to_disk = function (data, callback, temp) {
	var tmp_file_path = ''
        temp.open (tmp_file_path, function (err, info) {
            if (!err) {
                fs.writeFile (info.path, data.imageData, 'base64', function (err) {
                    if (err) {
                        callback (err)
                    } else {
                        console.log ("[* classifier task] file written")
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

var write_classifier_result = function (classification_result, _id, callback) {
    connect_mongo (function (err, mongoClient) {
        mongoClient.db ('user_tags_cars')
               .collection ('classifications')
               .update ({'_id': require('mongodb').ObjectID(_id)},
                        { $set: {'classifications': classification_result} },
                        function (err, result) {
                            mongoClient.close()
                            console.log ('[* classifier task] result in db')
                            callback (err, result)
                        })
    })
}


/* on listings returned, add powertrain and recalls info to listings doc */
var listings_request_worker = function (styleIds, edmunds_query, car_doc ,api_callback) {
        var listing_tasks = []
        
        async.retry (3, api.get_token, function (err, access_token_) {
            if (err) {
                api_callback (null, {'count':0, 'listings': [], remaining_ids: []})
            } else {
                var request_opts = {
                        method: "GET",
                        followRedirect: true,
                        qs: {
                            access_token: access_token_,
                            fmt: 'json',
                            view: 'full',
                            pagesize: edmunds_query.pagesize
                        }
                }
                request_opts.qs = _.extend (request_opts.qs, edmunds_query)
                _.each (styleIds, function (styleId) {
                    var listing_worker = function (callback) {
                        api.fetch_edmunds_listings (request_opts, styleId, callback)
                    }.bind (this)
                    listing_tasks.push (listing_worker)
                })

                async.parallelLimit (listing_tasks, 10, function (err, results) {
                    if (err) {
                        console.log (err)
                        api_callback (null, {'count':0, 'listings': [], remaining_ids: []})
                    } else {
                        var response_obj = {}
                        try {
                            response_obj['listings'] =  _.map (_.flatten(_.pluck(results, 'inventories')), function (listing) {
                                listing.submodel = car_doc.submodel
                                if (car_doc.hasOwnProperty ('powertrain') && 
                                    car_doc.powertrain.hasOwnProperty('engine') &&
                                    car_doc.powertrain.engine.hasOwnProperty('horsepower'))
                                    listing.horsepower = car_doc.powertrain.engine.horsepower
                                if (car_doc.hasOwnProperty ('powertrain') && 
                                    car_doc.powertrain.hasOwnProperty('engine') &&
                                    car_doc.powertrain.engine.hasOwnProperty('torque'))
                                    listing.torque = car_doc.powertrain.engine.torque
                                if (car_doc.hasOwnProperty ('mpg') && car_doc.mpg.hasOwnProperty('city'))
                                    listing.citympg = car_doc.powertrain.mpg.city
                                if (car_doc.hasOwnProperty ('complaints') && car_doc.complaints.hasOwnProperty('count'))
                                    listing.complaints_cnt = car_doc.complaints.count
                                if (car_doc.hasOwnProperty ('recalls') && car_doc.recalls.hasOwnProperty('numberOfRecalls'))
                                    listing.recalls_cnt = car_doc.recalls.numberOfRecalls
                                return listing                              
                            })
                            response_obj['count'] = response_obj['listings'].length
                            console.log ("[* " + response_obj['count'] + "] listings fetched")
                            api_callback (null, response_obj)
                        } catch (exp) {
                            console.error ('[ ERR fetching listings]' + exp)
                            response_obj['listings'] = []
                            response_obj['count'] = 0
                            api_callback (null, response_obj)
                        }
                    }
                })
            }
        })
}

var narrow_search = function (db_query, callback) {
    connect_mongo (function (err, mongoClient) {
        mongoClient.db ('trims').collection ('car_data')
        .find ( db_query,
        {
            'submodel': 1,
            'make': 1,
            'model': 1,
            'bodyType': 1,
            'year': 1,
            'compact_label' : 1,
            'powertrain.engine.compressorType': 1,
            'powertrain.engine.cylinder': 1,
            'powertrain.engine.horsepower': 1,
            'powertrain.engine.torque': 1,
            'powertrain.mpg.highway': 1,
            'powertrain.drivenWheels': 1,
            'powertrain.transmission.transmissionType': 1,

        })
        .toArray (function (err, docs) {
            callback (err, docs)
        })
    })
}

var narrow_search_callback = function (err, docs) {
    if (err) {
        this.res.status(500).json ({})
    } else {
        this.body.submodelCount = docs.length
        var hps = [],
            tqs = [],
            mpgs = []
        console.log ("[* narrow search ]: docs count = " + docs.length)
        _.each (docs, function (doc) {
            if (doc.hasOwnProperty ('make')) {
                if (this.body.car.makes === undefined)
                    this.body.car.makes = []
                this.body.car.makes.pushUnique (doc.make)
            }
            if (doc.hasOwnProperty ('model')) {
                if (this.body.car.models === undefined)
                    this.body.car.models = []
                this.body.car.models.pushUnique (doc.model.replace (new RegExp('_', 'g'), ' '))
            }
            if (doc.hasOwnProperty ('year')) {
                if (this.body.car.years === undefined)
                    this.body.car.years = []
                this.body.car.years.pushUnique (doc.year)
            }
            if (doc.hasOwnProperty ('make') && doc.hasOwnProperty ('model')
                && doc.hasOwnProperty ('year') && doc.hasOwnProperty ('compact_label')) {
                if (this.body.model_years === undefined)
                    this.body.model_years = {}
                if (!this.body.model_years.hasOwnProperty (doc.make))
                    this.body.model_years[doc.make] = {}
                if (!this.body.model_years[doc.make].hasOwnProperty ([doc.model]))
                    this.body.model_years[doc.make][doc.model] = {}

                var gen_name = doc.compact_label.replace (new RegExp (doc.model.replace (/[^a-zA-Z0-9]/g, ''), 'g'), '')
                                                .replace (new RegExp (doc.make.replace (/[^a-zA-Z0-9]/g, ''), 'g'), '')
                                                .replace (new RegExp (doc.bodyType.replace (/[^a-zA-Z0-9]/g, ''), 'g'), '')


                if (!this.body.model_years[doc.make][doc.model].hasOwnProperty (gen_name))
                    this.body.model_years[doc.make][doc.model][gen_name] = []
                this.body.model_years[doc.make][doc.model][gen_name].pushUnique (doc.year)
            }
            if (doc.hasOwnProperty ('bodyType')) {
                if (this.body.car.bodyTypes === undefined)
                    this.body.car.bodyTypes = []
                this.body.car.bodyTypes.pushUnique (doc.bodyType)
            }
            if (doc.hasOwnProperty ('powertrain') && doc.powertrain.hasOwnProperty ('transmission') 
                && doc.powertrain.transmission.hasOwnProperty ('transmissionType')) {
                if (this.body.car.transmissionTypes === undefined)
                    this.body.car.transmissionTypes = []
                this.body.car.transmissionTypes.pushUnique (doc.powertrain.transmission.transmissionType)
            }
            if (doc.hasOwnProperty ('powertrain') && doc.powertrain.hasOwnProperty ('engine') && doc.powertrain.engine.hasOwnProperty ('cylinder')) {
                if (this.body.car.cylinders === undefined)
                    this.body.car.cylinders = []
                this.body.car.cylinders.pushUnique (doc.powertrain.engine.cylinder)
            }
            if (doc.hasOwnProperty ('powertrain') && doc.powertrain.hasOwnProperty ('engine') && doc.powertrain.engine.hasOwnProperty ('compressorType')) { 
                if (this.body.car.compressors === undefined)
                    this.body.car.compressors = []
                this.body.car.compressors.pushUnique (doc.powertrain.engine.compressorType)
            }
            if (doc.hasOwnProperty ('powertrain') && doc.powertrain.hasOwnProperty ('engine') && doc.powertrain.engine.hasOwnProperty ('horsepower')) { 
                hps.pushUnique (doc.powertrain.engine.horsepower)
            }
            if (doc.hasOwnProperty ('powertrain') && doc.powertrain.hasOwnProperty ('engine') && doc.powertrain.engine.hasOwnProperty ('torque')) { 
                tqs.pushUnique (doc.powertrain.engine.torque)
            }
            if (doc.hasOwnProperty ('powertrain') && doc.powertrain.hasOwnProperty ('mpg') && doc.powertrain.mpg.hasOwnProperty ('highway')) { 
                mpgs.pushUnique (doc.powertrain.mpg.highway)
            }
            if (doc.hasOwnProperty ('powertrain') && doc.powertrain.hasOwnProperty ('drivenWheels')) { 
                if (this.body.car.drivetrains === undefined)
                    this.body.car.drivetrains = []
                this.body.car.drivetrains.pushUnique (doc.powertrain.drivenWheels)
            }
            this.body.car.minMpg = _.min (mpgs)
            this.body.car.minHp = _.min (hps)
            this.body.car.minTq = _.min (tqs)
        })
        this.res.status(200).json (this.body)
    }
}

var fetch_listings = function (db_query, edmunds_query, listings_callback) {
    var query_obj = {},
        sort = {}
        if (db_query.hasOwnProperty('sortBy')) {
            query_obj = _.omit(db_query, 'sortBy')
            sort = db_query.sortBy            
        } else {
            query_obj = db_query
        }
        // query_obj['listings_stats.inventoriesCount'] = {'$gte': 1}
        connect_mongo (function (err, mongoClient) {
            mongoClient.db ('trims').collection ('car_data')
                .find ( query_obj, 
                        {
                            'powertrain.engine.horsepower':1 ,
                            'powertrain.engine.torque':1,
                            'powertrain.mpg': 1,
                            'complaints.count': 1,
                            'recalls.numberOfRecalls': 1,
                            'submodel': 1,
                            'make': 1,
                            'model': 1,
                            'bodyType': 1,
                            'year': 1,
                            'powertrain.engine.compressorType': 1,
                            'powertrain.engine.cylinder': 1,
                            'powertrain.drivenWheels': 1,
                            'powertrain.transmission.transmissionType': 1,
                            'good_tags': 1,
                            'styleId': 1            
                        }).sort (sort).toArray (
                            function (err, submodels_docs) {
                                mongoClient.close()
                                if (err) {
                                    console.log (err)                    
                                } else {
                                    this.submodels_docs = submodels_docs
                                    console.log ('[util.fetch_listings]: * fetched ' + submodels_docs.length +' submodels ]\n[* submodels: ]')
                                    var fetch_ids = {},
                                        fetch_docs = {},
                                        tasks = []

                                    _.each (submodels_docs, function (doc) {
                                        console.log ("[util.fetch_listings]: submodel object")
                                        console.dir ("[util.fetch_listings: submodel styleid=" + doc.styleId+ " ]: " + doc.year + " " + doc.submodel)
                                        console.log ("\n")

                                    //     if (!fetch_ids.hasOwnProperty (doc.submodel))
                                    //         fetch_ids[doc.submodel] = []
                                    //     fetch_ids[doc.submodel].push (doc.styleId)
                                    //     fetch_docs[doc.submodel] = doc
                                    // })
                                    // _.each (_.keys (fetch_ids), function (submodel_key) {
                                    //     console.log ("[util.listings_request_worker]: ", submodel_key, JSON.stringify (fetch_ids[submodel_key]))
                                        var worker = function (callback) {
                                            listings_request_worker ( doc.styleId, edmunds_query, doc, callback)
                                        }
                                        tasks.push (worker)
                                    })
                                    // this.remaining_style_ids = _.difference (_.pluck (submodels_docs, 'styleId'), _.flatten (_.values (fetch_ids)))
                                    console.log (_.pluck (submodels_docs, 'styleId').length, this.remaining_style_ids.length)
                                    async.parallelLimit (tasks, 10, listings_callback.bind(this))
                                }           
                            }
                        )
        })
}

var construct_query_stats = function (queries) {
    var query = {}
    query.makes = _.uniq (_.pluck (queries, 'make'))
    query.main_models = _.uniq (_.pluck (queries, 'model'))
    query.bodyTypes = _.uniq (_.pluck (queries, 'bodyType'))
    query.years = _.uniq (_.pluck (queries, 'year'))
    query.tags = _.filter (_.uniq (_.flatten(_.pluck (queries, 'good_tags'))), 
        function (tag) {
            return tag !== null && tag !== undefined && tag.indexOf ('usedTmvRetail') < 0 && tag.indexOf ('baseMSRP') < 0
        }
    )

    query.drivenWheels = []
    query.cylinders = []
    query.compressors = []
    query.transmissionTypes = []
    query.mpg = []
    query.hp = []
    query.tq = []
    _.each (_.pluck (queries, 'powertrain'), function (powertrain) {
        if (powertrain.hasOwnProperty ('drivenWheels')) {
            query.drivenWheels.push (powertrain.drivenWheels)
        }
        if (powertrain.hasOwnProperty ('engine') && powertrain.engine.hasOwnProperty ('cylinder')) {
            query.cylinders.push (powertrain.engine.cylinder)
        }
        if (powertrain.hasOwnProperty ('engine') && powertrain.engine.hasOwnProperty ('compressorType')) {
            query.compressors.push (powertrain.engine.compressorType)
        }
        if (powertrain.hasOwnProperty ('transmission') && powertrain.transmission.hasOwnProperty('transmissionType')) {
            query.transmissionTypes.push (powertrain.transmission.transmissionType)
        }
        if (powertrain.hasOwnProperty ('engine') && powertrain.engine.hasOwnProperty ('hp')) {
            query.cylinders.push (powertrain.engine.cylinder)
            if (powertrain.engine.horsepower !== undefined)
                query.hp.push (powertrain.engine.horsepower)
            if (powertrain.engine.torque !== undefined)
                query.tq.push (powertrain.engine.torque)
        }
        if (powertrain.hasOwnProperty ('mpg') && powertrain.mpg.hasOwnProperty ('highway')) {
            query.mpg.push (powertrain.mpg.highway)
        }

    })
    query.cylinders = _.uniq (query.cylinders)
    query.compressors = _.uniq (query.compressors)
    query.transmissionTypes = _.uniq (query.transmissionTypes)
    query.drivenWheels = _.uniq (query.drivenWheels)
    query.minMpg = get_catetory_values (_.min (query.mpg))
    query.minHp = get_catetory_values(_.min (query.hp))
    query.minTq = get_catetory_values(_.min (query.tq))
    console.dir (query)
    return query
}

var has_color = function (listing_colors, type, color_query) {
    if (color_query === undefined || color_query.length < 1)
        return true

    if (listing_colors === undefined)
        return false

    var color_object = _.first (_.filter (listing_colors, function (color) {return color.category === type} ))
    if (color_object === undefined || !color_object.hasOwnProperty ('genericName'))
        return false

    var ret = false
    _.each (color_query, function (color) {
        if (color_object.genericName.toLowerCase().indexOf (color) > -1)
            ret = true
    })
    return ret
}

var has_equipment = function (equipments, query_equipments) {
    if (query_equipments === undefined || query_equipments.length < 1)
        return true

    if (equipments === undefined)
        return false
}

var listings_request_callback = function (err, listings) {
    if (err)
        console.dir (err)
    var response_obj = {},
        max_mileage = 5000000,
        max_price = 5000000

    // if (this.body.hasOwnProperty ('max_mileage'))
    //     max_mileage = this.body.max_mileage
    // if (this.body.hasOwnProperty ('max_price'))
    //     max_price = this.body.max_price

    if (this.body.hasOwnProperty ('max_mileage')) {
        console.log (max_mileage)
        if (this.body.max_mileage !== "No Max")        
            max_mileage = this.body.max_mileage
    }
    if (this.body.hasOwnProperty ('max_price')) {
        console.log (max_price)
        if (this.body.max_price !== "No Max")
            max_price = this.body.max_price
    }
    console.log ('[util.listings_request_callback]: max_mileage=' + max_mileage + " max_price=" + max_price + "")
    response_obj['listings'] =  _.filter (
                                    _.map (
                                        _.flatten(
                                            _.pluck(listings, 'listings')
                                        ),
                                        listing_formatter
                                    ), function (listing) {
                                        return (listing !== undefined && 
                                                listing.min_price <= max_price &&
                                                listing.mileage <= max_mileage)
                                                // has_color (listing.colors, 'Interior', this.body.api.int_colors) &&
                                                // has_color (listing.colors, 'Exterior', this.body.api.ext_colors))
                                                // has_equipment (_.union (listing.options, listing.features), this.body.features))
                                    }
                                )
    response_obj['count'] = response_obj['listings'].length
    response_obj['query'] = {}
    var next_query = construct_query_stats (this.submodels_docs)
    next_query.minMpg = this.body.car.minMpg
    next_query.minHp = this.body.car.minHp
    next_query.minTq = this.body.car.minTq
    next_query = _.omit (next_query, 'remaining_ids')
    next_query = _.omit (next_query, 'tags')

    console.log ('[util.listings_request_worker]: next query\n');
    console.dir (next_query)

    response_obj['query'].car = next_query


    if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'mileage:asc') {
        response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
            return listing.mileage
        })
    }
    if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'mileage:desc') {
        response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
            return -1 * listing.mileage
        })
    }
    if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'price:asc') {
        response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
            return listing.min_price
        })
    }
    if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'price:desc') {
        response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
            return -1 * listing.min_price
        })
    }
    if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'year:asc') {
        response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
            return listing.year.year
        })
    }
    if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'year:desc') {
        response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
            return -1 * listing.year.year
        })
    }
    this.res.status (201).json (response_obj)
}

var listing_formatter = function (listing) {
    if (listing !== undefined && listing.hasOwnProperty ('media') && 
        listing.media.hasOwnProperty ('photos') && 
        listing.media.photos.hasOwnProperty ('large') && 
        listing.media.photos.large.count > 1) {
        listing.media.photos.large.links = _.sortBy (listing.media.photos.large.links, function (photo) {
            var matched_nums = photo.href.match (new RegExp (/\d+/g))
            return parseInt (matched_nums[matched_nums.length -1])
        })
    }
    if (listing !== undefined && listing.hasOwnProperty ('prices'))
        listing.min_price = _.filter (_.values (listing.prices), function (price) {return price > 0}).sort()[0]

    if (listing.hasOwnProperty ('equipment') && listing.equipment.length > 0) {
        listing.equipment = _.filter (listing.equipment, function (equip) {
            return (equip.hasOwnProperty ('equipmentType') && equip.equipmentType !== 'TRANSMISSION' && equip.equipmentType !== 'ENGINE')
        })
    }
    return listing
}

var construct_dealer_query_stats = function (fetched_listings) {
    var response_obj = {}

    response_obj.query = {
        "car": {
            "years": [],
            "makes": [],
            "main_models": [],
            "drivenWheels": [],
            "bodyTypes": [],
            "transmissionTypes": [],
            "compressors": [],
            "cylinders": [],
            "fuelTypes": [],
            "conditions": [],
        },
        "api": this.body.api
    }

    if (fetched_listings !== null && fetched_listings !== undefined) {
        var listings = fetched_listings.inventories
        response_obj.listings = _.map (listings, function (listing) {
            var engine = _.find (listing.equipment, function (equipment) {
                return equipment.equipmentType === 'ENGINE'
            })
            var transmission = _.find (listing.equipment, function (equipment) {
                return equipment.equipmentType === 'TRANSMISSION'
            })

            if (listing.hasOwnProperty ('year') && listing.year.hasOwnProperty('year'))
                response_obj.query.car.years.push (listing.year.year)
            if (listing.hasOwnProperty ('make') && listing.make.hasOwnProperty('name'))
                response_obj.query.car.makes.push (listing.make.name.toLowerCase())
            if (listing.hasOwnProperty ('model') && listing.model.hasOwnProperty('name'))
                response_obj.query.car.main_models.push (listing.model.name.toLowerCase())
            if (listing.hasOwnProperty ('drivetrain'))
                response_obj.query.car.drivenWheels.push (listing.drivetrain.toLowerCase())
            if (listing.hasOwnProperty ('style') && listing.hasOwnProperty('submodel') && listing.hasOwnProperty ('body')) {
                response_obj.query.car.bodyTypes.push (listing.style.submodel.body.toLowerCase())
            }
            if (listing.hasOwnProperty ('type'))
                response_obj.query.car.conditions.push (listing.type)
            if (transmission !== undefined && transmission !== null && transmission.hasOwnProperty ('transmissionType'))
                response_obj.query.car.transmissionTypes.push (transmission.transmissionType.toLowerCase())
            if (engine !== undefined && engine !== null) {
                if (engine.hasOwnProperty ('cylinder'))                
                    response_obj.query.car.cylinders.push (engine.cylinder)
                if (engine.hasOwnProperty ('compressorType')) {
                    if (engine.compressorType === 'NA')
                        response_obj.query.car.compressors.push ('Naturally Aspirated')
                    else
                        response_obj.query.car.compressors.push (engine.compressorType)
                }
                if (engine.hasOwnProperty ('type'))
                    response_obj.query.car.fuelTypes.push (engine.type)
            }
            var formatted_listing = listing_formatter (listing)

            formatted_listing.hp = engine.horsepower
            formatted_listing.torque = engine.torque

            if (listing.hasOwnProperty ('mpg') && listing.mpg.hasOwnProperty ('highway'))
                    formatted_listing.highway = parseInt (listing.mpg.highway)
            return formatted_listing
        })
        _.each (_.keys (response_obj.query.car), function (key) {
            response_obj.query.car [key] = _.filter(_.uniq (response_obj.query.car[key]), function (val) {return val !== null && val !== undefined})
        })

        console.dir (this.body)

        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'mileage:asc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return listing.mileage
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'mileage:desc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return -1 * listing.mileage
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'price:asc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return listing.min_price
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'price:desc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return -1 * listing.min_price
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'year:asc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return listing.year.year
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'year:desc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return -1 * listing.year.year
            })
        }

        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'torque:desc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return -1 * listing.torque
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'torque:asc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return listing.torque
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'mpg:desc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return -1 * listing.highway
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'mpg:asc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return -1 * listing.highway
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'horsepower:asc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return listing.hp
            })
        }
        if (this.body.hasOwnProperty ('sortBy') && this.body.sortBy === 'horsepower:desc') {
            response_obj['listings'] =  _.sortBy (response_obj['listings'], function (listing) {
                return -1 * listing.hp
            })
        }
        if (this.body.hasOwnProperty ('car')) {
            response_obj['listings'] = _.filter (response_obj['listings'], function (listing) {
                if (this.body.car.hasOwnProperty ('makes') && this.body.car.makes.length > 1 && this.body.car.makes.indexOf (listing.make.name.toLowerCase()) <0 )
                    return false
                if (this.body.car.hasOwnProperty ('main_models') && this.body.car.main_models.length > 1 && this.body.car.main_models.indexOf (listing.model.name.toLowerCase()) <0 )
                    return false
                if (this.body.car.hasOwnProperty ('drivenWheels') && this.body.car.drivenWheels.length > 1 && this.body.car.drivenWheels.indexOf (listing.drivetrain.toLowerCase()) <0 )
                    return false
                if (this.body.car.hasOwnProperty ('bodyTypes') && this.body.car.bodyTypes.length > 1 && this.body.car.bodyTypes.indexOf (listing.style.submodel.body.toLowerCase()) <0 )
                    return false                
                return true
            })
        }

    }
    return response_obj        

}

var franchise_listings_callback = function (err, listings) {
    var cars_query = this.body.cars
    if (err)
        console.error ("[error returned from tasks * franchise query]" + err)
    var response_obj = construct_dealer_query_stats (listings)  
    this.res.status (201).json (response_obj)
}

var fetch_listings_by_franchise_id = function (user_query, callback) {
    var cars_query = user_query.cars,
        api_query = user_query.api

        async.retry (3, api.get_token, function (err, access_token_) {
            if (err) {
                callback (null, {'count':0, 'listings': [], remaining_ids: []})
            } else {
                var request_opts = {
                        method: "GET",
                        followRedirect: true,
                        qs: {
                            access_token: access_token_,
                            fmt: 'json',
                            view: 'full',
                            pagenum: api_query.pagenum,
                            pagesize: api_query.pagesize,
                        }
                }
                if (api_query.condition !== undefined)
                    request_opts.qs.condition = api_query.condition
                api.fetch_franchise_listings (request_opts, api_query.franchiseId, callback)
            }   
        })
}

var fetch_submodels = function (mongoclient, db_query, callback) {
    var query_obj = {},
        sort = {}
        if (db_query.hasOwnProperty('sortBy')) {
            query_obj = _.omit(db_query, 'sortBy')
            sort = db_query.sortBy            
        } else {
            query_obj = db_query
        }
        query_obj = _.omit (query_obj, 'make')
    if (mongoclient === undefined)
        callback ({'error': 'mongo client undefined'})
    else {
        mongoclient.db ('trims').collection ('car_data').find (query_obj, 
                        {
                            'powertrain.engine.horsepower':1 ,
                            'powertrain.engine.torque':1,
                            'powertrain.mpg': 1,
                            'images': 1,
                            'model': 1,
                            'year': 1,
                            'compact_label': 1,
                            'make': 1,
                            'styleId': 1,
                            'powertrain.engine.compressorType': 1,
                            'powertrain.engine.cylinder': 1,
                            'powertrain.drivenWheels': 1,
                            'powertrain.transmission.transmissionType': 1,
                            'recalls.numberOfRecalls' : 1,
                            'complaints.count': 1,
                            'incentives.count': 1,
                            'bodyType': 1,
                        }

                ).sort (sort).toArray (function (err, docs) {
                    if (err) {
                        console.error (err)
                        callback (err)
                    } else {
                        var model = [],
                            years = [],
                            hps = [],
                            tqs = [],
                            city = [],
                            highway = [],
                            imageUrl = [],
                            make = []

                        var model_info = {
                            'cylinders': [],
                            'compressors': [],
                            'transmissionTypes': [],
                            'drivenWheels': [],
                            'recallsCount': [],
                            'complaintsCount': [],
                            'incentivesCount': [],
                            'bodyTypes': []
                        },
                        model_obj = {},
                        hp_str = "",
                        tq_str = "",
                        city_str = "",
                        hwy_str = ""

                        _.each (docs, function (doc) {
                            if (doc !== undefined) {
                            if (doc.hasOwnProperty ('powertrain') && doc.powertrain !== undefined) {
                                if (doc.powertrain.hasOwnProperty ('drivenWheels'))
                                    model_info.drivenWheels.pushUnique (doc.powertrain.drivenWheels)
                                if (doc.powertrain.hasOwnProperty ('engine') && doc.powertrain.engine !== undefined) {
                                    if (doc.powertrain.engine.hasOwnProperty ('horsepower'))
                                        hps.pushUnique (doc.powertrain.engine.horsepower)
                                    if (doc.powertrain.engine.hasOwnProperty ('torque'))
                                        tqs.pushUnique (doc.powertrain.engine.torque)
                                    if (doc.powertrain.engine.hasOwnProperty ('compressorType'))
                                        model_info.compressors.pushUnique (doc.powertrain.engine.compressorType)
                                    if (doc.powertrain.engine.hasOwnProperty ('cylinder'))
                                        model_info.cylinders.pushUnique (doc.powertrain.engine.cylinder)
                                }
                                if (doc.powertrain.hasOwnProperty ('mpg') && doc.powertrain.mpg !== undefined) {
                                    if (doc.powertrain.mpg.hasOwnProperty ('city'))
                                        city.pushUnique (doc.powertrain.mpg.city)                                
                                    if (doc.powertrain.mpg.hasOwnProperty ('highway'))
                                        highway.pushUnique (doc.powertrain.mpg.highway)
                                }
                                if (doc.powertrain.hasOwnProperty ('transmission') && doc.powertrain.transmission !== undefined && doc.powertrain.transmission.hasOwnProperty ('transmissionType')) 
                                    model_info.transmissionTypes.pushUnique (doc.powertrain.transmission.transmissionType)
                            }
                            if (doc.hasOwnProperty ('recalls') && doc.recalls !== undefined && doc.recalls.hasOwnProperty ('numberOfRecalls'))
                                model_info.recallsCount.pushUnique (doc.recalls.numberOfRecalls)
                            if (doc.hasOwnProperty ('complaints') && doc.complaints !== undefined && doc.complaints.hasOwnProperty ('count'))
                                model_info.complaintsCount.pushUnique (doc.complaints.count)
                            if (doc.hasOwnProperty ('incentives') && doc.incentives !== undefined && doc.incentives.hasOwnProperty ('count'))
                                model_info.incentivesCount.pushUnique (doc.incentives.count)

                            if (doc.hasOwnProperty ('year'))
                                years.pushUnique (doc.year)
                            if (doc.hasOwnProperty ('model'))
                                model.pushUnique (doc.model)
                            if (doc.hasOwnProperty ('make'))
                                make.pushUnique (doc.make)
                            if (doc.hasOwnProperty ('images'))
                                imageUrl.pushUnique (_.first (doc.images))
                            if (doc.hasOwnProperty ('bodyType'))
                                model_info.bodyTypes.pushUnique (doc.bodyType)
                            }
                        })
                        model_info.hps = hps
                        model_info.tqs = tqs
                        model_info.city = city
                        model_info.highway = highway
                        model_info.years = years
 
                        {
                            var model_name = _.first (model)
                            if (model_name !== undefined)
                               model_obj.model = model_name.replace (/_/g, " ")
                            model_obj.make = _.first (make)
                            model_obj.imageUrl = _.first (imageUrl)


                            if (_.uniq (years).length > 1)
                                model_obj.yearDesc = _.min (years) + " - " + _.max (years)
                            else
                                model_obj.yearDesc = _.first (years)

                            if (_.uniq (hps).length > 1)
                                hp_str = _.min (hps) + " - " + _.max (hps) + " hp "
                            else if (hps.length > 0)
                                hp_str = _.first (hps) + " hp "

                            if (_.uniq (tqs).length > 1)
                                tq_str = _.min (tqs) + " - " + _.max (tqs) + " lb/ft"
                            else if (tqs.length > 0)
                                tq_str = _.first (tqs) + " lb/ft"
                            model_obj.powerDesc = hp_str + tq_str

                            if (_.uniq (city).length > 1)
                                city_str = _.min (city) + " - " + _.max (city) + " City /"
                            else if (city.length > 0)
                                city_str = _.first (city) + " City / "

                            if (_.uniq (highway).length > 1)
                                hwy_str = _.min (highway) + " - " + _.max (highway) + " Highway"
                            else if (highway.length > 0)
                                hwy_str =  _.first (highway) + " Highway"
                            model_obj.mpgDesc = city_str + hwy_str
                            model_obj.styleIds = _.pluck (docs, 'styleId')
                        }
                        callback (null, {'model_desc': model_obj, 'model_info': model_info})
                    }
        })
    }
}

var fetch_generations = function (mongoclient, cars_query, callback) {
    var query_obj = {}
    if (cars_query.hasOwnProperty('sortBy')) {
        query_obj = _.omit(cars_query, 'sortBy')
    } else {
        query_obj = cars_query
    }
    if (mongoclient === undefined)
        callback ({'error': 'mongo client undefined'})
    else {
        mongoclient.db ('trims').collection ('car_data').distinct ( 
            'compact_label',
            query_obj,
            function (err, labels) {
                if (err) {
                    console.error ("fetch_generations", err)
                    callback (err)
                } else {
                    var task_array = []
                    labels = _.uniq (_.map (labels, function (label) {return parser.parse_label (label) }))
                    _.each (labels, function (label) {
                        var fetch_submodels_worker = function (submodel_callback) {
                            var query = query_obj
                            query['compact_label'] = _.first (parser.make_reg_type ([label]))
                            fetch_submodels (mongoclient, query, submodel_callback)
                        }
                        task_array.push (async.ensureAsync(fetch_submodels_worker))
                    })
                    async.series (task_array, function (err, res) {
                        if (err) {
                            console.error (err)
                            callback (err)
                        }
                        else {
                            var res_flattened = _.flatten (res),
                                model_infos = _.pluck (res_flattened, 'model_info'),
                                model_descs = _.pluck (res_flattened, 'model_desc')
                            callback (null, {
                                'model_stats': {
                                    'cylinders': _.uniq (_.union(_.pluck (model_infos, 'cylinders'))),
                                    'compressors':_.uniq (_.union(_.pluck (model_infos, 'compressors'))),
                                    'transmissionTypes': _.uniq (_.union(_.pluck (model_infos, 'transmissionTypes'))),
                                    'make': _.first (_.pluck (model_descs, 'make')),
                                    'model': _.first (_.uniq (_.pluck (model_descs, 'model'))),
                                    'bodyTypes': _.uniq (_.union(_.pluck (model_infos, 'bodyTypes'))),
                                    'drivenWheels': _.uniq (_.union (_.pluck (model_infos, 'drivenWheels'))),
                                    'recallsCount': _.uniq (_.pluck (model_infos, 'recallsCount')),
                                    'complaintsCount': _.uniq (_.pluck (model_infos, 'complaintsCount')),
                                    'incentivesCount': _.uniq (_.pluck (model_infos, 'incentivesCount')),
                                    'years': _.uniq (_.pluck (model_infos, 'years')),
                                    'hps': _.uniq (_.pluck (model_infos, 'hps')),
                                    'tqs': _.uniq (_.pluck (model_infos, 'tqs')),
                                    'city': _.uniq (_.pluck (model_infos, 'city'))
                                },
                                'models': {
                                    'models': model_descs, 
                                    'make':  _.first (_.pluck (model_descs,'make')),
                                    'numModels': model_descs.length,
                                    'imageUrl': _.first (_.pluck (model_descs,'imageUrl'))
                                }
                            })
                        }
                    })
                }
            })
    }
}

var get_catetory_values = function (val, inteval) {
    return val - (val % inteval)
}

var fetch_makes = function (cars_query, callback) {
    var query_obj = {}
    if (cars_query.hasOwnProperty('sortBy')) {
        query_obj = _.omit(cars_query, 'sortBy')
    } else {
        query_obj = cars_query
    }
    connect_mongo (function (err, mongoClient) {
        if (err) {
            console.error ("fetch_makes", err)
            callback (err)
        } else {
            mongoClient.db ('trims')
            .collection ('car_data')
            .distinct ( 
            'make',
            query_obj,
            function (err, docs) {
                if (err) {
                    console.error (err)
                    callback (err)
                } else {
                    callback (null, docs)
                }
            })
        }
    })
}

var union_flatten_filter = function (array) {
    return _.uniq (_.filter(_.flatten (array), function (name) { return name !== undefined && name !== null }))
}
var construct_query_obj_from_makes = function (makes_result) {
    var query = {
        "car": {
            "years": union_flatten_filter(_.pluck (makes_result, 'years')),
            "makes": union_flatten_filter(_.pluck (makes_result, 'make')),
            "models": union_flatten_filter(_.pluck (makes_result, 'model')),
            "drivenWheels": union_flatten_filter(_.pluck (makes_result, 'drivenWheels')),
            "bodyTypes": union_flatten_filter(_.pluck (makes_result, 'bodyTypes')),
            "transmissionTypes": union_flatten_filter(_.pluck (makes_result, 'transmissionTypes')),
            "compressors": union_flatten_filter(_.pluck (makes_result, 'compressors')),
            "cylinders": union_flatten_filter(_.pluck (makes_result, 'cylinders')),
        }
    }
    var mpg = union_flatten_filter(_.pluck (makes_result, 'city'))
        hp =  union_flatten_filter(_.pluck (makes_result, 'hps'))
        tq =  union_flatten_filter(_.pluck (makes_result, 'tqs'))

    query.car.minMpg = get_catetory_values (_.min (mpg))
    query.car.minHp = get_catetory_values(_.min (hp))
    query.car.minTq = get_catetory_values(_.min (tq))

    return query
}

var fetch_makes_callback = function (err, docs) {
    if (err) {
        console.error (err)
        this.res.status(500).json (err)
    } else {
        connect_mongo (function (err, mongoclient) {
            if (err) {
                console.error (err)
                this.res.status (500).json (err)

            } else {
                var task_array = []
                _.each (docs, function (make_string) {
                    var fetch_generations_worker = function (callback) {
                        var new_query_object = this.cars_query
                        new_query_object['make'] = make_string
                        fetch_generations (mongoclient, new_query_object, callback)            
                    }
                    task_array.push (async.ensureAsync(fetch_generations_worker))
                })
                async.parallel (task_array, function (err, res) {
                    if (err) {
                        console.error (err)
                        this.res.status (500).json (err)
                    } else {
                        console.log (" [makes request] returned")
                        var makes_result = _.filter (res, function (make_doc) { return make_doc.models.numModels > 0}),
                            query_obj = construct_query_obj_from_makes (_.pluck (makes_result, 'model_stats')),
                            models = _.pluck (makes_result, 'models')
                        this.res.status (201).json ({'makes': models, 'makesCount': models.length, 'query': query_obj})
                    }
                })

            }
        })
    }
}



exports.connect_mongo = module.exports.connect_mongo = connect_mongo
exports.store_to_mongo = module.exports.store_to_mongo = store_to_mongo
exports.store_to_disk = module.exports.store_to_disk = store_to_disk
exports.write_classifier_result = module.exports.write_classifier_result = write_classifier_result
exports.listings_request_worker = module.listings_request_worker = listings_request_worker
exports.listings_request_callback = module.listings_request_callback = listings_request_callback
exports.franchise_listings_callback = module.franchise_listings_callback = franchise_listings_callback
exports.narrow_search = module.exports.narrow_search = narrow_search
exports.narrow_search_callback = module.exports.narrow_search_callback = narrow_search_callback
exports.fetch_makes = module.exports.fetch_makes = fetch_makes
exports.fetch_listings = module.exports.fetch_listings = fetch_listings
exports.fetch_listings_by_franchise_id = module.exports.fetch_listings_by_franchise_id = fetch_listings_by_franchise_id
exports.fetch_makes_callback = module.exports.fetch_makes_callback = fetch_makes_callback
