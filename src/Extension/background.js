chrome.app.runtime.onLaunched.addListener(function() {
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
}

window.perfromAppSelection = function(vncWV) {
  console.log("### perfromDeviceSelection ###");
  JobMgr.createTempJob(function (job) {
    var jobId = job.jobId;
    vncWV.loadDataWithBaseUrl("/integration/?locale=en#/applications?jobId=" + jobId, "http://16.54.196.10:8080");
  });
};

window.startReplay = function(steps) {
	stepsToExecute = steps;
	window.CommandsMgr.performStartReplay(startReplayCallback);
};

window.startRecord = function(tree) {
	stepTree = tree;
	window.CommandsMgr.startRecord(recordCallback);
}