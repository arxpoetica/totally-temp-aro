
export default class Ring {
  constructor(id, name, nodes = []){
    this.id = id
    this.name = id
    this.nodes = nodes
    if ('undefined' != typeof name) this.name = name
  }
}