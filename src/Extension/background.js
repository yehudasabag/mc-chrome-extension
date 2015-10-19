chrome.app.runtime.onLaunched.addListener(function () {
  chrome.app.window.create('mainWindow.html', {
    'outerBounds': {
      'width': 1000,
      'height': 1000
    }
  });
});

var callback = function (param) {
  console.log("callback: " + param);
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
  
  


  ConnectionMgr.serverHandshake(false, onHandshakeComplete);

}

window.performDeviceSelection = function (vncWV) {
  console.log("### performDeviceSelection, jobId = " + jobId);
  vncWV.src = "http://16.54.196.10:8080/integration/?locale=en#/devices?jobId=" + jobId;
}

window.startReplay = function () {
  console.log("### performStartReplay ###");
  window.CommandsMgr.performStartReplay(callback);
}