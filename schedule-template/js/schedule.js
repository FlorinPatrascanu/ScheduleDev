$(function(){
	// ---------------------------- SCHEDULE START ---------------------------- 

	// API 
	var url = '';
	var agendaUrl = '';
	var daysUrl = '';



	// global vars in which we store data recieved from AJAX Calls
	var dataObject = [];
	var dataDays = [];

	// init
	var select = $("#switchEvent");

	select.change(function(event){
		var value = $(this).val();

		// clear the days and agenda
		$("#scheduleManager").empty();
		$("#scheduleProgram").empty();

		switch(value) {
			case "North America":
				url = 'http://api.eventpoint.com/2.3/program?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
				agendaUrl = 'http://api.eventpoint.com/2.3/program/agenda?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
				daysUrl = 'http://api.eventpoint.com/2.3/program/days?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
			break; 

			case "EMEA":
				url = 'http://api.eventpoint.com/2.3/program?code=nav2016emea&apikey=eb1d7897821a4d40ba827606a0460ca8';
				agendaUrl = 'http://api.eventpoint.com/2.3/program/agenda?code=nav2016emea&apikey=eb1d7897821a4d40ba827606a0460ca8';
				daysUrl = 'http://api.eventpoint.com/2.3/program/days?code=nav2016emea&apikey=eb1d7897821a4d40ba827606a0460ca8';
			break;

			case "None":
				url = null;
				agendaUrl = null;
				daysUrl = null;
			break;
		}


		// entry ajax call
		$.ajax({
			url: url,
			type: 'GET',
			dataType: 'jsonp'
		})
		.done(function(data) {

			dataObject = data;

			// get days 
			$.ajax({
				url: daysUrl,
				dataType: 'jsonp'
			})
			.done(function(data) {
				dataDays = data;
			})
			.fail(function() {
				console.log("error");
			});		
		})
		.fail(function() {
			console.log("error");
		});

		if(url != null && agendaUrl != null && daysUrl != null) {
			setTimeout(function(){
				$.each(dataDays, function(index, el) {
					 buildScheduleUI(el);
				});
			} , 3000);
		}

	});


	function fn_equal_heights(target) {

		var heights = [];

		$.each(target , function(i , el){
			heights.push(el.clientHeight);
		});

		setTimeout(function(){
			var maxHeight = Math.max.apply(Math , heights);
			$.each(target , function(){
				$(this).css('height' , maxHeight + 'px');
			});
		} , 1000);		
	}

	// output days
	function buildScheduleUI(o) {
		var wrapper = '';
		var target = $("#scheduleManager");
		var goodDate = o.date.substring(0 , 10);


		
		wrapper += '<div class="col-md-3 col-xs-6" data-date="'+ goodDate +'">';
		wrapper += '<h2>Day ' + o.dateindex + '</h2>';
		wrapper += '<p style="font-size:22px">' + o.shortformatteddate + '</p>';
		wrapper += '</div>';
		

		target.append(wrapper);

	}

	// output agenda
	function buildScheduleTable(dataset , target) {
		target.empty();
		var wrapper = '';
		var Tiles = [];

		// reduce redundancy
		var rooms = _.chain(dataset)
					.reduce(function(result , value , key){
						result.push(value.room); 
						return result;
					} , [])
					.uniq()
					.value();


		_.map(rooms , function(room){
			buildColumn(room);
		});


		function buildColumn(room) {
			var output = {};

			var newDataset = _.filter(dataset , function(o){
				return o.room == room;
			});


			output.room = room;
			output.timeslots = [];

			_.map(newDataset , function(o){
				var obj = {};
				obj.timeslot = o.formattedtimeslot;
				obj.activity = o.title;
				output.timeslots.push(obj);
			});


			Tiles.push(output);

		}
		

		if(dataset.length < 1) {
			 	 wrapper += '<div class="col-md-12 schedule-card">';
				 wrapper += '<p> No agenda scheduled for today </p>';
			 	 wrapper += '</div>';

		} else {

			_.map(Tiles , function(obj){
				wrapper += '<div class="col-md-3 schedule-card">';
				wrapper += '<div class="inner-content">';
				wrapper += '<h3>' + '<span class="glyphicon glyphicon-map-marker" style="margin-right: 0.3em"></span>' + obj.room + '</h3><br><br>';

				// render room timeslots
				_.map(obj.timeslots , function(o){
					wrapper += '<h1>' + o.timeslot + '</h1>';
					wrapper += '<p>' + o.activity + '</p><br><br>';
				});
				wrapper += '</div>';
				wrapper += '</div>';
			});
		}

		var outputObject = $(wrapper);
		target.append(outputObject);

		return outputObject;

		
	}



	function checkForTimeFormat(xTime) {

		var result = null;
		var y = '';
		var x = xTime.split(" ");

		if(x[1] == "PM") {
		  	y = x[0].split(":").join("");
		    result = parseInt(y , 10);
		    // add 1200 to get 24 hour format
		    if(result != 1200) {
		    	result += 1200;
		    } 
		    
		} else {
		  	y = x[0].split(":").join("");
		    result = parseInt(y , 10);
		}
		  
	  	return result;
	}


	$(document).on("click" , "#scheduleManager div" , function(){
		
		var ref = $(this).attr("data-date");

		// array in which we store filtered objects
		var filteredAgenda = [];

		$.ajax({
			url: agendaUrl,
			dataType: 'jsonp'
			
		})
		.done(function(data) {

			// retrieve corresponding agenda for the clicked element 
			$.each(data, function(index, obj) {
				 if(ref == obj.start.substring(0 , 10)) {
				 	filteredAgenda.push(obj);
				 } 
			});

			// add new key to the object - transform the timeslot into an integer in order to be able to sort by time
			$.each(filteredAgenda, function(index, obj) {
				 var out = obj.formattedtimeslot.split(" - ")[0];
				 obj.timeToInt = checkForTimeFormat(out);
			});

			// sort the dataset by new property
			filteredAgenda.sort(function(a , b){
				var outA = a.timeToInt;
				var outB = b.timeToInt;

				if(outA == outB) return 0;

				return outA > outB ? 1 : -1;
			});

			// output the results to the view and equalize all tiles
			var output = buildScheduleTable(filteredAgenda , $("#scheduleProgram"));
			fn_equal_heights(output);
			
		})
		.fail(function() {
			console.log("error");
		});

	});

	// ---------------------------- SCHEDULE END ---------------------------- 
});