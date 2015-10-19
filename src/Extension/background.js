chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create('mainWindow.html', {
    'outerBounds': {
      'width': 1000,
      'height': 1000
    }
  });
});

var stepsToExecute = {};
var stepTree = null;

var startReplayCallback = function(param){
	console.log("Start Replay Complete");
	
	for(var stepName in stepsToExecute){
		var step = stepsToExecute[stepName];
		console.log("executing step: " + step);
		window.CommandsMgr.executeStep(step.action, step.testObject, null, null, executeStepCallback) 
	}
};

var executeStepCallback = function(arguments){
	console.log("######Executestep callback: " + arguments);
}

var recordCallback = function(arguments){
	console.log("######record callback: " + arguments);
	console.log(arguments);
	stepTree.addStep(args);
}

var jobId = null;

window.perfromAppSelection = function (vncWV) {
  console.log("### perfromDeviceSelection ###");

  function onHandshakeComplete(result) {
    console.log("---->onHandshakeComplete");
    if (result.error) {
      //TODO: message
      return;
    }
    JobMgr.createTempJob(function (job) {
      console.log("#### jobId = " + job.jobId);
      jobId = job.jobId;
      vncWV.src = "http://16.54.196.10:8080/integration/?locale=en#/applications?jobId=" + job.jobId;
    });
  }
  ConnectionMgr.serverHandshake(false, onHandshakeComplete);
  // vncWV.addEventListener("loadcommit", function (e) {
  //   vncWV.executeScript({ file: "MCCommunication/McLoginContentScript.js", runAt: "document_start" },
  //     function () {
  //       var code = "window.performLogin(" + CommonDetails.getSettings("userName") + "," + CommonDetails.getSettings("password") +
  //         "," + "en" + "," + CommonDetails.getSettings("server") + ");";
  //       console.log("#### code = " + code);
  //       vncWV.executeScript({ code: code, runAt: "document_start" });
  //     });

  // });
  //vncWV.src = CommonDetails.getSetting("serverUrl");
};

window.startReplay = function(steps) {
	stepsToExecute = steps;
  window.CommandsMgr.performStartReplay(startReplayCallback);

};

window.performDeviceSelection = function (vncWV) {
  console.log("### performDeviceSelection, jobId = " + jobId);
  vncWV.src = "http://16.54.196.10:8080/integration/?locale=en#/devices?jobId=" + jobId;
}

window.startRecord = function(tree) {
	stepTree = tree;
	window.CommandsMgr.performStartRecord(recordCallback);
}