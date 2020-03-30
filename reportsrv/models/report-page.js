class ReportPage {
  constructor(pageSetup, mapCenter, planId, visibleLayers) {
    this.pageSetup = pageSetup
    this.mapCenter = mapCenter
    this.planId = planId
    this.visibleLayers = visibleLayers
  }

  // Helper function to generate client parameters that we will send to the ARO app.
  toClientParams () {
    return {
      mapCenter: this.mapCenter,
      planId: this.planId,
      visibleLayers: this.visibleLayers
    }
  }
}

module.exports = ReportPage