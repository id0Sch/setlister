angular.module('youtube.api.services',[]).run(['$rootScope','$window',function($rootScope,$window) {
	var tag = document.createElement('script');
	tag.src = '//www.youtube.com/iframe_api';
	var firstScriptTag = document.getElementsByTagName('script')[0];
	firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
	$rootScope.$on('$viewContentLoaded',function() {
		if (typeof YT !== 'undefined') {
			$rootScope.$broadcast('apiReady');
		}
	});
}]).factory('youtubePlayer', ['$window','$rootScope', function ($window, $rootScope) {
	$window.onYouTubeIframeAPIReady = function () {
		$rootScope.$broadcast('apiReady');
	};
	var ytplayer = {
		'active':false,
		'playerId':null,
		'playerObj':null,
		'videoId':null,
		'autoplay': 0,
		'html5': 1,
		'controls': true,
		'height':390,
		'width':640,
		'listType':null,
		'playlist':null,
		'playlistIndex':0,
		'setShuffle':null,
		'state':null,
		'mute':false,

		setPlayerId:function(elemId) {
			this.playerId=elemId;
		},
		setDimensions:function(width,height) {
			this.width=width;
			this.height=height;
		},
		setPlayerVars: function(player_vars) {
			for (var attr in player_vars) {
				this[attr]=player_vars[attr];
			}
		},
		setPlayList : function (list) {
			this.listType = 'playlist';
			this.setShuffle = true;
			this.playlist = list.toString();
		},
		setVideoId: function(videoId) {
			this.videoId = videoId;
		},
		loadPlayer:function (callback) {
			var playerVars={'autoplay':this.autoplay,'controls':this.controls};
			var playerConfig={'height':this.height,'width':this.width,'playerVars':playerVars,'events':{}};
			if (this.listType) {
				playerConfig.playerVars.listType=this.listType;
				playerConfig.playerVars.setShuffle=this.setShuffle;
				playerConfig.playerVars.playlist=this.playlist;
			}
			else {
				playerConfig.videoId=this.videoId;
			}
			if (callback) {
				playerConfig.events.onReady=callback;
			}
			this.playerObj = new YT.Player(this.playerId, playerConfig);
		},
		muteVideo: function() {
			this.playerObj.mute();
		},
		unMuteVideo: function() {
			this.playerObj.unMute();
		},
		setVolume: function(volume){
			this.playerObj.setVolume({volume:volume});
		},
		playVideo:function() {
			this.playerObj.playVideo();
		},
		pauseVideo:function() {
			this.playerObj.pauseVideo();
		},
		stopVideo:function() {
			this.playerObj.stopVideo();
		},
		nextVideo:function() {
			this.playerObj.nextVideo();
		},
		previousVideo:function(){
			this.playerObj.previousVideo();
		},
		seekTo:function(value){
			this.playerObj.seekTo(value);
		},
		jumpTo:function(value){
			this.playerObj.playVideoAt(value);
		},
	};
	return ytplayer;
}])