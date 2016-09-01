var path = require('path')
var gm = require('gm')

var helpers = require('../helpers')
var database = helpers.database

var nodeTypes = [
  'businesses_default',
  'businesses_selected',
  'businesses_2kplus_default',
  'businesses_2kplus_selected',
  'businesses_large_default',
  'businesses_large_selected',
  'businesses_medium_default',
  'businesses_medium_selected',
  'businesses_small_default',
  'businesses_small_selected',
  'central_office',
  'central_office_selected',
  'fiber_deployment_terminal',
  'fiber_distribution_hub',
  'fiber_distribution_terminal',
  'households_default',
  'households_selected',
  'households_medium_default',
  'households_medium_selected',
  'households_small_default',
  'households_small_selected',
  'pole',
  'tower',
  'bulk_distrubution_terminal',
  'splice_point',
  'bulk_distribution_consumer'
]

const ARO_CLIENT = process.env.ARO_CLIENT
const fullPath = (filename) => path.join(__dirname, `../public/images/map_icons/${ARO_CLIENT}`, filename)

database.query('SELECT * FROM client.service_layer ORDER BY description ASC')
  .then((serviceLayers) => (
    Promise.all(
      serviceLayers.map((layer) => (
        Promise.all(
          nodeTypes.map((nodeType) => {
            var filename = fullPath(`composite/${layer.name}_${nodeType}.png`)
            return new Promise((resolve, reject) => {
              gm()
                .command('composite')
                .in('-gravity', 'center')
                .in(fullPath(`${nodeType}.png`))
                .in(fullPath(`service_layer_${layer.name}.png`))
                .write(filename, (err) => {
                  err ? reject(err) : (console.log(filename) || resolve())
                })
                // .size('result.png', (err, info) => {
                //   console.log('info', info)
                //   err ? reject(err) : resolve()
                // })
            })
          })
        )
      ))
    )
  ))
  .then(() => process.exit())
  .catch((err) => {
    console.log('err', err.stack)
  })
