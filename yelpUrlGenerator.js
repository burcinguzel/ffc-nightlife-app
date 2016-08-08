var oauthSignature = require('oauth-signature');  
var nonce = require('nonce')();  
var request = require('request');  
var qs = require('querystring');  
var lodash = require('lodash');

var generateYelpUrl = function(myLocation,myLanguage,callback) {
  var httpMethod = 'GET';
  var url = 'http://api.yelp.com/v2/search';
  var default_parameters = {
    lang: myLanguage,
    term : 'restaurants',
    location: myLocation,
    sort: '2'
  };

  var required_parameters = {
    oauth_consumer_key : process.env.yelp_consumer_key,
    oauth_token :  process.env.yelp_token,
    oauth_nonce : nonce(),
    oauth_timestamp : nonce().toString().substr(0,10),
    oauth_signature_method : 'HMAC-SHA1',
    oauth_version : '1.0'
  };

  var parameters = lodash.assign(default_parameters,  required_parameters);
  var consumerSecret = process.env.yelp_consumer_secret;
  var tokenSecret = process.env.yelp_token_secret;

  var signature = oauthSignature.generate(httpMethod, url, parameters, consumerSecret, tokenSecret, { encodeSignature: false});

  parameters.oauth_signature = signature;
  var paramURL = qs.stringify(parameters);
  var apiURL = url+'?'+paramURL;
  request(apiURL, function(error, response, body){
      return callback(error, response, body);
  });
  return apiURL;
};
 exports.generateYelpUrl = generateYelpUrl;