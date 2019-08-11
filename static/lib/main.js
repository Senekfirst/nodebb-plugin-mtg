'use strict';

/* globals $, document, window, socket, bootbox */

$(document).ready(function () {
	var Mtg = {};

	$(window).on('action:composer.enhanced', function () {
		Mtg.prepareFormattingTools();
	});

	$(window).on('action:redactor.load', function () {
		Mtg.initRedactor.apply(this, arguments);
	});

	$(window).on('action:composer.loaded', function () {
		if ($.Redactor) {
			$.Redactor.opts.plugins.push('mtg');
		}
	});

	Mtg.prepareFormattingTools = function () {
		require([
			'composer/formatting',
			'composer/controls',
		], function (formatting, controls) {
			if (formatting && controls) {
				formatting.addButtonDispatch('mtg', function (textarea, selectionStart, selectionEnd) {
					Mtg.showModal(function (url, query) {
						Mtg.select(textarea, selectionStart, selectionEnd, url, query);
					});
				});
			}
		});
	};

	Mtg.initRedactor = function () {
		$.Redactor.prototype.mtg = function () {
			return {
				init: function () {
					var self = this;
					var button = self.button.add('mtg', 'Insert MTG card');
					self.button.setIcon(button, '<i class="fa fa-mtg"></i>');
					self.button.addCallback(button, self.mtg.onClick);
				},
				onClick: function () {
					var self = this;
					Mtg.showModal(function (url, query) {
						var code = self.code.get();
						code += '<p><img src="' + url + '" alt="' + query + '" /></p>';

						self.code.set(code);
					});
				},
			};
		};
	};

	Mtg.populateDOM = function (resultsEl, cards) {
		require(['benchpress'], function (Benchpress) {
			Benchpress.parse('partials/mtg/list', {
				cards: cards,
			}, function (html) {
				resultsEl.html(html);
			});
		});
	};

	Mtg.showModal = function (callback) {
		require(['translator', 'benchpress'], function (translator, Benchpress) {
			Benchpress.parse('plugins/mtg/modal', {}, function (html) {
				var modal = bootbox.dialog({
					title: 'Insert MTG card',
					message: html,
					className: 'mtg-modal',
					onEscape: true,
				});

				var queryEl = modal.find('#mtg-query');
				var resultsEl = modal.find('#mtg-results');
				var queryTimeout;

				modal.on('shown.bs.modal', function () {
					queryEl.focus();
				});

				queryEl.on('keyup', function () {
					if (!queryEl.val().length) {
						return;
					}

					if (queryTimeout) {
						clearTimeout(queryTimeout);
					}

					queryTimeout = setTimeout(function () {
						// Trigger the real search
						socket.emit('plugins.mtg.query', {
							query: queryEl.val(),
						}, function (err, cards) {
							if (err) {
								return translator.translate(err.message, function (translated) {
									resultsEl.addClass('alert alert-warning').text(translated);
								});
							}

							// Fill the dom with the result
							Mtg.populateDOM(resultsEl, cards);
						});
					}, 250);
				});

				resultsEl.on('click', 'img[data-url]', function () {
					callback(this.getAttribute('data-url'), queryEl.val());
					modal.modal('hide');
				});
			});
		});
	};

	Mtg.select = function (textarea, selectionStart, selectionEnd, url, query) {
		require([
			'composer/formatting',
			'composer/controls',
		], function (formatting, controls) {
			if (selectionStart === selectionEnd) {
				controls.insertIntoTextarea(textarea, '![' + query + '](' + url + ')');
				controls.updateTextareaSelection(textarea, selectionStart + query.length + 4, selectionEnd + query.length + url.length + 4);
			} else {
				var wrapDelta = controls.wrapSelectionInTextareaWith(textarea, '![', '](' + url + ')');
				controls.updateTextareaSelection(textarea, selectionEnd + 4 - wrapDelta[1], selectionEnd + url.length + 4 - wrapDelta[1]);
			}
		});
	};
});
