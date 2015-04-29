Meteor.subscribe("tags");
var MY_TWEETS_LIST_NUM=10;

var sanitize=function(text){
	return $("<div>").text(text).html();
};

var postTweet=function(text,tagArray,$textArea,$myTweetsList){
	text=text.trim();
	if(!text){
		$textArea.focus();
		return;
	}
	if(tagArray.length===0)tagArray.push("");
	Meteor.call("postTweet",text,tagArray,function(err,res){
		if(err)console.log(err);
		if($myTweetsList !== void 0){
			var result = !err ? res.data.text : text;
			var isSucceeded = !err ? "ok" : "remove";
			isSucceeded='<span class="glyphicon glyphicon-'+isSucceeded+'"></span> ';
			result=sanitize(result);
			result=isSucceeded+result;
			$myTweetsList.prepend("<li>"+result+"</li>");
			if($myTweetsList.children().length>=MY_TWEETS_LIST_NUM){
				$myTweetsList.children(":last-child").remove();
			}
		}
	});
	$textArea.val("");
	$textArea.focus();
	return;
};

Template.registerHelper(
	"isSimpleMode",function(){
		if(!Meteor.user()) return false;
		return Tags.findOne().isSimpleMode;
	}
);

Template.header.events({
	"click #toggleSimpleMode":function(){
		var oldCondition=Tags.findOne().isSimpleMode;
		Meteor.call("toggleSimpleMode",!oldCondition);
	}
});

Template.tweetArea.events({
	"submit #newTweet": function(event) {
		var text = event.target.text.value;
		var $textArea=$(event.target.text);
		var station = $("#station").val();
		var program = $("#program").val();
		var tagArray=[station,program];
		postTweet(text,tagArray,$textArea,$("#myTweetsList"));
		return false;
	}
});

Template.configTagModal.events({
	"submit #addStation": function(event) {
		var station = event.target.text.value;
		Meteor.call("addStation",station);
		event.target.text.value = "";
		return false;
	},
	"submit #addProgram": function(event) {
		var program = event.target.text.value;
		var station=$(event.target).find(":selected").val();
		Meteor.call("addProgram",program,station);
		event.target.text.value = "";
		return false;
	},
	"submit #delStation":function(event){
		var station=$(event.target).find(":selected").val();
		Meteor.call("delStation",station);
		return false;
	},
	"submit #delProgram":function(){
		var program=$("#unwantedProgram").val();
		var station=$("#unwantedStation").val();
		Meteor.call("delProgram",program,station);
		return false;
	}
});

Template.getTagModal.events({
	"submit #getTag":function(){
		$("#tagSuggestion").empty();
		$("#tagSuggestionStatus").text("Loading...");
		$(".timeline").each(function(){
			$(this).prop("disabled",true);
		});
		var n=200;
		Meteor.call("getHomeTimeline",n,function(err,res){
			if(err)console.log(err);
			$("#tagSuggestionStatus").empty();
			var tagPool=[];
			for (var i = res.data.length - 1; i >= 0; i--) {
				for (var j = res.data[i].entities.hashtags.length - 1; j >= 0; j--) {
					var tag=res.data[i].entities.hashtags[j].text;
					tag=sanitize(tag);
					tagPool.push(tag);
				}
			}
			if(tagPool.length===0){
				$("#tagSuggestionStatus").text("There are no tags in your timeline.");
				return false;
			}
			var result=_.chain(tagPool)
			.countBy(function(n){return n;})
			.pairs()
			.sortBy(function(a){return a[1];})
			.value();
			/* -> [ [name, count_i], [name, count_j] .....]
			count_i <= count_j if i <j */
			var tagCount=result[result.length-1][1];
			var html='<optgroup label="'+tagCount+'回">';
			for (var i = result.length - 1; i >= 0; i--) {
				if(tagCount!==result[i][1]){
					tagCount=result[i][1];
					html+='</optgroup><optgroup label="'+tagCount+'回">';
				}
				html+='<option value="'+result[i][0]+'">'+result[i][0]+"</option>";
			}
			html+="</optgroup>";
			$("#tagSuggestion").append(html);
			$(".timeline").each(function(){
				$(this).prop("disabled",function(i, v) { return !v; });
			});
			$("#tagSuggestion").scrollTop(0);
			$("#tagSuggestionStatus").empty();
		});
		return false;
	},
	"submit #addStationFromSuggestion":function(event){
		$("#tagSuggestion").find(":selected").each(function(){
			var station=$(this).val();
			Meteor.call("addStation",station);
			$(this).remove();
		});
		$("optgroup").each(function(){
			if($(this).children().length===0)$(this).remove();
		});
		return false;
	},
	"submit #addProgramFromSuggestion":function(event){
		var station=$(".getTag #targetStation").val();
		$("#tagSuggestion").find(":selected").each(function(){
			var program=$(this).val();
			Meteor.call("addProgram",program,station);
			$(this).remove();
		});
		$("optgroup").each(function(){
			if($(this).children().length===0)$(this).remove();
		});
		return false;
	}
});

Template.simpleMode.events({
	"submit #newTweet":function(event){
		var text=event.target.text.value;
		var $textArea=$(event.target.text);
		postTweet(text,[],$textArea);
		return false;
	}
});

Template.footer.events({
	'click button[data-target="#footerContent"]':function(){
		var oldCondition=Tags.findOne().isFooterHidden;
		Meteor.call("toggleFooter",!oldCondition);
	}
});

Template.footer.helpers({
	isFooterHidden:function(){
		if(!Meteor.user()) return false;
		return Tags.findOne().isFooterHidden;
	},
	_isFooterHidden:function(){
		return Tags.findOne()._isFooterHidden;
	}
});

Template.footer.onCreated(function(){
	Meteor.call("footerInitialize");
});

$(function($) {
	//Ctrl+Enter
	$(window).keydown(function(e) {
		if (e.ctrlKey) {
			if (e.keyCode === 13) {
				$("#newTweet").submit();
				return false;
			}
		}
	});
});

Template.stationList.helpers({
	stations: function(){
		if(!Meteor.user()) return [];
		var tmp=Object.keys(Tags.findOne().stations);
		tmp=_.without(tmp,"blank_");
		return tmp;
	}
});

Template.programList.helpers({
	programs: function(){
		if(!Meteor.user()) return [];
		var station=Tags.findOne().selectedStation;
		return Tags.findOne().stations[station].programs;
	}
});

Template.configTagModalBody.helpers({
	defaultStations:["tokyomx","tvk","tvtokyo","fujitv","tbs","tvasahi","ntv","etv","nhk"]
});
