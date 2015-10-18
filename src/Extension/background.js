chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('mainWindow.html', {
    'outerBounds': {
      'width': 1000,
      'height': 1000
    }
  });
});

var callback = function(param){
	console.log("callback: " + param);
}

window.perfromDeviceSelection = function() {
  console.log("### perfromDeviceSelection ###");
}

window.startReplay = function() {
  console.log("### performStartReplay ###");
  window.CommandsMgr.performStartReplay(callback);
}