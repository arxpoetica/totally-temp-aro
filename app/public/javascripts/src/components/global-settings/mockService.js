// Temporary mock class, used while aro-service is being built

class MockService {

  constructor($http) {
    this.$http = $http
  }

  get(url) {
    switch (url) {

      case '/getAllGroups':
        return Promise.resolve([
          { id: 1, name: 'Administrators' },
          { id: 2, name: 'CAF Planners' },
          { id: 3, name: 'Ohio CAF Planners'}
        ])
      break;

      case '/getAllUsers':
        // First get a list of actual users from aro-service
        return this.$http.get('/service/odata/UserEntity')
          .then((result) => {
            result.data.forEach((user) => user.userGroups = [1, 2])
            return Promise.resolve(result.data)
          })
      break;

      default:
        return Promise.reject(`Unknown URL ${url}`)
    }
  }
}

export default MockService