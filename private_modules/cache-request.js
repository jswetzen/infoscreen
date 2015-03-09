var fs = require('fs');
var https = require('https');

function getUrl(url, callback, failback) {
  https.get(url, function(response) {
    var body = '';
    response.on('data', function(data) {
      body += data;
    }).on('end', function() {
      callback(body);
    }).on('error', function(e) {
      failback();
    });
  });
}

function writeCacheFile(data, cacheFile, callback) {
  fs.writeFile(cacheFile, data, function(err) {
    if(err) {
      console.log("Could not write cache file" + err);
    } else {
      callback(data);
    }
  });
}

function updateCache(url, cacheFile, callback, failback) {
  getUrl(url, function(data) {
    writeCacheFile(data, cacheFile, callback);
  },
  function() {
    failback();
  });
}

module.exports = {
  get: function(url, cacheFile, callback) {
    fs.readFile(cacheFile, {'encoding': 'utf-8'}, function (err, body) {
      if (err) {
        updateCache(url, cacheFile, callback, function() {
          console.log("Could not fetch cache");
        });
      } else {
        fs.stat(cacheFile, function(err, stats) {
          if (!err) {
            fs.stat(cacheFile, function(err, stats) {
              if (!err && stats.mtime.getHoursBetween(new Date()) > 12) {
                updateCache(url, cacheFile, callback, function() { callback(body); });
              } else {
                callback(body);
              }
            });
          } else {
            callback(body);
          }
        });
      }
    });
  }
};
