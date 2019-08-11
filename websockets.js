'use strict';

var SocketPlugins = require.main.require('./src/socket.io/plugins');
SocketPlugins.mtg = {};

module.exports.init = function () {
	var main = module.parent.exports;

	SocketPlugins.mtg.query = function (socket, data, callback) {
		main.query(data.query, callback);
	};
};

