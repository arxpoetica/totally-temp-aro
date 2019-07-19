/* global google */
import uuidv4 from 'uuid/v4'

export default class Ring {
  constructor (id, name) {
    this.id = id
    this.name = name || id
    this.nodes = []
    this.nodesById = {}
    this.linkData = []
  }

  static parseData (ringData, equipmentData) {
    // console.log('---data---')
    // console.log(ringData)
    // console.log(equipmentData)
    var parsedRing = new Ring(ringData.id, ringData.name)

    if (ringData.exchangeLinks.length > 0) {
      equipmentData.forEach(node => {
        parsedRing.nodesById[node.objectId] = {
          objectId: node.objectId,
          data: node
        }
      })

      parsedRing.nodes[0] = parsedRing.nodesById[ringData.exchangeLinks[0].fromOid]
      ringData.exchangeLinks.forEach((link, i) => {
        var fromNode = parsedRing.nodesById[link.fromOid]
        var toNode = parsedRing.nodesById[link.toOid]
        var geom = []
        parsedRing.nodes.push(toNode)
        if (!link.geomPath || link.geomPath.length === 0) {
          geom = parsedRing.figureRangeIntersectOffset(fromNode, toNode)
        } else {
          geom = parsedRing.importGeom(link.geomPath)
        }
        parsedRing.linkData[i] = {
          exchangeLinkOid: link.exchangeLinkOid,
          fromNode: fromNode,
          toNode: toNode,
          geom: geom
        }
      })
    }

    return parsedRing
  }

  addNode (node) {
    // move to caller
    var linkId = uuidv4() // ToDo: use /src/components/common/utilitias.js > getUUID()
    if (this.nodes.length > 0) {
      var fromNode = this.nodes[this.nodes.length - 1]
      this.linkData.push({
        exchangeLinkOid: linkId,
        fromNode: fromNode,
        toNode: node,
        geom: this.figureRangeIntersectOffset(fromNode, node)
      })
    }
    this.nodes.push(node)
  }

  removeNode (nodeId) {
    var nodeIndex = this.nodes.findIndex(ele => ele.objectId === nodeId)
    if (nodeIndex === -1) return
    this.nodes.splice(nodeIndex, 1)
    delete this.nodesById[nodeId]
    if (nodeIndex >= this.linkData.length) {
      // must be the last one, thus no From
      this.linkData.pop()
    } else {
      this.linkData.splice(nodeIndex, 1)
      if (nodeIndex > 0) {
        var link = this.linkData[nodeIndex - 1]
        link.toNode = this.nodes[nodeIndex]
        link.geom = this.figureRangeIntersectOffset(link.fromNode, link.toNode)
      }
    }
  }

  // --- //

  figureRangeIntersectOffset (nodeA, nodeB) {
    // given lat/long points A and B we'll find the offset (relitive to point A)
    // where the line AB intersects circle A with radius Range
    const coordsA = nodeA.data.geometry.coordinates
    const coordsB = nodeB.data.geometry.coordinates
    var latLngA = new google.maps.LatLng(coordsA[1], coordsA[0])
    var latLngB = new google.maps.LatLng(coordsB[1], coordsB[0])
    var heading = google.maps.geometry.spherical.computeHeading(latLngA, latLngB)

    var bounds = []
    bounds.push(google.maps.geometry.spherical.computeOffset(latLngA, 1000.0, heading + 90))
    bounds.push(google.maps.geometry.spherical.computeOffset(latLngA, 1000.0, heading - 90))
    bounds.push(google.maps.geometry.spherical.computeOffset(latLngB, 1000.0, heading - 90))
    bounds.push(google.maps.geometry.spherical.computeOffset(latLngB, 1000.0, heading + 90))

    return bounds
  }

  getDataExport () {
    var exchangeLinks = []
    this.linkData.forEach((link, i) => {
      exchangeLinks[i] = {
        exchangeLinkOid: link.exchangeLinkOid,
        fromOid: link.fromNode.objectId,
        toOid: link.toNode.objectId,
        geomPath: {
          type: 'MultiPolygon',
          coordinates: [
            [this.exportGeom(link)]
          ]
        }
      }
    })
    return {
      id: this.id,
      name: this.name,
      exchangeLinks: exchangeLinks
    }
  }

  exportGeom (link) {
    var geom = []
    link.geom.forEach(pt => {
      geom.push(
        [pt.lng(), pt.lat()]
      )
    })
    if (link.geom.length > 0) {
      geom.push(
        [link.geom[0].lng(), link.geom[0].lat()]
      )
    }
    return geom
  }

  importGeom (geomPath) {
    var geom = []
    geomPath.coordinates[0][0].forEach(pt => {
      geom.push(new google.maps.LatLng(pt[1], pt[0]))
    })
    if (geom.length > 0) geom.pop()
    return geom
  }

  clone () {
    var cloneRing = new Ring(this.id, this.name)
    cloneRing.nodes = this.nodes.slice(0) // keep references
    cloneRing.linkData = this.linkData.splice(0)
    cloneRing.nodesById = { ...this.nodesById }
    return cloneRing
  }
}
