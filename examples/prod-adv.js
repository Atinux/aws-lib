var aws = require("../lib/aws");

prodAdv = aws.createProdAdvClient('AKIAJTKL77XY7O3EJSLQ', 'e0pi8MtHDCs4m+0/QGBemCCYQ/nCoyFfTO+c//5v', 'maleamassagec-20');

prodAdv.call("ItemSearch", {SearchIndex: "Books", Keywords: "Javascript"}, function(err, result) {
  console.log(JSON.stringify(result));
})