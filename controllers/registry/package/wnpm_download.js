var debug = require('debug')('cnpmjs.org:controllers:registry:package:show');
var config = require('../../../config');
var urllib = require('../../../common/urllib');

module.exports = function* wnpmDownload(next) {
  debug('start download from %s', packageUrl);
  // 使用代理请求
  // var packageUrl = config.officialNpmRegistry + this.url.replace('/wnpm-download/' + this.params.name + '/' + this.params.version, '');
  var packageUrl = config.sourceNpmRegistry + this.url.replace('/wnpm-download/' + this.params.name + '/' + this.params.version, '');
  var res = yield urllib.request(packageUrl, {
    headers: {
      connection: this.headers.connection,
      referer: this.headers.referer,
      'user-agent': this.headers['user-agent']
    },
    followRedirect: true,
    timeout: 20000
  });
  this.status = res.status;
  this.body = res.data;
}