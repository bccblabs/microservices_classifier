var _ = require ('underscore-node')
var Filters = require ('./es_filters')


var AggFactory = {
  create: function (type) {
    switch (type) {
      case 'makeModelTrims': {
        return {
          prices: {
            "children": {
              "type": "listing"
            },
            "aggs": {
              "prices": {
                "nested": {
                  "path": "prices"
                },
                "aggs": {
                  "avg_price": {
                    "avg": {
                      "field": "prices.price_value"
                    }
                  }
                }
              }
            }
          },
          makes: {
            terms: {
              field: "make",
              size: 100
            },
            aggs: {
              models: {
                terms: {
                  field: "model",
                  missing: "n/a"
                },
                aggs: {
                  trims: {
                    terms: {
                      field: "trim",
                      missing: "n/a"
                    },
                    aggs: {
                      generations: {
                        terms: {
                          field: "generation",
                          missing: "n/a"
                        },
                        aggs: {
                          listings: {
                            children: {
                              type: "listing"
                            },
                            aggs: {
                              prices: {
                                nested: {
                                  path: "prices"
                                },
                                aggs: {
                                  avg_price: {
                                    avg: {
                                      field: "prices.price_value"
                                    }
                                  }
                                }
                              },
                              vin_cnt: {
                                cardinality: {
                                  field: "vin"
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      case 'makeModelYears': {
        return {
          prices: {
            "children": {
              "type": "listing"
            },
            "aggs": {
              "prices": {
                "nested": {
                  "path": "prices"
                },
                "aggs": {
                  "avg_price": {
                    "avg": {
                      "field": "prices.price_value"
                    }
                  }
                }
              }
            }
          },
          makes: {
            terms: {
              field: "make",
              size: 100
            },
            aggs: {
              models: {
                terms: {
                  field: "model",
                  missing: "n/a"
                },
                aggs: {
                  trims: {
                    terms: {
                      field: "trim",
                      missing: "n/a"
                    },
                    aggs: {
                      generations: {
                        terms: {
                          field: "generation",
                          missing: "n/a"
                        },
                        aggs: {
                          years: {
                            terms: {
                              field: "year",
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      case 'avgPriceModels': {
        return {
          prices: {
            nested: {
              path: "prices"
            },
            aggs: {
              avg_price: {
                avg: {
                  field: "prices.price_value"
                }
              }
            }
          },
          models: {
            cardinality: {
              field: "model"
            }
          },
          listings: {
            cardinality: {
              field: "vin"
            }
          }
        }
      }
      case 'avgPricePerTrim': {
        return {
          makes: {
            terms: {
              field: "make",
              size: 100
            },
            aggs: {
              models: {
                terms: {
                  field: "model",
                  missing: "n/a"
                },
                aggs: {
                  trims: {
                    terms: {
                      field: "trim",
                      missing: "n/a"
                    },
                    aggs: {
                      generations: {
                        terms: {
                          field: "generation",
                          missing: "n/a"
                        },
                        aggs: {
                          min_year: {
                            min: {
                              field: 'year'
                            }
                          },
                          max_year: {
                            max: {
                              field: 'year'
                            }
                          },
                          min_recalls: {
                            min: {
                              field: 'recalls.count'
                            }
                          },
                          max_recalls: {
                            max: {
                              field: 'recalls.count'
                            }
                          },
                          min_hp: {
                            min: {
                              field: 'engine.horsepower'
                            }
                          },
                          max_hp: {
                            max: {
                              field: 'engine.horsepower'
                            }
                          },
                          min_tq: {
                            min: {
                              field: 'engine.torque'
                            }
                          },
                          max_tq: {
                            max: {
                              field: 'engine.torque'
                            }
                          },
                          min_mpgcity: {
                            min: {
                              field: 'mpg.city'
                            }
                          },
                          max_mpgcity: {
                            max: {
                              field: 'mpg.city'
                            }
                          },
                          min_mpghighway: {
                            min: {
                              field: 'mpg.highway'
                            }
                          },
                          max_mpghighway: {
                            max: {
                              field: 'mpg.highway'
                            }
                          },
                          min_incentives: {
                            min: {
                              field: 'incentives.total_incentives_cnt'
                            }
                          },
                          max_incentives: {
                            max: {
                              field: 'incentives.total_incentives_cnt'
                            }
                          },
                          listings: {
                            children: {
                              type: "listing"
                            },
                            aggs: {
                              prices: {
                                nested: {
                                  path: "prices"
                                },
                                aggs: {
                                  avg_price: {
                                    avg: {
                                      field: "prices.price_value"
                                    }
                                  }
                                }
                              },
                              vin_cnt: {
                                cardinality: {
                                  field: "vin"
                                }
                              }

                            }
                          }
                        }
                      }

                    }
                  }
                }
              }
            }
          }

        }
      }
    }
  }
}

var FilterFactory = {
  create: function (tag) {
    switch (tag.category) {
      case 'bodyType': {
        return Filters.TermsFilter ('bodyType', tag.value)
      }
      case 'compressorType': {
        return Filters.TermsFilter ('engine.compressorType', tag.value)
      }
      case 'cylinder': {
        return Filters.RangeFilter ('engine.cylinder', tag.value)
      }
      case 'depreciation': {
        return Filters.RangeFilter ('ownership_costs.depreciation', tag.value)
      }
      case 'mileage': {
        return Filters.RangeFilter ('mileage', tag.value)
      }
      case 'displacement': {
        return Filters.RangeFilter ('engine.displacement', tag.value)
      }
      case 'drivetrain': {
        return Filters.CommonFilter ('drivetrain', tag.value)
      }
      case 'equipments': {
        return Filters.CommonFilter  ('equipments', tag.value)
      }
      case 'horsepower': {
        return Filters.RangeFilter ('engine.horsepower', tag.value)
      }
      case 'incentives': {
        return Filters.RangeFilter ('incentives.total_incentives_cnt', tag.value)
      }
      case 'insurance': {
        return Filters.RangeFilter ('ownership_costs.insurance', 'lte', tag.value)
      }
      case 'makes': {
        return Filters.TermsFilter ('make', tag.value)
      }
      case 'mpg': {
        return Filters.RangeFilter ('mpg.highway', tag.value)
      }
      case 'models': {
        return Filters.TermsFilter ('model', tag.value)
      }
      case 'trims': {
        return Filters.TermsFilter ('trim', tag.value)
      }
      case 'prices': {
        var priceRange = Filters.RangeFilter ('prices.price_value', tag.value)
        return Filters.NestedFilter ('prices', undefined, priceRange)
      }
      case 'recalls': {
        return Filters.RangeFilter ('recalls.count', tag.value)
      }
      case 'carsRecalled': {
        return Filters.RangeFilter ('recalls.total_cars_affected', tag.value)
      }
      case 'repairs': {
        return Filters.RangeFilter ('ownership_costs.repairs', tag.value)
      }
      case 'nhtsa_overall': {
        return Filters.RangeFilter ('safety.nhtsa_overall', tag.value)
      }
      case 'torque': {
        return Filters.RangeFilter ('engine.torque', tag.value)
      }
      case 'transmission': {
        return Filters.TermsFilter ('transmission.transmissionType', tag.value)
      }
      case 'years': {
        return Filters.TermsFilter ('year', tag.value)
      }
      case 'zero_sixty': {
        return Filters.RangeFilter ('dimensions.zero_sixty', tag.value)
      }
      case 'location': {
        console.log ('unrecognized tag category: ', tag.category)
        break
      }
      default: {
        console.log ('unrecognized tag category: ', tag.category)
        throw new Error ('cannot have unrecognized tags')
      }
    }
  }
}

var QueryFactory = {
  create: function (type, tags, sortBy) {
    var parentQuery = {has_parent: {parent_type: 'trim', query: {bool: {must: []}}}},

    childQuery = {has_child: {type: "listing", query: {bool: {filter: []}}}}
    query = {_source: 0, size: 0, query: {bool: {filter: []}}}
    if (typeof sortBy !== 'undefined') {
      query['sort'] = sortBy
    }
    switch (type) {
      case 'listings_aggs': {
        if (tags.length === 0) {
          query.query.bool.must.push ({match_all: {}})
        } else {
          _.each (tags, function (tag) {
            if (tag.category === 'prices' || tag.category === 'mileage' || tag.category === 'color') {
              query['query']['bool']['filter'].push (FilterFactory.create(tag))
            } else {
              parentQuery['has_parent']['query']['bool']['must'].push (FilterFactory.create(tag))
            }
          })
          query['query']['bool']['filter'].push (parentQuery)
        }
        return query
      }
      case 'listings': {
        query['_source'] = 1
        query['size'] = 20
        if (tags.length === 0 ) {
          query.query.bool.must.push ({match_all: {}})
          return query
        }
        _.each (tags, function (tag) {
          if (tag.category === 'prices' || tag.category === 'mileage' || tag.category === 'color') {
            query['query']['bool']['must'].push (FilterFactory.create(tag))
          } else {
            parentQuery['has_parent']['query']['bool']['filter'].push (FilterFactory.create(tag))
          }
        })
        query['query']['bool']['filter'].push (parentQuery)
        return query
      }
      case 'trims': {
        query['size'] = 20
        query['_source'] = 0

        _.each (tags, function (tag) {
          if (tag.category === 'prices' || tag.category === 'mileage' || tag.category === 'color') {
            childQuery['has_child']['query']['bool']['filter'].push (FilterFactory.create(tag))
          } else {
            query['query']['bool']['filter'].push (FilterFactory.create(tag))
          }
        })
        // trims doesn't return listings, only the trims and mmtg aggs
        childQuery['has_child']['inner_hits'] = {'size': 0}
        if (childQuery['has_child']['query']['bool']['filter'].length  > 0)
          query['query']['bool']['filter'].push (childQuery)
        return query
      }
    }
  }
}

var SortFactory = {
  create: function (field, order) {
    var sortBy = {}
    sortBy[field] = {missing: "_last", order: order}
    return sortBy
  }
}

exports.AggFactory = module.exports.AggFactory = AggFactory
exports.FilterFactory = module.exports.FilterFactory = FilterFactory
exports.QueryFactory = module.exports.QueryFactory = QueryFactory
exports.SortFactory = module.exports.SortFactory = SortFactory
