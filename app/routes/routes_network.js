var models = require('../models')
var helpers = require('../helpers')
var config = helpers.config
var Busboy = require('busboy')
var path = require('path')
var os = require('os')
var fs = require('fs')
var multer = require('multer')
var upload = multer({ dest: os.tmpdir() })

exports.configure = (api, middleware) => {
  var check_any_permission = middleware.check_any_permission
  var check_owner_permission = middleware.check_owner_permission
  var check_loggedin = middleware.check_loggedin;
  var jsonSuccess = middleware.jsonSuccess

  api.get('/network/fiber_type/:plan_id/:type', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = request.params.plan_id
    var type = request.params.type
    models.Network.viewFiberByConstructionType(plan_id, type, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/fiber_plant/datasource/:datasource', middleware.viewport, (request, response, next) => {
    var datasource = request.params.datasource
    var viewport = request.viewport
    models.Network.viewFiberPlantForDatasource(datasource, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/fiber_plant/current_carrier/:sourceName', middleware.viewport, (request, response, next) => {
    var sourceName = request.params.sourceName
    var viewport = request.viewport
    models.Network.viewFiberPlantForCurrentCarrier(viewport, sourceName)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
  
  api.get('/network/fiber_plant/sourceid_mapping', (request, response, next) => {
   models.Network.getFiberSourceIdMapping()
     .then(jsonSuccess(response, next))
     .catch(next)
 })

  api.get('/network/fiber_plant/:carrier_name', middleware.viewport, (request, response, next) => {
    var carrier_name = request.params.carrier_name
    var viewport = request.viewport
    models.Network.viewFiberPlantForCarrier(carrier_name, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/fairshare_density', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.MarketSize.fairShareHeatmap(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/carriers', (request, response, next) => {
    var fiberType = request.query.fiberType || 'fiber'
    models.Network.carriers(fiberType)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/carriers/viewport', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var fiberType = request.query.fiberType || 'fiber'
    models.Network.carriers(fiberType, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Network nodes for user client by node type
  api.get('/network/nodes/:node_type', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var node_type = request.params.node_type
    models.Network.viewNetworkNodes([node_type], null, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/nodes/:plan_id/find', check_any_permission, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = request.params.plan_id
    var node_types = request.query.node_types && request.query.node_types.split(',')
    models.Network.viewNetworkNodes(node_types, plan_id, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/nodes/:plan_id/find/:serviceLayer', check_any_permission, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = request.params.plan_id
    var serviceLayer = request.params.serviceLayer
    var node_types = request.query.node_types && request.query.node_types.split(',')
    models.Network.viewNetworkNodes(node_types, plan_id, viewport, serviceLayer)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/nodes/find/:serviceLayer', check_loggedin, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var serviceLayer = request.params.serviceLayer
    var node_types = request.query.node_types && request.query.node_types.split(',')
    models.Network.viewNetworkNodes(node_types, false, viewport, serviceLayer)
        .then(jsonSuccess(response, next))
        .catch(next)
  })

  api.get('/network/fiber/:plan_id/find/:serviceLayer/:limitNumberOfSegments', check_any_permission, middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    var plan_id = request.params.plan_id
    var serviceLayer = request.params.serviceLayer
    var limitNumberOfSegments = request.params.limitNumberOfSegments
    models.Network.viewFiber(plan_id, serviceLayer, limitNumberOfSegments, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/fiber/connectivityForPlan/:planId', check_loggedin, (request, response, next) => {
    var planId = request.params.planId
    models.Network.getConnectivityForPlan(planId)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Edit network nodes in a route
  api.post('/network/nodes/:plan_id/edit', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var changes = request.body
    models.Network.editNetworkNodes(plan_id, changes)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/network/nodes/:plan_id/csv', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var busboy = new Busboy({ headers: request.headers })
    var fullpath
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      fullpath = path.join(os.tmpdir(), String(Date.now()))
      file.pipe(fs.createWriteStream(fullpath))
    })
    busboy.on('finish', () => {
      models.Network.importLocationsByCoordinates(plan_id, fullpath)
        .then(jsonSuccess(response, next))
        .catch(next)
    })
    request.pipe(busboy)
  })

  api.post('/network/nodes/:plan_id/csvIds', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    var busboy = new Busboy({ headers: request.headers })
    var fullpath
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      fullpath = path.join(os.tmpdir(), String(Date.now()))
      file.pipe(fs.createWriteStream(fullpath))
    })
    busboy.on('finish', () => {
      models.Network.importLocationsByIds(plan_id, fullpath)
        .then(jsonSuccess(response, next))
        .catch(next)
    })
    request.pipe(busboy)
  })

  // Clear network nodes in a route
  api.post('/network/nodes/:plan_id/clear', check_owner_permission, (request, response, next) => {
    var plan_id = request.params.plan_id
    models.Network.clearNetworkNodes(plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Recalculate network nodes
  api.post('/network/nodes/:plan_id/recalc', check_owner_permission, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var options = request.body.options
    models.Network.recalculateNodes(plan_id, options)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  // Recalculate network nodes
  api.post('/network/nodes/:plan_id/select_boundary', check_owner_permission, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var data = request.body
    models.Network.selectBoundary(plan_id, data)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/search/boundaries', middleware.viewport, (request, response, next) => {
    var text = request.query.text
    var viewport = request.viewport
    var types = request.query.types
    types = (Array.isArray(types) ? types : [types]).filter(Boolean)
    models.Network.searchBoundaries(text, types, viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/road_segments', middleware.viewport, (request, response, next) => {
    var viewport = request.viewport
    models.Network.roadSegments(viewport)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/backhaul/:plan_id/links', (request, response, next) => {
    var plan_id = +request.params.plan_id
    models.Network.backhaulLinks(plan_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/backhaul/:plan_id/links', check_owner_permission, (request, response, next) => {
    var plan_id = +request.params.plan_id
    var fromIds = request.body.from_ids
    var toIds = request.body.to_ids
    models.Network.saveBackhaulLinks(plan_id, fromIds, toIds)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/user_entities/list', (request, response, next) => {
    var userId = request.user.id
    var req = {
      url: config.aro_service_url + `/user-entites/user/${userId}`,
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/user_entities/delete', (request, response, next) => {
    var id = request.body.userEntities
    var req = {
      method: 'DELETE',
      url: config.aro_service_url + `/user-entites/${id}`,
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/user_boundaries/list', (request, response, next) => {
    var userId = request.user.id
    var req = {
      url: config.aro_service_url + `/serviceLayers/${userId}`,
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/user_boundaries/delete', (request, response, next) => {
    var id = request.body.userBoundaries
    var req = {
      method: 'DELETE',
      url: config.aro_service_url + `/serviceLayers/${id}`,
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/fiberSourceIdOfExistingFiber/:fiberName', (request, response, next) => {
    var fiberName = request.params.fiberName
    models.Network.getFiberSourceIdOfExistingFiber(fiberName)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/user_fiber/list', (request, response, next) => {
    var userId = request.user.id
    var req = {
      url: config.aro_service_url + '/installed/fiber/metadata',
      qs: {
        'user_id': userId
      },
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/user_fiber/upload', upload.single('file'), (request, response, next) => {
    var userId = request.user.id
    var name = request.body.name
    var mediaType = request.body.fileType
    var fullpath = request.file && request.file.path
    var req = {
      url: config.aro_service_url + '/installed/fiber/files',
      qs: {
        'user_id': userId,
        'media': mediaType
      },
      method: 'POST',
      formData: {
        file: fs.createReadStream(fullpath),
        name: name
      },
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/user_fiber/delete', (request, response, next) => {
    var userId = request.user.id
    var id = request.body.userFiber
    var req = {
      method: 'DELETE',
      qs: {
        'user_id': userId
      },
      url: config.aro_service_url + `/installed/fiber/metadata/${id}`,
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/optimization/processes', (request, response, next) => {
    var req = {
      url: config.aro_service_url + '/optimization/processes',
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/optimization/processes/:optimizationIdentifier', (request, response, next) => {
    var req = {
      url: config.aro_service_url + `/optimization/processes/${request.params.optimizationIdentifier}`,
      json: true
    }
    models.AROService.request(req)
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.post('/optimization/stop/:plan_id', (request, response, next) => {
    var req = {
      url: config.aro_service_url + '/optimization/processes',
      json: true
    }
    models.AROService.request(req)
      .then((response) => {
        var planId = +request.params.plan_id
        var info = response.find((status) => status.planId === planId)
        if (!info) return {}
        var req = {
          method: 'DELETE',
          url: config.aro_service_url + `/optimization/processes/${info.optimizationIdentifier}`,
          json: true
        }
        return models.AROService.request(req)
          .then(() => ({}))
      })
      .then(jsonSuccess(response, next))
      .catch(next)
  })
  
  api.get('/morphology/tiles', (request, response, next) => {
	models.Network.fetchMorphologyTilesInfo()
      .then(jsonSuccess(response, next))
      .catch(next)
  })

  api.get('/network/nodes/:id/details', (request, response, next) => {
    var node_id = request.params.id
    models.Network.getNetworkNodeDetails(node_id)
      .then(jsonSuccess(response, next))
      .catch(next)
  })
}
