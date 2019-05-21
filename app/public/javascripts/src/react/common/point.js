import uuidv4 from 'uuid/v4'
export default class Point {
  constructor (lat, lng, id = uuidv4()) {
    this.id = id
    this.lat = lat
    this.lng = lng
  }
}
