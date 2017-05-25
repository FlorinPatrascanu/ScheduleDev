function loading(arg) {
	if(arg == true) {
		$('#loading').removeClass('fadeOut').removeClass('fadeIn');
		$('#loading').addClass("active");
		setTimeout(function(){
			$('#loading').addClass('fadeIn');
		}, 300);
	} else {
		$('#loading').addClass('fadeOut');
		setTimeout(function(){
			$('#loading').removeClass("active").removeClass('fadeOut').removeClass('fadeIn');
		}, 300);
	}
}
function conferenceArray(data){
	var colors = ["#083D77" , "#DA4167" , "#F4D35E" , "#49DCB1" , "#48284A" , "#F26419" , "#A5243D" , "#5F7367" , "#FB4D3D" , "#3B5249","#4C2E05","#7A8450", "#785964", "#4C2E05", "#F5AC72","#083D77" , "#DA4167" , "#F4D35E" , "#49DCB1" , "#48284A" , "#F26419" ];

	var conference = _.filter(data , function(obj){
		return obj.name === "Conference Path";
	});

	var conferencePathArrayRaw = _.filter(data, function(obj){
		return obj.parentid === conference[0].id;
	})
	var conferencePathFinal = _.reduce(conferencePathArrayRaw, function(result, value, key){
		var obj = {};
		obj.id = value.id;
		obj.color = colors[key];
		obj.name = value.name;
		result.push(obj);
		return result;
	},[]);

	return conferencePathFinal;
}
function GetAPIData(link){
	var deferred = $.Deferred();
	$.ajax({
		url: link,
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
function getData(event){
	var deferred = $.Deferred();
	var event = "nav2016us";
	var daysUrl = 'http://api.eventpoint.com/2.3/program/days?code='+event+'&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
	var topicsUrl = 'http://api.eventpoint.com/2.3/program/topics?code='+event+'&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
	var categoriesUrl = 'https://api.eventpoint.com/2.3/program/categories?code='+event+'&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
	loading(true);
	$.when(GetAPIData(daysUrl),GetAPIData(topicsUrl),GetAPIData(categoriesUrl)).then(function(v1,v2,v3){
		var conferencePathArray = conferenceArray(v3);
		var scheduleData = _.reduce(v1, function(result, value, key){
			var date = value.date;
			date = date.split('T')[0];

			var obj = {};
			obj.date = date;
			obj.topics = _.chain(v2.results)
										.filter(function(o){
											// console.log(o);
											return (o.start).split("T")[0] == date;
										})
										.reduce(function(result, value, key){
											var obj = {};
											obj.title = value.title;
											obj.id = value.id;
											obj.description = value.description;
											obj.publishingStatus = value.publishingstatus;
											obj.room = value.room;
											obj.categoryids = value.categoryids;
											obj.start = (value.start).split('T')[1].substring(0 , 5);
											obj.finish = (value.finish).split('T')[1].substring(0 , 5);
											// _.map(value.categoryids, function(value){
											obj.conferencePath = _.filter(conferencePathArray, function(object){
												return _.includes(value.categoryids, object.id)
											});

											result.push(obj);
											return result;

										},[])
										.value();
			result.push(obj);
			return result;
		},[]);


		deferred.resolve(scheduleData);
	});
	return deferred.promise();
}
function buildEventSelect(){
	var eventSelect = [];
	$('#event-select option').each(function(){
		var value = $(this).attr("value") == "" ? "" : $(this).attr("value");
		var name = $(this).html();
		eventSelect.push({"value": value, "name": name});
	});
	// eventSelect.shift();
	var output = '<select id="header-event-select" class="form-control">';
	_.map(eventSelect, function(o){
		if(o.value == "") {
			output += '<option value="'+o.value+'" disabled selected>'+o.name+'</option>';
		} else {
			output += '<option value="'+o.value+'">'+o.name+'</option>';
		}

	});
	output += '</select>';
	return output;
}
function buildDaySelect(data){
	var days = _.reduce(data, function(result, value, key){
		result.push(value.date);
		return result;
	},[]);

	var output = '<select id="header-day-select" class="form-control">';
	// output += '<option value="" disabled seleted>Pick a date</option>';
	_.map(days, function(val){
			output += '<option value="'+val+'">'+val+'</option>';
	});
	output += '</select>';
	return output;
}
function buildConferencePathSelect(data){
	var conferencePathArray = _.chain(data)
														.reduce(function(result, value, key){
															// var array = [];
															// if (_.size(value.conferencePath) > 0) {
															// 		result.concat(value.conferancePath);
															// }
															// return result;
														},[])
														.uniq()
														.value();
	console.log(conferencePathArray);
	// var output = '<select id="header-day-select" class="form-control">';
	// // output += '<option value="" disabled seleted>Pick a date</option>';
	// _.map(days, function(val){
	// 		output += '<option value="'+val+'">'+val+'</option>';
	// });
	// output += '</select>';
	// return output;
}
function renderHeader(data) {
	var output = '<div id="schedule-header" class="form-inline animated fadeIn">';
	output += '<i class="fa fa-calendar" aria-hidden="true"></i>';
	output += buildEventSelect();
	output += buildDaySelect(data);
	output += '</div>';
	$("#schedule").prepend(output);
	$("#header-event-select").val($("#event-select").val());
}
function renderTable(data) {
	console.log(data);
}
function Schedule(data){


	 renderHeader(data);
	//  buildConferencePathSelect(data);


	 $('#header-day-select').on("change", function(){
		 var date = $(this).val();
		 var dataFilteredByDate = _.filter(data, function(o){
			 return o.date == date;
		 });
		 renderTable(dataFilteredByDate);
	 });
		//Run
		// console.log("schedule",data);
		loading(false);

}



$(function(){
	$('#event-select').on("change", function(){
		var event = $(this).val();
		$('#event-select-wrapper').hide();
		$.when(getData(event)).then(function(data){
			Schedule(data);
		});

	});
});
