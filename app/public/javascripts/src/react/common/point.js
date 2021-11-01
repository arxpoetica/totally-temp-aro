import uuidv4 from 'uuid/v4'
export default class Point {
  constructor (lat, lng, id = uuidv4(), props = {}) {
    this.id = id
    this.lat = lat
    this.lng = lng
    this.props = props
  }
}
