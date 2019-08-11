'use strict';

/* globals $, app, socket */

define('admin/plugins/mtg', ['settings'], function (Settings) {
	var ACP = {};

	ACP.init = function () {
		Settings.load('mtg', $('.mtg-settings'));

		$('#save').on('click', function () {
			Settings.save('mtg', $('.mtg-settings'), function () {
				app.alert({
					type: 'success',
					alert_id: 'mtg-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function () {
						socket.emit('admin.reload');
					},
				});
			});
		});
	};

	return ACP;
});
