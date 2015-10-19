(function () {
	"use strict";
	console.log("############# I am inside ######");

	var RESTHandler = {
		init: function (server) {
			console.log("----------> RESTHandler::init() - " + server);
			this._server = server + "/rest/";
		},

		postMsg: function (jsonMsg, restAPI, callback) {
			this._postGetHelper(jsonMsg, restAPI, "POST", callback)
		},

		getMsg: function (jsonMsg, restAPI, callback, sync) {
			this._postGetHelper(jsonMsg, restAPI, "GET", callback, sync)
		},

		_postGetHelper: function (jsonMsg, restAPI, restType, callback, sync) {
			function onResponse() {
				console.log("REST response from " + server + " for request: " + restAPI + " status = " + xhr.status + "; responseText: " + xhr.responseText);
				if (xhr.status == 503) {
					callback && callback({
						error: true,
						message: "Failed to connecto to server: " + server
					});
					return;
				}
				if (xhr.status >= 400) {
					callback && callback({
						error: true,
						message: "Request from " + server + " failed: " + xhr.statusText
					});
					return;
				}
				console.log("REST RCV(%s): Status %d; Response: %O", restAPI, xhr.status, JSON.parse(xhr.responseText));
				// In the Login we will get this header and we need to send him from now on in our REST requests
				if (!RESTHandler._hp4mSecret) {
					RESTHandler._hp4mSecret = xhr.getResponseHeader("x-hp4msecret");
				}
				callback && callback(JSON.parse(xhr.responseText));
			}

			try {
				var async = !sync;
				var server = this._server;
				var xhr = new XMLHttpRequest();
				xhr.timeout = 30000;
				if (callback) {
					xhr.onload = onResponse;
				}
				xhr.ontimeout = function () {
					console.log("REST request from " + server + " timeout: " + restType + "; " + restAPI + "; " + msg);
					callback && callback({
						error: true,
						reason: "timeout",
						message: "Failed to connect to server: " + server
					});
				};

				xhr.onerror = function () {
					console.log("REST request from " + server + " error: " + restType + "; " + restAPI + "; " + msg);
					callback && callback({
						error: true,
						message: "Server.ConnectionFailed" + " (" + server + ")"
					});
				};

				xhr.open(restType, RESTHandler._server + restAPI, async);//async
				xhr.setRequestHeader("Content-type", "application/json;charset=UTF-8");

				if (this._hp4mSecret) {
					xhr.setRequestHeader("x-hp4msecret", this._hp4mSecret);
				}
				var msg = JSON.stringify(jsonMsg);
				console.log("REST request from " + server + ": " + restType + "; " + restAPI + "; " + msg);
				console.log("REST SND(%s): %O", restAPI, jsonMsg);
				xhr.send(msg);
			}
			catch (ex) {
				console.error("Exception in _postGetHelper:" + ex.message);
				callback && callback({ error: true, message: ex.message });
			}
		},

		startNewSession: function () {
			console.log("----------> RESTHandler::startNewSession()");
			this._hp4mSecret = null;
			this._server = null;
		},
		_server: null,

		_hp4mSecret: null
	};

	var innerPerformLogin = function (username, password, locale, callback) {
		console.log("##### post login message")
		RESTHandler.postMsg({
			"accountName": "default",
			"name": username,
			"password": password,
			"locale": locale
		}, "client/login", callback);
	}

	window.performLogin = function (username, password, locale, server) {
		RESTHandler.init(server);
		innerPerformLogin(username, password, locale, function (result) {
			console.log("### CB of performLogin: %O", result);
			//event.source.postMessage({ loggedIn: !result.error }, event.origin);
		});
	}
})();
