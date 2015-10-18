//DeviceMgr
(function () {
	"use strict";
	window.DeviceMgr = {
		currDevice: {},
		getDeviceId: function () {
			return CommonDetails.getSetting("deviceId");
		},
		getDeviceName: function () {
			return this.currDevice.logicName || "";
		},
		validateDeviceIsConnected: function (deviceID, callback) {
			this.getDevices(function (response) {
				if (response.error) {
					callback && callback(response);
					return;
				}
				console.log("----------> Look for deviceID = " + deviceID);
				if (response && response.length > 0) {
					for (var i = 0; i < response.length; i++) {
						if (response[i].deviceID == deviceID && (response[i].deviceStatus == "registered" || response[i].deviceStatus == "inUse")) {
							console.log("----------> Found deviceID = " + response[i].deviceID + " deviceStatus = " + response[i].deviceStatus);
							callback && callback({error: false, connected: true});
							return;
						}
					}
					console.log("----------> deviceID = " + deviceID + " is not connected to the server");
					callback && callback({error: false, connected: false});
				}
			});
		},
		unlockDevice: function (callback, sync) {
			console.log("----------> unlockDevice()");
			var deviceId = this.getDeviceId();
			if (!deviceId) {
				console.log("----------> unlockDevice() - No deviceId - " + deviceId);
				callback && callback({});
				return;
			}
			ConnectionMgr.getRESTMsg({}, "locking/unlockDevice/" + deviceId, function (response) {
				console.log("----------> executed CB of REST locking/unlockDevice/" + deviceId);
				if (response.error) {
					console.log("----------> Error : " + response.message);
					callback && callback({
						error: true,
						reason: response.reason,
						message: "Failed to unlock device: " + response.message
					});
				}
				else {
					callback && callback({});
				}
			}, sync);
		},
		lockDevice: function (deviceId, callback) {
			console.log("----------> lockDevice(deviceId) - " + deviceId);
			console.log("----------> lockDevice() - currJobId = " + JobMgr.currJobId);
			ConnectionMgr.getRESTMsg({}, "locking/lockDevice/" + deviceId + "/" + JobMgr.currJobId, function (response) {
				if (response.error) {
					console.error("----------> Error : " + response.message);
					callback && callback({
						error: true,
						message: "Device.FailedToLockDevice" + response.message
					});
				}
				else {
					callback && callback({});
				}
			});
		},
		// Returns array of devices. Each device is an object similar to this one:
		// {"serialNumber":"4df710ba67dc21f9","status":null,"osVersion":"16","model":"GT-N7100",
		// "deviceID":"4df710ba67dc21f9","connectionType":null,"deviceStatus":"inUse","manufacturer":"samsung",
		// "agentVersion":null,"logicName":null,"deviceIP":"192.168.2.106:5000","deviceType":"real",
		// "macAddress":null,"imei":null}
		// passing parameters with jsonMsg does not work, don't know why, use url parameter instead
		getDevices: function (callback) {
			console.log("----------> getDevices()");
			ConnectionMgr.getRESTMsg({}, "devices", function (response) {
				console.log("----------> executed CB of REST getDevices");
				if (response.error) {
					console.error("----------> Error: Failed to get devices list: " + response.message);
					callback && callback({error: true, message: "Failed to get devices list: " + response.message});
				}
				else {
					callback && callback(response.data);
				}
			});
		}
	};
})();