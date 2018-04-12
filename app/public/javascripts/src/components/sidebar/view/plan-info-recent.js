class PlanInfoRecentController {
  constructor(state) {
    this.state = state
  }
}

PlanInfoRecentController.$inject = ['state']

let planInfoRecent = {
  template: `
    Recent search
  `,
  controller: PlanInfoRecentController
}

export default planInfoRecent