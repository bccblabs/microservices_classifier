exports.tc0 = module.exports.tc0 = {
  tags: [
      {category: 'bodyType', value: ['Coupe', 'Sedan']},
      {category: 'compressorType', value: ['turbocharger']},
      {category: 'top_safety'}
  ]
}
exports.tc1 = module.exports.tc1 = {
  tags: [
    {category: 'cylinder', value: 8},
    {category: 'incentives', value: true},
    {category: 'recall', value: 10},
    {category: 'torque', value: 300},
  ]
}
// {category: 'equipments', value: ['automated_manual', 'manual']},
// {category: 'models', value: ['rear wheel drive', 'all wheel drive']},

// ok
// {category: 'horsepower', value: 400},
// {category: 'mileage', value: 1000},
// {category: 'cylinder', value: 8},
// {category: 'incentives', value: true},
// {category: 'recall', value: 1000000},
// {category: 'torque', value: 300},
// {category: 'makes', value: ['bmw', 'audi', 'ferrari', 'dodge', 'ford', 'chevrolet']},
// {category: 'years', value: [2016]},
// {category: 'transmission', value: ['automated_manual', 'manual']},

// failing:
// {category: 'zero_sixty', value: 5},
// {category: 'drivetrain', value: ['rear wheel drive', 'all wheel drive']},

// n.a
// {category: 'max_price', value: 1000000},
// {category: 'depreciation', value: 1000000},
// {category: 'insurance', value: 1000000},
// {category: 'repairs', value: 100000}
