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
var signInButton = null;
var agreeButton = null;
var i = 0;
var j = 0;
var toRemove = new Array();
var foundUrlIndex;
var foundButton;
var ytVideo = null;
var currentTab = null;
var shouldSwitchTab = false;
var initEvent = null;
var isTypingInSearchBox = false;
var aButton = null;

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
				gBrowser.removeEventListener("load", YouTubeNonStopObj.initCore, true);
				gBrowser.addEventListener("load", YouTubeNonStopObj.initCore, true);
			}
		}, false);
		
		var searchBar = window.document.getElementById("searchbar");
		if(typeof searchBar !== 'undefined' && searchBar !== null){
			searchBar.onfocus = function() {
				isTypingInSearchBox = true;
				// log("YouTubeNonStop: Search bar in use.");
			};
			searchBar.onblur = function() {
				isTypingInSearchBox = false;
				// log("YouTubeNonStop: Search bar no longer being used.");
			};
		}
	},
	initCore: function(event){
		//initEvent = event;
		//log(initEvent);
		
		if(typeof event.originalTarget !== 'undefined' && typeof event.originalTarget.defaultView !== 'undefined'){
		
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
					log("YouTubeNonStop: YouTube detected on URL \"" + gBrowser.getBrowserForTab(gBrowser.selectedTab).contentDocument.URL + "\". Running monitoring code to detect pause notification!");
					YouTubeNonStopObj.youTubeMonitor();
				}
			}
		}
	},
	youTubeMonitor: function(){
		clearInterval(interval);
		interval = setInterval(function(){ 
			YouTubeNonStopObj.pauseContinue();
		}, 5000);
	},
	pauseContinue: function(){
		currentTab = gBrowser.selectedTab;		
		shouldSwitchTab = false;
		toRemove = new Array();

		// Only perform the check if the URL and search bar are not focused!!!!
		if(!gURLBar.focused && !isTypingInSearchBox){
			if(extraInfo){
				dateNow = new Date();
				log("YouTubeNonStop: Checking for pause button on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US'));
			}
			
			for(i = 0; i < arrayOfDoms.length; i++){
				if(!Components.utils.isDeadWrapper(arrayOfDoms[i])){ // Dead check
					// Check for pause button
					pauseButton = arrayOfDoms[i].getElementById('confirm-button');
					if(pauseButton && YouTubeNonStopObj.isVideoPaused(arrayOfDoms[i], arrayOfTabs[i])){
						dateNow = new Date();
						gBrowser.selectedTab = arrayOfTabs[i]; // Change to tab and set focus
						if(YouTubeNonStopObj.isVisible(pauseButton)){						
							log("YouTubeNonStop: Resuming playback and clicking on the confirm button on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US') + "!");
							pauseButton.click();
							aButton = pauseButton.getElementsByTagName('a');
							if(aButton && aButton.length){
								aButton[0].click();
							}
							YouTubeNonStopObj.playAudio(arrayOfDoms[i], arrayOfTabs[i], true);
						}

						// Remove any paper dialogs
						/*
						var paperDiagFound = false;
						var paperDiags = arrayOfDoms[i].getElementsByTagName("paper-dialog");
						if(paperDiags && paperDiags.length){
							paperDiagFound = true;
							for(j = 0; j < paperDiags.length; j++){
								paperDiags[j].remove();
							}
						}
						
						var overlays = arrayOfDoms[i].getElementsByTagName("iron-a11y-announcer");
						if(overlays && overlays.length){
							paperDiagFound = true;
							for(j = 0; j < paperDiags.length; j++){
								overlays[j].remove();
							}
						}
						
						overlays = arrayOfDoms[i].getElementsByTagName("iron-overlay-backdrop");
						if(overlays && overlays.length){
							paperDiagFound = true;
							for(j = 0; j < paperDiags.length; j++){
								overlays[j].remove();
							}
						}
						*/
					
						shouldSwitchTab = true;
					}
					
					// Check for login nag screen
					signInButton = arrayOfDoms[i].getElementById('dismiss-button');
					if(signInButton){
						dateNow = new Date();
						gBrowser.selectedTab = arrayOfTabs[i]; // Change to tab and set focus
						if(YouTubeNonStopObj.isVisible(signInButton)){						
							log("YouTubeNonStop: Resuming playback and clicking on the Not Now button for the YouTube signin nag screen on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US') + "!");
							signInButton.click();
							signInButton.remove();
							aButton = signInButton.getElementsByTagName('a');
							if(aButton && aButton.length){
								aButton[0].click();
								aButton[0].remove();
							}
							YouTubeNonStopObj.playAudio(arrayOfDoms[i], arrayOfTabs[i], true);
						}
						shouldSwitchTab = true;
					}
					
					// Check for agree button nag screen
					agreeButton = arrayOfDoms[i].getElementById('introAgreeButton');
					if(agreeButton){
						dateNow = new Date();
						gBrowser.selectedTab = arrayOfTabs[i]; // Change to tab and set focus
						if(YouTubeNonStopObj.isVisible(agreeButton)){						
							log("YouTubeNonStop: Resuming playback and clicking on the agree button for the YouTube cookies annoying nag screen on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US') + "!");
							agreeButton.click();
							agreeButton.remove();
							aButton = agreeButton.getElementsByTagName('a');
							if(aButton && aButton.length){
								aButton[0].click();
								aButton[0].remove();
							}
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
	isVideoPaused: function(element, tab){
		ytVideo = null;
		
		// Video paused?
		ytVideo = element.querySelector('video');
		if(ytVideo && ytVideo.paused){
			return true;
		}
		
		// audio paused?
		ytVideo = element.querySelector('audio');
		if(ytVideo && ytVideo.paused){
			return true;
		}
						
		return false;
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
