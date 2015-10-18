//ConMgr
(function () {
	"use strict";

	var WebSocketHandler = {
		_server: null,

		_ws: null,

		init: function () {
			var server = CommonDetails.getServer();
			console.log("----------> WebSocketHandler::init() " + server);
			var useHttps = CommonDetails.useHttps;
			var wsPrefix = useHttps ? "wss" : "ws";
			this._server = wsPrefix + "://" + server + "/ws/";
		},

		get connected() {
			return WebSocketHandler._ws && WebSocketHandler._ws.readyState == WebSocket.OPEN;
		},

		connect: function (openCB, messagesCB, errorCB) {
			console.log("----------> WebSocketHandler::connect() - " + CommonDetails.getServer());
			if (!WebSocketHandler._server) {
				WebSocketHandler.init();
			}
			WebSocketHandler._ws = new WebSocket(WebSocketHandler._server);

			WebSocketHandler._ws.onopen = function () {
				openCB();
			};

			WebSocketHandler._ws.onerror = function () {
				errorCB();
			};

			WebSocketHandler._ws.onclose = function (event) {
				console.log("----------> WebSocketHandler - Closed with code - " + event.code);
			};

			WebSocketHandler._ws.onmessage = function (event) {
				messagesCB(event.data);
			};
		},

		disconnect: function (callback) {
			console.log("----------> WebSocketHandler - disconnect()");
			if (callback) {
				WebSocketHandler._ws.addEventListener("close", function onClose() {
					console.log("----------> WebSocket disconnect callback invoked");
					WebSocketHandler._ws.removeEventListener("close", onClose, false);
					callback();
				}, false);
			}
			WebSocketHandler._ws.close();
		},

		send: function (msg) {
			console.log("WS send to " + CommonDetails.getServer() + ": " + msg);
			var parsed = JSON.parse(msg);
			console.log("WS SND(%s): %O", (parsed.data && parsed.data.data && parsed.data.data.command), parsed);
			
			try {
				if (WebSocketHandler.connected)
					WebSocketHandler._ws.send(msg);
				else {
					TC_NS.Event.dispatch("mobile/ws-communication-error", null, {state: WebSocketHandler._ws.readyState}, TC_NS.Event.DISPATCH_SYNC);
				}
			} catch (ex) {
				console.error(ex.message, "----------> WebSocketHandler::send()");
			}
		},

		startNewSession: function (callback) {
			console.log("----------> WebSocketHandler::startNewSession()");
			WebSocketHandler._server = null;
			if (WebSocketHandler.connected) {
				WebSocketHandler.disconnect(callback);
			} else {
				callback && callback();
			}
		}
	};

	var RESTHandler = {
		init: function () {
			var server = CommonDetails.getServer();
			console.log("----------> RESTHandler::init() - " + server);
			this._server = CommonDetails.getUrlPrefix() + "://" + server + "/rest/";

			if (RESTHandler.keepAliveHandlerId)
				clearInterval(RESTHandler.keepAliveHandlerId);

			// This keepAlive is because after 30 minutes without REST the HTTP session gets timeout.
			// In order to solve this issue the server added a keepAlive for REST.
			RESTHandler.keepAliveHandlerId = setInterval(function () {
				ConnectionMgr.getRESTMsg({}, "keepAlive");
			}, 20 * 60 * 1000);
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
				var server = CommonDetails.getServer();
				var async = !sync;
				if (!this._server) {
					this.init();
				}
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
						message: window.getL10NStr("Server.ConnectionFailed") + " (" + server + ")"
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
				callback && callback({error: true, message: ex.message});
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

	var _UIIDsList = {};

	function _createUID() {
		var randVal = Math.random();
		randVal = randVal != 0 ? randVal : Math.random();
		var UID = Math.floor(randVal * 1000000000000000);
		return UID;
	}

	var UIDManager = {
		getUID: function(commandID){
			var UID = _createUID();
			while (_UIIDsList[UID]){
				UID = _createUID();
			}
			_UIIDsList[UID] = commandID;
			return UID;
		},
		validateAndClearUID: function(UID,commandID){
			if (!_UIIDsList[UID] || _UIIDsList[UID] !== commandID)
				return false;
			this.clearUID(UID);
			return true;
		},
		clearUID: function(UID){
			delete _UIIDsList[UID];
		},
		clear: function(){
			_UIIDsList = {};
		}
	};

	window.ConnectionMgr = {
		isConnected: function () {
			return WebSocketHandler.connected;
		},
		incomingWsMessageHandler: function (notificationMessage) {
			console.log("Incoming ws message: " + notificationMessage);
			try {
				var resBody = JSON.parse(notificationMessage);
				console.log("WS RCV(%s): %O", (resBody.data && resBody.data.data && resBody.data.data.command), resBody);
				if (!resBody.data) return;
				if (resBody.data.data.command != "report")
					return;

				var content = resBody.data.data.content;

				// if (resBody.type == "response" && !UIDManager.validateAndClearUID(resBody.uid,content.command)){
				// 	console.error("----------> Error: Message from server is not validated (UID = " + resBody.uid + " Command = " + content.command + "). Dropping message");
				// 	return;
				// }

				if (content.status && content.status != 'success') {	// log error
					var server = CommonDetails.getServer();
					var device = DeviceMgr.getDeviceId();
					var serverAndDevice = " (" + server;
					if (device && device !== "") {
						serverAndDevice += ", Device: " + device;
					}
					serverAndDevice += ")";
					console.error("----------> Error: Server request failed for command '" + content.command + "' with error #" + content.errorCode + " - " + content.message + serverAndDevice);
				}

				var responseArgs = {
					status: content.status, errorCode: content.errorCode,
					errorText: content.message || content.errorCode,
					screenshot: content.screenshot
				};

				var updateAdditionalValues = function () {
					responseArgs.result = content.result;
					if (resBody.data.data.statistics)
						responseArgs.deviceDuration = resBody.data.data.statistics.deviceDuration;
				};

				switch (content.command) {
					case "stepRecorded":
						content.data.job = {id: content.job.id};
						content.data.device = {id: content.device.id};
						Event.dispatch("mobile/stepRecieved", null, {stepContent: content.data});
						break;
					case "startReplay":
						YEvent.dispatch("mobile/replay-started", responseArgs);
						break;
					case "startRecord":
						YEvent.dispatch("mobile/record-started", responseArgs);
						break;
					case "launchApplication":
						YEvent.dispatch("mobile/launch-app-finished", responseArgs);
						break;
					case "startAnalog":
						YEvent.dispatch("mobile/analog-started", responseArgs);
						break;
					case "stopRecord":
						YEvent.dispatch("mobile/record-stopped", responseArgs);
						break;
					case "stopReplay":
						YEvent.dispatch("mobile/replay-stopped", responseArgs);
						break;
					case "stopAnalog":
						YEvent.dispatch("mobile/analog-stopped", responseArgs);
						break;
					case "executeStep":
						updateAdditionalValues();
						YEvent.dispatch("mobile/step-executed", responseArgs);
						break;
					case "query":
						updateAdditionalValues();
						YEvent.dispatch("mobile/find-element", responseArgs);
						break;
					case "simulateEvent":
						if(resBody.type == "response") {
							updateAdditionalValues();
							YEvent.dispatch("mobile/step-executed", responseArgs);
						} else { // event simulation recorded
							YEvent.dispatch("mobile/stepRecieved", null, {stepContent: content });
						}
						break;
					default:
						if (content.status == "failure") {
							YEvent.dispatch("mobile/handle-server-failure", null, {
								error: content.errorCode || true,
								message: content.message || ("Error:" + content.errorCode)
							});
							return;
						}
						// ignoring keep alive messages
						return;
				}
			}
			catch (ex) {
				console.error("Exception in incomingWsMessageHandler: " + ex.message);
			}
		},
		getCmdMsg: function (cmd, includeHeader, testObj, targetTestObject) {
			var cmdObj = {
				"type": "request",
				"uid": UIDManager.getUID(cmd),
				"data": {
					"data": {
						"command": cmd,
						"content": {
							"job": {"id": JobMgr.currJobId},
							"device": {"id": DeviceMgr.getDeviceId()}
						}
					}
				}
			};
			// only when includeHeader is intentionally false do not add it, otherwise add
			if (includeHeader === undefined || includeHeader === true) {
				var networkConditionsType = null;
				// if (TC_NS.RTS("EnableNetworkConditions")) {
				// 	var networkConditionsUsePredefined = TC_NS.RTS("NetworkConditionsUsePredefined");
				// 	if (networkConditionsUsePredefined === 1 || networkConditionsUsePredefined === undefined) {
				// 		networkConditionsType = TC_NS.RTS("NetworkConditionsType");
				// 		networkConditionsType = (networkConditionsType >= 1 && networkConditionsType <= profilesArray.length) ? profilesArray[networkConditionsType - 1] : null;
				// 	} else {
				// 		networkConditionsType = TC_NS.RTS("NetworkConditionsUserType");
				// 	}
				// }

				//var SNAPSHOT_ALWAYS = '2';
				cmdObj.data.data.content.header = {
					"configuration": {
						"restartApp": McCommonDetails.getSetting("restartApp"),
						"installAppBeforeExecution": McCommonDetails.getSetting("installAppBeforeExecution"),
						"deleteAppAfterExecution": McCommonDetails.getSetting("deleteAppAfterExecution"),
						"maxStepTimeOut": McCommonDetails.getSetting("maxStepTimeOut"),
					},
					"collect": {
						"cpu": false,
						"freeMemory": false,
						"memory": false,
						"logs": false,
						"screenshot": false
					}
					// "networkConditionsProfileId": networkConditionsType
				}
			}
			if (testObj) {
				cmdObj.data.data.content.testObject = {};
				Object.extend(cmdObj.data.data.content.testObject, testObj);
			}
			return cmdObj;
		},
		
		get serverInformationChanged() {
			var username = CommonDetails.getUserName();
			var password = CommonDetails.getPassword();
			var server = CommonDetails.getServer();
			var useHttps = CommonDetails.useHttps;

			console.log("----------> serverInformationChanged");
			if (CommonDetails.last.serverAddr != server || CommonDetails.last.username != username || CommonDetails.last.password != password || CommonDetails.last.useHttpsValue != useHttps) {
				console.log("----------> serverInformationChanged - true");
				return true
			}
			console.log("----------> serverInformationChanged - false");
			return false;
		},
		serverHandshake: function (force, callback) {
			console.log("----------> serverHandshake()");
			function innerCallback(response) {
				YEvent.dispatch("mobile/connect-server-done", null, {error: response.error});
				callback && callback(response);
			}

			function onLoginResponse(response) {
				var serverUrl = CommonDetails.getServer();
				if (serverUrl !== "") {
					serverUrl = " (" + serverUrl + ")";
				}

				console.log("----------> executed CB of login to server" + serverUrl);
				if (response.error) {
					console.error("----------> executed CB of login - has error" + serverUrl);
					ConnectionMgr.cleanup(function () {
						//Clean the last server because there was some error in the connection. In the next successful
						// attempt to reconnect we want to resetSavedData() and this will happen only if the server changed
						CommonDetails.last.serverAddr = "";
					});
					CommonDetails.last.errorMessage = response.message || "Server.ConnectionFailed" + serverUrl;
					console.log("----------> Error : " + CommonDetails.last.errorMessage);
					innerCallback({error: true, message: CommonDetails.last.errorMessage});
				}
				else {
					if (CommonDetails.last.serverAddr && (CommonDetails.last.serverAddr != server)) {
						CommonDetails.resetSavedData();
						// if we succeed to connect to the new server, reset app and device data and save, because it
						// is not relevant anymore
						TC_NS.Event.dispatch("mobile/new-server-session");
					}
					CommonDetails.loggedIn = true;
					if (!ConnectionMgr.isConnected()) {
						WebSocketHandler.connect(function () {//ws open callback
								console.log("----------> executed CB of WebSocketHandler.connect" + serverUrl);
								//updateServerInformation();
								innerCallback({});
							},
							ConnectionMgr.incomingWsMessageHandler,//ws message callback
							function () {//ws error callback
								console.error("----------> executed CB of WebSocketHandler.onerror" + serverUrl);
								innerCallback({error: true});
							});
					}
					else {
						innerCallback({});
					}
				}
			}

			var username = CommonDetails.getUserName();
			var password = CommonDetails.getPassword();
			var server = CommonDetails.getServer();
			//var locale = window.getCurrentActiveLanguage ? window.getCurrentActiveLanguage() : "en";
			ConnectionMgr.login(username, password, server, "en", force, onLoginResponse);
		},
		// reestablishConnection: function (callback) {
		// 	if (!isLoadMode) {
		// 		TC_NS.Log.extended("----------> reestablishConnection interactive mode");
		// 		TC_NS.Event.dispatch("mobile/reestablish-connection", null, {callback: callback});
		// 	} else {
		// 		TC_NS.Log.extended("----------> reestablishConnection load mode");
		// 		TC_NS.TCNMConnectionMgr.serverHandshake(true, callback);
		// 	}
		// },
		// recoverConnection: function (callback) {
		// 	var retriesNum = 5;// TC_NS.RTS("RecoveryRetriesNumber");
		// 	var interval = 60000;// TC_NS.RTS("RecoveryInterval");
		// 	var count = 0;

		// 	function reconnect() {
		// 		TC_NS.Log.extended("----------> starting reestablishConnection " + (count + 1));
		// 		TC_NS.TCNMConnectionMgr.reestablishConnection(function (response) {
		// 			if (!response.error) {
		// 				TC_NS.Log.extended("----------> reestablishConnection succeded");
		// 				callback && callback(response);
		// 			} else {
		// 				count++;
		// 				if (count < retriesNum) {
		// 					TC_NS.Log.extended("----------> reestablishConnection failed: " + response.message + ". Retrying.");
		// 					setTimeout(reconnect, interval);
		// 				} else {
		// 					TC_NS.Log.extended("----------> reestablishConnection failed: " + response.message + ". Finished.");
		// 					callback && callback({error: true, recoveryFailed: true});
		// 				}
		// 			}
		// 		});
		// 	}

		// 	TC_NS.Log.extended("----------> starting recoverConnection");
		// 	reconnect();
		// },
		getXhp4msecret: function () {
			return RESTHandler._hp4mSecret;
		},
		login: function (username, password, server, locale, force, callback) {
			function innerLogIn() {
				ConnectionMgr.postRESTMsg({
					"accountName": "default",
					"name": username,
					"password": password,
					"locale": locale
				}, "client/login", function (response) {
					console.log("----------> executed CB of REST client/login");
					callback && callback(response);
				});
			}

			console.log("----------> login(username, server) - " + username + ", " + server);
			locale = locale || "en";

			if (!username || !username.length || !server || !server.length) {
				console.log("----------> login() - user name or server are invalid");
				callback && callback({error: true, message: "AppDevice.NoneServerOrUser"});
				return;
			}

			/*var retObj = CommonDetails.validateServerUrl(server);
			if (retObj.error) {
				console.log("----------> login() - ip or port are invalid");
				callback && callback(retObj);
				return;
			}*/
			if (!force) {
				if (!CommonDetails.loggedIn) {
					innerLogIn();
				} else {
					callback && callback({});
				}
			} else {
				ConnectionMgr.cleanup(innerLogIn);
			}
		},
		logout: function (callback) {
			console.log("----------> logout()");
			if (CommonDetails.loggedIn) {
				CommonDetails.loggedIn = false;
				ConnectionMgr.postRESTMsg(null, "client/logout", callback);
				WebSocketHandler.disconnect();
				UIDManager.clear();
			}
			else {
				callback && callback({});
			}
		},
		cleanup: function (callback) {
			console.log("----------> cleanup()");
			if (CommonDetails.loggedIn) {
				ConnectionMgr._cleanupExistingSession(callback);
			} else {
				RESTHandler.startNewSession();
				WebSocketHandler.startNewSession(callback);
			}
		},
		_cleanupExistingSession: function (callback) {
			function endingServerSessionHandler() {
				console.log("----------> executed CB of dispatchAndTrack:mobile/ending-server-session");
				ConnectionMgr.logout(function () {
					console.log("----------> executed CB of logout");
					CommonDetails.loggedIn = false;
					RESTHandler.startNewSession();
					WebSocketHandler.startNewSession(callback);//clear connection so the callback will reconnect the ws
				});
			}

			console.log("----------> _cleanupExistingSession()");
			//TC_NS.Event.dispatchAndTrack("mobile/ending-server-session", null, null, endingServerSessionHandler);
		},
		sendToWS: function (msgType, waitResponseType, keepAUTState, contentExtension, includeHeader, callback) {
			// function onTimeout() {
			// 	if (errorHandler) {
			// 		errorHandler.off("mobile/server-failed");
			// 	}
			// 	handler.off(waitResponseType, handler);

			// 	UIDManager.clearUID(cmdMsgObj.uid);

			// 	callback && callback({
			// 		error: true,
			// 		timeout: true,
			// 		message: window.getL10NStr("LogMessages.ServerTimeout") + msgType
			// 	});
			// }

			// if (!ConnectionMgr.isConnected())
			// 	return callback && callback({
			// 			error: true,
			// 			disconnected: true,
			// 			message: "LogMessages.RecoverServer"
			// 		});
			// var errorHandler = null;
			// if (callback) {
			// 	errorHandler = YEvent.on("mobile/server-failed", function (e) {
			// 		handler.off(waitResponseType);
			// 		clearTimeout(serverNotRespondingTimer);
			// 		stepTimeoutEvent.off("step/timeout", onTimeout);
			// 		UIDManager.clearUID(cmdMsgObj.uid);
			// 		callback({error: e.error, message: e.errorText});
			// 	});
			// }

			var cmdMsgObj = ConnectionMgr.getCmdMsg(msgType, includeHeader);
			if (keepAUTState) {
				var config = cmdMsgObj.data.data.content.header.configuration;
				config.installAppBeforeExecution = false;
				config.launchApplication = false;
				config.restartApp = false;
				config.deleteAppAfterExecution = false;
			}
			if (contentExtension) {
				Object.extend(cmdMsgObj.data.data.content, contentExtension);
			}
			var cmdMsg = JSON.stringify(cmdMsgObj);
			var handler = YEvent.on(waitResponseType, function (response) {
			// 	if (serverNotRespondingTimer)
			// 		clearTimeout(serverNotRespondingTimer);
			// 	stepTimeoutEvent.off("step/timeout", onTimeout);

			 	if (callback) {
			// 		errorHandler.off("mobile/server-failed");

			 		if (response.status == "failure") {
			 			response["error"] = response.errorCode;
			 			response["message"] = response.errorText;
			 		}
					 handler.off(waitResponseType);
			 		callback(response);
			 	}
			});
			// var serverNotRespondingTimer = null;
			// if (CommonDetails.msgTimeouts[msgType]) {
			// 	serverNotRespondingTimer = setTimeout(onTimeout, CommonDetails.msgTimeouts[msgType]);
			// } else { // for executeStep (there is no default timeout, the timeout defined per step
			// 	var stepTimeoutEvent = YEvent.on("step/timeout", onTimeout);
			// }
			WebSocketHandler.send(cmdMsg);
		},
		postRESTMsg: function (jsonMsg, restAPI, callback) {
			RESTHandler.postMsg(jsonMsg, restAPI, callback);
		},
		getRESTMsg: function (jsonMsg, restAPI, callback, sync) {
			RESTHandler.getMsg(jsonMsg, restAPI, callback, sync);
		}
	};

})();