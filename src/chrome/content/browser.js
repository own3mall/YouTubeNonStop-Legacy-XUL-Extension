/**
 * YouTubeNonStop namespace.
 *
 * writes to both browser and error console.
 * Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage("test");
**/
/* Globals */
var debug = false; // Set to true to make it work on any page (test using the index.html file included in this xpi)
var extraInfo = false; // Set to true for more logging
var interval = null;
var matchStr = /youtube.com/;


// Global Non-Settings
var dateNow = new Date();
var arrayOfDoms = new Array();
var arrayOfTabs = new Array();
var arrayUrls = new Array();
var pauseButton = null;
var i = 0;
var toRemove = new Array();
var foundUrlIndex;
var foundButton;
var ytVideo = null;
var currentTab = null;
var shouldSwitchTab = false;

/* Functions */

function log(str){
	//Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage(str);
	console.log(str);
}

/* MAIN CODE */
var YouTubeNonStopObj = {
	init: function(){
		window.addEventListener("load", function () {
			if( typeof gBrowser !== 'undefined' && gBrowser !== null){
				gBrowser.addEventListener("load", function (event) {
					// this is the content document of the loaded page.
					let doc = event.originalTarget;

					if (doc instanceof HTMLDocument) {
						// is this an inner frame?
						if (doc.defaultView.frameElement) {
							// Frame within a tab was loaded.
							// Find the root document:
							while (doc.defaultView.frameElement) {
								doc = doc.defaultView.frameElement.ownerDocument;
							}
						}
					}
					
					var dmn = doc.defaultView.location.href;
				  
					// log("YouTubeNonStop: Page domain is " + dmn);
					if(dmn.match(matchStr) || debug){
						if(gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument.URL.match(matchStr) || debug){
							foundUrlIndex = arrayUrls.indexOf(gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument.URL)
							if(foundUrlIndex != -1){
								if(extraInfo){
									log("YouTubeNonStop: YouTube duplicate instance detected. Removing previous reference!");
								}
								YouTubeNonStopObj.removeDup(gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument.URL, foundUrlIndex);
							}
							
							arrayOfDoms.push(gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument);
							arrayOfTabs.push(gBrowser.selectedTab);
							arrayUrls.push(gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument.URL);
							log("YouTubeNonStop: YouTube detected. Running monitoring code to detect pause notification!");
							YouTubeNonStopObj.youTubeMonitor();
						}
					}
				}, true);
				gBrowser.removeEventListener("load", function(){}, true);
			}
		}, false);
	},
	youTubeMonitor: function(){
		clearInterval(interval);
		interval = setInterval(function(){ 
			YouTubeNonStopObj.pauseContinue();
		}, 5000);
	},
	pauseContinue: function(){
		shouldSwitchTab = false;
		if(extraInfo){
			dateNow = new Date();
			log("YouTubeNonStop: Checking for pause button on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US'));
		}
		
		toRemove = new Array();
		currentTab = gBrowser.selectedTab;
		for(i = 0; i < arrayOfDoms.length; i++){
			if(!Components.utils.isDeadWrapper(arrayOfDoms[i])){ // Dead check
				pauseButton = arrayOfDoms[i].getElementById('confirm-button');
				if(pauseButton){
					dateNow = new Date();
					gBrowser.selectedTab = arrayOfTabs[i]; // Change to tab and set focus
					if(YouTubeNonStopObj.isVisible(pauseButton)){						
						log("YouTubeNonStop: Resuming playback and clicking on the confirm button on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US') + "!");
						pauseButton.click();
						YouTubeNonStopObj.playAudio(arrayOfDoms[i], arrayOfTabs[i], true);
					}
					shouldSwitchTab = true;
				}
			}else{
				toRemove.push(i);
			}
		}
		
		if(shouldSwitchTab){
			gBrowser.selectedTab = currentTab;
		}
		
		if(toRemove.length){
			for(i = 0; i < toRemove.length; i++){
				arrayOfDoms.splice(toRemove[i], 1);
			}
		}
	},
	playAudio: function(element, tab, playVideo){
		ytVideo = null;
		
		// Hide pause notification
		foundButton = element.querySelector('paper-dialog.style-scope');
		if(foundButton){
			foundButton.style.display = "none";
		}
		
		if(playVideo){			
			// Play the video
			ytVideo = element.querySelector('video');
			if(ytVideo){
				ytVideo.play();
			}
						
			// Play audio for YouTube music
			ytVideo = element.querySelector('.ytp-unmute');
			if(ytVideo){
				ytVideo.click();
			}
		}
	},
	isVisible: function(element){
		return (element.offsetWidth > 0 || element.offsetHeight > 0)
	},
	removeDup: function(url, foundUrlIndex){
		toRemove = new Array();
		for(i = 0; i < arrayOfDoms.length; i++){
			if(!Components.utils.isDeadWrapper(arrayOfDoms[i])){ // Dead check
				if(arrayOfDoms[i].URL == url){
					toRemove.push(i);
				}
			}else{
				toRemove.push(i);
			}
		}
		if(toRemove.length){
			for(i = 0; i < toRemove.length; i++){
				arrayOfDoms.splice(toRemove[i], 1);
			}
		}
		
		arrayUrls.splice(foundUrlIndex, 1);
	}
};

YouTubeNonStopObj.init();
