// ==== START SCHEDULE ====

$(function(){
	// INIT



	var timeslotArray = buildTimeSlotsArray();
	renderTimeslots(timeslotArray);

	$.when(getDays()).then(function(data){
		return buildSelects(data);
	}).then(function(){
		return getCategories();
	}).then(function(data){
		// console.log("GET CATEGORIES DATA" , data);
		return conferencePathArray = getConferancePathArray(data);
	}).then(function(){		
		return getTopics();
	}).then(function(data){

		handleTopics(data);
		var optionValue = $("#triggerDayChange").val();

		console.log(topics);
		buildConferenceFilters(conferencePathArray);
		buildTable(topics, optionValue, conferencePathArray);

		//after render
		var currentCategoryIds = [];
		$('#schedule-topic .topic').each(function(){
			var categoryId= $(this).attr("data-conference-id");
			console.log(categoryId);
			if(categoryId != undefined) {
				currentCategoryIds.push(categoryId);
			}
			
		});
		console.log(currentCategoryIds)


		// Handle Day Change
		$('#triggerDayChange').on("change",  function(){
			var selectValue = $(this).val();
			buildTable(topics, selectValue, conferencePathArray);

			//reset conference path selecet
			if($('#conference-path').length) {
				$('#conference-path').val("");
			}
			
		});

		// conference path event

		$('#conference-path').on("change", function(){
			var value = $(this).val();
			console.log("changed");
			if (value == "") {
				$("#schedule-topic .topic").removeClass("filter-in").removeClass("filter-out");	
			} else {
				$("#schedule-topic .topic").each(function(){
					if($(this).attr("data-conference-id") == value) {
						$(this).addClass("filter-in").removeClass("filter-out");
					} else {
						$(this).removeClass("filter-in").addClass("filter-out");
					}
				});
			}
			
		});

		
	});
});

// Global Vars

var url = 'http://api.eventpoint.com/2.3/program?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
var daysUrl = 'http://api.eventpoint.com/2.3/program/days?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
var topicsUrl = 'http://api.eventpoint.com/2.3/program/topics?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
var roomsUrl = 'http://api.eventpoint.com/2.3/program/rooms?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
var speakersUrl = 'http://api.eventpoint.com/2.3/program/speakers?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
var conferencePathArray = [];

var topics = [];
var days = [];
var categories = [];


var cardUnitVertical = 40;
var cardUnitHorizontal = 300;





// AJAX Calls

function getDays() {
	var deferred = $.Deferred();
	$.ajax({
		url: daysUrl,
		type: 'GET',
		dataType: 'jsonp'
	})
	.done(function(data){
		deferred.resolve(data);
	})
	.fail(function(error) {
		deferred.reject(error);
		console.log("error");
	});
	return deferred.promise();
}

function getTopics() {
	var deferred = $.Deferred();
	$.ajax({
		url: topicsUrl,
		type: 'GET',
		dataType: 'jsonp'
	})
	.done(function(data) {
		// handleTopics(data.results);
		// console.log(topics);
		var result = data.results;
		// console.log("datares",data.results);
		deferred.resolve(result);
	})
	.fail(function(error) {
		deferred.reject(error);
		console.log("error");
	});

	return deferred.promise();
}


// END AJAX Calls

function buildSelects(data) {
	var deferred = $.Deferred();
	$.each(data , function(index , obj){
		var fullDate = obj.date.split('T');
		var option = fullDate[0];
		var $options = $('<option value="' + option + '">' + option + '</option>');

		$("#triggerDayChange").append($options);
	});
	deferred.resolve("buildselects");
	return deferred.promise();
}
function buildConferenceFilters(data){
	var output = "";
	output += '<select id="conference-path" class="form-control">';
	output += '<option value="">Select a conference path</option>';
	_.map(data, function(o){
		output += '<option value='+o.id+'>'+o.name+'</option>';
	});
	output += '</select>';

	$('#triggerDayChange').after(output);
}

// function handleDayChangeEvent() {


// 		$('#triggerDayChange').on("change",  function(){
// 			var selectValue = $(this).val();
// 			buildTable(topics, selectValue);
// 		});

// }


function handleTopics(data) {

	$.each(data , function(index , obj){

			var newObj = {};
			newObj.categoryIDs = [];
			newObj.speakersIDs = [];

			var getStartInfo = obj.start.split('T');

			var theDate = getStartInfo[0];
			var startTime = getStartInfo[1].substring(0 , 5);


			var getFinishInfo = obj.finish.split('T');
			var finishTime = getFinishInfo[1].substring(0 , 5);

			newObj.id = obj.id;
			newObj.date = theDate;
			newObj.approvalStatus = obj.approvalstatus;
			newObj.publishingStatus = obj.publishingstatus;
			newObj.categoryIDs = obj.categoryids;
			newObj.finish = finishTime;
			newObj.start = startTime;
			newObj.title = obj.title;
			newObj.room = obj.room;
			newObj.speakersIDs = obj.speakerids;
			topics.push(newObj);


	});

}


