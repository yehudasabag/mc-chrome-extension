

(function () {
	"use strict";

	var mobileSettingsItemNameMap = {
		"serverUrl": null,
		"userName": null,
		"password": null,
		"deviceId": null,
		"appId": null,
		"restartApp": true,
		"installAppBeforeExecution": true,
		"deleteAppAfterExecution": false,
		"maxStepTimeOut": 20
	};

	window.CommonDetails = {
		currJobId: null,
		useHttps: false,
		msgTimeouts: {
			startRecord: 3 * 60 * 1000,
			startReplay: 3 * 60 * 1000,
			stopRecord: 2 * 60 * 1000,
			stopReplay: 2 * 60 * 1000,
			launchApplication: 5 * 60 * 1000,
			query: 30 * 1000 // for find-element
		},

		getSetting: function (name) {
			// Interactive Mode: get from RTS directly
			return mobileSettingsItemNameMap[name];
		},

		updateSetting: function (name, value) {
			mobileSettingsItemNameMap[name] = value;
		},

		// get serverDeviceSuffix() {
		// 	var server = TC_NS.TCNMCommonDetails.getServer();
		// 	var device = TC_NS.TCNMDeviceMgr.getDeviceId();
		// 	var serverAndDevice = " (" + server;
		// 	if (device && device !== "") {
		// 		serverAndDevice += ", Device: " + device;
		// 	}
		// 	serverAndDevice += ")";
		// 	return serverAndDevice;
		// },
		
		loggedIn: false,
		
		last: {
			serverAddr: null,
			username: null,
			password: null,
			errorMessage: null,
			useHttpsValue: null
		},
		
		resetSavedData: function () {
			//TC_NS.Log.extended("----------> resetSavedData()");
			CommonDetails.currJobId = null;
			CommonDetails.last = {
				serverAddr: null,
				username: null,
				password: null,
				errorMessage: null,
				useHttpsValue: null
			};
		},

		getServer: function () {
			var server = CommonDetails.getServerUrl();
			if (server) {
				var begin = server.indexOf("://");
				begin = begin == -1 ? 0 : begin + 3;
				var end = server.lastIndexOf("/");
				if (end <= begin || end == -1) {
					end = server.length;
				}
				server = server.substr(begin, end - begin);
			}
			return server;
		},

		// validateServerUrl: function (serverUrl) {
		// 	var ipAddr = TC_NS.TCNMCommonDetails.getServerIP(serverUrl);
		// 	if (!ipAddr.match(/[a-z]/i) && !TC_NS.TCNMCommonDetails.checkIsValidIPV4(ipAddr)) {
		// 		TC_NS.Event.dispatch("mobile/show-dialog-msg", null, {message: getL10NStr("Server.InvalidIP")});
		// 		TC_NS.Log.extended("----------> validateServerUrl() - invalid ip - " + ipAddr);
		// 		return {error: true, message: window.getL10NStr("Server.InvalidIP")};
		// 	} else {
		// 		var port = TC_NS.TCNMCommonDetails.getServerPort(serverUrl);
		// 		if (!port || !TC_NS.TCNMCommonDetails.checkIsPortValid(port)) {
		// 			TC_NS.Event.dispatch("mobile/show-dialog-msg", null, {message: getL10NStr("Server.InvalidPort")});
		// 			TC_NS.Log.extended("----------> validateServerUrl() - invalid port - " + port);
		// 			return {error: true, message: window.getL10NStr("Server.InvalidPort")};
		// 		}
		// 	}
		// 	TC_NS.Log.extended("----------> validateServerUrl() - ip and port are valid");
		// 	return {error: false};
		// },
		getUrlPrefix: function () {
			return "http";
		},
		getServerIP: function (ipAndPort) {
			var url = ipAndPort || CommonDetails.getSetting("serverUrl");
			var index = url.indexOf(":");
			if (index === -1)
				return url;
			return url.substring(0, index);
		},
		getServerUrl: function () {
			return CommonDetails.getSetting("serverUrl");
		},
		getUserName: function () {
			return CommonDetails.getSetting("userName");
		},
		getPassword: function () {
			return CommonDetails.getSetting("password");
		},
		checkIsValidIPV4: function (ipAddr) {
			var blocks = ipAddr.split(".");
			if (blocks.length === 4) {
				return blocks.every(function (block) {
					return !isNaN(block) && parseInt(block, 10) >= 0 && parseInt(block, 10) <= 255;
				});
			}
			return false;
		},
		checkIsPortValid: function (port) {
			return !isNaN(port) && port >= 1 && port <= 65535;
		},
		getServerPort: function (ipAndPort) {
			var index = ipAndPort.indexOf(":");
			if (index === -1)
				return undefined;
			return ipAndPort.substring(index + 1);
		}
	};
})();