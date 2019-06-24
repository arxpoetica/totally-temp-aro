export default class Transaction {
  constructor (id, userId, planId) {
    this.id = id
    this.userId = userId
    this.planId = planId
  }

  static fromServiceObject (src) {
    return new Transaction(src.id, src.userId, src.planId)
  }
}
