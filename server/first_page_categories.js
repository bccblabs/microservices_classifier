var first_page_categories = [
  {
    topCategory: 'economical',
    placeholders: [
      {
        name: 'incentives',
        tags: [{category: 'incentives', value: {min: 1}}]
      },
      {
        name: '40+ mpg hwy',
        tags: [{category: 'mpg', value: {min: 40}}]
      },
      {
        name: 'edmunds\' cheapest repairs',
        tags: [{category: 'repairs', value: {max: 950}}],

      }
    ],
    searches: [
      {
        name: '200+hp under $15k',
        tags: [
          {category: 'horsepower', value: {min: 200}},
          {category: 'bodyType', value: ["Coupe", "Convertible", "Hatchback"]},
          {category: 'prices', value: {max: 15000}}
        ]
      },
      {
        name: 'cars w/ third row under $15k',
        tags: [
          {category: 'equipments', value: ['third row']},
          {category: 'prices', value: {max: 20000}}
        ]
      },
      {
        name: 'all wheel drive under $15k',
        tags: [
          {category: 'drivetrain', value: ['all wheel drive']},
          {category: 'prices', value: {max: 15000} }
        ]
      },
      {
        name: 'hybrid',
        tags: [
          {category: 'equipments',value: ['hybrid']}
        ]
      },
      {
         name: 'cheap depreciation',
         tags: [{category: 'depreciation', value: {max: 7801}}]
       },
       {
         name: 'cheap insurance',
         tags: [{category: 'insurance', value: {max: 9300}}]
       }
    ]
  },
  {
    topCategory: 'nice cars',
    placeholders: [
      {
        name: 'American Premium',
        tags: [
          {category: 'makes', value: ['lincoln', 'cadillac', 'gmc', 'am']}
        ]
      },
      {
        name: 'Japanese Premium',
        tags: [
          {category: 'makes', value: ['acura', 'infiniti', 'lexus']}
        ]
      },
      {
        name: 'european',
        tags: [{category: 'makes', value: require ('./european_makes.js')}]
      }
    ],
    searches: [
      {
        name: 'British',
        tags: [
          {category: 'makes', value: ['bentley','jaguar','land-rover','mini', 'rolls-royce']}
        ]
      },
      {
        name: 'German',
        tags: [
          {category: 'makes', value: ['audi', 'bmw', 'mercedes-benz', 'porsche']}
        ]
      },
      {
        name: 'Italian',
        tags: [
          {category: 'makes', value: ['ferrari', 'lamborghini', 'fiat']}
        ]
      }
    ]
  },
  {
    topCategory: 'goodies',
    placeholders: [
      {
        name: 'sunroof',
        tags: [
          {category: 'equipments', value: ['sunroof']}
        ]
      },
      {
        name: 'massaging seat',
        tags: [
          {category: 'equipments', value: ['massaging']}
        ]
      },
      {
        name: 'navigation',
        tags: [
          {category: 'equipments', value: ['navigation']
          }
        ]
      }
    ],
    searches: [
        {
          name: 'satellite traffic reporting',
          tags: [
            {
              category: 'equipments',
              value: [
                'traffic'
              ]
            }
          ]
        },
        {
          name: 'all heated',
          tags: [
            {
              category: 'equipments', value: [
              "Heated Passenger Seat",
              "Heated Driver's Seat"]
            }
          ]
        },

        {
          name: 'xenon',
          tags: [
            {
              category: 'equipments',
              value: [
                'xenon'
              ]
            }
          ]
        },
        {
          name: 'moonroof',
          tags: [
            {
              category: 'equipments',
              value: [
                'moonroof'
              ]
            }
          ]
        },
        {
          name: 'leather',
          tags: [
            {
              category: 'equipments',
              value: [
                'leather'
              ]
            }
          ]
        }
    ]
  },

  {
    topCategory: 'mechanical',
    placeholders: [
      {
        name: '8+ cylinders',
        tags: [{category: 'cylinder', value: {min: 8}}]
      },
      {
        name: 'limited-slip differentinal',
        tags: [
          {
            category: 'equipments',
            value: [
              "limited slip"
            ]
          }
        ]
      },
      {
        name: 'front+rear stabilizer bars',
        tags: [
          {
            category: 'equipments',
            value: [
              "Rear Stabilizer Bar",
              "Front Stabilizer Bar",
            ]
          }
        ]
      }
    ],
    searches: [
      {
        name: 'self-adjusting suspensions',
        tags: [
          {
            category: 'equipments',
            value: [
              "Active Suspension",
              "Driver Adjustable Suspension",
              "Self Leveling Suspension"
            ]
          }
        ]
      },
      {
        name: 'supercharged',
        tags: [{category: 'compressorType', value: ['supercharger']}]
      },
      {
        name: 'turbo',
        tags: [{category: 'compressorType', value: ['turbocharger']}]
      },
      {
        name: 'all wheel drive',
        tags: [{category: 'drivetrain', value: ['all wheel drive']}]
      },
      {
        name: 'manual',
        tags: [{category: 'transmission', value: ['manual']}]
      },
      {
        name: 'automatic',
        tags: [{category: 'transmission', value: ['automatic', 'automated_manual']}]
      },
      {
        name: 'front wheel drive',
        tags: [{category: 'drivetrain', value: ['front wheel drive']}]
      },
      {
        name: 'rear wheel drive',
        tags: [{category: 'drivetrain', value: ['rear wheel drive']}]
      }
    ]
  },

  {
    topCategory: 'performance',
    placeholders: [
      {
        name: '300hp+ w/ manual',
        tags: [
          {category: 'horsepower', value: {min: 300}},
          {category: 'transmission', value: ['manual']}
        ]
      },
      {
        name: '4.0L+ displacement',
        tags: [
          {
            category: 'displacement',
            value: {min: 4000}
          }
        ]
      },
      {
        name: '400+ hp',
        tags: [{category: 'horsepower', value: {min: 400}}]
      },
      {
        name: 'bucket seats',
        tags: [
          {
            category: 'equipments',
            value: [
              'bucket'
            ]
          }
        ]
      }
    ]
  },
  {
    topCategory: 'safety',
    placeholders: [
      {
        name: '5/5 nhtsa overall',
        tags: [{category: 'nhtsa_overall' , value: {min: 5}}]
      },
      {
        name: 'no_recalls',
        tags: [{category: 'recalls', value: {max: 0}}]
      },
      {
        name: 'traction+stability control',
        tags: [
          {
            category: 'equipments',
            value: [
              "Traction Control",
              "Stability Control",
            ]
          }
        ]
      }
    ],
    searches: [
      {
        name: 'post collision safety',
        tags: [
          {
            category: 'equipments',
            value: ['post-collision']
          }
        ]
      },
      {
        name: 'knee airbags',
        tags: [
          {category: 'equipments',value: ['knee airbags']}
        ]
      },
      {
        name: '1,000,000+ recalled',
        tags: [
          {category: 'carsRecalled', value: {min: 1000000}}
        ]
      }
    ]
  }
]

exports = module.exports = first_page_categories
