'use strict'


var FilterInitialState = {
  cylinders: {
    min: 0,
    max: 12,
  },
  distance: {
    min: 0,
    max: 20
  },
  displacement: {
      min: 100,
      max: 10000
  },
  horsepower: {
      min: 0,
      max: 1000
  },
  incentives: {
    min: 0,
    max: 1000
  },
  torque: {
      min: 0,
      max: 1000
  },
  prices: {
    min: 0,
    max: 200000,
  },
  mileage: {
    min: 0,
    max: 200000,
  },
  recalls: {
    min: 0,
    max: 10,
  },
  years: {
    min: 1900,
    max: 2017,
  },
  mpg: {
    min: 5,
    max: 40,
  },
  zero_sixty: {
    min: 1,
    max: 10,
  },
  makes: [],
  models: [],
  transmission: [],
  compressorType: [],
  drivetrain: [],
  equipments: [],
}

exports = module.exports = FilterInitialState
