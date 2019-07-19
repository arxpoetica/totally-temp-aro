import React from 'react'
import { shallow } from 'enzyme'
import { RingEdit } from '../ring-edit'
import RingStatusTypes from '../constants'
import Ring from '../../../common/ring'

const mockSetMap = jest.fn()
const mockSetPosition = jest.fn()
const mockGetPath = jest.fn()
const mockSetOptions = jest.fn()
const mockMarkerConstructor = jest.fn(markerObj => {
  return { ...markerObj,
    setMap: mockSetMap
  }
})
const mockPolylineConstructor = jest.fn(polylineObj => {
  return { ...polylineObj,
    setMap: mockSetMap
  }
})
const mockPolygonConstructor = jest.fn(polygonObj => {
  return { ...polygonObj,
    setMap: mockSetMap,
    setOptions: mockSetOptions,
    getPath: mockGetPath
  }
})
const mockLatLngConstructor = jest.fn(latLngObj => {
  // Return an object with a mock for setPosition(), that will be called by our component
  return latLngObj
})
const mockAddListener = jest.fn()

const globalGoogle = {
  maps: {
    Marker: mockMarkerConstructor,
    Polygon: mockPolygonConstructor,
    Polyline: mockPolylineConstructor,
    LatLng: mockLatLngConstructor,
    event: {
      addListener: mockAddListener
    },
    setOptions: () => {}
  }
}

// may have to change this
//const ring45 = new Ring()

