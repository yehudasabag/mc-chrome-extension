//RREMgr
(function () {
	"use strict";

	window.CommandsMgr = {
		startRecord: function (callback) {
			console.log("----------> startRecord()");
			if (!JobMgr.isJobReady()) {
				callback && callback({error: true, message: "Reconnect to the server" });
				return;
			}
			ConnectionMgr.sendToWS("startRecord", "mobile/record-started", true, null, true, callback);
		},
		performStartRecord: function (callback) {
			console.log("----------> performStartRecord()");
			CommandsMgr.updateRunTimeInfo();
			function onHandshakeComplete2(handshakeState) {
				console.log("----------> executed CB of serverHandshake");
				// Assumes that RTS contains deviceId and appId
				function onJobReady(response) {
					console.log("----------> executed CB of getJob");
					if (response.error) {
						console.error("----------> Error : " + response.message);
						callback(response);
					}
					else {
						if (!JobMgr.isJobReady()) {
							callback && callback({error: true, message: "Reconnect to the server" });
							return;
						}
						ConnectionMgr.sendToWS("startRecord", "mobile/record-started", true, null, true, callback);
					}
				}

				if (handshakeState.error) {
					console.error("----------> Error : " + handshakeState.message);
					callback && callback(handshakeState);
					return;
				}

				JobMgr.getJob(onJobReady);
			}

			ConnectionMgr.serverHandshake(false, onHandshakeComplete2);
		},
		stopRecord: function (callback) {
			console.log("----------> stopRecord()");
			ConnectionMgr.sendToWS("stopRecord", "mobile/record-stopped", true, null, true, callback);
		},
		performStopRecord: function (callback) {
			console.log("----------> performStopRecord()");
			this.stopRecord(callback);
		},
		performStartReplay: function (callback) {
			console.log("----------> performStartReplay()");
			CommandsMgr.updateRunTimeInfo();
			function onHandshakeComplete(handshakeState) {
				console.log("----------> executed CB of serverHandshake");
				// Assumes that RTS contains deviceId and appId
				function onJobReady(response) {
					console.log("----------> executed CB of getJob");
					if (response.error) {
						console.error("----------> Error : " + response.message);
						callback(response);
					}
					else {
						CommandsMgr.startReplay(true, callback);// In case of error the start replay will return object with error
					}
				}

				if (handshakeState.error) {
					console.error("----------> Error : " + handshakeState.message);
					callback && callback(handshakeState);
					return;
				}

				JobMgr.getJob(onJobReady);
			}

			ConnectionMgr.serverHandshake(false, onHandshakeComplete);
		},
		startReplay: function (keepAUTstate, callback) {
			AppMgr.launchApp(undefined, function (response) {
				console.log("----------> executed CB of launchApp");
				if (response.error) {
					console.error("----------> Error : " + response.message);
					callback && callback(response);
				} else {
					CommandsMgr._startReplay(true, callback);// In case of error the start replay will return object with error
				}
			});
		},
		_startReplay: function (keepAUTstate, callback) {
			console.log("----------> startReplay(keepAUTstate) - " + keepAUTstate);
			ConnectionMgr.sendToWS("startReplay", "mobile/replay-started", keepAUTstate, null, true, callback);
		},
		performStopReplay: function (callback) {
			console.log("----------> performStopReplay()");
			function onReplayStopped(replayStoppedArguments) {
				console.log("----------> executed CB of stopReplay");
				callback && callback(replayStoppedArguments);
			}

			CommandsMgr.stopReplay(onReplayStopped);
		},
		stopReplay: function (callback) {
			console.log("----------> stopReplay()");
			if (!CommonDetails.loggedIn) {
				callback && callback({error: true, message: CommonDetails.last.errorMessage});
				return;
			}
			var keepAUTState = true;
			ConnectionMgr.sendToWS("stopReplay", "mobile/replay-stopped", keepAUTState, null, true, callback);
		},
		executeStep: function (actionSection, testObj, targetTestObject, command, callback) {
			var contentExtension = {};
			if (actionSection) {
				console.log(actionSection);
				contentExtension.action = actionSection;
			}
			if (testObj && testObj.className != "Device") {
				console.log(testObj);
				contentExtension.application = {uuid: AppMgr.currApp.identifier};
			}
			if (testObj) {
				contentExtension.testObject = testObj;
			}
			if (targetTestObject) {
				contentExtension.targetTestObject = targetTestObject;
			}

			console.log("content: " + contentExtension);
			ConnectionMgr.sendToWS(command || "executeStep", "mobile/step-executed", false, contentExtension, false, callback);
		},
		findElementInPoint: function (point, callback) {
			var contentExt = {
				action: {
					"name": "findElement",
					"parameters": {
						"location": {
							"x": point.x,
							"y": point.y
						}
					}
				},
				application: {
					uuid: TC_NS.TCNMAppMgr.currApp.identifier
				}
			};
			ConnectionMgr.sendToWS("query", "mobile/find-element", true, contentExt, true, callback);
		},
		verifyElementExists: function (element, callback) {
			//create a copy with no boundsInScreen
			var obj = {};
			Object.extend(obj, element);
			delete obj.boundsInScreen;

			var contentExt = {
				action: {
					"name": "findElement",
					"parameters": obj
				},
				application: {
					uuid: AppMgr.currApp.identifier
				}
			};
			ConnectionMgr.sendToWS("query", "mobile/find-element", true, contentExt, true, callback);
		},
		updateRunTimeInfo: function () {
			// TC_NS.TCNMCommonDetails.metrics = {};
			// TC_NS.TCNMCommonDetails.metrics["cpu"] = TC_NS.RTS("memory");
			// TC_NS.TCNMCommonDetails.metrics["freeMemory"] = TC_NS.RTS("freeMemory");
			// TC_NS.TCNMCommonDetails.metrics["memory"] = TC_NS.RTS("memory");
		}
	};

})();