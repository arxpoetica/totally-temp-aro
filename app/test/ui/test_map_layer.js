/* global describe beforeEach it inject expect */
describe('Map layer', () => {
  var $rootScope
  var $httpBackend
  var MapLayer
  var layer

  var events = []
  var features = {
    'feature_collection': {
      'type': 'FeatureCollection',
      'features': [
        {
          'type': 'Feature',
          'properties': {
            'id': 1
          },
          'geometry': {
            'type': 'Point',
            'coordinates': [
              -73.9590880838578,
              40.7724784736083
            ]
          }
        }
      ]
    }
  }

  beforeEach(module('aro'))

  beforeEach(inject((_$rootScope_, _$httpBackend_, $injector) => {
    $httpBackend = _$httpBackend_

    $httpBackend
      .when('GET', '/network/nodes/central_office')
      .respond(features)

    $httpBackend
      .when('GET', '/foo')
      .respond(features)

    MapLayer = $injector.get('MapLayer')
    $rootScope = _$rootScope_

    events.splice(0)
    ;['map_layer_changed_visibility'].forEach((eventName) => {
      $rootScope.$on(eventName, () => {
        events.push(eventName)
      })
    })

    layer = new MapLayer({
      type: 'network_nodes',
      name: 'Central offices',
      short_name: 'SP',
      api_endpoint: '/network/nodes/central_office',
      style_options: {
        normal: {
          icon: '/images/map_icons/splice_point.png'
        },
        selected: {
          icon: '/images/map_icons/splice_point_selected.png'
        }
      }
    })
  }))

  it('should show the layer', (done) => {
    expect(layer.visible).to.be.false // hidden by default
    layer.show()
    expect(layer.visible).to.be.true
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.equal('map_layer_changed_visibility')
    $rootScope.$on('map_layer_loaded_data', (e, layer) => {
      expect(layer.number_of_features() > 0).to.be.true
      done()
    })
    $httpBackend.flush()
  })

  it('should hide the layer', () => {
    layer.show()
    layer.hide()
    expect(layer.visible).to.be.false
    expect(events.length).to.be.equal(2)
    expect(events[0]).to.be.equal('map_layer_changed_visibility')
    expect(events[1]).to.be.equal('map_layer_changed_visibility')
  })

  it('should toggle the visibility', () => {
    layer.toggle_visibility()
    expect(layer.visible).to.be.true
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.equal('map_layer_changed_visibility')
  })

  it('should revert the styles', () => {
    layer.revert_styles()
  })

  it('should clear the data', () => {
    layer.clear_data()
    expect(layer.number_of_features()).to.be.equal(0)
  })

  it('should change the API endpoint', () => {
    layer.show()
    $httpBackend.flush()

    layer.set_api_endpoint('/foo')
    expect(layer.number_of_features()).to.be.equal(0) // first clears the data
    $httpBackend.flush()
    expect(layer.number_of_features()).to.be.equal(1) // data should be loaded
  })

  it('should be removed', () => {
    layer.remove()
  })

  it('should create and show a layer with data already loaded', () => {
    var layer = new MapLayer({
      type: 'network_nodes',
      name: 'Splice points',
      short_name: 'SP',
      data: features.feature_collection,
      style_options: {
        normal: {
          icon: '/images/map_icons/splice_point.png'
        },
        selected: {
          icon: '/images/map_icons/splice_point_selected.png'
        }
      }
    })
    layer.show()
    expect(layer.visible).to.be.true
    expect(events.length).to.be.equal(1)
    expect(events[0]).to.be.equal('map_layer_changed_visibility')
    expect(layer.number_of_features() > 0).to.be.true
  })
})
