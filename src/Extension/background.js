chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('mainWindow.html', {
    'outerBounds': {
      'width': 1000,
      'height': 1000
    }
  });
});

window.perfromDeviceSelection = function() {
  console.log("### perfromDeviceSelection ###");
}