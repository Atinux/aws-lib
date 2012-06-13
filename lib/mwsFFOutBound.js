
exports.init = function(genericAWSClient) {
  // Creates an MWSFFOutBound API client
  // <HACK> Modified by Benjamin (reason: Take a hash as params instead of formal parameters)
  var createMWSFFOutBoundClient = function (sellerId, accessKeyId, secretAccessKey, options) {
  //  var createEC2Client = function (accessKeyId, secretAccessKey, options) {
    options = options || {};

    // <HACK> Modified by Benjamin (reason: Host is not the same + need merchantId)
    var client = MWSFFOutBoundClient({
      host: options.host || "mws.amazonservices.fr",
      path: options.path || "/FulfillmentOutboundShipment/2010-10-01",
      sellerId: sellerId,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      secure: options.secure,
      version: options.version
    });
//    var client = ec2Client({
//      host: options.host || "ec2.amazonaws.com",
//      path: options.path || "/",
//      accessKeyId: accessKeyId,
//      secretAccessKey: secretAccessKey,
//      secure: options.secure,
//      version: options.version
//    });
    return client;
  }
  // Amazon MWSFFOutBound API handler which is wrapped around the genericAWSClient
  var MWSFFOutBoundClient = function(obj) {
    var aws = genericAWSClient({
      host: obj.host,
      path: obj.path,
      sellerId: obj.sellerId, // <HACK> Added by Benjamin
      accessKeyId: obj.accessKeyId,
      secretAccessKey: obj.secretAccessKey,
      secure: obj.secure
    });
    obj.call = function(action, query, callback) {
      query['SellerId'] = obj.sellerId; // <HACK> Added by Benjamin
      query["Action"] = action
      // <HACK> Modified by Benjamin (reason: Default 'Version' is not the same)
      query["Version"] = obj.version || '2010-10-01'
//      query["Version"] = obj.version || '2009-11-30'
      query["SignatureMethod"] = "HmacSHA256"
      query["SignatureVersion"] = "2"
      return aws.call(action, query, callback);
    }
    return obj;
  }
  return createMWSFFOutBoundClient;
}