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
var matchStr = "youtube.com";


// Global Non-Settings
var dateNow = new Date();
var arrayOfDoms = new Array();
var arrayOfTabs = new Array();
var arrayUrls = new Array();
var arrayUrlsToTrack = new Array();
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
var closestPaperDiag;
var tabContainer;
var tabs;
var tabUrl;
var tab;
var runningLoopDetection = false;

/* Functions */

function log(str){
	//Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService).logStringMessage(str);
	console.log(str);
}

/* MAIN CODE */
var YouTubeNonStopObj = {
	init: function(){
		YouTubeNonStopObj.youTubeMonitor();
	},
	loopThroughTabsLookingForYouTube: function(){
		if( typeof gBrowser !== 'undefined' && gBrowser !== null){
			if(!runningLoopDetection){
				arrayOfDoms = new Array();
				arrayOfTabs = new Array();
				arrayUrls = new Array();
				
				runningLoopDetection = true;
				tabContainer = gBrowser.tabContainer;
				if(tabContainer){
					tabs = tabContainer.childNodes;
					if(tabs && tabs.length){
						for(i = 0; i < tabs.length; i++){
							tabUrl = gBrowser.getBrowserForTab(tabs[i]).contentDocument.URL;
							tab = gBrowser.getBrowserForTab(tabs[i]).contentDocument;
							if(tabUrl.toLowerCase().indexOf(matchStr) != -1){						
								arrayOfDoms.push(tab);
								arrayOfTabs.push(tabs[i]);
								arrayUrls.push(tabUrl);
								if(arrayUrlsToTrack.indexOf(tabUrl) == -1){
									log("YouTubeNonStop: YouTube detected on URL \"" + tabUrl + "\" from triggered event. Running monitoring code to detect pause notification!");
									arrayUrlsToTrack.push(tabUrl);
								}
							}
						}
					}
				}
			}
		}
		runningLoopDetection = false;
	},
	youTubeMonitor: function(){
		clearInterval(interval);
		interval = setInterval(function(){ 
			YouTubeNonStopObj.pauseContinue();
		}, 5000);
	},
	getLocalizedDate: function(){
		return dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US');
	},
	pauseContinue: function(){
		currentTab = gBrowser.selectedTab;		
		shouldSwitchTab = false;
		toRemove = new Array();
		
		YouTubeNonStopObj.loopThroughTabsLookingForYouTube();

		// Only perform the check if the URL and search bar are not focused!!!!
		if(!gURLBar.focused && !isTypingInSearchBox){
			if(debug && extraInfo){
				dateNow = new Date();
				log("YouTubeNonStop: Checking for pause button on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US'));
			}
			
			for(i = 0; i < arrayOfDoms.length; i++){
				if(!Components.utils.isDeadWrapper(arrayOfDoms[i])){ // Dead check
					// Check for pause button
					pauseButton = arrayOfDoms[i].getElementById('confirm-button');
					if(pauseButton){
						dateNow = new Date();
						closestPaperDiag = pauseButton.closest('paper-dialog');
						
						// Try new YouTube element format
						if(!closestPaperDiag || closestPaperDiag == null){
							closestPaperDiag = pauseButton.closest('tp-yt-paper-dialog');
						}
											
						if(closestPaperDiag && closestPaperDiag != null && !closestPaperDiag.getAttribute("aria-hidden")){						
							log("YouTubeNonStop: Resuming playback and clicking on the confirm button on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US') + " for YouTube instance with the URL of " + arrayUrls[i] + "!");
							pauseButton.click();
							aButton = pauseButton.getElementsByTagName('a');
							if(aButton && aButton.length){
								aButton[0].click();
							}
							YouTubeNonStopObj.playAudio(arrayOfDoms[i], arrayOfTabs[i], true);
						}
					}
					
					// Check for login nag screen
					signInButton = arrayOfDoms[i].getElementById('dismiss-button');
					if(signInButton){
						dateNow = new Date();
						if(YouTubeNonStopObj.isVisible(signInButton)){						
							log("YouTubeNonStop: Resuming playback and clicking on the Not Now button for the YouTube signin nag screen from instance " + arrayUrls[i] + " on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US') + "!");
							signInButton.click();
							aButton = signInButton.getElementsByTagName('a');
							if(aButton && aButton.length){
								aButton[0].click();
							}
							YouTubeNonStopObj.playAudio(arrayOfDoms[i], arrayOfTabs[i], true);
						}
					}
					
					// Check for randomly appearing login nag screen
					signInButton = arrayOfDoms[i].querySelector('div.yt-player-error-message-renderer div#dismiss-button');
					if(signInButton){
						dateNow = new Date();					
						log("YouTubeNonStop: Resuming playback and clicking on the Not Now button for the YouTube randomly appearing signin nag screen from instance " + arrayUrls[i] + " on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US') + "!");
						signInButton.click();
						aButton = signInButton.getElementsByTagName('a');
						if(aButton && aButton.length){
							aButton[0].click();
						}
						YouTubeNonStopObj.playAudio(arrayOfDoms[i], arrayOfTabs[i], true);
					}
					
					// Check for agree button nag screen
					agreeButton = arrayOfDoms[i].getElementById('introAgreeButton');
					if(agreeButton){
						closestPaperDiag = agreeButton.closest('paper-dialog');
						
						// Try new YouTube element format
						if(!closestPaperDiag || closestPaperDiag == null){
							closestPaperDiag = pauseButton.closest('tp-yt-paper-dialog');
						}
						
						dateNow = new Date();
						if(closestPaperDiag && closestPaperDiag != null && !closestPaperDiag.getAttribute("aria-hidden")){						
							log("YouTubeNonStop: Resuming playback and clicking on the agree button for the YouTube cookies annoying nag screen from instance " + arrayUrls[i] + " on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US') + "!");
							agreeButton.click();
							aButton = agreeButton.getElementsByTagName('a');
							if(aButton && aButton.length){
								aButton[0].click();
							}
							YouTubeNonStopObj.playAudio(arrayOfDoms[i], arrayOfTabs[i], true);
						}
					}
										
				}else{
					toRemove.push(i);
				}
			}
			
			if(shouldSwitchTab){
				log("YouTubeNonStop: Switching back to originally active tab on " + dateNow.toLocaleDateString() + " " + dateNow.toLocaleTimeString('en-US') + "!");
				gBrowser.selectedTab = currentTab;
			}
			
			if(toRemove.length){
				for(i = 0; i < toRemove.length; i++){
					arrayOfDoms.splice(toRemove[i], 1);
					arrayOfTabs.splice(toRemove[i], 1);
					arrayUrls.splice(toRemove[i], 1);
				}
			}
		}
	},
	playAudio: function(element, tab, playVideo){
		if(YouTubeNonStopObj.isVideoPaused(element, tab)){
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
		}
	},
	isVideoPaused: function(element, tab){
		ytVideo = null;
		
		var urlOfTab = gBrowser.getBrowserForTab(tab).contentDocument.URL;
		
		// Video paused?
		ytVideo = element.querySelector('video');
		if(ytVideo && ytVideo.paused){
			log("YouTubeNonStop: Video detected as paused on URL " + urlOfTab + "!");
			return true;
		}
		
		// Audio paused?
		ytVideo = element.querySelector('audio');
		if(ytVideo && ytVideo.paused){
			log("YouTubeNonStop: Audio detected as paused on URL " + urlOfTab + "!");
			return true;
		}
						
		return false;
	},
	isVisible: function(element){
		return (element.offsetWidth > 0 || element.offsetHeight > 0)
	}
};

YouTubeNonStopObj.init();
