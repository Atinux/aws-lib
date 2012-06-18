exports.init = function(genericAWSClient) {
  // Creates an MWS Product Data SubmitFeed Client 
  var createMWSProductDataClient = function (sellerId, accessKeyId, secretAccessKey, options) {
    options = options || {};

    var client = MWSProductDataClient({
      host: options.host || "mws.amazonservices.fr",
      path: options.path || "/",
      sellerId: sellerId,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: options.secure,
      version: options.version
    });
    return client;
  }
  // Amazon MWSProd API handler which is wrapped around the genericAWSClient
  var MWSProductDataClient = function(obj) {
    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      sellerId: obj.sellerId,
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure
    });
    obj.call = function(action, query, callback) {
      query['AWSAccessKeyId'] = obj.accessKeyId;
      query['Merchant'] = obj.sellerId;
      query["Action"] = action;
      query["Version"] = obj.version || '2009-01-01';
      query["SignatureMethod"] = "HmacSHA256";
      query["SignatureVersion"] = "2";
      return aws.call(action, query, callback);
    }
    return obj;
  }
  return createMWSProductDataClient;
}