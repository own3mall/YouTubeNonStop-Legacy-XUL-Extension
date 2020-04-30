/**
 * YouTubeNonStop namespace.
 *
 * writes to both browser and error console.
 * Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage("test");
**/
/* Functions */

function log(str){
	//Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage(str);
	console.log(str);
}

/* MAIN CODE */
var YouTubeNonStopObj = {
	curWin: null,
	init: function(){
		window.addEventListener("load", function () {

					//------------------------ actual removal ------------------
					var dmn='youtube.com';

				  
					log("YouTubeNonStop: Page domain is " + dmn);
					if(dmn.match(/youtube.com/)){
						YouTubeNonStopObj.youTubeMonitor();
					}
				}, true);
	},
	youTubeMonitor: function(){
		var interval = setInterval(function(){ 
			YouTubeNonStopObj.pauseContinue();
		}, 5000);
	},
	pauseContinue: function(){
		var pauseButton = document.getElementById('confirm-button');
		if(pauseButton){
			pauseButton.click();
		}
	}
};

YouTubeNonStopObj.init();
