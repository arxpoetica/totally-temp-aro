/* global describe it beforeEach inject expect */
describe('Selection model', () => {
  var selection

  beforeEach(module('aro'))

  beforeEach(inject((_selection_) => {
    selection = _selection_
  }))

  it('should have sources and targets', () => {
    expect(selection).to.have.property('sources')
    expect(selection).to.have.property('targets')
  })

  it('should be able to add ids to a collection', () => {
    selection.sources.add('123')
    expect(selection.sources.length()).to.be.equal(1)
  })

  it('should avoid duplicates', () => {
    selection.sources.add('123')
    selection.sources.add('123')
    expect(selection.sources.length()).to.be.equal(1)
  })

  it('should implement the #contains() method', () => {
    selection.sources.add('123')
    expect(selection.sources.contains('123')).to.be.true
  })

  it('should be able to remvoe ids from a collection', () => {
    selection.sources.remove('123')
    expect(selection.sources.length()).to.be.equal(0)
  })

  it('should be able to remove all ids from a collection', () => {
    selection.sources.add('123')
    selection.sources.removeAll('123')
    expect(selection.sources.length()).to.be.equal(0)
  })

  it('should be able to clear all selections', () => {
    selection.sources.add('123')
    selection.targets.add('321')
    selection.clear_selection()
    expect(selection.sources.length()).to.be.equal(0)
    expect(selection.targets.length()).to.be.equal(0)
  })

  it('should sync the selection of all layers', () => {
    selection.sources.add('123')
    selection.targets.add('321')
    selection.sync_selection()
  })
})
