var Parser = require('../../lib/compliance/parsepdf417')

var bitcoinAddressValidator = require('bitcoin-address')
var ethereumUtils = require('../eth-utils')
var ICAP = require('ethereumjs-icap')
var url = require('url')

module.exports = {
  config: config,
  scanPairingCode: scanPairingCode,
  scanMainQR: scanMainQR,
  scanPDF417: scanPDF417,
  scanPhotoID: scanPhotoID,
  cancel: cancel,
  parseEthURI: parseEthURI
}

var configuration = null
var _cancelCb = null

function config (_configuration) {
  configuration = _configuration.mock.data
}

function scanPairingCode (callback) {
  return setTimeout(function () { callback(null, configuration.pairingData) }, 500)
}

function scanMainQR (cryptoCode, callback) {
  setTimeout(function () {
    var resultStr = configuration.qrData[cryptoCode]

    switch (cryptoCode) {
      case 'BTC':
        callback(null, processBitcoinURI(resultStr))
        break
      case 'ETH':
        callback(null, parseEthURI(resultStr))
        break
      default:
        throw new Error('Unsupported coin: ' + cryptoCode)
    }
  }, 2000)
}

function scanPDF417 (callback) {
  var pdf417Data = configuration.pdf417Data
  setTimeout(function () { callback(null, Parser.parse(pdf417Data)) }, 2000)
}

function scanPhotoID (callback) {
  var fakeLicense = configuration.fakeLicense
  setTimeout(function () { callback(null, fakeLicense) }, 2000)
}

function cancel () {
  if (_cancelCb) _cancelCb()
}

function processBitcoinURI (data) {
  var address = parseBitcoinURI(data)
  if (!address) return null

  console.log('DEBUG16: *%s*', address)
    //TODO Re-add validation
    //if (!bitcoinAddressValidator.validate(address)) {
    //console.log('Invalid bitcoin address: %s', address)
    //return null
    //}
  return address
}

function parseBitcoinURI (uri) {
  var res = /^(bitcoin:\/{0,2})?(\w+)/.exec(uri)
  var address = res && res[2]
  if (!address) {
    return null
  } else return address
}

function isValidEthAddress (address) {
  if (address.toUpperCase() === address || address.toLowerCase() === address) {
    if (address.indexOf('0x') !== 0) return false
    return true
  }

  return ethereumUtils.isChecksumAddress(address)
}

function parseEthURI (uri) {
  try {
    var rec = url.parse(uri)
    if (rec.protocol === 'iban:') {
      var icap = rec.host.toUpperCase()
      return ICAP.toAddress(icap)
    }

    var address = rec.path || rec.host
    if (address && isValidEthAddress(address)) return address

    return null
  } catch (e) {
    return null
  }
}
