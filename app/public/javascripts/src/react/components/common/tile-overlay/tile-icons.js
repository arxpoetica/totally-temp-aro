
//  we aren't putting this in Redux because it holds an Image which has functions 
//  also once these are loaded on init (through '/configuration')
//  they never change

//  w/h is a percent of the icon image width/height to use as the anchor point
//  x/y is the offset in pixels from the anchor point, to draw the badge
//  for example 
//  {x: -9, y:-4},
//  {w: 1.0, h: 0.0},
//  the top-left of the BADGE image would be positioned 
//  9px to the left, 4px up 
//  from the top right corner of the ICON image

var iconSets = {
  mapIcons: {},
  iconBadges: {
    back: {}, 
    front: {}
  },
}

function setIcon (key, src, offset) {
  let image = new Image()
  iconSets.mapIcons[key] = {
    image,
    offset,
  }
  iconSets.mapIcons[key].image.src = src
}

function setBadge (key, src, offset, offsetMult, isBack) {
  let image = new Image()
  let depthKey = 'front'
  if ('back' === isBack) depthKey = 'back'

  iconSets.iconBadges[depthKey][key] = {
    image,
    offset,
    offsetMult,
  }
  iconSets.iconBadges[depthKey][key].image.src = src
}

setBadge(
  'selected',
  '/images/map_icons/badges/badge_selected.png',
  {x: -15, y: -15},
  {w: 0.5, h: 0.5},
  'back'
)
setBadge(
  'alert',
  '/images/map_icons/badges/badge_alert.png',
  {x: -9, y:-4},
  {w: 1.0, h: 0.0},
)
setBadge(
  'inactive',
  '/images/map_icons/badges/badge_inactive.png',
  {x: -9, y:-4},
  {w: 1.0, h: 0.0},
)
// setBadge(
//   'xOut',
//   '/images/map_icons/badges/badge_x.png',
//   {x: -2, y:-10},
//   {w: 0.0, h: 1.0},
// )
setBadge(
  'nearnet',
  '/images/map_icons/badges/dashed_circle_blue.png',
  {x: -13, y: -13},
  {w: 0.5, h: 0.5},
)


export default {
  setIcon,
  setBadge,
  mapIcons: iconSets.mapIcons,
  iconBadges: iconSets.iconBadges,
}
