// Mock service to simulate calls to aro-service while the backend is being built
// Delete when aro-service is up and running

app.service('mockResourceService', ['$http', ($http) => {

  var mockResourceService = {}

  mockResourceService.get = (url) => {

    var components = url.split('/')
    if (url === '/service/odata/resourcetypeentity') {
      return mockResourceService.getResourceTypeEntity()
    } else if (components.length === 4) {
      // Assume that we have a GET on /service/v1/arpu-manager, etc
      if (components[3] === 'arpu-manager') {
        return $http.get(url) // Currently the only one implemented
      } else {
        return Promise.resolve({
          id: Math.round(Math.random() * 100),
          name: `Default ${components[3]} manager`,
          description: `Default ${components[3]} manager`
        })
      }
    }
  }

  mockResourceService.getResourceTypeEntity = () => {
    return Promise.resolve({
      status: 200,
      data: [{ "id": 1, "name": "price_book", "description": "Price Book" },
             { "id": 2, "name": "tsm_system", "description": "Telecom Spend Matix System" },
             { "id": 3, "name": "competition_system", "description": "Competition System" },
             { "id": 4, "name": "roic_manager", "description": "Roic Manager" },
             { "id": 5, "name": "arpu_manager", "description": "ARPU Manager" }]
    })
  }

  return mockResourceService

}])
