import { URL, URLSearchParams } from 'url'

// Given a Express request and user id, replaces (if it exists) or appends the user_id
// query parameter to the request URL and returns the URL
// E.g. for userid=xxx, input url='/service/do_something', returns '/service/do_something?user_id=xxx'
//      for userid=xxx, input url='/service/do_something?user_id=yyy', returns '/service/do_something?user_id=xxx'
// This will also replace parts of the service url. So if you want '/service/v1/test' to become '/svc2/v1/test',
// send urlPartialToRemove='/service', urlPartialToReplace='/svc2'
export default (request, urlPartialToRemove, urlPartialToReplace, userId) => {
  // First construct the full url (i.e. including the http(s)://<hostname>)
  const fullUrl = new URL(`${request.protocol}://${request.get('host')}${request.url}`)

  // Now extract the existing query parameters
  const searchParams = new URLSearchParams(fullUrl.searchParams)

  // Overwrite or add the user_id query parameter. (Overwrite so that authenticated clients cannot
  // impersonate other users). Then set the query parameters back to the original URL.
  searchParams.set('user_id', userId)
  fullUrl.search = searchParams

  // Construct the "final" URL by removing the protocol, host, etc so it looks like '/v1/plan?user_id=xxx'
  const finalUrl = urlPartialToReplace + fullUrl.href.substring(fullUrl.href.indexOf(urlPartialToRemove) + urlPartialToRemove.length)
  return finalUrl
}
