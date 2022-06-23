// This is a helper class to wrap fetch() calls. Unlike fetch(), rejects all HTTP response codes other than 200-299
import fetch from 'cross-fetch'

class AroHttp {
  // Make a HTTP GET request
  static get (url, returnRawResult = false) {
    return this._fetch(url, {}, returnRawResult)
  }

  // Make a HTTP POST request
  static post (url, body = {}, returnRawResult = false) {
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    }
    return this._fetch(url, options, returnRawResult)
  }

  // Make a HTTP POST request, without converting to JSON
  static postRaw (url, body = {}) {
    const options = {
      method: 'POST',
      body: body
    }
    return this._fetch(url, options)
  }

  // Make a HTTP PUT request
  static put (url, body = {}) {
    const options = {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    }
    return this._fetch(url, options)
  }

  // Make a HTTP DELETE request
  static delete (url) {
    const options = {
      method: 'DELETE'
    }
    return this._fetch(url, options)
  }

  // Internal fetch() implementation. Rejects all HTTP response codes other than 200-299
  static _fetch (url, options, returnRawResult) {
    let status
    let respUrl
    return fetch(url, options)
      .then(response => {
        if (response.type === 'error') {
          // Error code from server, reject the promise
          return Promise.reject(new Error('Network error when fetching data from the server'))
        } else {
          // We have a response.
          status = response.status
          respUrl = response.url // We need url for Debug mode "Get tile info for all selected service areas"
          // We cannot do response.json() on an empty response (which is sometimes returned by service)
          return returnRawResult ? response.arrayBuffer() : response.text()
        }
      })
      .then(result => {
        if (url.startsWith('/service/plan-transaction/')) console.log(result)
        let resultToSend = returnRawResult
          ? result
          : {
            status: status,
            data: JSON.parse(result || '{}'),
            url: respUrl
          }
        if (status >= 200 && status <= 299) {
          return Promise.resolve(resultToSend)
        } else {
          return Promise.reject(resultToSend)
        }
      })
  }
}

export default Object.freeze(AroHttp)
