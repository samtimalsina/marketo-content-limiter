// Marketo Content Limiter
// Based on original script by Brady Matthews

(function ($) {
	if (window.self !== window.top) {
		console.log("This script does not work in an iframe");
		return;
	}
	var settings = {
		'cookieName'	:	false,
		'allowedDomains':	/[\.\/]talend.com|[\.\/]talendforge.org|[\.\/]magiclogixstaging.com/i,
		
	}
	head.js({json : "json2.min.js"},
			{cookie : "jquery.cookie.js"},
			{simplemodal : "jquery.simplemodal.js"},
			{easyxdm : "easyXDM.js"});
	head(function () {
		// CSS added here to avoid having to add CSS to every site's header
		// And adding a <link> dynamically does not have a "ready" event
		var CSS = "#basic-modal-content{display:none;}";
		CSS += "#simplemodal-overlay{background-color:#000;}";
		CSS += "#simplemodal-container{height:360px;width:400px;background-color:#FFF;-webkit-box-shadow:0 0 20px 2px rgba(0,0,0,1);box-shadow:0 0 20px 2px rgba(0,0,0,1);padding:4px;}";
		CSS += "#simplemodal-container code{background:#141414;border-left:3px solid #65B43D;color:#bbb;display:block;font-size:12px;margin-bottom:12px;padding:4px 6px 6px;}";
		CSS += "#simplemodal-container a{color:#ddd;} #simplemodal-container a.modalCloseImg{background:url(http://www.talend.com/sites/all/modules/talend/includes/img/style/closeForm.png) no-repeat;width:30px;height:29px;display:inline;z-index:3200;position:absolute;top:-15px;right:-16px;cursor:pointer;}";
		CSS += "#simplemodal-container h3{color:#84b8d9;} #simplemodal-container .simplemodal-data > iframe{width:100%;height:100%;}";
		var fullDomain = location.hostname; 
		var topDomain = fullDomain.split('.').slice(-2).join('.'); 
		var subDomain = fullDomain.split('.').slice(0, fullDomain.split('.').length - 2).join('.'); 
		var ContentLimiter = function () {};
		ContentLimiter.prototype.getCookie = function () {
			var data = $.cookie('mytalend');
			if (data && typeof data === "string" && data.length > 1) {
				try {
					data = JSON.parse(data);
				} catch (e) {
					console.log("Could not parse mytalend cookie");
					return {};
				}
			}
			if (typeof data !== "object")
				return {};
			return data;
		};
		ContentLimiter.prototype.setCookie = function (key, value) {
			var cookie = this.getCookie();
			cookie[key] = value;
			$.cookie('mytalend', JSON.stringify(cookie));
			console.log('cookie ' + key + ' updated to ' + value);
		};
		function updateUser() {
			var data = $.cookie('mytalend');
			cookie = JSON.parse(data);
			cookie['QualifiedUser'] = true;
			$.cookie('mytalend', JSON.stringify(cookie));
		}
		ContentLimiter.prototype.trackContent = function (contentData, callback) {
			// @todo tracking
			callback.call(this, contentData);
		};
		ContentLimiter.prototype.limitContent = function (contentData) {
			this.trackContent(contentData, this.gateAsNecessary);
		};
		ContentLimiter.prototype.limitLink = function (link, type, ls, lsd) {
			var self = this;
			link.click(function (e) {
				if (self.gateAsNecessary({
						'type' : type,
						'ls' : ls,
						'lsd' : lsd
					})) {}
				else {
					e.preventDefault();
					e.stopPropagation();
					return false;
				}
				e.preventDefault();
				e.stopPropagation();
				return false;
			});
		};
		ContentLimiter.prototype.gateAsNecessary = function (contentData) {
			var cookie = this.getCookie();
			// If the user is a Qualified User, show no forms
			if (cookie.QualifiedUser === true)
				return true;
			// If the user is logged in, but not a QU, show a popup form
			if (typeof cookie.Username === "string" && cookie.Username.length) {
				this.showPopupQualifiedForm();
			} else {
				this.showDefaultPopupForm(contentData);
				//this.redirectToDrupalRegistration(contentData);
				//this.showPopupQualifiedForm(contentData);
			}
		};
		ContentLimiter.prototype.shouldLimitTutorial = function () {
			// Only show the form for the third tutorial viewed
			return true;
			var cookie = this.getCookie();
			if (!cookie._tut) {
				this.setCookie("_tut", 1);
				return false;
			} else {
				//if(cookie._tut >= 2) return true;
				this.setCookie("_tut", cookie._tut + 1);
				return false;
			}
		};
		ContentLimiter.prototype.getQueryString = function (contentData, obj) {
			var qs = {
				redir : window.location.href
			};
			if (contentData) {
				if (contentData.ls)
					qs.ls = contentData.ls;
				if (contentData.lsd)
					qs.lsd = contentData.lsd;
			}
			if (obj)
				return qs;
			return $.param(qs);
		};
		ContentLimiter.prototype.redirectToDrupalRegistration = function (contentData) {
			window.location = "http://www.talend.com/user/register?" + this.getQueryString(contentData);
		};
		ContentLimiter.prototype.showDefaultPopupForm = function (contentData) {
			var qsObj = this.getQueryString(contentData, true)
				var container = $('<div></div>');
			container.modal({
				close : false,
				opacity : 80,
				onOpen : function (dialog) {
					dialog.overlay.fadeIn('slow');
					dialog.container.show();
					dialog.data.show();
					var socket = new easyXDM.Socket({
							remote : "//info.talend.com/QualifiedUserForm_transparent.html",
							'container' : container[0],
							onMessage : function (message, origin) {
								var allowedDomains = /[\.\/]talend.com|[\.\/]talendforge.org|[\.\/]magiclogixstaging.com/i;
								if (!allowedDomains.test(origin))
									return;
								message = JSON.parse(message);
								if (!message || !message.op)
									return;
								console.log('Drupal received: ', message);
								if (message.op === "updateHeight") {
									if (!message.height) {
										console.log('drupal-popup.js: invalid height supplied for updateHeight');
										return;
									}
									//container.find('iframe').css('height', message.height);
									container.find('iframe').animate({
										height : message.height
									});
									dialog.container.animate({
										height : message.height + 10
									});
								} else if (message.op === "formSubmitSuccess") {
									$('#simplemodal-overlay').hide();
									$('#simplemodal-container').hide();
									updateUser();
								}
							},
							/*onReady: function() {
							var msg = {op: "addRedirData", data: qsObj};
							socket.postMessage(JSON.stringify(msg));
							}*/
						});
				}
			});
		};
		ContentLimiter.prototype.showPopupQualifiedForm = function () {
			var container = $('<div></div>');
			container.modal({
				close : false,
				opacity : 80,
				onOpen : function (dialog) {
					dialog.overlay.fadeIn('slow');
					dialog.container.show();
					dialog.data.show();
					var socket = new easyXDM.Socket({
							remote : "https://info.talend.com/IntermediaryFrame.html?url=" + encodeURIComponent("https://info.talend.com/QualifiedUserForm_popup.html"),
							'container' : container[0],
							onMessage : function (message, origin) {
								var allowedDomains = /[\.\/]talend.com|[\.\/]talendforge.org|[\.\/]magiclogixstaging.com/i;
								if (!allowedDomains.test(origin))
									return;
								message = JSON.parse(message);
								if (!message || !message.op)
									return;
								console.log('Drupal received: ', message);
								if (message.op === "updateHeight") {
									if (!message.height) {
										console.log('drupal-popup.js: invalid height supplied for updateHeight');
										return;
									}
									//container.find('iframe').css('height', message.height);
									container.find('iframe').animate({
										height : message.height + 10
									});
									dialog.container.animate({
										height : message.height
									});
								} else if (message.op === "formSubmitSuccess") {
									$('#simplemodal-overlay').hide();
									$('#simplemodal-container').hide();
									updateUser();
								} else {
									return;
								}
							}
						});
				}
			});
		};
		$(document).ready(function () {
			$('head').append($('<style/>').html(CSS));
			var cl = window.__cl = new ContentLimiter();
			//if(typeof __cl_content === "undefined")
			var __cl_content = {
				ls : "THC",
				lsd : "THC",
				type : 'help',
				id : '1'
			};
			cl.limitContent(__cl_content);
			// Jira
			if (subDomain === "jira") {
				$('.lnk').each(function (i, el) {
					el = $(el);
					cl.limitLink(el, "jira", "Web - Jira", "Some Link");
				});
			}
		});
	});
})(jQuery);
