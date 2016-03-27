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



app.get ('/listings', function (req, res) {
  console.log ('[listings req params]',req.query)
      var pageNum = req.query['pageNum'],
          pageSize = req.query['pageSize'],
          subPageNum = req.query['subPageNum'],
          subPageSize = req.query['subPageSize']

  Promise.map (first_page_categories.slice (pageNum * pageSize, (pageNum+1) * pageSize),
    function (categoryQuery) {
      var placeholders = categoryQuery.placeholders

      if (categoryQuery.searches !== undefined)
        searches = categoryQuery.searches.slice (subPageNum * subPageSize, (subPageNum + 1) * subPageSize)

      if (subPageNum > 0)
        placeholder = []

      var placeholder_promises = Promise.map (placeholders, function (placeholder_query) {
          var query_body = util.processTagsQuery (placeholder_query, 'categories')
          var query_promise = Promise.resolve (client.search ({index: 'car', body: query_body}))
          return query_promise.then (function (query_res) {
            return {
                name: placeholder_query.name,
                models_cnt: format_numerals (query_res['aggregations']['models']['value']),
                listings_cnt: format_numerals (query_res['aggregations']['listings']['value']),
                avg_price: format_numerals (query_res['aggregations']['prices']['avg_price']['value']),
                tags: placeholder_query.tags
            }
          })
      })
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

      return Promise.join (placeholder_promises, searches_promises, function (placeholder_res, search_res) {
        return {
          category: categoryQuery.topCategory,
          placeholders: placeholder_res,
          searches: search_res,
          filters: categoryQuery.filters
        }
      })
    })
    .then (function (data_array) {
      res.status (200).json (data_array)
    })
    .error (function (err) {
      res.status (500).json (err)
    })
})

app.post ('/makeModelAggs', function (req, res) {
  var es_query = util.preprocessQuery (req.body, 'make_model_aggs'),
      search_promise = Promise.resolve (client.search ({index: 'car', body: es_query}))

  search_promise.then (function (response) {
    var formattedAggs = { makes: {

    }}
    res.status (200).json ({'topLevelAggs': formattedAggs})
    })
    .error (function (err) {
      res.status (500).json (err)
    })
})

app.post ('/listings', function (req, res) {
    var es_query = util.preprocessQuery (req.body, 'listings'),
        search_promise = Promise.resolve (client.search ({index: 'car', body: es_query}))

    search_promise.then (function (response) {
      listings = _.pluck (response.hits.hits, '_source')
      console.log ('fetched ',listings.length, ' listings' )
      res.status (200).json ({'listings': listings})
    })
    .error (function (error) {
      res.status (500).json (error)
    })
})


exports = module.exports = server
