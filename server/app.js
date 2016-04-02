var app = require ('express')(),
    bodyParser = require ('body-parser')
    app.use(bodyParser.json({limit: '50mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb'}));

var server = require ('http').createServer(app).listen(8080),
    util = require ('./util'),
    parser = require ('./parser'),
    _ = require ('underscore-node'),
    async = require ('async'),
    request = require ('request'),
    fs = require ('fs'),
    request = require ('request-promise'),
    Promise = require ('bluebird'),
    numeral = require ('numeral'),
    normalizr = require ('normalizr'),
    filterInitialState = require ('./FilterInitialState'),
    first_page_categories = require ('./first_page_categories'),
    format_numerals = function (number) {
      return numeral (number).format ('0,0')
    }

console.log ("[* app.js] server starts listening on 8080")

var es = require ('elasticsearch')
var client = new es.Client ({host: 'localhost:9200', log: 'error', path: './log/testing.log'})
client.ping ({requestTimeout: Infinity, hello: 'es!'})
        .then (
        function () {
        }, function (e) {
            console.trace ('es server down')
        });

app.post ('/makeModelAggs', function (req, res) {
  var es_query = util.preprocessQuery (req.body, 'make_model_aggs'),
      search_promise = Promise.resolve (client.search ({index: 'car', body: es_query}))
  search_promise.then (function (response) {
    var formattedAggs = { makes: []}
    _.each (response.aggregations.makes.buckets, function (make_object) {
      var make_level_object = {key: make_object.key, models: []}
      _.each (make_object.models.buckets, function (model_object) {
        var model_level_object = {key: model_object.key, trims: []}
          _.each (model_object.trims.buckets, function (trim_object) {
            model_level_object.trims.push ({'key': trim_object.key})
        })
        make_level_object.models.push (model_level_object)
      })
      formattedAggs.makes.push (make_level_object)
    })
    console.log (formattedAggs)
    res.status (200).json ({
        'makes': formattedAggs.makes,
        'avg_price_aggregation': response.aggregations.prices.prices.avg_price.value
      })
    })
    .error (function (err) {
      res.status (500).json (err)
    })
})

app.get ('/fetchCategorySearches', function (req, res) {
  var categoryName = req.query['categoryName'],
      pageNum = req.query['pageNum'],
      pageSize = req.query['pageSize'],
      categoryQuery = first_page_categories[categoryName]

    console.log (categoryName)
    searches = categoryQuery.searches
    var searches_promises = Promise.map (searches, function (sub_query) {
      var query_body = util.processTagsQuery (sub_query, 'categories')
      var query_promise = Promise.resolve (client.search ({index: 'car', body: query_body }))
      return query_promise.then (function (query_res) {
        return {
            name: sub_query.name,
            models_cnt: format_numerals (query_res['aggregations']['models']['value']),
            listings_cnt: format_numerals (query_res['aggregations']['listings']['value']),
            avg_price: format_numerals (query_res['aggregations']['prices']['avg_price']['value']),
            tags: sub_query.tags
        }
      })
    })

    searches_promises.all().then (function (data) {
      console.log (data)
      res.status(200).json({aggs: data})
    })
    .error (function (err) {
      res.status (500).json ({error: errs})
    })

})


app.post ('/trims', function (req, res) {
  var trims_promise = util.createTrimsPromise (req.body)
  Promise.resolve (trims_promise)
         .then (function (resp) {
           var aggs = resp.aggregations.makes.buckets
           var trimInfo = _.map (resp.hits.hits, function (trimDoc) {
             console.log (trimDoc)
                            var make = _.first(trimDoc.fields.make),
                                model = _.first(trimDoc.fields.model),
                                trim = _.first(trimDoc.fields.trim),
                                generation = _.first(trimDoc.fields.generation),
                                makeAgg = _.find (aggs, function (makeKey) {return makeKey.key === make}),
                                modelAgg = _.find (makeAgg.models.buckets, function (modelKey) {return modelKey.key === model})
                            if (typeof modelAgg === 'undefined') {
                              return {
                                make: make,
                                model: model,
                                trim: trim,
                                generation:generation
                              }
                            }
                            var trimAgg = _.find (modelAgg.trims.buckets, function (trimKey) {return trimKey.key === trim})
                            if (typeof trimAgg === 'undefined') {
                              return {
                                make: make,
                                model: model,
                                trim: trim,
                                generation:generation
                              }
                            }
                            var genAgg = _.find (trimAgg.generations.buckets, function (genKey) {return genKey.key === generation})

                            if (typeof genAgg === 'undefined') {
                              genAgg = _.first (trimAgg.generations.buckets)
                            }

                            listings_stats = genAgg.listings
                            return {
                              make: make,
                              model: model,
                              trim: trim,
                              generation:generation,
                              hp: util.renderRange (genAgg.min_hp.value, genAgg.max_hp.value, 'HP'),
                              tq: util.renderRange (genAgg.min_tq.value, genAgg.max_tq.value, 'LB/FT'),
                              mpg_city: util.renderRange (genAgg.min_mpgcity.value, genAgg.max_mpgcity.value, 'MPG'),
                              mpg_highway: util.renderRange (genAgg.min_mpghighway.value, genAgg.max_mpghighway.value, 'MPG'),
                              recalls: util.renderRange (genAgg.min_recalls.value, genAgg.max_recalls.value, 'Recalls'),
                              yearRange: util.renderRange (genAgg.min_year.value, genAgg.max_year.value, ''),
                              incentives: util.renderRange (genAgg.min_incentives.value, genAgg.max_incentives.value, 'incentives'),
                              avgPrice: listings_stats.prices.avg_price.value,
                              listingsCnt: listings_stats.vin_cnt.value,
                            }
                          })
            res.status(200).send ({trimHighlight: _.uniq (trimInfo, false, function (field) {return JSON.stringify (field)})})
          })
         .error (function (error) {res.status(500).send (error)})
})

app.post ('/listings', function (req, res) {
  var search_promise = util.createListingsPromise (req.body)
  Promise.resolve (search_promise)
          .then (function (response) {
            _.each (response.hits.hits, function (model) {
              _.each (model.inner_hits.listing.hits, function (listing) {
                console.log (typeof listing)
              })
            })
            res.status (200).json (response)
          })
          .error (function (error) {res.status(500).json (error)})
})


exports = module.exports = server
