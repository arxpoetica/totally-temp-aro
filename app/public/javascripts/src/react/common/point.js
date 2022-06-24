import uuidv4 from 'uuid/v4'
import { handleError } from './notifications'

let isErrorTimed
export default class Point {
  constructor (lat, lng, id = uuidv4(), props = {}) {
    try {
      if (!Number.isInteger(id) && typeof id !== 'string') {
        throw new Error('Wrong type for `id` variable on `Point` instantiation.')
      }

      this.id = id
      this.lat = lat
      this.lng = lng
      this.props = props
    } catch (error) {
      // debounce because we only want to show one error, not a gazillion
      if (!isErrorTimed) handleError(error)
      clearTimeout(isErrorTimed)
      isErrorTimed = setTimeout(() => isErrorTimed = undefined, 250)
    }
  }
}
