var _ = require ('underscore-node')

var make_reg_type = function (original_field) {
    var reg_exp_arr = []
    _.each (original_field, function (field) {
        if (field === 'Turbo')
            reg_exp_arr.push (new RegExp (field.replace (/[^a-zA-Z0-9]/g, ''),'i'))
        else
            reg_exp_arr.push (new RegExp ("^"+ field.replace (/[^a-zA-Z0-9]/g, ''),'i'))
    })
    return reg_exp_arr
}

var parse_model = function (original_field) {
    var reg_exp_field = []
    _.each (original_field, function (field) {
        if (field === 'Cooper') {
            reg_exp_field.push (new RegExp (field + '$'), 'i')
            reg_exp_field.push (new RegExp (field + 's$'), 'i')
            reg_exp_field.push (new RegExp (field + 'johncooperworks$'), 'i')
        }
        else if (field === 'C AMG' || field === 'E AMG' || field === 'GLA AMG' || field === 'ML AMG' ||
                field === 'G AMG' || field === 'GL AMG' || field === 'S AMG' || field === 'SL AMG' ||
                field === 'SLK AMG' || field === 'CLA AMG' || field === 'CLS AMG') {
            reg_exp_field.push (new RegExp (field.replace (' ', '\\d+'),'i'))
        } else {
            reg_exp_field.push (new RegExp (field.replace (/[^a-zA-Z0-9]/g, ''), 'i'))
        }
    })
    return reg_exp_field
}

var parse_listings_query = function (params) {
    var obj = {}
    _.each (['zipcode', 'pagesize', 'pagenum', 'radius', 'intcolor',
            'extcolor', 'msrpmin', 'msrpmax', 'lpmin', 'lpmax', 'type', 'sortby'], 
            function (key) {
                if (params.hasOwnProperty (key)) {
                    obj[key] = params[key]
                }
    })
    return obj
}

var parse_compressors = function (array_compressors_query) {
    var result = _.map (array_compressors_query, function (field) {return new RegExp (field, 'i')})
    console.log ('[parser.parse_compressors]: compressors array')
    console.log (JSON.stringify(result))
    return result
}

var parse_label = function (params) {



    if (params.indexOf ('bmw_bmw_6_series_f13') > -1)
        return 'bmwbmwf06f12f13'

    if (params.indexOf ('chrysler_town_country_v_minivan') > -1)
        return 'chryslertowncountrygenerationvminivan'
    if (params.indexOf ('chrysler_town_country_iv_minivan') > -1)
        return 'chryslertowncountrygenerationivminivan'

    var label_str = params.replace (/[^a-zA-Z0-9]/g, '').toLowerCase()
                .replace(/bmw[0-9]series/, 'bmw')
                .replace(/mercedesbenz[a-z]{1,3}class/, 'mercedesbenz')
                .replace(/convertible$/, '')
                .replace(/sedan$/, '')
                .replace(/coupe$/, '')
                .replace(/truck$/, '')
                .replace(/van$/, '')
                .replace(/suv$/, '')
                .replace(/wagon$/, '')
                .replace(/hatchback$/, '')
                .replace(/facelift[0-9]{4}/, '')
                // .replace(/463.*facelift[0-9]{4}/, '463')
    // console.log ('[parser.parse_label]: ' + params + ' => '+ label_str)
    return label_str
}

