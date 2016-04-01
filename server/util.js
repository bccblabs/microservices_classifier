'use strict'
var _ = require ('underscore-node')
var ESFactory = require ('./es_factory')
var diff = require('changeset')
var filterInitialState = require ('./filterInitialState')

var pretty_print = function (obj) {console.log (JSON.stringify (obj, null, 2))}


var defaultCarSort = {'engine.horsepower': {'order': 'desc'}}

var defaultListingsSort = {"mileage": {"order": "desc"}}

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

function processTagsQuery (tagsQuery, type, sortBy) {
  var queryBody = {}
  switch (type) {
    case 'categories': {
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
      queryBody = ESFactory.QueryFactory.create ('listings', tagsQuery.tags, sortBy)
      queryBody['aggs'] = ESFactory.AggFactory.create ('avgPriceModels')
      return queryBody
    }
    case 'make_model_aggs' : {
      queryBody = ESFactory.QueryFactory.create ('trims', tagsQuery.tags, undefined)
      queryBody['aggs'] = ESFactory.AggFactory.create ('makeModelTrims')
      return queryBody
    }
    default: {
      console.log ('[preprocess_query] unrecognized tag: ', type)
      return queryBody
    }
  }
}

function preprocessQuery (userQuery, queryType) {
  var dirtyFilters = diff (userQuery, filterInitialState),
      tagsQuery = { category: queryType, tags: []},
      sortBy = defaultCarSort,
      categories = []
  _.each (dirtyFilters, function (filterDiff) {
      categories.push (filterDiff.key[0])
  })
  _.each (_.uniq (categories), function (category) {
    switch (category) {
      case 'location':
      case 'selectedMake':
      case 'selectedModel':
      case 'selectedTrim':
      break
      case 'sortBy': {
        sortBy = ESFactory.SortFactory.create (category, userQuery[category])
        break
      }
      default:
        tagsQuery.tags.push ({category: category, value: userQuery[category]})
    }
  })
  return processTagsQuery (tagsQuery, queryType, sortBy)
}

exports.pretty_print = module.exports.pretty_print =  pretty_print
exports.preprocessQuery = module.exports.preprocessQuery = preprocessQuery
exports.processTagsQuery = module.exports.processTagsQuery = processTagsQuery
exports.rank_listing = module.exports.rank_listing = rank_listing
