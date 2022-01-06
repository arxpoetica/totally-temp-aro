import React, { Component } from 'react'
import { PropTypes } from 'prop-types'
import reduxStore from '../../../redux-store'
import wrapComponentWithProvider from '../../common/provider-wrapped-component'
import MapReportActions from './map-reports-actions'
import { REPORT_LAT_LONG_PRECISION } from './constants'
import MercatorProjection from '../../../shared-utils/mercator-projection'

export class MapReportsListMapObjects extends Component {
  constructor (props) {
    super(props)
    this.pageIdToMapObjects = {}
    this.pageIdToListeners = {}
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

    var pagesToCreate = []
    var pagesToDelete = []
    var pagesToUpdate = []

    if (prevProps.mapZoom !== this.props.mapZoom) {
      // If the zoom level has changed, delete all existing map objects and recreate all.
      this.props.reportPages.forEach(reportPage => {
        if (this.pageIdToMapObjects[reportPage.uuid]) {
          this.deleteMapObject(reportPage.uuid)
        }
      })
      pagesToCreate = this.props.reportPages
    } else {
      const newIds = new Set(this.props.reportPages.map(reportPage => reportPage.uuid))
      const oldIds = new Set(prevProps.reportPages.map(reportPage => reportPage.uuid))
      pagesToCreate = this.props.reportPages.filter(reportPage => !oldIds.has(reportPage.uuid))
      pagesToDelete = prevProps.reportPages.filter(reportPage => !newIds.has(reportPage.uuid))
      pagesToUpdate = this.props.reportPages.filter(reportPage => newIds.has(reportPage.uuid) && oldIds.has(reportPage.uuid))
    }

    pagesToCreate.forEach((reportPage, index) => this.createMapObject(reportPage, index))
    pagesToDelete.forEach(reportPage => this.deleteMapObject(reportPage.uuid))

    pagesToUpdate.forEach((reportPage, index) => {
      const oldPage = prevProps.reportPages.filter(page => page.uuid === reportPage.uuid)[0]
      const newPage = reportPage
      if ((oldPage !== newPage) || // The page definition has changed
        (prevProps.activePageUuid === reportPage.uuid) || // This page was previously the active page
        (this.props.activePageUuid === reportPage.uuid) // This page is now the active page
      ) {
        this.deleteMapObject(reportPage.uuid)
        this.createMapObject(reportPage, index)
      }
    })
  }

  createMapObject (reportPage, index) {
    const polygonOptions = (reportPage.uuid === this.props.activePageUuid) ? this.polygonOptions.selected : this.polygonOptions.normal
    const polygonProjections = this.getMapPolygonForReportPage(reportPage)
    const mapObject = new google.maps.Polygon({
      paths: polygonProjections.paths,
      strokeColor: polygonOptions.strokeColor,
      strokeWeight: polygonOptions.strokeWeight,
      fillColor: polygonOptions.fillColor,
      fillOpacity: polygonOptions.fillOpacity,
      clickable: true,
      draggable: true,
      map: this.props.googleMaps
    })
    var dragStartCoordinates = null
    const clickListener = mapObject.addListener('click', event => this.props.setActivePageUuid(reportPage.uuid))
    const dragStartListener = mapObject.addListener('dragstart', event => { dragStartCoordinates = event.latLng })
    const dragEndListener = mapObject.addListener('dragend', event => {
      const dragEnd = event.latLng
      const deltaLat = dragEnd.lat() - dragStartCoordinates.lat()
      const deltaLng = dragEnd.lng() - dragStartCoordinates.lng()
      dragStartCoordinates = null
      var newPageDefinition = JSON.parse(JSON.stringify(this.props.reportPages.filter(page => page.uuid === reportPage.uuid)[0]))
      newPageDefinition.mapCenter.latitude += deltaLat
      newPageDefinition.mapCenter.latitude = Math.round(newPageDefinition.mapCenter.latitude * REPORT_LAT_LONG_PRECISION) / REPORT_LAT_LONG_PRECISION
      newPageDefinition.mapCenter.longitude += deltaLng
      newPageDefinition.mapCenter.longitude = Math.round(newPageDefinition.mapCenter.longitude * REPORT_LAT_LONG_PRECISION) / REPORT_LAT_LONG_PRECISION
      const reportPages = [].concat(this.props.reportPages)
      reportPages.splice(index, 1, newPageDefinition)
      this.props.setPages(this.props.planId, reportPages)
    })
    this.pageIdToListeners[reportPage.uuid] = [clickListener, dragStartListener, dragEndListener]
    this.pageIdToMapObjects[reportPage.uuid] = [mapObject]

    if (this.props.showPageNumbers) {
      const deltaX = (polygonProjections.pixelExtents.maxX - polygonProjections.pixelExtents.minX)
      const deltaY = (polygonProjections.pixelExtents.maxY - polygonProjections.pixelExtents.minY)
      const fontSize = Math.round(deltaY / 10)
      const pageNumberMarker = new google.maps.Marker({
        position: { lat: reportPage.mapCenter.latitude, lng: reportPage.mapCenter.longitude },
        label: {
          text: `Page ${index + 1}`,
          fontSize: `${fontSize}px`,
          color: '#303030'
        },
        anchor: new google.maps.Point(deltaX / 2, deltaY / 2),
        icon: '/images/map_icons/aro/blank.png',
        map: this.props.googleMaps,
        optimized: !ARO_GLOBALS.MABL_TESTING,
      })
      this.pageIdToMapObjects[reportPage.uuid].push(pageNumberMarker)
    }
  }

