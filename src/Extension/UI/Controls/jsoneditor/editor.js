
function Editor(domName){
	this.domName = domName;
	this.numOfSteps = 0;
	this.steps = {};
	
	this.getSteps = function(){
		return editor.get();
	}
	
	this.addStep = function(json){
		var step = (json) ? json : jsonCmdTemplate;
		steps["Step " + numOfSteps] = step;
		editor.set(steps);
		numOfSteps += 1;
	}
	
	var editor = new JSONEditor(domName, {
		  "change": function () {},
		  "name": "Steps"
		  });
}

var jsonCmdTemplate = {
	"command": "executeStep",
	"content": {
	"action": {
		"name": "",
		"parameters": {
		}
	},
	"application": {
		"instrumented": false,
		"name": "",
		"uuid": ""
		
	},
	"testObject": {
		"boundsInScreen": {
			"bottom": 0,
			"left": 0,
			"right": 0,
			"top": 0
		},
		"className": "",
		"index": 0,
		"isCheckable": false,
		"isChecked": false,
		"isClickable": false,
		"isEnabled": false,
		"isFocusable": false,
		"isFocused": false,
		"isScrollable": false,
		"nativeClass": "",
		"resourceId": ""
	},
	"requestId": -1,
	"stepId": ""
	}	
}	
		
		