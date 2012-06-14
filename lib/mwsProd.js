
exports.init = function(genericAWSClient) {
  // Creates an MWSProd API client
  var createMWSProdClient = function (merchantId, accessKeyId, secretAccessKey, options) {
    options = options || {};

    var client = MWSProdClient({
      host: options.host || "mws.amazonservices.fr",
      path: options.path || "/",
      merchantId: merchantId,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: options.secure,
      version: options.version
    });
    return client;
  }
  // Amazon MWSProd API handler which is wrapped around the genericAWSClient
  var MWSProdClient = function(obj) {
    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      merchantId: obj.merchantId,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure
    });
    obj.call = function(action, query, callback) {
      query['Merchant'] = obj.merchantId;
      query["Action"] = action;
      query["Version"] = obj.version || '2009-01-01';
      query["SignatureMethod"] = "HmacSHA256";
      query["SignatureVersion"] = "2";
      return aws.call(action, query, callback);
    }
    return obj;
  }
  return createMWSProdClient;
}