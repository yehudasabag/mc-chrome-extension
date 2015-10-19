console.log("###############################");
function YEvent(target) {
	var events = {}, empty = [], list, j, i;
	this.target = target || this
	/**
	 *  On: listen to events
	 */
	this.target.on = function (type, func, ctx) {
		(events[type] = events[type] || []).push([func, ctx])
	}
	/**
	 *  Off: stop listening to event / specific callback
	 */
	this.target.off = function (type, func) {
		type || (events = {})
		list = events[type] || empty,
		i = list.length = func ? list.length : 0
		while (i--) func == list[i][0] && list.splice(i, 1)
	}
	/** 
	 * Emit: send event, callbacks will be triggered
	 */
	this.target.dispatch = function (type, arguments) {
		list = events[type] || empty; i = 0
		while (j = list[i++]) j[0].apply(j[1], [arguments]);
	};
}

YEvent.Instance = null;

YEvent.on = function (type, func, ctx) {
	if(!YEvent.Instance)
	{
		YEvent.Instance = new YEvent({});
	}
	
	YEvent.Instance.target.on(type, func, ctx);
	
	return YEvent.Instance.target;
}

YEvent.off = function (type, func, event) {
	YEvent.Instance.target.off(type, func);
}

YEvent.dispatch = function (type, arguments) {
	YEvent.Instance.target.dispatch(type, arguments);
}