var parse_car_query = function (query_params, min_price, max_price, sort_query) {
    console.dir (query_params)
    var query = {}
    if (_.has (query_params, 'makes') && query_params.makes.length > 0) {
        query['make'] = {'$in': make_reg_type(query_params.makes)}
    }

    if (_.has (query_params, 'main_models') && query_params.main_models.length > 0) {
        query['model'] = {'$in': query_params.main_models}
    }

    if (_.has (query_params, 'models') && query_params.models.length > 0) {
        query['submodel'] = {'$in': parse_model(query_params.models)}
    }

    if (_.has (query_params, 'bodyTypes') && query_params.bodyTypes.length > 0) {
        query['bodyType'] = {'$in': make_reg_type (query_params.bodyTypes)}
    }

    // if (_.has (query_params, 'years') && query_params.years.length > 0) {
    //     query['year'] = {'$in': query_params['years']}
    // }

    if (_.has (query_params, 'labels') && query_params.labels.length > 0) {
        query['compact_label'] = {'$in': _.map (query_params.labels, function (label) {
            if (label.indexOf ('bmw_bmw_3_series_e9') != -1)
                return new RegExp ('bmwbmwe90')
            if (label.indexOf ('bmw_bmw_5_series_f07') != -1)
                return new RegExp ('bmwbmwf10f11f07sedan')
            return new RegExp(parse_label (label), 'i') 
        })}
    }

    if (_.has (query_params, 'transmissionTypes') && query_params.transmissionTypes.length > 0) {
        query['powertrain.transmission.transmissionType'] = {'$in': make_reg_type(query_params.transmissionTypes)}
    }

    if (_.has (query_params, 'compressors') && query_params.compressors.length > 0) {
        console.log ('[parser.parse_car_query]: compressors array\n')
        console.log (JSON.stringify (query_params['compressors']))
        // query['powertrain.engine.compressorType'] = {'$in': _.uniq (new RegExp (query_params.compressors), 'i')}
        query['powertrain.engine.compressorType'] = {'$in': _.uniq (parse_compressors (query_params['compressors']))}
    }
    // if (_.has (query_params, 'cylinders') && query_params.cylinders.length > 0) {
    //     query['powertrain.engine.cylinder'] = {'$in': query_params['cylinders']}
    // }
    if (_.has (query_params, 'minHp') && query_params['minHp'] > 0) {
        query['powertrain.engine.horsepower'] = {'$gte': query_params['minHp']}
    }

    if (_.has (query_params, 'minTq') && query_params['minTq']  > 0) {
        query['powertrain.engine.torque'] = {'$gte': query_params['minTq']}
    }

    if (_.has (query_params, 'minMpg') && query_params['minMpg'] > 0) {
        query['powertrain.mpg.highway'] = {'$gte': query_params['minMpg']}
    }

    if (_.has (query_params, 'minCylinders')) {
        console.log ('[parser.parse_car_query]: min cylinders=', query_params['minCylinders'])
        query['powertrain.engine.cylinder'] = {'$gte': query_params['minCylinders']}
    }

    if (_.has (query_params, 'minYr')) {
        console.log ('[parser.parse_car_query]: min year=', query_params['minYr'])
        query['year'] = {'$gte': query_params['minYr']}

    }

    if (_.has (query_params, 'tags') && query_params.tags.length > 0) {
        _.each (query_params.tags, function (tag) {
            if (tag.toLowerCase() === 'has incentives')
                query['incentives.count'] = {'$gte': 1}
            else if (tag.toLowerCase() === 'no recalls')
                query['recalls.numberOfRecalls'] = {'$eq': 0}
            else if (tag.toLowerCase() === 'electric')
                query['powertrain.engine.fuelType'] = 'electric'
            else if (tag.toLowerCase() === 'no complaints') {
                query['complaints.count'] = {'$eq': 0}
            } else {
            }
        })
    }

    if (_.has (query_params, 'drivenWheels') && query_params.drivenWheels.length > 0) {
        query['powertrain.drivenWheels'] = {'$in': make_reg_type (query_params['drivenWheels'])}
    }

    if (sort_query === 'mpg:asc') {
        query['sortBy'] = [['powertrain.mpg.highway', 1]]
    }
    if (sort_query === 'mpg:desc') {
        query['sortBy'] = [['powertrain.mpg.highway', -1]]
    }
    if (sort_query === 'horsepower:asc') {
        query['sortBy'] = [['powertrain.engine.horsepower', 1]]
    }
    if (sort_query === 'horsepower:desc') {
        query['sortBy'] = [['powertrain.engine.horsepower', -1]]
    }
    if (sort_query === 'torque:asc') {
        query['sortBy'] = [['powertrain.engine.torque', 1]]
    }
    if (sort_query === 'torque:desc') {
        query['sortBy'] = [['powertrain.engine.torque', -1]]
    }
    if (sort_query === 'complaints:asc') {
        query['sortBy'] = [['complaints.count', 1]]
    }
    if (sort_query === 'complaints:desc') {
        query['sortBy'] = [['complaints.count', -1]]
    }
    if (sort_query === 'recalls:asc') {
        query['sortBy'] = [['recalls.numberOfRecalls', 1]]
    }
    if (sort_query === 'recalls:desc') {
        query['sortBy'] = [['recalls.numberOfRecalls', -1]]
    }
    if (sort_query === 'year:asc') {
        query['sortBy'] = [['year', 1]]
    }
    if (sort_query === 'year:desc') {
        query['sortBy'] = [['year', -1]]
    }

    if (_.has (query_params, 'remaining_ids') && query_params.remaining_ids.length > 0) {
        var last_query = {}
        last_query['styleId'] = {'$in': query_params.remaining_ids}
        if (query.hasOwnProperty ('sortBy'))
            last_query['sortBy'] = query['sortBy']
        else
            last_query['sortBy'] = 'year:asc'
        if (query.hasOwnProperty ('$or'))
            last_query['$or'] = query['$or']

        // console.log("[** PARSER.JS]: CONT'D Query")
        // console.log (last_query)
        return last_query
    }


    console.log("[** PARSER.JS]: Car Query")
    console.dir(query)
    return query
}

exports.make_reg_type = module.exports.make_reg_type = make_reg_type
exports.parse_label = module.exports.parse_label = parse_label
exports.parse_model = module.exports.parse_model = parse_model
exports.parse_car_query = module.exports.parse_car_query = parse_car_query
exports.parse_listings_query = module.exports.parse_listings_query = parse_listings_query

