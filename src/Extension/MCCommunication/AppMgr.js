//AppMgr
(function () {
	"use strict";

	window.AppMgr = {
		currApp: {},
		
		getApplicationName: function () {
			return AppMgr.currApp.name || "";
		},
		getApplicationIcon: function () {
			return AppMgr.currApp.icon || null;
		},
		getAppId: function () {
			return CommonDetails.getSetting("appId");
		},
		getAppSection: function () {
			//, "type": TC_NS.TCNMAppMgr.getAppOsType()
			return {"identifier": this.getAppId()};
		},
		 /*validateAppIsInstalled: function (appID, callback) {
		 	TC_NS.TCNMAppMgr.getInstalledApps(function (response) {
		 		if (response.error) {
		 			callback && callback(response);
		 			return;
		 		}
		 		TC_NS.Log.extended("----------> Look for appID = " + appID);
		 		if (response && response.length > 0) {
		 			for (var i = 0; i < response.length; i++) {
		 				if (response[i].id == appID || response[i].identifier == appID) {
		 					TC_NS.Log.extended("----------> Found appID = " + response[i].id);
		 					callback && callback({error: false, installed: true});
		 					return;
		 				}
		 			}
		 			TC_NS.Log.extended("----------> appID = " + appID + " is not installed on to the server");
		 			callback && callback({error: false, installed: false});
		 		}
		 	});
		 },*/
		// Returns array of installed Apps. Each app object is similiar to:
		//{"name":"HP-Demo","id":"681522bc-bfd2-4db5-9c4a-6cd9ae5114cb","type":"ANDROID","fileName":"HP-Demo.apk",
		// "version":"1","identifier":"com.example.hp_demo","icon":"base64blabla...",
		// "dateTime":"16:14 29/04/14","counter":1}
		// getInstalledApps: function (callback) {
		// 	TC_NS.Log.extended("----------> getInstalledApps()");
		// 	TC_NS.TCNMConnectionMgr.getRESTMsg({}, "apps", function (response) {
		// 		TC_NS.Log.extended("----------> executed CB of REST getInstalled apps");
		// 		if (response.error) {
		// 			TC_NS.Log.error("----------> Error: Failed to get installed apps: " + response.message);
		// 			callback({error: true, message: "Failed to get installed apps: " + response.message});
		// 		}
		// 		else {
		// 			callback(response.data);
		// 		}
		// 	});
		// },
		launchApp: function (installBefore, callback) {
			var server = CommonDetails.getServer();
			var device = DeviceMgr.getDeviceId(); //can not be null
			var serverAndDevice = " (" + server + ", Device: " + device + ")";

			console.log("----------> launchApp()");
			if (!ConnectionMgr.isConnected()) {
				console.log("----------> launchApp() - Web socket is not connected " + serverAndDevice);
				callback && callback({error: true, message: "Failed to launch application" + serverAndDevice});
			}
			var contentExt = {
				header: {
					"configuration": {
						"installAppBeforeExecution": installBefore !== undefined ? installBefore : CommonDetails.getSetting('installAppBeforeExecution')
					}
				}
			};
			ConnectionMgr.sendToWS("launchApplication", "mobile/launch-app-finished", false, contentExt, true, callback);
		}
	};

	// TC_NS.Query.addEventListener("mobile/job-changed mobile/job-ready", function (e) {
	// 	TC_NS.Log.extended("----------> Received event " + e.type);
	// 	function handleResponse(response) {
	// 		TC_NS.Log.extended("----------> executed CB of launchApp");
	// 		TC_NS.Event.dispatch("mobile/launch-app-done", null, {error: (response.error || response.status == "failure")});
	// 		if (response.error || response.status == "failure") {
	// 			var message = (response.message || response.errorText) + " (" + TC_NS.TCNMCommonDetails.getServer() + ", Device: " + TC_NS.TCNMDeviceMgr.getDeviceId() + ")";
	// 			TC_NS.Log.extended("----------> Error : " + message);
	// 			TC_NS.Event.dispatch("mobile/show-dialog-msg", null, {message: message});
	// 		}
	// 	}

	// 	if (TC_NS.TCNMJobMgr.currJobId) {
	// 		TC_NS.TCNMAppMgr.launchApp(true, handleResponse);
	// 	} else {
	// 		TC_NS.Log.extended("----------> Error : No job id, will not launch app");
	// 	}
	// });

})();