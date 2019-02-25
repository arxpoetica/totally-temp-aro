class locationAuditLogController {
  constructor ($http, state) {
    this.$http = $http
    this.state = state
  }

  getLocationAuditLog () {
    this.objectId &&
    this.$http.get(`/service/audit/location/trail/${this.objectId}?plan_id=${this.planId}&user_id=${this.currentUserId}`)
      .then((response) => {
        this.locationAuditLog = response.data
      })
  }

  $onInit () {
    this.oldObjectId = this.objectId
    this.getLocationAuditLog()
  }

  $doCheck () {
    if (this.oldObjectId !== this.objectId) {
      this.oldObjectId = this.objectId
      // businesses don't have objectId in VT features
      if (!this.objectId) this.locationAuditLog = []
      this.getLocationAuditLog()
    }
  }

  $onDestroy () {
    this.locationAuditLog = []
  }
}

locationAuditLogController.$inject = ['$http', 'state']

let locationAuditLog = {
  templateUrl: '/components/sidebar/view/location-audit-log.html',
  bindings: {
    planId: '=',
    objectId: '=',
    currentUserId: '='
  },
  controller: locationAuditLogController
}

export default locationAuditLog
