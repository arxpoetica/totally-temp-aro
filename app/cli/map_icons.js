import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import gm from 'gm'
import pync from 'pync'
import database from '../helpers/database.cjs'

// https://stackoverflow.com/a/62892482/209803
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

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
const fullPath = (filename) => join(__dirname, `../public/images/map_icons/${ARO_CLIENT}`, filename)

database.query('(SELECT name FROM client.service_layer WHERE is_user_defined=false ORDER BY description ASC) UNION ALL (SELECT \'all\' AS name)')
  .then((serviceLayers) => (
    pync.series(serviceLayers, (layer) =>
      pync.series(nodeTypes, (nodeType) => {
        var filename = fullPath(`composite/${layer.name}_${nodeType}.png`)
        return new Promise((resolve, reject) => {
          if (layer.name === 'all') {
            var buff = fs.readFileSync(fullPath(`${nodeType}.png`))
            fs.writeFileSync(filename, buff)
            console.log(filename)
            return resolve()
          }
          gm()
            .command('composite')
            .in('-gravity', 'center')
            .in(fullPath(`${nodeType}.png`))
            .in(fullPath(`service_layer_${layer.name}.png`))
            .write(filename, (err) => {
              err ? reject(err) : (console.log(filename) || resolve())
            })
        })
      })
    )
  ))
  .then(() => process.exit())
  .catch((err) => {
    console.log('err', err.stack)
  })