function getCategories() {
	
	var deferred = $.Deferred();
	var categoriesUrl = 'https://api.eventpoint.com/2.3/program/categories?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
	$.ajax({
		url: categoriesUrl,
		type: 'GET',
		dataType: 'jsonp'
	})
	.done(function(response){
		// console.log("AJAX CALL CATEGORIES " , response);
		deferred.resolve(response);
	})
	.fail(function(error) {
		deferred.reject(error);
		console.log("error");
	});
	return deferred.promise();
}

function getConferancePathArray(data) {
	// console.log("handle cat", result);
	var colors = ["#083D77" , "#DA4167" , "#F4D35E" , "#49DCB1" , "#48284A" , "#F26419" , "#A5243D" , "#5F7367" , "#FB4D3D" , "#3B5249","#4C2E05","#7A8450", "#785964", "#4C2E05", "#F5AC72","#083D77" , "#DA4167" , "#F4D35E" , "#49DCB1" , "#48284A" , "#F26419" ];

	var conference = _.filter(data , function(obj){
		return obj.name === "Conference Path";
	});

	var conferencePathArrayRaw = _.filter(data, function(obj){
		return obj.parentid === conference[0].id;
	})
// console.log("conferences",conferencePathArrayRaw);
	var conferencePathFinal = _.reduce(conferencePathArrayRaw, function(result, value, key){
		var obj = {};
		obj.id = value.id;
		obj.color = colors[key];
		obj.name = value.name;
		result.push(obj);
		return result;
	},[]);

	return conferencePathFinal;
	// console.log("conf path" , conferencePathFinal);
}





function buildTable(topics, data, conferencePathArray) {
	$('#schedule-topic').empty();
	var newDataset = _.filter(topics , function(o){
		return o.date == data;
	});

	// console.log("Build Table New Dataset: " , newDataset);



	// conference path implement
	_.map(newDataset , function(obj){
		// console.log("HERE" , obj.categoryIDs);
	});

	var rooms = _.chain(newDataset).map(function(obj){
		return obj.room;
	}).uniq().value();

	// console.log("Rooms: " , rooms);

	buildHeaderRooms(rooms);

	_.map(newDataset , function(obj){
		buildCard(rooms,obj, conferencePathArray);
	});
}


function buildHeaderRooms(arg) {
	$("#schedule-rooms").empty();

	var roomSize = _.size(arg);
	
	$.each(arg , function(index , o){
		var room = o.split(",");
		var roomWrapper = '';

		roomWrapper += '<div class="room">' + room + '</div>';
		$("#schedule-rooms").append(roomWrapper);
		$("#schedule-rooms").css("width" , cardUnitHorizontal * roomSize + "px");
	});
	
}


function buildCard(rooms, obj, conferencePathArray) {

	// console.log(obj);
	var colorArray = _.filter(conferencePathArray, function(o){
		return _.includes(obj.categoryIDs, o.id)
	});

	var color = "#909090";
	var conferencePathId = "";
	// console.log(colorArray);

	if (_.size(colorArray) > 0) {
		color = colorArray[0].color;
		conferencePathId = 'data-conference-id="'+colorArray[0].id+'"';
	}

	// var randomColor = Math.floor(Math.random() * colors.length);

	var timeslotArray = buildTimeSlotsArray();
	var offsetTop = _.indexOf(timeslotArray, obj.start) * cardUnitVertical;
	var offsetLeft = _.indexOf(rooms, obj.room) * cardUnitHorizontal;
	var cardHeight = (_.indexOf(timeslotArray, obj.finish) - _.indexOf(timeslotArray, obj.start)) * cardUnitVertical;
	// console.log(offsetTop, offsetLeft, cardHeight);
	var output = "";
	output += '<div class="topic" '+conferencePathId+'style="position: absolute; left:'+offsetLeft+ 'px; top: '+offsetTop+'px; height: '+cardHeight+'px; width: '+cardUnitHorizontal+'px;">';
	output += '<div class="content" style="background-color: ' + color + ';">';
	output += '<span>' + obj.title + '</span>';
	output += '</div>';
	output += '</div>';
	$("#schedule-topic").append(output);
}


function buildTimeSlotsArray() {
	var result = [];
	var minutes = ["00","15","30","45"];
	for (var i = 0; i < 24; i++) {
		_.map(minutes, function(minutes){
			var value = i;
			if (value < 10) { value = "0" + i;}
			result.push(value+ ":" + minutes)
		});
	}

	return result;
}
function renderTimeslots(arr) {
	var output = "";
	_.map(arr, function(hour){
		output += '<div class="timeslot"><span>'+hour+'</span></div>'
	});
	$("#schedule-timeslots").append(output);
}





// ==== END SCHEDULE ====