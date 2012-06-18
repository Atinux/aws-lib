var aws = require("aws-lib");

ec2 = aws.createEC2Client('AKIAJTKL77XY7O3EJSLQ', 'e0pi8MtHDCs4m+0/QGBemCCYQ/nCoyFfTO+c//5v');

ec2.call("DescribeInstances", {}, function(err, result) {
  console.log(JSON.stringify(result));
})