const rings = {
  "45":{
    "id":45,
    "name":"north",
    "nodes":[
      {
        "objectId":"cc7608dc-55a6-4a07-828a-dda582c7a4b3",
        "data":{
          "dataType":"equipment",
          "objectId":"cc7608dc-55a6-4a07-828a-dda582c7a4b3",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.333852,
              47.616451
            ]
          },
          "attributes":{
            "siteIdentifier":"",
            "siteName":"",
            "selectedEquipmentType":"Generic ADSL"
          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":{
            "siteInfo":{
              "siteClli":"",
              "siteName":"",
              "address":"",
              "dpiEnvironment":"",
              "hsiOfficeCode":"",
              "hsiEnabled":true,
              "t1":false,
              "fiberAvailable":false,
              "physicallyLinked":false
            },
            "existingEquipment":[

            ],
            "plannedEquipment":[

            ],
            "notes":""
          },
          "subnetId":null,
          "deploymentType":"PLANNED"
        }
      },
      {
        "objectId":"c17a0dfe-8885-4541-9bac-80f24db79432",
        "data":{
          "dataType":"equipment",
          "objectId":"c17a0dfe-8885-4541-9bac-80f24db79432",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.328187,
              47.573619
            ]
          },
          "attributes":{
            "siteIdentifier":"",
            "siteName":"",
            "selectedEquipmentType":"Generic ADSL"
          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":{
            "siteInfo":{
              "siteClli":"",
              "siteName":"",
              "address":"",
              "dpiEnvironment":"",
              "hsiOfficeCode":"",
              "hsiEnabled":true,
              "t1":false,
              "fiberAvailable":false,
              "physicallyLinked":false
            },
            "existingEquipment":[

            ],
            "plannedEquipment":[

            ],
            "notes":""
          },
          "subnetId":null,
          "deploymentType":"PLANNED"
        }
      },
      {
        "objectId":"351567da-ca1d-43c5-8ca1-d1ebf228b3e6",
        "data":{
          "dataType":"equipment",
          "objectId":"351567da-ca1d-43c5-8ca1-d1ebf228b3e6",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.328187,
              47.562964
            ]
          },
          "attributes":{
            "siteIdentifier":"",
            "siteName":"",
            "selectedEquipmentType":"Generic ADSL"
          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":{
            "siteInfo":{
              "siteClli":"",
              "siteName":"",
              "address":"",
              "dpiEnvironment":"",
              "hsiOfficeCode":"",
              "hsiEnabled":true,
              "t1":false,
              "fiberAvailable":false,
              "physicallyLinked":false
            },
            "existingEquipment":[

            ],
            "plannedEquipment":[

            ],
            "notes":""
          },
          "subnetId":"c17a0dfe-8885-4541-9bac-80f24db79432",
          "deploymentType":"PLANNED"
        }
      }
    ],
    "nodesById":{
      "cc7608dc-55a6-4a07-828a-dda582c7a4b3":{
        "objectId":"cc7608dc-55a6-4a07-828a-dda582c7a4b3",
        "data":{
          "dataType":"equipment",
          "objectId":"cc7608dc-55a6-4a07-828a-dda582c7a4b3",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.333852,
              47.616451
            ]
          },
          "attributes":{
            "siteIdentifier":"",
            "siteName":"",
            "selectedEquipmentType":"Generic ADSL"
          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":{
            "siteInfo":{
              "siteClli":"",
              "siteName":"",
              "address":"",
              "dpiEnvironment":"",
              "hsiOfficeCode":"",
              "hsiEnabled":true,
              "t1":false,
              "fiberAvailable":false,
              "physicallyLinked":false
            },
            "existingEquipment":[

            ],
            "plannedEquipment":[

            ],
            "notes":""
          },
          "subnetId":null,
          "deploymentType":"PLANNED"
        }
      },
      "c17a0dfe-8885-4541-9bac-80f24db79432":{
        "objectId":"c17a0dfe-8885-4541-9bac-80f24db79432",
        "data":{
          "dataType":"equipment",
          "objectId":"c17a0dfe-8885-4541-9bac-80f24db79432",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.328187,
              47.573619
            ]
          },
          "attributes":{
            "siteIdentifier":"",
            "siteName":"",
            "selectedEquipmentType":"Generic ADSL"
          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":{
            "siteInfo":{
              "siteClli":"",
              "siteName":"",
              "address":"",
              "dpiEnvironment":"",
              "hsiOfficeCode":"",
              "hsiEnabled":true,
              "t1":false,
              "fiberAvailable":false,
              "physicallyLinked":false
            },
            "existingEquipment":[

            ],
            "plannedEquipment":[

            ],
            "notes":""
          },
          "subnetId":null,
          "deploymentType":"PLANNED"
        }
      },
      "351567da-ca1d-43c5-8ca1-d1ebf228b3e6":{
        "objectId":"351567da-ca1d-43c5-8ca1-d1ebf228b3e6",
        "data":{
          "dataType":"equipment",
          "objectId":"351567da-ca1d-43c5-8ca1-d1ebf228b3e6",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.328187,
              47.562964
            ]
          },
          "attributes":{
            "siteIdentifier":"",
            "siteName":"",
            "selectedEquipmentType":"Generic ADSL"
          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":{
            "siteInfo":{
              "siteClli":"",
              "siteName":"",
              "address":"",
              "dpiEnvironment":"",
              "hsiOfficeCode":"",
              "hsiEnabled":true,
              "t1":false,
              "fiberAvailable":false,
              "physicallyLinked":false
            },
            "existingEquipment":[

            ],
            "plannedEquipment":[

            ],
            "notes":""
          },
          "subnetId":"c17a0dfe-8885-4541-9bac-80f24db79432",
          "deploymentType":"PLANNED"
        }
      }
    },
    "linkData":[
      {
        "exchangeLinkOid":"74688d18-b724-46e0-85fe-94c10e59b641",
        "fromNode":{
          "objectId":"cc7608dc-55a6-4a07-828a-dda582c7a4b3",
          "data":{
            "dataType":"equipment",
            "objectId":"cc7608dc-55a6-4a07-828a-dda582c7a4b3",
            "geometry":{
              "type":"Point",
              "coordinates":[
                -122.333852,
                47.616451
              ]
            },
            "attributes":{
              "siteIdentifier":"",
              "siteName":"",
              "selectedEquipmentType":"Generic ADSL"
            },
            "networkNodeType":"central_office",
            "networkNodeEquipment":{
              "siteInfo":{
                "siteClli":"",
                "siteName":"",
                "address":"",
                "dpiEnvironment":"",
                "hsiOfficeCode":"",
                "hsiEnabled":true,
                "t1":false,
                "fiberAvailable":false,
                "physicallyLinked":false
              },
              "existingEquipment":[

              ],
              "plannedEquipment":[

              ],
              "notes":""
            },
            "subnetId":null,
            "deploymentType":"PLANNED"
          }
        },
        "toNode":{
          "objectId":"c17a0dfe-8885-4541-9bac-80f24db79432",
          "data":{
            "dataType":"equipment",
            "objectId":"c17a0dfe-8885-4541-9bac-80f24db79432",
            "geometry":{
              "type":"Point",
              "coordinates":[
                -122.328187,
                47.573619
              ]
            },
            "attributes":{
              "siteIdentifier":"",
              "siteName":"",
              "selectedEquipmentType":"Generic ADSL"
            },
            "networkNodeType":"central_office",
            "networkNodeEquipment":{
              "siteInfo":{
                "siteClli":"",
                "siteName":"",
                "address":"",
                "dpiEnvironment":"",
                "hsiOfficeCode":"",
                "hsiEnabled":true,
                "t1":false,
                "fiberAvailable":false,
                "physicallyLinked":false
              },
              "existingEquipment":[

              ],
              "plannedEquipment":[

              ],
              "notes":""
            },
            "subnetId":null,
            "deploymentType":"PLANNED"
          }
        },
        "geom":[
          {
            "lat":47.615651847657574,
            "lng":-122.34712539476902
          },
          {
            "lat":47.6172486212168,
            "lng":-122.32057819988177
          },
          {
            "lat":47.609379275249246,
            "lng":-122.30659314087461
          },
          {
            "lat":47.574416622365305,
            "lng":-122.31492406087142
          },
          {
            "lat":47.572819848806006,
            "lng":-122.34144953471866
          }
        ]
      },
      {
        "exchangeLinkOid":"2b38fc04-6769-4000-8955-5d8d1c1c1e40",
        "fromNode":{
          "objectId":"c17a0dfe-8885-4541-9bac-80f24db79432",
          "data":{
            "dataType":"equipment",
            "objectId":"c17a0dfe-8885-4541-9bac-80f24db79432",
            "geometry":{
              "type":"Point",
              "coordinates":[
                -122.328187,
                47.573619
              ]
            },
            "attributes":{
              "siteIdentifier":"",
              "siteName":"",
              "selectedEquipmentType":"Generic ADSL"
            },
            "networkNodeType":"central_office",
            "networkNodeEquipment":{
              "siteInfo":{
                "siteClli":"",
                "siteName":"",
                "address":"",
                "dpiEnvironment":"",
                "hsiOfficeCode":"",
                "hsiEnabled":true,
                "t1":false,
                "fiberAvailable":false,
                "physicallyLinked":false
              },
              "existingEquipment":[

              ],
              "plannedEquipment":[

              ],
              "notes":""
            },
            "subnetId":null,
            "deploymentType":"PLANNED"
          }
        },
        "toNode":{
          "objectId":"351567da-ca1d-43c5-8ca1-d1ebf228b3e6",
          "data":{
            "dataType":"equipment",
            "objectId":"351567da-ca1d-43c5-8ca1-d1ebf228b3e6",
            "geometry":{
              "type":"Point",
              "coordinates":[
                -122.328187,
                47.562964
              ]
            },
            "attributes":{
              "siteIdentifier":"",
              "siteName":"",
              "selectedEquipmentType":"Generic ADSL"
            },
            "networkNodeType":"central_office",
            "networkNodeEquipment":{
              "siteInfo":{
                "siteClli":"",
                "siteName":"",
                "address":"",
                "dpiEnvironment":"",
                "hsiOfficeCode":"",
                "hsiEnabled":true,
                "t1":false,
                "fiberAvailable":false,
                "physicallyLinked":false
              },
              "existingEquipment":[

              ],
              "plannedEquipment":[

              ],
              "notes":""
            },
            "subnetId":"c17a0dfe-8885-4541-9bac-80f24db79432",
            "deploymentType":"PLANNED"
          }
        },
        "geom":[
          {
            "lat":47.573618229499516,
            "lng":-122.34150243010788
          },
          {
            "lat":47.573618229499516,
            "lng":-122.31487156989215
          },
          {
            "lat":47.56296322978718,
            "lng":-122.31487427839141
          },
          {
            "lat":47.56296322978718,
            "lng":-122.34149972160861
          }
        ]
      }
    ]
  },
  "47":{
    "id":47,
    "name":"south",
    "nodes":[
      {
        "objectId":"2f6725fb-7485-4802-8498-c3be9d0965c6",
        "data":{
          "dataType":"equipment",
          "objectId":"2f6725fb-7485-4802-8498-c3be9d0965c6",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.3884942,
              47.57561259
            ]
          },
          "attributes":{

          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":null,
          "subnetId":null,
          "deploymentType":"PLANNED"
        }
      },
      {
        "objectId":"7dae3630-78b8-46b6-afaf-ebab92c61e7f",
        "data":{
          "dataType":"equipment",
          "objectId":"7dae3630-78b8-46b6-afaf-ebab92c61e7f",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.3816604,
              47.54819903
            ]
          },
          "attributes":{

          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":null,
          "subnetId":null,
          "deploymentType":"PLANNED"
        }
      }
    ],
    "nodesById":{
      "2f6725fb-7485-4802-8498-c3be9d0965c6":{
        "objectId":"2f6725fb-7485-4802-8498-c3be9d0965c6",
        "data":{
          "dataType":"equipment",
          "objectId":"2f6725fb-7485-4802-8498-c3be9d0965c6",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.3884942,
              47.57561259
            ]
          },
          "attributes":{

          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":null,
          "subnetId":null,
          "deploymentType":"PLANNED"
        }
      },
      "7dae3630-78b8-46b6-afaf-ebab92c61e7f":{
        "objectId":"7dae3630-78b8-46b6-afaf-ebab92c61e7f",
        "data":{
          "dataType":"equipment",
          "objectId":"7dae3630-78b8-46b6-afaf-ebab92c61e7f",
          "geometry":{
            "type":"Point",
            "coordinates":[
              -122.3816604,
              47.54819903
            ]
          },
          "attributes":{

          },
          "networkNodeType":"central_office",
          "networkNodeEquipment":null,
          "subnetId":null,
          "deploymentType":"PLANNED"
        }
      }
    },
    "linkData":[
      {
        "exchangeLinkOid":"02585092-5377-4867-8573-6fc9e0374283",
        "fromNode":{
          "objectId":"2f6725fb-7485-4802-8498-c3be9d0965c6",
          "data":{
            "dataType":"equipment",
            "objectId":"2f6725fb-7485-4802-8498-c3be9d0965c6",
            "geometry":{
              "type":"Point",
              "coordinates":[
                -122.3884942,
                47.57561259
              ]
            },
            "attributes":{

            },
            "networkNodeType":"central_office",
            "networkNodeEquipment":null,
            "subnetId":null,
            "deploymentType":"PLANNED"
          }
        },
        "toNode":{
          "objectId":"7dae3630-78b8-46b6-afaf-ebab92c61e7f",
          "data":{
            "dataType":"equipment",
            "objectId":"7dae3630-78b8-46b6-afaf-ebab92c61e7f",
            "geometry":{
              "type":"Point",
              "coordinates":[
                -122.3816604,
                47.54819903
              ]
            },
            "attributes":{

            },
            "networkNodeType":"central_office",
            "networkNodeEquipment":null,
            "subnetId":null,
            "deploymentType":"PLANNED"
          }
        },
        "geom":[
          {
            "lat":47.57412127634163,
            "lng":-122.40162517408658
          },
          {
            "lat":47.577102404980124,
            "lng":-122.37536247831957
          },
          {
            "lat":47.54968884569975,
            "lng":-122.36853554842219
          },
          {
            "lat":47.54670771706117,
            "lng":-122.39478450509256
          }
        ]
      }
    ]
  }
}

test('With no rings', () => {
  const mockSetSelectedRingId = jest.fn()
  const component = shallow(
    <RingEdit rings={{}}
      setSelectedRingId={mockSetSelectedRingId}
    />
  )
  expect(component).toMatchSnapshot()
})
/*
test("With rings, can't edit", () => {
  global.google = globalGoogle
  const mockSetSelectedRingId = jest.fn()
  const mockGoogleMaps = {}
  
  const component = shallow(
    <RingEdit rings={rings}
      setSelectedRingId={mockSetSelectedRingId}
      map={{googleMaps: mockGoogleMaps}}
      status={RingStatusTypes.COMPLETED}
    />
  )
  expect(component).toMatchSnapshot()
})
*/

