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
		
		var showVNCBtn = document.getElementById("showVNC");
		showVNCBtn.addEventListener('click', showVNC);
		
		getBG();
	}
	
	function showVNC(){
		console.log("asdsadfadfadsdsfasdkjhdsa");
		document.getElementById("showVNC").style.display = "none";
		var vncWV = document.getElementById("vncWV");
		vncWV.style.display = "inline";
		vncWV.src = "http://16.54.196.10:8080/integration/?locale=en#/remote?jobId=39c810b9-8504-4acc-a4c4-dfae7f74cc16&deviceId=00000011-4B36-8AA5-0000-000000000000";
		
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