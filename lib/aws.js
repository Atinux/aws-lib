var http = require("http");
var https = require("https");
var qs = require("querystring")
var crypto = require("crypto")
var events = require("events")
var xml2js = require("xml2js")
var jsontoxml = require('jsontoxml'); // <HACK> Added by Benjamin

// include specific API clients
//<HACK> Added by Benjamin
var mwsFFInBound = require('./mwsFFInBound');
var mwsFFOutBound = require('./mwsFFOutBound');
var mwsOrders = require('./mwsOrders');
var mwsProd = require('./mwsProd');
// </HACK>

// ↓↓ MWS Product Data
var mws = require('./mws')


var ec2 = require("./ec2");
var prodAdv = require("./prodAdv");
var simpledb = require("./simpledb");
var sqs = require("./sqs");
var sns = require("./sns");
var ses = require("./ses");

// <HACK> Added by Benjamin
function contentMd5(xml) {
	return crypto.createHash('md5').update(xml).digest('base64');
}
// </HACK>

// Returns the hmac digest using the SHA256 algorithm.
function hmacSha256(key, toSign) {
	var hash = crypto.createHmac("sha256", key);
	return hash.update(toSign).digest("base64");
}

// a generic AWS API Client which handles the general parts
var genericAWSClient = function(obj) {
	var creds = crypto.createCredentials({});
	if (null == obj.secure)
		obj.secure = true;

	obj.connection = obj.secure ? https : http;
	// <HACK> Modified by Benjamin
	obj.call = function (action, q, callback) {
//  obj.call = function (action, query, callback) {
		if (obj.secretAccessKey == null || obj.accessKeyId == null) {
			throw new Error("secretAccessKey and accessKeyId must be set");
		}
		// <HACK> Added by Benjamin
		var query = {};
		for (var _i in q) {
			query[_i] = q[_i];
		}
		// </HACK>
		var now = new Date();

		// <HACK> Added by Benjamin (reason: Add specificities to SubmitFeed action)
		var md5 = null;
		var xml = null;
		if (action === 'SubmitFeed') {
			query['PurgeAndReplace'] = query['PurgeAndReplace'] || false;
			// <MWS> Adding FeedType
			// query['FeedType'] = query.feedType;
			// </MWS>
			xml = '<?xml version="1.0" encoding="ISO-8859-1"?>';
			xml += '<AmazonEnvelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="amzn-envelope.xsd">';
			if (typeof query['data'] !== 'undefined') {
				xml += jsontoxml.obj_to_xml(query['data']);
			}
			xml += '</AmazonEnvelope>';
			// Fucking bug on Amazon ’ character (by Seb <3)
			xml = xml.replace(/’/g, "'");
			xml = require('iconv-lite').encode(xml, 'iso-8859-1');
//---------------------------------  console.log -------------------------------
			// console.log('XML Body: ', xml.toString());
			md5 = contentMd5(xml);
			delete query['data'];
		};
		// </HACK>

		if (!obj.signHeader) {
			// Add the standard parameters required by all AWS APIs
			query["Timestamp"] = now.toISOString();
			query["AWSAccessKeyId"] = obj.accessKeyId;
			query["Signature"] = obj.sign(query);
		}

		var body = qs.stringify(query);
//---------------------------------  console.log -------------------------------
		// console.log('Request: ', body);
		// <HACK> Modified by Benjamin (reason: Content-type is not the same)
		var headers = {
				'Host': obj.host,
				'Content-Type': 'text/xml',
				'Content-Length': xml ? xml.length : body.length
			};
		if (md5 !== null) {
			headers['Content-MD5'] = md5;
		}
//    var headers = {
//        "Host": obj.host,
//        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
//        "Content-Length": body.length
//      };
		if (obj.signHeader) {
			headers["Date"] = now.toUTCString();
			headers["x-amzn-authorization"] =
			"AWS3-HTTPS " +
			"AWSAccessKeyId=" + obj.accessKeyId + ", " +
			"Algorithm=HmacSHA256, " +
			"Signature=" + hmacSha256(obj.secretAccessKey, now.toUTCString());
		}

		// <HACK> Modified by Benjamin (reason: Adjuste to MWS)
		var options = {
				host: obj.host,
				path: obj.path + '?' + body,
				method: 'POST',
				headers: headers
			};
//    var options = {
//        host: obj.host,
//        path: obj.path,
//        method: 'POST',
//        headers: headers
//      };
		var req = obj.connection.request(options, function (res) {
			var data = '';
			//the listener that handles the response chunks
			res.addListener('data', function (chunk) {
				data += chunk.toString()
			});
			res.addListener('end', function() {
				var parser = new xml2js.Parser();
				 parser.addListener('end', function(result) {
						if (typeof result !== "undefined" && typeof result.Error !== "undefined"){
							return callback(result.Error);
						}
						 // <MWS> : Callback of GetFeedSubmissionList
						// else if (action === 'GetFeedSubmissionList' || action === 'SubmitFeed'){
							callback(null, result);
						// }
						// // </MWS>
						// else {
						// 	callback(null, result.Items)
						// }
				 });
				parser.parseString(data);
			});
		});
		req.on('error', function (error) {
			callback(error);
		})
		// <HACK> Modified by Benjamin
		// console.log((xml ? xml.toString() : body));
		req.write(xml || body);
//    req.write(body);
	}
	/*
	 Calculate HMAC signature of the query
	 */
	obj.sign = function (query) {
		var keys = []
		var sorted = {}

		for(var key in query)
			keys.push(key)

		keys = keys.sort()

		var key;
		for(var n in keys) {
			key = keys[n];
			// <HACK> Modified by Benjamin
			if (typeof key === 'string') {
				sorted[key] = query[key];
			}
//      sorted[key] = query[key];
		}
		var stringToSign = ["POST", obj.host, obj.path, qs.stringify(sorted)].join("\n");

		// Amazon signature algorithm seems to require this
		stringToSign = stringToSign.replace(/'/g,"%27");
		stringToSign = stringToSign.replace(/\*/g,"%2A");
		stringToSign = stringToSign.replace(/\(/g,"%28");
		stringToSign = stringToSign.replace(/\)/g,"%29");

		return hmacSha256(obj.secretAccessKey, stringToSign);
	}
	return obj;
}

//<HACK> Added by Benjamin
exports.createMWSFFInBoundClient = mwsFFInBound.init(genericAWSClient);
exports.createMWSFFOutBoundClient = mwsFFOutBound.init(genericAWSClient);
exports.createMWSOrdersClient = mwsOrders.init(genericAWSClient);
exports.createMWSProdClient = mwsProd.init(genericAWSClient);
// </HACK>
// MWS
exports.createMWSProductDataClient = mws.init(genericAWSClient);
//
exports.createEC2Client = ec2.init(genericAWSClient);
exports.createProdAdvClient = prodAdv.init(genericAWSClient);
exports.createSimpleDBClient = simpledb.init(genericAWSClient);
exports.createSQSClient = sqs.init(genericAWSClient);
exports.createSNSClient = sns.init(genericAWSClient);
exports.createSESClient = ses.init(genericAWSClient);
exports.createCWClient = ses.init(genericAWSClient);