  deleteMapObject (pageId) {
    this.pageIdToMapObjects[pageId].forEach(mapObject => mapObject.setMap(null))
    delete this.pageIdToMapObjects[pageId]
    this.pageIdToListeners[pageId].forEach(listener => google.maps.event.removeListener(listener))
    delete this.pageIdToListeners[pageId]
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

    // We are going to generate a Google Maps polygon that will represent the page being printed.
    // From Wikipedia https://en.wikipedia.org/wiki/Mercator_projection
    // From EPSG:900913 (used by Google Maps), Radius of earth at the equator = 6378137

    // First, decide on the sphere radius based on the scaling factor.
    const R = 6378137 / reportPage.worldLengthPerMeterOfPaper
    const projection = new MercatorProjection(R)

    // Use the Mercator projection on our sphere to get the X, Y coordinates of the point
    const xCenter = projection.longitudeToX(reportPage.mapCenter.longitude)
    const yCenter = projection.latitudeToY(reportPage.mapCenter.latitude)

    // Get the physical distance that we will cover along the latitude and longitude.
    // We have chosen the radius of the sphere (R) such that we have to move by an
    // amount equal to the paper size in meters.
    const paperSizeMeters = this.getPaperSize(reportPage.paperSize)
    const sizeX = (reportPage.orientation === 'portrait') ? paperSizeMeters.sizeX : paperSizeMeters.sizeY
    const sizeY = (reportPage.orientation === 'portrait') ? paperSizeMeters.sizeY : paperSizeMeters.sizeX

    // Find the corner coordinates of the page in the Mercator (X, Y) coordinate system.
    // Note that the distance between yCenter and yMin will not be the same except at the equator
    // and the difference will get more pronounced at higher latitudes.
    const minLatitude = projection.yToLatitude(yCenter - sizeY / 2)
    const minLongitude = projection.xToLongitude(xCenter - sizeX / 2)
    const maxLatitude = projection.yToLatitude(yCenter + sizeY / 2)
    const maxLongitude = projection.xToLongitude(xCenter + sizeX / 2)

    // Create a polygon from our min/max latitude/longitude pairs
    var paths = []
    paths.push({ lat: minLatitude, lng: minLongitude })
    paths.push({ lat: maxLatitude, lng: minLongitude })
    paths.push({ lat: maxLatitude, lng: maxLongitude })
    paths.push({ lat: minLatitude, lng: maxLongitude })

    // Calculate the radius of the sphere used for at this zoom level. The number of pixels on the X axis will
    // correspond to the length of the equator. The tile at zoom level 0 has a pixel size of 256x256.
    const radiusForScreenshot = 256 * Math.pow(2, this.props.mapZoom) / (2.0 * Math.PI)
    const projectionScreenshot = new MercatorProjection(radiusForScreenshot)
    const pixelExtents = {
      minX: projectionScreenshot.longitudeToX(minLongitude),
      minY: projectionScreenshot.latitudeToY(minLatitude),
      maxX: projectionScreenshot.longitudeToX(maxLongitude),
      maxY: projectionScreenshot.latitudeToY(maxLatitude)
    }

    return {
      paths,
      pixelExtents
    }
  }

  componentWillUnmount () {
    //Object.keys(this.pageIdToMapObjects).forEach(reportPage => this.deleteMapObject(reportPage.uuid))
    this.props.reportPages.forEach(reportPage => {
      if (this.pageIdToMapObjects[reportPage.uuid]) {
        this.deleteMapObject(reportPage.uuid)
      }
    })
  }
}

MapReportsListMapObjects.propTypes = {
  planId: PropTypes.number,
  activePageUuid: PropTypes.string,
  googleMaps: PropTypes.object,
  mapZoom: PropTypes.number,
  reportPages: PropTypes.array,
  showPageNumbers: PropTypes.bool
}

const mapStateToProps = state => ({
  planId: state.plan.activePlan.id,
  activePageUuid: state.mapReports.activePageUuid,
  googleMaps: state.map.googleMaps,
  mapZoom: state.map.zoom,
  reportPages: state.mapReports.pages,
  showPageNumbers: state.mapReports.showPageNumbers
})

const mapDispatchToProps = dispatch => ({
  setPages: (planId, pageDefinitions) => dispatch(MapReportActions.setPages(planId, pageDefinitions)),
  setActivePageUuid: uuid => dispatch(MapReportActions.setActivePageUuid(uuid))
})

const MapReportsListMapObjectsComponent = wrapComponentWithProvider(reduxStore, MapReportsListMapObjects, mapStateToProps, mapDispatchToProps)
export default MapReportsListMapObjectsComponent
