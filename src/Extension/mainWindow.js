(function () {
	"use strict";

	window.onload = function () {
		var deviceSelection = document.getElementById("deviceSelectionBtn");
		deviceSelection.addEventListener('click', onDeviceSelection);
	}
	
	var bg = null;

	function onDeviceSelection() {
		console.log("#### on device selection");
		chrome.runtime.getBackgroundPage(function (backgroundPage) {
			if (backgroundPage) {
				bg = backgroundPage;
				bg.perfromDeviceSelection();
			}
		});
	}
})();