var first_page_categories =
{
  'top':  {
      searches: [
        {
          name: "40+ Highway MPG",
          tags: [{category: "mpg", value: {min: 40}}]
        },
        {
          name: "Cars with Incentives",
          tags: [{category: "incentives", value: {min: 1}}]
        },
        {
          name: "No Recalls",
          tags: [{category: "recalls", value: {max: 0}}]
        },
        {
          name: "300+hp",
          tags: [
            {category: "horsepower", value: {min: 200}},
            {category: "bodyType", value: ["Coupe", "Convertible", "Hatchback"]},
          ]
        },
        {
          name: "Third Row Seats",
          tags: [
            {category: "equipments", value: ["third row"]},
          ]
        },
        {
          name: "All Wheel Drive",
          tags: [
            {category: "drivetrain", value: ["all wheel drive"]},
          ]
        },
        {
          name: "Hybrid",
          tags: [
            {category: "equipments",value: ["hybrid"]}
          ]
        },
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
        },
        {
          name: 'Japanese',
          tag: [
            {category: "makes", value: ["acura", "infiniti", "lexus"]}
          ]
        }
      ]
  },
  'convenience':  {
      name: "Convenience and Luxury Equipments",
      searches: [
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
        },
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
        },
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
  'mechanical':  {
      name: "Mechanical Equipments",
      searches: [
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
        },
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
        },
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
        }
      ]
  }
}
exports = module.exports = first_page_categories
