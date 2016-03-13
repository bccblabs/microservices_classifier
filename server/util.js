'use strict'
var _ = require ('underscore-node')
var ESFactory = require ('./es_factory')

var pretty_print = function (obj) {console.log (JSON.stringify (obj, null, 2))}


var defaultCarSort = {'engine.horsepower': {'order': 'desc'}}

var defaultListingsSort = {"mileage": {"order": "desc"}}

// use at the first level search, when no specific models
var categoryListingsAgg = {
}

var listingCntAvgPricePerTrimAgg = {
}

// use at searchlisting, agg avg price per make/model/gen
var listingAvgPricePerTrimAggs = {
}

// use when click into listing and then see how it ranks again search results
function rank_listing (metrics) {
  var listingAggQuery = {}
  _.each (_.keys (metrics), function (key) {
    var metric_val = metrics[key]
    switch (key) {
      case 'nhtsa_overall': {
        listingAggQuery['nhtsa_overall_stats'] = {
          "percentile_ranks": {
            "field": "safety.nhtsa_overall",
            "values": [metric_val]
          }
        }
        break;
      }
      case 'hp': {
        listingAggQuery['hp_stats'] = {
          "percentile_ranks": {
            "field": "engine.horsepower",
            "values": [metric_val]
          }
        }
        break;
      }
      case 'tq': {
        listingAggQuery['tq_stats'] = {
          "percentile_ranks": {
            "field": "engine.torque",
            "values": [metric_val]
          }
        }
        break;
      }
      case 'recalls': {
        listingAggQuery['recall_stats'] = {
          "percentile_ranks": {
            "field": "recalls.total_cars_affected",
            "values": [metric_val]
          }
        }
        break;
      }
      case 'recallCars': {
        listingAggQuery['recallCars'] = {
          'percentile_ranks': {
            'field': 'recalls.count',
            'values': [metric_val]
          }
        }
        break;
      }
      case 'mpgCity': {
        listingAggQuery['mpgCity'] = {
          'percentile_ranks': {
            'field': 'mpg.city',
            'values': [metric_val]
          }
        }
        break;
      }
      default: {
        throw new Error ('[listingAggQuery] cannot find category', tag.category)
        break;
      }
    }
  })
  return listingAggQuery
}

function filterListingSearchTags (item) {
  return item.category === 'mileage' || item.category === 'max_price' || item.category === 'ext_color' ||
  item.category === 'int_color' || item.category === 'seller_location';
}

function createListingsQuery (baseQuery, tags, sortBy) {
  var obj = {
    "has_child": {
      "type": "listing",
      "query": {"bool":{"filter": []}}
    }
  }
  return obj
}

// tagsQuery: request_body.tags
function preprocess_query (tagsQuery, type) {
  var sortBy, queryBody

  switch (type) {
    case 'categories': {
      sortBy = ESFactory.SortFactory.create ('mileage', 'asc')
      queryBody = ESFactory.QueryFactory.create ('listings', tagsQuery.tags, sortBy)
      queryBody['aggs'] = ESFactory.AggFactory.create ('avgPriceModels')
      return queryBody
    }
    case 'trims': {
      sortBy = ESFactory.SortFactory.create ('engine.horsepower', 'desc')
      queryBody = ESFactory.QueryFactory.create ('trims', tagsQuery.tags, sortBy)
      queryBody['aggs'] = ESFactory.AggFactory.create ('avgPricePerTrim')
      return queryBody
    }
    default: {
      console.log ('[preprocess_query] unrecognized tag: ', type)
      return queryBody
    }
  }
}


