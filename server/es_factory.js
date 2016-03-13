var Filters = require ('./es_filters')
var AggFactory = {
  create: function (type) {
    switch (type) {
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
      case 'avgPriceVinsPerTrim': {
        return {
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
}
var _ = require ('underscore-node')
var FilterFactory = {
  create: function (tag) {
    // console.log (tag)
    switch (tag.category) {
      case 'bodyType': {
        return Filters.TermsFilter ('bodyType', tag.value)
      }
      case 'compressorType': {
        return Filters.TermsFilter ('engine.compressorType', tag.value)
      }
      case 'cylinder': {
        return Filters.RangeFilter ('engine.cylinder', 'gte', tag.value)
      }
      case 'depreciation': {
        return Filters.RangeFilter ('ownership_costs.depreciation', 'lte', tag.value)
      }
      case 'displacement': {
        return Filters.RangeFilter ('engine.displacement', 'gte', tag.value)
      }
      case 'drivetrain': {
        return Filters.CommonFilter ('drivetrain', tag.value)
      }
      case 'equipments': {
        return Filters.CommonFilter  ('equipments', tag.value)
      }
      case 'horsepower': {
        return Filters.RangeFilter ('engine.horsepower', 'gte', tag.value)
      }
      case 'has_incentives': {
        return Filters.RangeFilter ('incentives.total_incentives_cnt', 'gt', 0)
      }
      case 'insurance': {
        return Filters.RangeFilter ('ownership_costs.insurance', 'lte', tag.value)
      }
      case 'makes': {
        return Filters.TermsFilter ('make', tag.value)
      }
      case 'mpg': {
        return Filters.RangeFilter ('mpg.highway', 'gte', tag.value)
      }
      case 'models': {
        return Filters.TermsFilter ('model', tag.value)
      }
      case 'prices': {
        var priceRange = Filters.RangeFilter ('prices.price_value', 'lte', tag.value)
        return Filters.NestedFilter ('prices', undefined, priceRange)
      }
      case 'recall': {
        return Filters.RangeFilter ('recalls.count', 'lte', 0)
      }
      case 'carsRecalled': {
        return Filters.RangeFilter ('recalls.total_cars_affected', 'gte', tag.value)
      }
      case 'repairs': {
        return Filters.RangeFilter ('ownership_costs.repairs', 'lte', tag.value)
      }
      case 'top_safety': {
        return Filters.TermFilter ('safety.nhtsa_overall', 5)
      }
      case 'torque': {
        return Filters.RangeFilter ('engine.torque', 'gte', tag.value)
      }
      case 'transmission': {
        return Filters.TermsFilter ('transmission.transmissionType', tag.value)
      }
      case 'years': {
        return Filters.TermsFilter ('year', tag.value)
      }
      case 'zero_sixty': {
        return Filters.RangeFilter ('dimensions.zero_sixty', 'lte', tag.value)
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
    switch (type) {
      case 'listings': {
        var parentQuery = {has_parent: {parent_type: 'trim', query: {bool: {must: []}}}},
            query = {'_source': 0,'size': 0,'query': {'bool': {'must': []}}}

        _.each (tags, function (tag) {
            // console.log (tag)
            if (tag.category === 'prices' || tag.category === 'mileage' || tag.category === 'color') {
              query['query']['bool']['must'].push (FilterFactory.create(tag))
            } else {
              parentQuery['has_parent']['query']['bool']['must'].push (FilterFactory.create(tag))
            }
        })
        query['query']['bool']['must'].push (parentQuery)
        return query
      }
      case 'trims': {
        return {
          '_source': 0,
          'size': 50000
        }
      }
    }
  }
}

var SortFactory = {
  create: function (field, order) {
    var sortBy = {}
    sortBy[field] = {order: order}
    return sortBy
  }
}

exports.AggFactory = module.exports.AggFactory = AggFactory
exports.FilterFactory = module.exports.FilterFactory = FilterFactory
exports.QueryFactory = module.exports.QueryFactory = QueryFactory
exports.SortFactory = module.exports.SortFactory = SortFactory
