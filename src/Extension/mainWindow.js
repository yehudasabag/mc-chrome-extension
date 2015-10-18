(function () {
	"use strict";

	window.onload = function () {
		var appSelection = document.getElementById("appSelectionBtn");
		appSelection.addEventListener('click', onAppSelection);
		
		var addStepBtn = document.getElementById("addStepBtn");
		addStepBtn.addEventListener('click', onAddStep);
		
		var startReplayBtn = document.getElementById("startReplayBtn");
		startReplayBtn.addEventListener('click', onStartReplay);
		
		var startRecordBtn = document.getElementById("startRecordBtn");
		startRecordBtn.addEventListener('click', onStartRecord);
		
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
	};
	
	function onStartReplay() {
		console.log("#### on start replay");
		getBG(function () {
			bg.startReplay(stepsTree.getSteps());
		});
	};

	function onAppSelection() {
		console.log("#### on device selection");
		getBG(function () {
			bg.perfromAppSelection(document.getElementById("vncWV"));	
		});
	};
	
	function onStartRecord() {
		console.log("#### on start record");
		getBG(function () {
			bg.startRecord(stepsTree);
		});
	};
	
})();