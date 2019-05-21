import uuidv4 from 'uuid/v4'
export default class Point {
  constructor (lat, lng) {
    this.id = uuidv4()
    this.lat = lat
    this.lng = lng
  }
}
