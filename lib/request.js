// for now, make this b/w compat with trader.js calls

const got = require('got')
const uuid = require('uuid')

const PORT = 3333
const RETRY_INTERVAL = 5000
const RETRY_TIMEOUT = 60000

function richError (errMessage, name) {
  var err = new Error(errMessage)
  err.name = name
  return err
}

function retrier (timeout) {
  const maxRetries = timeout / RETRY_INTERVAL

  return (retry, err) => {
    console.log('DEBUG406')
    if (err.statusCode && err.statusCode === 403) return 0
    if (retry >= maxRetries) return 0

    return RETRY_INTERVAL
  }
}

function request (configVersion, options, cb) {
  const protocol = "http:";
    //const connectionInfo = globalOptions.connectionInfo

    //if (!connectionInfo) return cb()

  const host = '192.168.56.1'
  const requestId = uuid.v4()
  const date = new Date().toISOString()
  const headers = {date, 'request-id': requestId}
  if (options.body) headers['content-type'] = 'application/json'
  if (configVersion) headers['config-version'] = configVersion
  const repeatUntilSuccess = !options.noRetry &&
    (options.retryTimeout || options.method === 'POST')
  const retryTimeout = options.retryTimeout || RETRY_TIMEOUT

  const retries = repeatUntilSuccess && options.retryTimeout
  ? retrier(retryTimeout)
  : null

  const gotOptions = {
    protocol,
    host,
    port: PORT,
    agent: false,
      //cert: globalOptions.clientCert.cert,
      //key: globalOptions.clientCert.key,
      //ca: connectionInfo.ca,
    rejectUnauthorized: true,
    method: options.method,
    path: options.path,
    body: options.body && JSON.stringify(options.body),
    retries,
    timeout: 10000,
    headers,
    json: true
  }

  return got(options.path, gotOptions)
  .catch(err => {
    switch (err) {
      case got.RequestError:
      case got.ReadError:
      case got.ParseError:
        throw richError(err.message, 'networkDown')
      default:
        throw err
    }
  })
  .then(r => cb(null, r.body))
  .catch(err => cb(err))
}

module.exports = {request}
