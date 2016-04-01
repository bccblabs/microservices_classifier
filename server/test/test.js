var chai = require ('chai')
var chaihttp = require ('chai-http')
var server = require ('../app')
var should = chai.should()
var simple_test_suite = require ('./json/rangefilter_tc0.js')
chai.use (chaihttp)

describe ('[Test Suit 0] elasticsearch query and aggregations', function () {
    // it('[tc0] => POST /categoryAggregations', function (done){
    //   var tc0 = simple_test_suite['tc0']
    //   chai.request(server)
    //       .post ('/categoryAggregations')
    //       .send ({tags: tc0['tags']})
    //       .end (function (err, res) {
    //           res.should.have.status(200)
    //           res.body.should.be.a('object')
    //           res.body.should.have.property ('avg_price')
    //           res.body.should.have.property ('count')
    //           res.body.count.should.equal (376)
    //           res.body.avg_price.should.equal (43042.88316151203)
    //           done()
    //         })
    // });
    // it ('[tc1] => POST /listingPages', function (done) {
    //   var tc1 = simple_test_suite['tc1']
    //   chai.request (server)
    //       .post ('/listingPages')
    //       .send ({tags: tc1['tags']})
    //       .end (function (err, res) {
    //         res.should.have.status(200)
    //         res.body.should.be.a('object')
    //
    //         res.body.should.have.property ('listings')
    //         res.body.listings.should.be.a('array')
    //
    //         // res.body.should.have.property ('listings')
    //         // res.body.listings.should.be.a('array')
    //         done()
    //       })
    // });
    // it ('[tc2] => POST /searchListings', function (done) {
    //   chai.request (server)
    //       .post ('/searchListings')
    //       .send ({})
    //       .end (function (err, res) {
    //         console.log (JSON.stringify(res.body, null, 2))
    //         res.should.have.status (200)
    //         done()
    //       })
    // });
    //
    // it ('[tc3] => GET /listings', function (done) {
    //   chai.request (server)
    //       .get ('/listings')
    //       .query ({'pageNum': '0'})
    //       .query ({'pageSize': 10})
    //       .query ({'subPageNum': '0'})
    //       .query ({'subPageSize': 3})
    //       .end (function (err, res) {
    //         console.log (JSON.stringify(res.body, null, 2))
    //         res.should.have.status (200)
    //         done()
    //       })
    // })

    it ('[tc0] test query', function (done) {
      chai.request (server)
      .post ('/listings')
      .send (
        { cylinder: { min: 0, max: 12 },
          displacement: { min: 100, max: 10000 },
          horsepower: { min: 0, max: 1000 },
          incentives: { min: 0, max: 1000 },
          torque: { min: 0, max: 1000 },
          prices: { min: 0, max: 1000000 },
          mileage: { min: 0, max: 200000 },
          recalls: { min: 0, max: 10 },
          years: { min: 1900, max: 2017 },
          mpg: { min: 0, max: 100 },
          zero_sixty: { min: 1, max: 10 },
          makes: [],
          models: [],
          trims: [],
          transmission: [],
          compressorType: [],
          drivetrain: [],
          equipments: [],
          bodyType: [],
          sortBy: {
            category: 'engine.horsepower',
            order: 'desc'
          }
      })
      .end (function (err, res) {
        console.log (JSON.stringify(res.body, null, 2))
        res.should.have.status (200)
        done()
      })
    })
    // it ('[tc3] => GET /fetchCategorySearches', function (done) {
    //   chai.request (server)
    //       .get ('/fetchCategorySearches')
    //       .query ({'categoryName': 'top'})
    //       .query ({'pageSize': 10})
    //       .query ({'pageNum': 0})
    //       .end (function (err, res) {
    //         console.log (JSON.stringify(res.body, null, 2))
    //         res.should.have.status (200)
    //         done()
    //       })
    // })
  })
