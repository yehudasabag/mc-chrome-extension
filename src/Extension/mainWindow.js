(function () {
	"use strict";

	window.onload = function () {
		var appSelection = document.getElementById("appSelectionBtn");
		appSelection.addEventListener('click', onAppSelection);
		
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
				callback && callback(bg);
			}
		});
	}
	
	var stepsTree = null;
	var bg = null;
	
	function onAddStep() {
		stepsTree.addStep();
	}

	function onAppSelection() {
		console.log("#### on device selection");
		getBG(function () {
			bg.perfromAppSelection(document.getElementById("vncWV"));	
		});
	}
	
})();