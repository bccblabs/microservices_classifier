var chai = require ('chai')
var chaihttp = require ('chai-http')
var server = require ('../app')
var should = chai.should()
var simple_test_suite = require ('./json/rangefilter_tc0.js')
chai.use (chaihttp)

describe ('[Test Suit 0] elasticsearch query and aggregations', function () {
    it('[tc0] => POST /categoryAggregations', function (done){
      var tc0 = simple_test_suite['tc0']
      chai.request(server)
          .post ('/categoryAggregations')
          .send ({tags: tc0['tags']})
          .end (function (err, res) {
              res.should.have.status(200)
              res.body.should.be.a('object')
              res.body.should.have.property ('avg_price')
              res.body.should.have.property ('count')
              res.body.count.should.equal (376)
              res.body.avg_price.should.equal (43042.88316151203)
              done()
            })
    });
    it ('[tc1] => POST /listingPages', function (done) {
      var tc1 = simple_test_suite['tc1']
      chai.request (server)
          .post ('/listingPages')
          .send ({tags: tc1['tags']})
          .end (function (err, res) {
            res.should.have.status(200)
            res.body.should.be.a('object')

            res.body.should.have.property ('listings')
            res.body.listings.should.be.a('array')

            // res.body.should.have.property ('listings')
            // res.body.listings.should.be.a('array')
            done()
          })
    });
    it ('[tc2] => POST /searchListings', function (done) {
      chai.request (server)
          .post ('/searchListings')
          .send ({})
          .end (function (err, res) {
            console.log (JSON.stringify(res.body, null, 2))
            res.should.have.status (200)
            done()
          })
    })
})
