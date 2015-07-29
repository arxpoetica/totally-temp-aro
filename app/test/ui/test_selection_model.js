describe('Selection model', function() {
  var selection;

  beforeEach(module('aro'));

  beforeEach(inject(function(_selection_) {
    selection = _selection_;
  }));

  it('should have sources and targets', function() {
    expect(selection).to.have.property('sources');
    expect(selection).to.have.property('targets');
  });

  it('should be able to add ids to a collection', function() {
    selection.sources.add('123');
    expect(selection.sources.length()).to.be.equal(1);
  });

  it('should avoid duplicates', function() {
    selection.sources.add('123');
    selection.sources.add('123');
    expect(selection.sources.length()).to.be.equal(1);
  });

  it('should implement the #contains() method', function() {
    selection.sources.add('123');
    expect(selection.sources.contains('123')).to.be.true;
  });

  it('should be able to remvoe ids from a collection', function() {
    selection.sources.remove('123');
    expect(selection.sources.length()).to.be.equal(0);
  });

  it('should be able to remove all ids from a collection', function() {
    selection.sources.add('123');
    selection.sources.removeAll('123');
    expect(selection.sources.length()).to.be.equal(0);
  });

  it('should be able to clear all selections', function() {
    selection.sources.add('123');
    selection.targets.add('321');
    selection.clear_selection();
    expect(selection.sources.length()).to.be.equal(0);
    expect(selection.targets.length()).to.be.equal(0);
  });

  it('should sync the selection of all layers', function() {
    selection.sources.add('123');
    selection.targets.add('321');
    selection.sync_selection();
  });

});
