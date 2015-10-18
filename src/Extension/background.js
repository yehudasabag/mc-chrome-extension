chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('mainWindow.html', {
    'outerBounds': {
      'width': 1000,
      'height': 1000
    }
  });
});

window.perfromAppSelection = function(vncWV) {
  console.log("### perfromDeviceSelection ###");
  JobMgr.createTempJob(function (job) {
    var jobId = job.jobId;
    vncWV.loadDataWithBaseUrl("/integration/?locale=en#/applications?jobId=" + jobId,
      "http://16.54.196.10:8080");
    
  });
  
  
}