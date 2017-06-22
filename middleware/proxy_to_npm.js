'use strict';

/**
 * Module dependencies.
 */

var debug = require('debug')('cnpmjs.org:middleware:proxy_to_npm');
var config = require('../config');
var urllib = require('../common/urllib');
var common = require('../lib/common');

module.exports = function (options) {
  var redirectUrl = config.sourceNpmRegistry;
  var proxyUrls = [
    // /:pkg, dont contains scoped package
    /^\/[\w\-\.]+$/,
    // /-/package/:pkg/dist-tags
    /^\/\-\/package\/[\w\-\.]+\/dist-tags/,
  ];
  if (options && options.isWeb) {
    redirectUrl = redirectUrl.replace('//registry.', '//');
    proxyUrls = [
      // /package/:pkg
      /^\/package\/[\w\-\.]+$/,
    ];
  }
  return function* proxyToNpm(next) {
    if (config.syncModel !== 'none') {
      return yield next;
    }
    // only proxy read requests
    if (this.method !== 'GET' && this.method !== 'HEAD') {
      return yield next;
    }

    var pathname = this.path;
    var match;
    for (var i = 0; i < proxyUrls.length; i++) {
      match = proxyUrls[i].test(pathname);
      if (match) {
        break;
      }
    }
    if (!match) {
      return yield next;
    }

    var url = redirectUrl + this.url;
    debug('proxy to %s', url);

    if (options && options.isWeb) {
      this.redirect(url);
    } else {
      // 使用代理请求
      var headers = Object.assign({}, this.headers);
      delete headers.host;
      var res = yield urllib.request(url, {
        headers: headers,
        followRedirect: true,
        dataType: 'json',
        timeout: 20000
      });
      // 将 dist.tarball 地址指定到 /wnpm-download/:name/:version 路径下，进行自定义下载
      for(var version in res.data.versions) {
        var pkg = res.data.versions[version];
        common.setWnpmDownloadURL(pkg,  this);
      }
      this.status = res.status;
      this.body = res.data;
    }
  };
};
