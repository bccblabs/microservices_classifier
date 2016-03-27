var first_page_categories =
[
  {
    topCategory: "Everyday Cars",
    filters: [
      {
        title: "Filter By MPG, Types, Transmission and Drivetrain",
        tags: [
          {
            name: "Highway MPG",
            category: "mpg"
          },
          {
            name: "Body Types",
            category: 'bodyType',
            value: [
              'Sedan',
              'Coupe',
              'Convertible',
              'Hatchback',
              'Truck',
              'Van',
              'Wagon'
            ]
          },
          {
            name: "Drive Trains",
            category: "drivetrain",
            value: ["Front Wheel Drive", "Rear Wheel Drive", "All Whell Drive"]
          },
          {
            name: "Transmission",
            category: "transmission",
            value: ["Automatic", "Manual"]
          }

        ]
      }
    ],
    placeholders: [
      {
        name: "40+ Highway MPG",
        tags: [{category: "mpg", value: {min: 40}}]
      },
      {
        name: "Cars with Incentives",
        tags: [{category: "incentives", value: {min: 1}}]
      },
      {
        name: "Edmunds\" Cheapest Repairs",
        tags: [{category: "repairs", value: {max: 950}}]

      },
      {
        name: "Edmund\"s Cheapest Depreciation",
        tags: [{category: "depreciation", value: {max: 7801}}]
      },
      {
        name: "Edmunds\"s Cheapest Insurance",
        tags: [{category: "insurance", value: {max: 9300}}]
      }
    ],
    searches: [
      {
        name: "200+hp < $15k",
        tags: [
          {category: "horsepower", value: {min: 200}},
          {category: "bodyType", value: ["Coupe", "Convertible", "Hatchback"]},
          {category: "prices", value: {max: 15000}}
        ]
      },
      {
        name: "Third Row < $15k",
        tags: [
          {category: "equipments", value: ["third row"]},
          {category: "prices", value: {max: 20000}}
        ]
      },
      {
        name: "AWD < $15k",
        tags: [
          {category: "drivetrain", value: ["all wheel drive"]},
          {category: "prices", value: {max: 15000} }
        ]
      },
      {
        name: "Hybrid < $15k",
        tags: [
          {category: "equipments",value: ["hybrid"]}
        ]
      }
    ]
  },
  {
    topCategory: "Nice cars",
    placeholders: [
      {
        name: "American Premium",
        tags: [
          {category: "makes", value: ["lincoln", "cadillac", "gmc", "am"]}
        ]
      },
      {
        name: "European Premium",
        tags: [{category: "makes", value: require ("./european_makes.js")}]
      },
      {
        name: "Japanese Premium",
        tags: [
          {category: "makes", value: ["acura", "infiniti", "lexus"]}
        ]
      }
    ],
    searches: [
      {
        name: "British",
        tags: [
          {category: "makes", value: ["bentley","jaguar","land-rover","mini", "rolls-royce"]}
        ]
      },
      {
        name: "German",
        tags: [
          {category: "makes", value: ["audi", "bmw", "mercedes-benz", "porsche"]}
        ]
      },
      {
        name: "Italian",
        tags: [
          {category: "makes", value: ["ferrari", "lamborghini", "fiat"]}
        ]
      }
    ],
    filters: [
    ]
  },
  {
    topCategory: "More Safety and Recalls Categories",
    filters: [
      {
        title: "Recalls and Safety Filters",
        tags: [
          {
            name: "Safety",
            category: "equipments",
            value: ["Front Airbags", "Rear Airbags", "Curtain Airbags", "Traction Control", "Post Collision System", "Stability Control", "Night Vision"]
          },
          {
            name: "Recalls",
            category: "recalls",
            value: ["No Recalls", "1-5 Recalls", "5-10 Recalls", "10+ Recalls"]
          },
          {
            name: "NHTSA Overall Safety Rating",
            category: "nhtsa_overall",
            value: [3,4,5]
          }
        ]
      }
    ],
    placeholders: [
      {
        name: "5/5 NHTSA Overall Ratings",
        tags: [{category: "nhtsa_overall" , value: {min: 5}}]
      },
      {
        name: "Never Recalled",
        tags: [{category: "recalls", value: {max: 0}}]
      },
      {
        name: "Both Traction and Stability Control",
        tags: [
          {
            category: "equipments",
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
        name: "Post Collision Safety",
        tags: [
          {
            category: "equipments",
            value: ["post-collision"]
          }
        ]
      },
      {
        name: "Airbags",
        tags: [
          {category: "equipments",value: ["knee airbags"]}
        ]
      },
      {
        name: "Night Vision",
        tags: [
          {category: "equipments", value: ["Night"]}
        ]
      }
    ]
  },

    {
      topCategory: "More Cars By Equpments",
      placeholders: [
        {
          name: "Sunroof",
          tags: [
            {category: "equipments", value: ["sunroof"]}
          ]
        },
        {
          name: "Massaging Seats",
          tags: [
            {category: "equipments", value: ["massaging"]}
          ]
        },
        {
          name: "Navigation System",
          tags: [
            {category: "equipments", value: ["navigation"]}
          ]
        }
      ],
      filters: [
        {
          title: 'All Equipments',
          tags: [
            {
              name: "Convenience & Luxury",
              category: "equipments",
              value: ["Navigation", "Satellite Traffic Information", "Moonroof", "Sunroof", "Massaging Seats", "Power Seats"]
            },
            {
              name: "Sport Equipments",
              category: "equipments",
              value: ["Bucket Seats", "19\"+ rims", "Front Stabilizer Bar", "Rear Stabilizer Bar", "Limited Slip Differential"]
            }
          ]
        }
      ],
      searches: [
        {
          name: "Climate Control",
          tags: [
            {
              category: "equipments",
              value: [
                "climate"
              ]
            }
          ]
        },
        {
          name: "Satellite Traffic Reporting",
          tags: [
            {
              category: "equipments",
              value: [
                "traffic"
              ]
            }
          ]
        },
        {
          name: "Heated Seat +",
          tags: [
            {
              category: "equipments", value: [
                "Heated"
              ]
            }
          ]
        },

        {
          name: "Xenon Headlights",
          tags: [
            {
              category: "equipments",
              value: [
                "xenon"
              ]
            }
          ]
        },
        {
          name: "Moonroof",
          tags: [
            {
              category: "equipments",
              value: [
                "moonroof"
              ]
            }
          ]
        },
        {
          name: "Leather Seats +",
          tags: [
            {
              category: "equipments",
              value: [
                "leather"
              ]
            }
          ]
        }
      ]
    },
    {
    topCategory: "Find cars by more mechanical equipments",
    filters: [
      {
        title: 'Performance Filters',
        tags: [
          {
            name: "Zero Sixty (s)",
            category: "zero_sixty",
          },
          {
            name: "Horsepower (hp)",
            category: "horsepower",
          },
          {
            name: "Torque (lb/ft)",
            category: "torque",
          },
          {
            name: "Engine Compressor",
            category: "compressorType",
            value: ["Turbocharger", "Supercharger", "Naturally Aspirated"]
          },
          {
            name: "Engine Cylinders",
            category: "cylinder",
          }
        ]
      }
    ],
    placeholders: [
      {
        name: "300hp+ w/ Manual Transmission",
        tags: [
          {category: "horsepower", value: {min: 300}},
          {category: "transmission", value: ["manual"]},
          {category: "bodyType", value: ["Coupe", "Sedan", "Hatchback", "Convertible", "Wagon"]}
        ]
      },
      {
        name: "4.0L+ Displacement",
        tags: [
          {
            category: "displacement",
            value: {min: 4000}
          }
        ]
      },
      {
        name: "400+ Engine HP",
        tags: [{category: "horsepower", value: {min: 400}}]
      },
      {
        name: "Bucket Seats",
        tags: [
          {
            category: "equipments",
            value: [
              "bucket"
            ]
          }
        ]
      },
      {
        name: "8+ Cylinders",
        tags: [{category: "cylinder", value: {min: 8}}]
      },
      {
        name: "Limited-Slip Differentinal",
        tags: [
          {
            category: "equipments",
            value: [
              "limited slip"
            ]
          }
        ]
      },
      {
        name: "Front and Rear Stabilizer Bars",
        tags: [
          {
            category: "equipments",
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
        name: "Adjustable Suspensions",
        tags: [
          {
            category: "equipments",
            value: [
              "Active Suspension",
              "Driver Adjustable Suspension",
              "Self Leveling Suspension"
            ]
          }
        ]
      },
      {
        name: "Supercharged",
        tags: [{category: "compressorType", value: ["supercharger"]}]
      },
      {
        name: "Turbo",
        tags: [{category: "compressorType", value: ["turbocharger"]}]
      },
      {
        name: "All Wheel Drive",
        tags: [{category: "drivetrain", value: ["all wheel drive"]}]
      },
      {
        name: "Manual",
        tags: [{category: "transmission", value: ["manual"]}]
      },
      {
        name: "Rear Wheel Drive",
        tags: [{category: "drivetrain", value: ["rear wheel drive"]}]
      }
    ]
  }

]

exports = module.exports = first_page_categories
