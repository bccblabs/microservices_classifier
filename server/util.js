'use strict'
var _ = require ('underscore-node')
var ESFactory = require ('./es_factory')
var filterInitialState = require ('./filterInitialState')

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
      case 'horsepower': {
        listingAggQuery['hp_stats'] = {
          "percentile_ranks": {
            "field": "engine.horsepower",
            "values": [metric_val]
          }
        }
        break;
      }
      case 'torque': {
        listingAggQuery['tq_stats'] = {
          "percentile_ranks": {
            "field": "engine.torque",
            "values": [metric_val]
          }
        }
        break;
      }
      case 'carsRecalled': {
        listingAggQuery['recall_stats'] = {
          "percentile_ranks": {
            "field": "recalls.total_cars_affected",
            "values": [metric_val]
          }
        }
        break;
      }
      case 'recalls': {
        listingAggQuery['recallCars'] = {
          'percentile_ranks': {
            'field': 'recalls.count',
            'values': [metric_val]
          }
        }
        break;
      }
      case 'mpg': {
        listingAggQuery['mpg'] = {
          'percentile_ranks': {
            'field': 'mpg.highway',
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

// tagsQuery: request_body.tags
function preprocess_query (tagsQuery, type) {
  var sortBy, queryBody

  switch (type) {
    case 'categories': {
      sortBy = ESFactory.SortFactory.create ('mileage', 'asc')
      queryBody = ESFactory.QueryFactory.create ('listings_aggs', tagsQuery.tags, sortBy)
      queryBody['aggs'] = ESFactory.AggFactory.create ('avgPriceModels')
      return queryBody
    }
    case 'trims': {
      sortBy = ESFactory.SortFactory.create ('engine.horsepower', 'desc')
      queryBody = ESFactory.QueryFactory.create ('trims', tagsQuery.tags, sortBy)
      queryBody['aggs'] = ESFactory.AggFactory.create ('avgPricePerTrim')
      return queryBody
    }
    case 'listings': {
      sortBy = ESFactory.SortFactory.create ('engine.horsepower', 'desc')
      queryBody = ESFactory.QueryFactory.create ('listings', tagsQuery.tags, sortBy)
      queryBody['aggs'] = ESFactory.AggFactory.create ('avgPriceModels')
    }
    default: {
      console.log ('[preprocess_query] unrecognized tag: ', type)
      return queryBody
    }
  }
}


exports.preprocess_query = module.exports.preprocess_query = preprocess_query
exports.rank_listing = module.exports.rank_listing = rank_listing

exports.pretty_print = module.exports.pretty_print =  pretty_print