// default sort order: mileage
function create_car_query (query, searchItems, carSort, listingSort) {
  var listingsQuery = createListingsQuery (_.filter (searchItems,filterListingSearchTags), listingSort),
  query_body = query
  query_body['sort'] = carSort
  query_body['query'] = {
    'bool': {
      'filter': []
    }
  }
  var push_to_bool_filter = function (obj) {
    query_body['query']['bool']['filter'].push (obj)
  }

  push_to_bool_filter (listingsQuery)
  _.each (searchItems, function (tag) {
    push_to_bool_filter (FiltersFactory.create (tag))
    // switch (tag.category) {
    //   case 'bodyType': {
    //     push_to_bool_filter (termsFilter ('bodyType', tag.value))
    //     break;
    //   }
    //   case 'compressorType': {
    //     push_to_bool_filter (termsFilter ('engine.compressorType', tag.value))
    //     break;
    //   }
    //   case 'cylinder': {
    //     push_to_bool_filter (rangeFilter ('engine.cylinder', 'gte', tag.value))
    //     break;
    //   }
    //   case 'depreciation': {
    //     push_to_bool_filter (rangeFilter ('ownership_costs.depreciation', 'lte', tag.value))
    //     break;
    //   }
    //   case 'displacement': {
    //     push_to_bool_filter (rangeFilter ('engine.displacement', 'gte', tag.value))
    //     break;
    //   }
    //   case 'drivetrain': {
    //     push_to_bool_filter (commonFilter('drivetrain', tag.value))
    //     break;
    //   }
    //   case 'equipments': {
    //     _.each (tag.value, function (equipment_name) {
    //       push_to_bool_filter (commonFilter ('equipments', equipment_name))
    //     })
    //     break;
    //   }
    //   case 'horsepower': {
    //     push_to_bool_filter (rangeFilter ('engine.horsepower', 'gte', tag.value))
    //     break;
    //   }
    //   case 'incentives': {
    //     if (tag.value === true) {
    //       push_to_bool_filter (rangeFilter ('incentives.total_incentives_cnt', 'gt', 0))
    //     }
    //     break;
    //   }
    //   case 'insurance': {
    //     push_to_bool_filter (rangeFilter ('ownership_costs.insurance', 'lte', tag.value))
    //     break;
    //   }
    //   case 'makes': {
    //     push_to_bool_filter (termsFilter ('make', tag.value))
    //     break;
    //   }
    //   case 'mpg': {
    //     push_to_bool_filter (rangeFilter ('mpg.highway', 'gte', tag.value))
    //     break;
    //   }
    //   case 'models': {
    //     push_to_bool_filter (termsFilter ('model', tag.value))
    //     break;
    //   }
    //   case 'recall': {
    //     push_to_bool_filter (rangeFilter ('recalls.count', 'lte', 0))
    //     break;
    //   }
    //   case 'carsRecalled': {
    //     push_to_bool_filter (rangeFilter ('recalls.total_cars_affected', 'gte', tag.value))
    //     break;
    //   }
    //   case 'repairs': {
    //     push_to_bool_filter (rangeFilter ('ownership_costs.repairs', 'lte', tag.value))
    //   }
    //   case 'top_safety': {
    //     push_to_bool_filter (termFilter ('safety.nhtsa_overall', 5))
    //     break;
    //   }
    //   case 'torque': {
    //     push_to_bool_filter (rangeFilter ('engine.torque', 'gte', tag.value))
    //     break;
    //   }
    //   case 'transmission': {
    //     push_to_bool_filter (termsFilter ('transmission.transmissionType', tag.value))
    //     break;
    //   }
    //   case 'years': {
    //     push_to_bool_filter (termsFilter ('year', tag.value))
    //     break;
    //   }
    //   case 'zero_sixty': {
    //     push_to_bool_filter (rangeFilter ('dimensions.zero_sixty', 'lte', tag.value))
    //     break;
    //   }
    //   default: {
    //     console.log ('unrecognized tag category: ', tag.category)
    //     // throw new Error ('cannot have unrecognized tags')
    //   }
    // }
  })

  return query_body
}

var parse_listings = function (data) {
  var payload = data['hits'],
  listings = []
  _.each (payload['hits'], function (trim_result) {
    listings = _.union (listings, trim_result['inner_hits']['listing']['hits']['hits'])
  })
  return {listings: listings, aggs: data['aggregations']}
}

var parse_listings_cnt_price = function (listings_agg) {
  return {
    'avg_price': listings_agg['prices']['avg_price']['value'],
    'count': listings_agg['vin_cnt']['value'],
  }
}


exports.preprocess_query = module.exports.preprocess_query = preprocess_query
exports.create_car_query = module.exports.create_car_query = create_car_query
exports.rank_listing = module.exports.rank_listing = rank_listing

exports.pretty_print = module.exports.pretty_print =  pretty_print
exports.parse_listings = module.exports.parse_listings = parse_listings
exports.parse_listings_cnt_price = module.exports.parse_listings_cnt_price = parse_listings_cnt_price
