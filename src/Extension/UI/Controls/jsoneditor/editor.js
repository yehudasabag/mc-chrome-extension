
function Editor(domName){
	this.domName = domName;
	this.steps = [];
	this.getSteps = function(){
		return editor.get();
	}
	
	this.addStep = function(json){
		var step = json || jsonCmdTemplate;
		this.steps.push(step)
		editor.set(this.steps);
	}
	
	var editor = new JSONEditor(domName, {
		  "change": function () {
	}});
	return this;
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
		
		