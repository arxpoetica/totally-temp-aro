import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import { connect } from 'react-redux'

export class MapReportsListMapObjects extends Component {
  constructor (props) {
    super(props)
    this.pageIdToMapObject = {}
    this.polygonOptions = {
      normal: {
        strokeColor: '#005cbf',
        strokeWeight: 1,
        fillColor: '#348ee8',
        fillOpacity: 0.2
      },
      selected: {
        strokeColor: '#005cbf',
        strokeWeight: 3,
        fillColor: '#348ee8',
        fillOpacity: 0.5
      }
    }
  }

  render () {
    return null // Everything in this component is about google maps objects. No UI.
  }

  componentDidUpdate (prevProps, prevState, snapshot) {
    const newIds = new Set(this.props.reportPages.map(reportPage => reportPage.uuid))
    const oldIds = new Set(prevProps.reportPages.map(reportPage => reportPage.uuid))
    const pagesToCreate = this.props.reportPages.filter(reportPage => !oldIds.has(reportPage.uuid))
    const pagesToDelete = prevProps.reportPages.filter(reportPage => !newIds.has(reportPage.uuid))
    const pagesToUpdate = this.props.reportPages.filter(reportPage => newIds.has(reportPage.uuid) && oldIds.has(reportPage.uuid))

    pagesToCreate.forEach((reportPage, index) => this.createMapObject(reportPage, index))
    pagesToDelete.forEach(reportPage => this.deleteMapObject(reportPage.uuid))

    // INEFFICIENT: Only recreate if objects have actually changed:
    pagesToUpdate.forEach((reportPage, index) => {
      this.deleteMapObject(reportPage.uuid)
      this.createMapObject(reportPage, index)
    })
  }

  createMapObject (reportPage, index) {
    const polygonOptions = (index === this.props.activePageIndex) ? this.polygonOptions.selected : this.polygonOptions.normal
    const mapObject = new google.maps.Polygon({
      paths: this.getMapPolygonForReportPage(reportPage),
      strokeColor: polygonOptions.strokeColor,
      strokeWeight: polygonOptions.strokeWeight,
      fillColor: polygonOptions.fillColor,
      fillOpacity: polygonOptions.fillOpacity,
      map: this.props.googleMaps
    })
    this.pageIdToMapObject[reportPage.uuid] = mapObject
  }

  deleteMapObject (pageId) {
    this.pageIdToMapObject[pageId].setMap(null)
    delete this.pageIdToMapObject[pageId]
  }

  // Copy paste :( server side code
  getPaperSize (type) {
    // Note that all physical size definitions are in meters
    const a0Sizes = { x: 0.841, y: 1.189 }
    var paperSizeDefinitions = {}
    // Build sizes from A0 through A6
    var lastX = a0Sizes.y
    var lastY = a0Sizes.x * 2
    for (var i = 0; i <= 6; ++i) {
      const sizeX = lastY / 2
      const sizeY = lastX
      paperSizeDefinitions[`A${i}`] = { sizeX, sizeY }
      lastX = sizeX
      lastY = sizeY
    }
    return paperSizeDefinitions[type]
  }

  getMapPolygonForReportPage (reportPage) {
    const paperSizeMeters = this.getPaperSize(reportPage.paperSize)
    const physicalDistanceAlongLongitude = reportPage.worldLengthPerMeterOfPaper * paperSizeMeters.sizeX
    const physicalDistanceAlongLatitude = reportPage.worldLengthPerMeterOfPaper * Math.sin(reportPage.mapCenter.latitude / 180.0 * Math.PI) * paperSizeMeters.sizeY
    const equatorLength = 40075016.686  // meters
    const radiusEarth = equatorLength / 2.0 / Math.PI
    // const sliceLengthAtLongitude = equatorLength * Math.sin(reportPage.mapCenter.longitude)
    const latitudeDeltaBy2 = (physicalDistanceAlongLatitude / radiusEarth * 180.0 / Math.PI) / 2
    const longitudeDeltaBy2 = (physicalDistanceAlongLongitude / radiusEarth * 180.0 / Math.PI) / 2

    var paths = []
    paths.push({ lat: reportPage.mapCenter.latitude - latitudeDeltaBy2, lng: reportPage.mapCenter.longitude - longitudeDeltaBy2 })
    paths.push({ lat: reportPage.mapCenter.latitude + latitudeDeltaBy2, lng: reportPage.mapCenter.longitude - longitudeDeltaBy2 })
    paths.push({ lat: reportPage.mapCenter.latitude + latitudeDeltaBy2, lng: reportPage.mapCenter.longitude + longitudeDeltaBy2 })
    paths.push({ lat: reportPage.mapCenter.latitude - latitudeDeltaBy2, lng: reportPage.mapCenter.longitude + longitudeDeltaBy2 })
    return paths
  }
}

MapReportsListMapObjects.propTypes = {
  activePageIndex: PropTypes.number,
  googleMaps: PropTypes.object,
  reportPages: PropTypes.array
}

const mapStateToProps = state => ({
  activePageIndex: state.mapReports.activePageIndex,
  googleMaps: state.map.googleMaps,
  reportPages: state.mapReports.pages
})

const mapDispatchToProps = dispatch => ({
})

const MapReportsListMapObjectsComponent = connect(mapStateToProps, mapDispatchToProps)(MapReportsListMapObjects)
export default MapReportsListMapObjectsComponent
