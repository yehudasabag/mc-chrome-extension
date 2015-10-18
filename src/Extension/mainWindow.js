(function () {
	"use strict";

	window.onload = function () {
		var deviceSelection = document.getElementById("deviceSelectionBtn");
		deviceSelection.addEventListener('click', onDeviceSelection);
		
		var addStepBtn = document.getElementById("addStepBtn");
		addStepBtn.addEventListener('click', onAddStep);
		
		var container = document.getElementById("jsoneditor");
		stepsTree = new Editor(container);
		
		getBG();
	}
	
	function getBG(callback) {
		if (bg) {
			callback(bg);
		}
		chrome.runtime.getBackgroundPage(function (backgroundPage) {
			if (backgroundPage) {
				bg = backgroundPage;
				callback(bg);
			}
		});
	}
	
	var stepsTree = null;
	var bg = null;
	
	function onAddStep() {
		stepsTree.addStep();
	}

	function onDeviceSelection() {
		console.log("#### on device selection");
		bg.perfromDeviceSelection();
		
	}
})();