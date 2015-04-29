var config=Assets.getText("config.json");
config=JSON.parse(config);

Meteor.startup(function(){
	Accounts.loginServiceConfiguration.remove({service:"twitter"});
	Accounts.loginServiceConfiguration.insert({
		service:"twitter",
		consumerKey:config.consumerKey,
		secret:config.secret
	});
});

TwitterApi.prototype.homeTimeline = function(param) {
	return this.get('statuses/home_timeline.json',param);
};

var twitter=new TwitterApi();

function validateString(s) {
	return ((typeof s)==="string")&&(s!=="")&&(s.match(/\./)===null);
}

function confirmStation (stationName,userId) {
	var selector={};
	selector["stations."+stationName]={$exists:true};
	selector["owner"]=userId;
	return !!Tags.find(selector).count();
}

function confirmProgram (program,stationName,userId) {
	var selector={};
	selector["stations."+stationName+".programs"]=program;
	selector["owner"]=userId;
	return !!Tags.find(selector).count();
}

Meteor.methods({
	postTweet:function(text,tagArray){
		if(Meteor.user()&&(_.isArray(tagArray))&&(tagArray.length>0)){
			_.chain(tagArray)
			.filter(function(a){return (validateString(a))&&(a!=="blank_");})
			.map(function(a){text=text+" #"+a;});
			text=text.trim();
			return twitter.postTweet(text);
		}
	},
	addStation:function(stationName){
		if(validateString(stationName) && Meteor.user()){
			//confirm the new station name does not exist
			if(!confirmStation(stationName,this.userId)){
				var selector={};
				selector["stations."+stationName+".createdAt"]=new Date();
				selector["stations."+stationName+".programs"]=[];
				Tags.update({owner:this.userId},{$set:selector});
			}
		}
	},
	addProgram:function(program,stationName){
		if(Meteor.user()&&validateString(program)&&validateString(stationName)){
			if(confirmStation(stationName,this.userId)&&(!confirmProgram(program,stationName,this.userId))){
				var selector={};
				selector["stations."+stationName+".programs"]=program;
				Tags.update({owner:this.userId},{$push:selector});
			}
		}
	},
	delStation:function(stationName){
		if(Meteor.user()&&stationName!=="blank_"){
			var selector={};
			selector["stations."+stationName]="";
			Tags.update({owner:this.userId},{$unset:selector,$set:{selectedStation:"blank_"}});
		}
	},
	delProgram:function(program,stationName){
		if(Meteor.user()){
			var selector={};
			selector["stations."+stationName+".programs"]=program;
			Tags.update({owner:this.userId},{$pull:selector});
		}
	},
	changeStation:function(stationName){
		if(Meteor.user()&&confirmStation(stationName,this.userId)){
			Tags.update({owner:this.userId},{$set:{selectedStation:stationName}});
		}
	},
	getHomeTimeline:function(n){
		if(Meteor.user()&&n>0&&n<=200){
			return twitter.homeTimeline({count:n});
		}
	},
	toggleSimpleMode:function(newCondition){
		if(Meteor.user()&&((typeof newCondition)==="boolean")){
			Tags.update({owner:this.userId},{$set:{isSimpleMode:newCondition}});
		}
	},
	toggleFooter:function(newCondition){
		if(Meteor.user()&&((typeof newCondition)==="boolean")){
			Tags.update({owner:this.userId},{$set:{isFooterHidden:newCondition}});
		}
	},
	footerInitialize:function(){
		if(Meteor.user()){
			var newCondition=Tags.findOne({owner:this.userId}).isFooterHidden;
			Tags.update({owner:this.userId},{$set:{_isFooterHidden:newCondition}});
		}
	}
});

Meteor.publish("tags",function(){
	if(Tags.find({owner:this.userId}).count()===0){
		Tags.insert({
			owner:this.userId,
			stations:{
				blank_:{
					createdAt:new Date(),
					programs:[]
				}
			},
			selectedStation:"blank_",
			isSimpleMode:false,
			isFooterHidden:false
		});
	}
	else {
		Tags.update({
				owner:this.userId
			},
			{
				$set:{
					selectedStation:"blank_"
			}
		});
	}
	return Tags.find({owner:this.userId});
});