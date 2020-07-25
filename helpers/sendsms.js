var qs = require("querystring");
var http = require("https");

var options = {
  "method": "POST",
  "hostname": "www.smsgateway.center",
  "port": null,
  "path": "/SMSApi/rest/send",
  "headers": {
    "content-type": "application/x-www-form-urlencoded",
    "cache-control": "no-cache"
  }
};

function sendsms()
{

var req = http.request(options, function (res) {
  var chunks = [];

  res.on("data", function (chunk) {
    chunks.push(chunk);
  });

  res.on("end", function () {
    var body = Buffer.concat(chunks);
    console.log(body.toString());
  });
});

req.write(qs.stringify({ userId: 'manipurmart',
  password: 'kdBhtah6',
  senderId: 'SMSGAT',
  sendMethod: 'simpleMsg',
  msgType: 'text',
  mobile: '9713313358',
  msg: 'This is my first message with SMSGateway.Center',
  duplicateCheck: 'true',
  testMessage:'true',
  format: 'json' }));
req.end();
}

module.exports.sendsms = sendsms

