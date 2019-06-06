
import RingUtils from '../components/ring-edit/ring-utils'
import uuidv4 from 'uuid/v4'

export default class Ring {
  
  constructor(id, name){
    this.id = id
    this.name = name || id
    this.nodes = []
    this.exchangeLinks = []
  }
  

  static parseData(data, planId, userId){
    var parsedRing = new Ring(data.id, data.name)
    parsedRing.exchangeLinks = data.exchangeLinks
    
    if (parsedRing.exchangeLinks.length > 0){
      var nodeIds = [ parsedRing.exchangeLinks[0].fromOid ]
      parsedRing.exchangeLinks.forEach(link => {
        nodeIds.push(link.toOid)
      })
      var promisses = []
      nodeIds.forEach(id => {
        promisses.push( RingUtils.getEquipmentDataPromise(id, planId, userId) )
      })
      
      Promise.all(promises)
      .then(results => {
        console.log(results)
        results.forEach(result => {
          if (result.data.hasOwnProperty('objectId')){
            this.nodeMeta[result.data.objectId] = result.data
          }
          var index = nodeIds.findIndex((ele) => ele == result.data.objectId)
          if (-1 != index){
            parsedRing.nodes[index] = {
              objectId: result.data.objectId, 
              data: result.data
            }
          }
        }).catch(err => console.error(err)) 
      })
    }
    
    return parsedRing
  }

  // todo: each object can keep track of their own polygon

  addNode(node){
    var linkId = uuidv4() // ToDo: use /src/components/common/utilitias.js > getUUID()
    // todo use helper class
    if (this.nodes.length > 0){
      this.exchangeLinks.push({
        exchangeLinkOid: linkId, 
        fromOid: this.nodes[this.nodes.length - 1].objectId, 
        toOid: node.objectId
      })
    }
    this.nodes.push(node)
  }

  removeNode(nodeId){
    var nodeIndex = this.nodes.findIndex(ele => ele.objectId == nodeId)
    if (-1 == nodeIndex) return
    this.nodes.splice(nodeIndex, 1)
    if (nodeIndex >= this.exchangeLinks.length){
      // must be the last one, thus no From
      this.exchangeLinks.pop()
    }else{
      this.exchangeLinks.splice(nodeIndex, 1)
      if (nodeIndex > 0){
        this.exchangeLinks[nodeIndex-1].toOid = this.nodes[nodeIndex].objectId
      }
    }
  }
  
  getDataExport(){
    return {
      id: this.id, 
      name: this.name, 
      exchangeLinks: this.exchangeLinks
    }
  }

  clone(){
    var cloneRing = new Ring(this.id, this.name)
    cloneRing.nodes = this.nodes.slice(0) // keep references
    cloneRing.exchangeLinks = JSON.parse(JSON.stringify(this.exchangeLinks)) // do NOT keep references
    return cloneRing
  }
  // todo make helper classes
}