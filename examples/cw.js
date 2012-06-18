var aws = require("../lib/aws");

cw = aws.createCWClient('AKIAJTKL77XY7O3EJSLQ', 'e0pi8MtHDCs4m+0/QGBemCCYQ/nCoyFfTO+c//5v');

cw.call("ListMetrics", {}, function(result) {
  console.log(JSON.stringify(result));
})
