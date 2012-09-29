var audioContext   = new webkitAudioContext();
var src            = audioContext.createBufferSource();
var sampleRate     = audioContext.sampleRate;
var bufferSize     = 1024;
var javaScriptnode = audioContext.createJavaScriptNode(bufferSize, 1, 1);

var tonesize = Math.floor(0.10 * sampleRate);
var interval = Math.floor(0.15 * sampleRate);

var curkey = {};
var dialkeys = [];

var silentData = new Float32Array(bufferSize);
var toneData = [];

var keysdata = [
	{"id" : "key1",      "value" : "1",      "captions" : ["1"],      "frequenciesData" : [697, 1209]},
	{"id" : "key2",      "value" : "2",      "captions" : ["2"],      "frequenciesData" : [697, 1336]},
	{"id" : "key3",      "value" : "3",      "captions" : ["3"],      "frequenciesData" : [697, 1477]},
	{"id" : "key4",      "value" : "4",      "captions" : ["4"],      "frequenciesData" : [770, 1209]},
	{"id" : "key5",      "value" : "5",      "captions" : ["5"],      "frequenciesData" : [770, 1336]},
	{"id" : "key6",      "value" : "6",      "captions" : ["6"],      "frequenciesData" : [770, 1477]},
	{"id" : "key7",      "value" : "7",      "captions" : ["7"],      "frequenciesData" : [852, 1209]},
	{"id" : "key8",      "value" : "8",      "captions" : ["8"],      "frequenciesData" : [852, 1336]},
	{"id" : "key9",      "value" : "9",      "captions" : ["9"],      "frequenciesData" : [852, 1477]},
	{"id" : "keyStar",   "value" : "*",      "captions" : ["*"],      "frequenciesData" : [941, 1209]},
	{"id" : "key0",      "value" : "0",      "captions" : ["0"],      "frequenciesData" : [941, 1336]},
	{"id" : "keySquare", "value" : "#",      "captions" : ["#"],      "frequenciesData" : [941, 1477]},
	{"id" : "keyCancel", "value" : "cancel", "captions" : ["Cancel"], "frequenciesData" : []         },
	{"id" : "keyDial",   "value" : "dial",   "captions" : ["Dial"],   "frequenciesData" : []         },
	{"id" : "keyDelete", "value" : "delete", "captions" : ["Delete"], "frequenciesData" : []         },
	{"id" : "keyCheck",  "value" : "check",  "captions" : [""],       "frequenciesData" : []         }
];

var attachOnceEvent = function(target, type, listener, useCapture) {
	var remove = (
		function(target, type, listener, useCapture){
			return function(){
				target.removeEventListener(type, listener, useCapture);
				target.removeEventListener(type, remove,   useCapture);
			};
		}
	)(target, type, listener, useCapture);
	target.addEventListener(type, listener, useCapture);
	target.addEventListener(type, remove,   useCapture);
};

var attachAudio = function() {
	src.noteOn(0);
	src.connect(javaScriptnode);
	// audioprocessイベントは、何故かaddEventListenerで設定できない
	//javaScriptnode.addEventListener("audioprocess", onAudioProcess, false);
	javaScriptnode.onaudioprocess = onAudioProcess;
	javaScriptnode.connect(audioContext.destination);
};

function onAudioProcess(e) {
	var output = e.outputBuffer.getChannelData(0);
	var data = 0;
	if (toneData.length != 0) {
		data = toneData.shift();
	} else {
		data = silentData;
	}
	output.set(data);
}

function tone(tones) {

	if (tones.length == 0) {return;}

	var bufferCount = Math.ceil((tones.length * interval) / bufferSize);
	var bufferData = new Float32Array(bufferSize * bufferCount);

	for (var i = 0, toneslen = tones.length; i < toneslen; i++) {
		for (var cur = 0; cur < tonesize; cur++) {
			var val = 0;
			for (var j = 0, frequencylen = tones[i].length; j < frequencylen; j++) {
				var frequency = tones[i][j];
				val += Math.sin(2 * Math.PI * frequency * (cur / sampleRate));
			}
			bufferData[interval * i + cur] = val / tones[i].length;
		}
	}

	for (var i = 0, len = bufferSize * bufferCount; i < len; i += bufferSize) {
		toneData.push(bufferData.subarray(i, i + bufferSize));
	}

}

function setTone() {
	for (var i = 0, datalen = keysdata.length; i < datalen; i++) {
		var keydata = keysdata[i];
		keydata.tone = (
			function(frequenciesData){
				return function() {
					if (frequenciesData.length == 0) {
						return;
					}
					tone([frequenciesData]);
				};
			}
		)(keydata.frequenciesData);
	}
}

function detectCollision(event) {
	var x = event.touches[0].pageX;
	var y = event.touches[0].pageY;
	var collisions = [];
	for (var i = 0, datalen = keysdata.length; i < datalen; i++) {
		var keydata = keysdata[i];
		var element = document.getElementById(keydata.id);
		if (x < element.offsetLeft || element.offsetLeft + element.offsetWidth  < x) {continue;}
		if (y < element.offsetTop  || element.offsetTop  + element.offsetHeight < y) {continue;}
		collisions.push(keydata);
	}
	return collisions;
}

function initialize() {

	attachOnceEvent(document.body, "touchstart", attachAudio, false);

	setTone();
	for (var i = 0, datalen = keysdata.length; i < datalen; i++) {
		var keydata = keysdata[i];
		var element = document.getElementById(keydata.id);
		var captions = keydata.captions;
		for (var j = 0, captionslen = captions.length; j < captionslen; j++) {
			var div = document.createElement("div");
			div.textContent = captions[j];
			element.appendChild(div);
		}
	}
	document.body.addEventListener(
		"touchstart",
		function(event){
			var keys = detectCollision(event);
			if (keys.length != 1) {return;}
			curkey = keys[0];
			curkey.tone();
			event.stopPropagation();
			event.preventDefault();
		},
		false
	);
	document.body.addEventListener(
		"touchmove",
		function(event){
			var keys = detectCollision(event);
			if (keys.length != 1) {return;}
			if (curkey.id == keys[0].id) {return;}
			curkey = keys[0];
			curkey.tone();
			event.stopPropagation();
			event.preventDefault();
		},
		false
	);
	document.body.addEventListener(
		"touchend",
		function(event){
			var value = curkey.value;
			switch (value) {
			case "check":
				break;
			case "cancel":
				break;
			case "dial":
				break;
			case "delete":
				dialkeys.pop();
				break;
			default:
				dialkeys.push(curkey);
			}
			var keys = [];
			var tones = [];
			for (var i = 0, len = dialkeys.length; i < len; i++) {
				keys.push(dialkeys[i].value);
				tones.push(dialkeys[i].frequenciesData);
			}
			switch (value) {
			case "check":
			case "dial":
				tone(tones);
				break;
			default:
				document.getElementById("display").textContent = keys.join("");
			}
			event.stopPropagation();
			event.preventDefault();
		},
		false
	);

}

window.addEventListener("load",initialize,false);
