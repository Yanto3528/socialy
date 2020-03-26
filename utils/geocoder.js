const NodeGeocoder = require("node-geocoder");

const options = {
  provider: "mapquest",
  httpAdapter: "https",
  apiKey: "6g3Q6vdR8ghnwGq3zqIP64ONCLXFUqmO",
  formatter: null
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
