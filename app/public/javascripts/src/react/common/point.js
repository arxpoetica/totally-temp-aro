import uuidv4 from 'uuid/v4'
import { handleError } from './notifications'

export default class Point {
  constructor (lat, lng, id = uuidv4(), props = {}) {
    try {
      if (!Number.isInteger(id) || typeof id !== 'string') {
        throw new Error('Wrong type for `id` variable on `Point` instantiation.')
      }

      this.id = id
      this.lat = lat
      this.lng = lng
      this.props = props
    } catch (error) {
      handleError(error)
    }
  }
}
