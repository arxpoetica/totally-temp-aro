module.exports = {
  // Define the URL where we can access the ARO web app. Ideally, use the internal docker network. So if
  // your app container is named "app", the base url is 'http://app:8000'
  APP_BASE_URL: process.env.APP_BASE_URL || 'http://app:8000'
}
