// This is a helper class to wrap fetch() calls. Unlike fetch(), rejects all HTTP response codes other than 200-299
import fetch from 'cross-fetch'

class AroHttp {
  // Make a HTTP GET request
  static get (url) {
    return this._fetch(url)
  }

  // Make a HTTP POST request
  static post (url, body = {}) {
    const options = {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify(body)
    }
    return this._fetch(url, options)
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
  static _fetch (url, options) {
    var status
    return fetch(url, options)
      .then(response => {
        if (response.type === 'error') {
          // Error code from server, reject the promise
          return Promise.reject(new Error('Network error when fetching data from the server'))
        } else {
          // We have a response.
          status = response.status
          // We cannot do response.json() on an empty response (which is sometimes returned by service)
          return response.text()
        }
      })
      .then(result => {
        const parsedResult = (result === '') ? {} : JSON.parse(result)
        return Promise.resolve(parsedResult)
      })
      .then(result => {
        // We have all the data from the request. Send it back
        return Promise.resolve({
          status: status,
          data: result
        })
      })
  }
}

export default Object.freeze(AroHttp)
