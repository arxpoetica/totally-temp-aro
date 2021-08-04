// general purpose lodash-like utilities

// 1. lodash's _.set function in vanilla js:
export function set (obj, path, value) {
    const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]])+/g)
    
    pathArray.reduce((acc, key, i) => {
        if (acc[key] === undefined) acc[key] = {}
        if (i === pathArray.length - 1) acc[key] = value
        return acc[key]
    }, obj)
}