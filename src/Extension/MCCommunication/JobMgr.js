//JobMgr
(function () {
	"use strict";

	function generateUUID() {
		function S4() {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		}
		return "{".concat(S4(), S4(), "-", S4(), "-", S4(), "-", S4(), "-", S4(), S4(), S4(), "}");
	}

	window.JobMgr = {
		createJob: function (callback) {
			console.log("----------> createJob()");
			function onJobCreateResponse(response) {
				console.log("----------> executed CB of REST job/create");
				if (response.error || !response.data.id) {
					console.log("----------> Error : " + response.message);
					callback({
						error: true,
						message: "Communicator.JobFailed" + response.message + " (" + CommonDetails.getServer() + ")",
						messageCode: response.messageCode
					});
				}
				else {
					console.log("----------> createJob() - currJobId = " + response.data.id);
					JobMgr.currJobId = response.data.id;
					AppMgr.currApp = response.data.application;
					DeviceMgr.currDevice = response.data.devices[0];
					//TC_NS.Event.dispatch("mobile/job-created");
					callback({ jobId: JobMgr.currJobId });
				}
			}

			var deviceId = DeviceMgr.getDeviceId();
			var appId = AppMgr.getAppId();
			if (appId && deviceId) {
			
				var currJobName = "TruClientJob_" + generateUUID();
				console.log("----------> createJob() - currJobName: " + currJobName);
				var createJobMsg = {
					"name": currJobName,
					"application": AppMgr.getAppSection(),
					"devices": [
						{ "deviceID": deviceId }
					]
				};
				console.log("----------> createJob() - createJob: " + JSON.stringify(createJobMsg));
				ConnectionMgr.postRESTMsg(createJobMsg, "job/create", onJobCreateResponse);
				/*DeviceMgr.validateDeviceIsConnected(deviceId, function (response) {
					if (response.error) {
						callback && callback(response);
						return;
					}
					if (response.connected) {
						AppMgr.validateAppIsInstalled(appId, function (response) {
							if (response.error) {
								callback && callback(response);
								return;
							}
							if (response.installed) {
								var currJobName = "TruClientJob_" + generateUUID();
								console.log("----------> createJob() - currJobName: " + currJobName);
								var createJobMsg = {
									"name": currJobName,
									"application": AppMgr.getAppSection(),
									"devices": [
										{ "deviceID": deviceId }
									]
								};
								console.log("----------> createJob() - createJob: " + JSON.stringify(createJobMsg));
								ConnectionMgr.postRESTMsg(createJobMsg, "job/create", onJobCreateResponse);
							} else {
								callback({
									error: true,
									message: "Communicator.ApplicationNotInstalled" + " (" + CommonDetails.getServer() + ")"
								});
							}
						});
					} else {
						callback({
							error: true,
							message: "Communicator.DeviceNotConnected" + " (" + CommonDetails.getServer() + ", Device: " + deviceId + ")"
						});
					}
				});*/

			}
			else {
				console.log("----------> createJob() - Application or device not selected yet");
				callback({ error: false, message: "Application or device not selected yet" });
			}
		},
		createTempJob: function (callback) {
			console.log("----------> createTempJob()");
			function onJobCreated(response) {
				console.log("----------> executed CB of REST job/createTempJob");
				if (response.error) {
					console.log("----------> Error : " + response.message);
					callback({ error: true, message: response.message });
				}
				else {
					callback({ jobId: response.data.id });
				}
			}

			if (CommonDetails.loggedIn) {
				ConnectionMgr.getRESTMsg({}, "job/createTempJob", onJobCreated);
			}
			else {
				console.log("----------> createTempJob() - not loggedin");
				callback && callback({ error: true, message: CommonDetails.last.errorMessage });
			}
		},
		deleteJob: function (id, callback) {
			console.log("----------> deleteJob(id) - " + id);
			id = id || JobMgr.currJobId;
			var deleteJobMsg = { "id": id };
			ConnectionMgr.postRESTMsg(deleteJobMsg, "job/delete", callback);
		},
		updateJob: function (job, callback) {
			console.log("----------> updateJob() - job = " + job);
			function getDeviceId() {
				if (job.devices && job.devices.length) {
					return job.devices[0].deviceID;
				}
				return null;
			}

			var deviceId = getDeviceId();
			TC_NS.Log.extended("----------> updateJob() - deviceId = " + deviceId);
			// Do not lock the device when the currJobId is null, otherwise, TC_NS.TCNMJobMgr.getJob
			// will fail, because of the device is locked.
			if (deviceId && JobMgr.currJobId) {
				DeviceMgr.unlockDevice(function () {
					console.log("----------> executed CB of unlockDevice");
					DeviceMgr.lockDevice(deviceId, function (response) {
						console.log("----------> executed CB of lockDevice");
						if (response.error) {
							console.error("----------> Error : " + response.message + " (" + CommonDetails.getServer() + ")");
							callback && callback(response);
						}
						else {
							_updateJobCore();
						}
					});
				});
			}
			else {
				_updateJobCore();
			}

			function _updateJobCore() {
				ConnectionMgr.postRESTMsg(job, "job/updateJob", function (response) {
					if (response.error) {
						console.error("unable to update job: " + response.message);
						callback && callback({
							error: true,
							message: "Device.FailedToUnlockDevice " + response.message
						});
					}
					else {
						// There is no app uuid in the response on updateJob now, so we need to take job details for it
						JobMgr.getJobInfo(job.id, function (response) {
							if (!response.error) {
								if (response.data.application) {
									AppMgr.currApp = response.data.application;
								}
								if (response.data.devices && response.data.devices.length > 0) {
									DeviceMgr.currDevice = response.data.devices[0];
								}
							}
							//TC_NS.Event.dispatch("mobile/job-updated");
							callback && callback(response);
						});
					}
				});
			}
		},
		// This function returns an existing job or creating a new one if createIfNotExist is true.
		getJob: function (callback) {
			console.log("----------> getJob()");
			function innerCallback(response) {
				var error = !response || response.error;
				//TC_NS.Event.dispatch("mobile/connect-device-done", null, { error: error });
				callback && callback(response);
			}

			if (JobMgr.currJobId) {
				console.log("----------> getJob() - already has currJobId");
				innerCallback({ jobId: JobMgr.currJobId });
			} else {
				JobMgr.createJob(function (response) {
// 					function createJobSucceeded() {
// 					
// 					}
// 
// 					function handleDeviceLocked(response) {
// 						TC_NS.Event.dispatchAndTrack("mobile/show-dialog-msg", null, {
// 							message: getL10NStrP("Communicator.UnlockDeviceQuestion", TC_NS.TCNMDeviceMgr.getDeviceId()),
// 							confirmDialog: true
// 						}, function (e) {
// 							if (e.dialogResult) {
// 								TC_NS.Log.extended("----------> User approve unlock device");
// 								TC_NS.TCNMDeviceMgr.unlockDevice(function (unlockResponse) {
// 									TC_NS.Log.extended("----------> executed CB of unlockDevice");
// 									if (unlockResponse.error) {
// 										TC_NS.Log.extended("----------> Error: " + unlockResponse.message);
// 										innerCallback(unlockResponse);
// 									} else {
// 										TC_NS.Log.extended("----------> Unlock device succeeded, will try to create job");
// 										TC_NS.TCNMJobMgr.createJob(function (createJobResponse) {
// 											TC_NS.Log.extended("----------> executed CB of createJob retry");
// 											if (createJobResponse.error) {
// 												TC_NS.Log.extended("----------> Error: " + createJobResponse.message);
// 											} else {
// 												TC_NS.Log.extended("----------> createJob succeeded");
// 												createJobSucceeded();
// 											}
// 											innerCallback(unlockResponse);
// 										});
// 									}
// 								});
// 							} else {
// 								TC_NS.Log.extended("----------> No listener to the dialog event (Load Mode) or user did not approve unlock the device");
// 								response.hideErrorDialog = true;
// 								innerCallback(response);
// 							}
// 						});
// 					}

					console.log("----------> executed CB of createJob");
					if (!response.error) {
						//createJobSucceeded();
						innerCallback(response);
					} else if (response.messageCode == 2009) {
						console.error("----------> createJob failed because device is already locked");
						//handleDeviceLocked(response);
					} else {
						console.error("----------> Error: " + response.message);
						innerCallback(response);
					}
				});
			}
		},
		isJobReady: function () {
			return !!JobMgr.currJobId;
		},
		getJobInfo: function (jobId, callback) {
			console.log("----------> getJobInfo(jobId) - " + jobId);
			function onJobInfoArrived(response) {
				console.log("----------> executed CB of REST job/" + jobId);
				if (response.error) {
					console.error("----------> Error : " + response.message);
					callback({ error: true, message: "Failed to get temp job: " + response.message });
				}
				else {
					callback(response);
				}
			}

			ConnectionMgr.getRESTMsg({}, "job/" + jobId, onJobInfoArrived);
		},
		getJobReports: function (jobId, callback) {
			function onReportsReady(response) {
				console.log("onReportsReady response:" + JSON.stringify(response));

				if (response.error) {
					console.error("Failed to get reports for job: " + jobId + "\nerror:" + response.message);
					callback && callback({
						error: true,
						message: response.message || "Reports.FailedToGetReports" + jobId
					});
				}
				else {
					callback && callback(response.data);
				}
			}

			var restApi = "job/getJobReports/" + jobId + "/" + DeviceMgr.getDeviceId();

			ConnectionMgr.getRESTMsg({}, restApi, onReportsReady);
		}
		// },
		// logJobReports: function (callback) {
		// 	console.log("----------> logJobReports()");
		// 	if (!TC_NS.RTS('EnableNetworkConditions')) {
		// 		callback();
		// 		return;
		// 	}
		// 	TC_NS.TCNMJobMgr.getJobReports(TC_NS.TCNMJobMgr.currJobId, function (reports) {
		// 		TC_NS.Log.extended("----------> executed CB of getJobReports");
		// 		var location = "";
		// 		if (reports.error) {
		// 			TC_NS.Log.error(reports.message);
		// 		} else {
		// 			if (reports.networkConditionAnalysis) {
		// 				// quick and dirty workaround for multiple replays issue - MC are sending line separated list of json objects
		// 				// so convert it to legal array json format
		// 				var values = JSON.parse("[" + reports.networkConditionAnalysis.replace(/}\s*{/g, "},{") + "]");
		// 				if (values.length > 0)
		// 					location = values[values.length - 1].analysisResourcesLocation;
		// 			}
		// 			TC_NS.Log.info(window.getL10NStr("Reports.NVResultFile") + location);
		// 		}
		// 		callback();
		// 	});
		// }
	};

})();