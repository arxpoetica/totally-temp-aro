
export default class Rule {
  constructor (condition) {
    this.condition = condition
    this._validateCondition(this.condition)
  }

  checkCondition (fact) {
    return this._checkConditionRecursive(fact, this.condition)
  }

  _validateCondition (condition) {
    if (!condition.type) {
      console.error('Conditions object must a type')
      return
    }

    if (condition.type !== 'all' && condition.type !== 'any' && condition.type !== 'property') {
      console.error('Type property of conditions object must be either "all", "any" or "property"')
    }
  }

  _checkConditionRecursive (fact, condition) {
    switch (condition.type) {
      case 'all':
        return condition.value.map(singleCondition => this._checkConditionRecursive(fact, singleCondition))
          .reduce((sum, next) => sum && next, true)

      case 'any':
        return condition.value.map(singleCondition => this._checkConditionRecursive(fact, singleCondition))
          .reduce((sum, next) => sum || next, false)

      case 'property':
        return this._checkConditionProperty(fact, condition)

      default:
        console.error(`Unknown condition type ${condition.type}`)
    }
  }

  _checkConditionProperty (fact, condition) {
    switch (condition.operator) {
      case 'equal':
        return fact[condition.property] === condition.value

      case 'lessThan':
        return fact[condition.property] < condition.value

      case 'greaterThan':
        return fact[condition.property] > condition.value

      default:
        console.error(`Unknown operator ${condition.operator}`)
    }
  }
}
