'use strict';

var controllers = require('./lib/controllers');
var websockets = require('./websockets');
var meta = require.main.require('./src/meta');
var winston = require.main.require('winston');

var request = require('request');

var plugin = {
	_settings: {
		key: null,
	},
};

/**
 * Called with the hook static:app.load
 */
plugin.init = function (params, callback) {
	var router = params.router;
	var hostMiddleware = params.middleware;

	router.get('/admin/plugins/mtg', hostMiddleware.admin.buildHeader, controllers.renderAdminPage);
	router.get('/api/admin/plugins/mtg', controllers.renderAdminPage);

	websockets.init();
	plugin.refreshSettings(callback);
};

plugin.refreshSettings = function (callback) {
	meta.settings.get('mtg', function (err, settings) {
		Object.assign(plugin._settings, settings);

		// Check all the plugin specific settings required
		if (!settings.key || !settings.key.length) {
			winston.warn('[plugin/mtg] Invalid or missing API Key, plugin disabled');
		}

		callback(err);
	});
};

/**
 * Called with the hook filter:admin.header.build
 */
plugin.addAdminNavigation = function (header, callback) {
	header.plugins.push({
		route: '/plugins/mtg',
		icon: 'fa-tint',
		name: 'MTG',
	});

	callback(null, header);
};

/**
 * Called with the hook filter:composer.formatting
 * Add the specific card choice button to the composer
 */
plugin.registerFormatting = function (payload, callback) {
	if (!plugin._settings.key) { // If the required settings are not defined : don't add the button te the composer
		return setImmediate(callback, null, payload);
	}

	payload.options.push({ name: 'mtg', className: 'fa fa-mtg', title: 'Insert MTG card' });
	callback(null, payload);
};

plugin.query = function (query, callback) {
	const uriSafeCardName = encodeURIComponent(query);
	request({
		url: 'http://gatherer.wizards.com/Handlers/InlineCardSearch.ashx?nameFragment=' + uriSafeCardName,
		method: 'get',
		json: true,
	}, function (err, res, body) {
		if (!plugin._settings.key || !body || !body.Results) {
			err = new Error('[[error:invalid-login-credentials]]');
		}

		if (err) {
			return callback(err);
		}

		// Clear the objects
		var cards = body.results.map(function (cardData) {
			return {
				id: cardData.ID,
				name: cardData.Name,
				url: 'http://gatherer.wizards.com/Handlers/Image.ashx?multiverseid=' + cardData.ID + '&type=card',
			};
		});

		callback(null, cards);
	});
};

module.exports = plugin;
