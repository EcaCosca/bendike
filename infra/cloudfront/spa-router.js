// Serves the single-page app's index.html for navigation requests.
//
// The origin is S3 behind OAC, where a missing key answers 403 rather than 404
// because ListBucket is denied. So /en/shop/aura-6, which is a route and not an
// object, would 403 without this.
//
// Only extensionless paths are rewritten. A missing /assets/main-abc123.js keeps
// its real error instead of being handed HTML, which would surface to the browser
// as a syntax error somewhere unrelated.
function handler(event) {
  var request = event.request;
  var uri = request.uri;

  if (uri.endsWith('/')) {
    request.uri = '/index.html';
    return request;
  }

  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {
    request.uri = '/index.html';
  }

  return request;
}
