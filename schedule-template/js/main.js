$(function(){
	stepOne();
})

	// ----- START DEV-SCHEDULE -----

	// Global Vars
	var eventData = [];
	var eventDaysData = [];
	var topics = [];
	var rooms = [];



	function stepOne() {

		// North America API
		var url = 'http://api.eventpoint.com/2.3/program?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
		var daysUrl = 'http://api.eventpoint.com/2.3/program/days?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
		var topicsUrl = 'http://api.eventpoint.com/2.3/program/topics?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
		var roomsUrl = 'http://api.eventpoint.com/2.3/program/rooms?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';
		var speakersUrl = 'http://api.eventpoint.com/2.3/program/speakers?code=nav2016us&apikey=a325a4c2a3ed435eb1eb9e8f0dddeb03';

		function getEvent() {
			var deferred = $.Deferred();
			$.ajax({
				url: url,
				type: 'GET',
				dataType: 'jsonp'
			})
			.done(function(data){
				eventData = data;
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
				console.log("Topics!!!" , data);
				manageData(data.results);
				deferred.resolve(data.results);
			})
			.fail(function(error) {
				deferred.reject(error);
				console.log("error");
			});

			return deferred.promise();
		}

		$.when(getTopics()).then(getDays()).then(function(){
				buildUi(eventDaysData , topics);
				// handleTimeslotClick();

				$.ajax({
					url: speakersUrl,
					type: 'GET',
					dataType: 'jsonp'
				})
				.done(function(data){
					console.log("Speakers: " , data);
				})
				.fail(function(error) {		
					console.log("error");
				});


		}).then(function(){
			stepTwo();
		});


		// $.when(getTopics()).then(getRooms()).then(function(){
		// 	buildUi(rooms , topics);
		// }).then(function(){
		// 	console.log("Inject step two here...");
		// })


		function getRooms() {
			var deferred = $.Deferred();
			$.ajax({
				url: roomsUrl,
				type: 'GET',
				dataType: 'jsonp'
			})
			.done(function(data){
				rooms = data;
				deferred.resolve(data);
			})
			.fail(function(error) {
				deferred.reject(error);
				console.log("error");
			});
			return deferred.promise();
		}
	

		function getDays() {
			var deferred = $.Deferred();
			$.ajax({
				url: daysUrl,
				type: 'GET',
				dataType: 'jsonp'
			})
			.done(function(data){
				console.log("Zile: " , data);
				eventDaysData = data;
				deferred.resolve(data);
			})
			.fail(function(error) {
				deferred.reject(error);
				console.log("error");
			});
			return deferred.promise();
		}


		function manageData(data) {

			$.each(data , function(index , obj){

					var newObj = {};
					newObj.categoryIDs = [];
					newObj.speakersIDs = [];

					var getStartInfo = obj.start.split('T');

					var theDate = getStartInfo[0];
					var startTime = getStartInfo[1].substring(0 , 5);


					var getFinishInfo = obj.finish.split('T');
					var finishTime = getFinishInfo[1].substring(0 , 5);

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


		// Build User Interface
		function buildUi(data , topics) {
		
			console.log("Topics filtered: " , topics);
			var target = $(".events").find("ul");
			var wrapper = '';

			$.each(data , function(index , obj){
		
	
					wrapper += '<li class="events-group">';
					wrapper += '<div class="top-info"><span>' + obj.name + '</span></div>';
					wrapper += '<ul>';

					// $.map(topics , function(o){
					// 	if(o.date == dataDate) {
					// 		wrapper += '<li class="single-event" data-start="' + o.start + '" data-end="' + o.finish + '" data-event="event-1" style="min-height: 200px">';
					// 		wrapper += '<a href="#0">';
					// 		wrapper += '<em class="event-name">' + o.title + ' <br><br>Room: ' + o.room + '</em>';
					// 		wrapper += '</a>';
					// 		wrapper += '</li>';
					// 	}

					// });

					wrapper += '</ul>';
					wrapper += '</li>';
			});

			target.append(wrapper);

		}


		function handleTimeslotClick() {
			$(".timeline ul li").click(function(event){
				
				var filterCriteria = $(this).text();

				// filter topics 
				var test = topics.filter(function(o){
					return o.start == filterCriteria;
				});

				$.each(test , function(index , obj){
					console.log(obj);
				});

				// console.log("Filtered: " , test);
			});
		}


	}

	// -----  END DEV-SCHEDULE ------








	// ----- START SCHEDULE PLAN ------

	function stepTwo() {

		

		var transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
		var transitionsSupported = ( $('.csstransitions').length > 0 );
		//if browser does not support transitions - use a different event to trigger them
		if( !transitionsSupported ) transitionEnd = 'noTransition';
		
		//should add a loding while the events are organized 

		function SchedulePlan( element ) {
			this.element = element;
			this.timeline = this.element.find('.timeline');
			this.timelineItems = this.timeline.find('li');
			this.timelineItemsNumber = this.timelineItems.length;
			this.timelineStart = getScheduleTimestamp(this.timelineItems.eq(0).text());
			//need to store delta (in our case half hour) timestamp
			this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems.eq(1).text()) - getScheduleTimestamp(this.timelineItems.eq(0).text());

			this.eventsWrapper = this.element.find('.events');
			this.eventsGroup = this.eventsWrapper.find('.events-group');
			this.singleEvents = this.eventsGroup.find('.single-event');
			this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();

			this.modal = this.element.find('.event-modal');
			this.modalHeader = this.modal.find('.header');
			this.modalHeaderBg = this.modal.find('.header-bg');
			this.modalBody = this.modal.find('.body'); 
			this.modalBodyBg = this.modal.find('.body-bg'); 
			this.modalMaxWidth = 800;
			this.modalMaxHeight = 480;

			this.animating = false;

			this.initSchedule();
		}

		SchedulePlan.prototype.initSchedule = function() {
			this.scheduleReset();
			this.initEvents();
		};

		SchedulePlan.prototype.scheduleReset = function() {
			var mq = this.mq();
			if( mq == 'desktop' && !this.element.hasClass('js-full') ) {
				//in this case you are on a desktop version (first load or resize from mobile)
				this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
				this.element.addClass('js-full');
				this.placeEvents();
				this.element.hasClass('modal-is-open') && this.checkEventModal();
			} else if(  mq == 'mobile' && this.element.hasClass('js-full') ) {
				//in this case you are on a mobile version (first load or resize from desktop)
				this.element.removeClass('js-full loading');
				this.eventsGroup.children('ul').add(this.singleEvents).removeAttr('style');
				this.eventsWrapper.children('.grid-line').remove();
				this.element.hasClass('modal-is-open') && this.checkEventModal();
			} else if( mq == 'desktop' && this.element.hasClass('modal-is-open')){
				//on a mobile version with modal open - need to resize/move modal window
				this.checkEventModal('desktop');
				this.element.removeClass('loading');
			} else {
				this.element.removeClass('loading');
			}
		};

		SchedulePlan.prototype.initEvents = function() {
			var self = this;

			this.singleEvents.each(function(){
				//create the .event-date element for each event
				var durationLabel = '<span class="event-date">'+$(this).data('start')+' - '+$(this).data('end')+'</span>';
				$(this).children('a').prepend($(durationLabel));

				//detect click on the event and open the modal
				// $(this).on('click', 'a', function(event){
				// 	event.preventDefault();
				// 	if( !self.animating ) self.openModal($(this));
				// });
			});

			//close modal window
			this.modal.on('click', '.close', function(event){
				event.preventDefault();
				if( !self.animating ) self.closeModal(self.eventsGroup.find('.selected-event'));
			});
			this.element.on('click', '.cover-layer', function(event){
				if( !self.animating && self.element.hasClass('modal-is-open') ) self.closeModal(self.eventsGroup.find('.selected-event'));
			});
		};

		SchedulePlan.prototype.placeEvents = function() {
			var self = this;
			this.singleEvents.each(function(){
				//place each event in the grid -> need to set top position and height
				var start = getScheduleTimestamp($(this).attr('data-start')),
					duration = getScheduleTimestamp($(this).attr('data-end')) - start;

				var eventTop = self.eventSlotHeight*(start - self.timelineStart)/self.timelineUnitDuration,
					eventHeight = self.eventSlotHeight*duration/self.timelineUnitDuration;
				
				$(this).css({
					top: (eventTop -1) +'px',
					height: (eventHeight+1)+'px'
				});
			});

			this.element.removeClass('loading');
		};

		SchedulePlan.prototype.openModal = function(event) {
			var self = this;
			var mq = self.mq();
			this.animating = true;

			//update event name and time
			this.modalHeader.find('.event-name').text(event.find('.event-name').text());
			this.modalHeader.find('.event-date').text(event.find('.event-date').text());
			this.modal.attr('data-event', event.parent().attr('data-event'));

			//update event content
			this.modalBody.find('.event-info').load(event.parent().attr('data-content')+'.html .event-info > *', function(data){
				//once the event content has been loaded
				self.element.addClass('content-loaded');
			});

			this.element.addClass('modal-is-open');

			setTimeout(function(){
				//fixes a flash when an event is selected - desktop version only
				event.parent('li').addClass('selected-event');
			}, 10);

			if( mq == 'mobile' ) {
				self.modal.one(transitionEnd, function(){
					self.modal.off(transitionEnd);
					self.animating = false;
				});
			} else {
				var eventTop = event.offset().top - $(window).scrollTop(),
					eventLeft = event.offset().left,
					eventHeight = event.innerHeight(),
					eventWidth = event.innerWidth();

				var windowWidth = $(window).width(),
					windowHeight = $(window).height();

				var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
					modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

				var modalTranslateX = parseInt((windowWidth - modalWidth)/2 - eventLeft),
					modalTranslateY = parseInt((windowHeight - modalHeight)/2 - eventTop);
				
				var HeaderBgScaleY = modalHeight/eventHeight,
					BodyBgScaleX = (modalWidth - eventWidth);

				//change modal height/width and translate it
				self.modal.css({
					top: eventTop+'px',
					left: eventLeft+'px',
					height: modalHeight+'px',
					width: modalWidth+'px',
				});
				transformElement(self.modal, 'translateY('+modalTranslateY+'px) translateX('+modalTranslateX+'px)');

				//set modalHeader width
				self.modalHeader.css({
					width: eventWidth+'px',
				});
				//set modalBody left margin
				self.modalBody.css({
					marginLeft: eventWidth+'px',
				});

				//change modalBodyBg height/width ans scale it
				self.modalBodyBg.css({
					height: eventHeight+'px',
					width: '1px',
				});
				transformElement(self.modalBodyBg, 'scaleY('+HeaderBgScaleY+') scaleX('+BodyBgScaleX+')');

				//change modal modalHeaderBg height/width and scale it
				self.modalHeaderBg.css({
					height: eventHeight+'px',
					width: eventWidth+'px',
				});
				transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
				
				self.modalHeaderBg.one(transitionEnd, function(){
					//wait for the  end of the modalHeaderBg transformation and show the modal content
					self.modalHeaderBg.off(transitionEnd);
					self.animating = false;
					self.element.addClass('animation-completed');
				});
			}

			//if browser do not support transitions -> no need to wait for the end of it
			if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
		};

		SchedulePlan.prototype.closeModal = function(event) {
			var self = this;
			var mq = self.mq();

			this.animating = true;

			if( mq == 'mobile' ) {
				this.element.removeClass('modal-is-open');
				this.modal.one(transitionEnd, function(){
					self.modal.off(transitionEnd);
					self.animating = false;
					self.element.removeClass('content-loaded');
					event.removeClass('selected-event');
				});
			} else {
				var eventTop = event.offset().top - $(window).scrollTop(),
					eventLeft = event.offset().left,
					eventHeight = event.innerHeight(),
					eventWidth = event.innerWidth();

				var modalTop = Number(self.modal.css('top').replace('px', '')),
					modalLeft = Number(self.modal.css('left').replace('px', ''));

				var modalTranslateX = eventLeft - modalLeft,
					modalTranslateY = eventTop - modalTop;

				self.element.removeClass('animation-completed modal-is-open');

				//change modal width/height and translate it
				this.modal.css({
					width: eventWidth+'px',
					height: eventHeight+'px'
				});
				transformElement(self.modal, 'translateX('+modalTranslateX+'px) translateY('+modalTranslateY+'px)');
				
				//scale down modalBodyBg element
				transformElement(self.modalBodyBg, 'scaleX(0) scaleY(1)');
				//scale down modalHeaderBg element
				transformElement(self.modalHeaderBg, 'scaleY(1)');

				this.modalHeaderBg.one(transitionEnd, function(){
					//wait for the  end of the modalHeaderBg transformation and reset modal style
					self.modalHeaderBg.off(transitionEnd);
					self.modal.addClass('no-transition');
					setTimeout(function(){
						self.modal.add(self.modalHeader).add(self.modalBody).add(self.modalHeaderBg).add(self.modalBodyBg).attr('style', '');
					}, 10);
					setTimeout(function(){
						self.modal.removeClass('no-transition');
					}, 20);

					self.animating = false;
					self.element.removeClass('content-loaded');
					event.removeClass('selected-event');
				});
			}

			//browser do not support transitions -> no need to wait for the end of it
			if( !transitionsSupported ) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
		}

		SchedulePlan.prototype.mq = function(){
			//get MQ value ('desktop' or 'mobile') 
			var self = this;
			return window.getComputedStyle(this.element.get(0), '::before').getPropertyValue('content').replace(/["']/g, '');
		};

		SchedulePlan.prototype.checkEventModal = function(device) {
			this.animating = true;
			var self = this;
			var mq = this.mq();

			if( mq == 'mobile' ) {
				//reset modal style on mobile
				self.modal.add(self.modalHeader).add(self.modalHeaderBg).add(self.modalBody).add(self.modalBodyBg).attr('style', '');
				self.modal.removeClass('no-transition');	
				self.animating = false;	
			} else if( mq == 'desktop' && self.element.hasClass('modal-is-open') ) {
				self.modal.addClass('no-transition');
				self.element.addClass('animation-completed');
				var event = self.eventsGroup.find('.selected-event');

				var eventTop = event.offset().top - $(window).scrollTop(),
					eventLeft = event.offset().left,
					eventHeight = event.innerHeight(),
					eventWidth = event.innerWidth();

				var windowWidth = $(window).width(),
					windowHeight = $(window).height();

				var modalWidth = ( windowWidth*.8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth*.8,
					modalHeight = ( windowHeight*.8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight*.8;

				var HeaderBgScaleY = modalHeight/eventHeight,
					BodyBgScaleX = (modalWidth - eventWidth);

				setTimeout(function(){
					self.modal.css({
						width: modalWidth+'px',
						height: modalHeight+'px',
						top: (windowHeight/2 - modalHeight/2)+'px',
						left: (windowWidth/2 - modalWidth/2)+'px',
					});
					transformElement(self.modal, 'translateY(0) translateX(0)');
					//change modal modalBodyBg height/width
					self.modalBodyBg.css({
						height: modalHeight+'px',
						width: '1px',
					});
					transformElement(self.modalBodyBg, 'scaleX('+BodyBgScaleX+')');
					//set modalHeader width
					self.modalHeader.css({
						width: eventWidth+'px',
					});
					//set modalBody left margin
					self.modalBody.css({
						marginLeft: eventWidth+'px',
					});
					//change modal modalHeaderBg height/width and scale it
					self.modalHeaderBg.css({
						height: eventHeight+'px',
						width: eventWidth+'px',
					});
					transformElement(self.modalHeaderBg, 'scaleY('+HeaderBgScaleY+')');
				}, 10);

				setTimeout(function(){
					self.modal.removeClass('no-transition');
					self.animating = false;	
				}, 20);
			}
		};

		var schedules = $('.cd-schedule');
		var objSchedulesPlan = [],
			windowResize = false;
		
		if( schedules.length > 0 ) {
			schedules.each(function(){
				//create SchedulePlan objects
				objSchedulesPlan.push(new SchedulePlan($(this)));
			});
		}

		$(window).on('resize', function(){
			if( !windowResize ) {
				windowResize = true;
				(!window.requestAnimationFrame) ? setTimeout(checkResize) : window.requestAnimationFrame(checkResize);
			}
		});

		$(window).keyup(function(event) {
			if (event.keyCode == 27) {
				objSchedulesPlan.forEach(function(element){
					element.closeModal(element.eventsGroup.find('.selected-event'));
				});
			}
		});

		function checkResize(){
			objSchedulesPlan.forEach(function(element){
				element.scheduleReset();
			});
			windowResize = false;
		}

		function getScheduleTimestamp(time) {
			//accepts hh:mm format - convert hh:mm to timestamp
			time = time.replace(/ /g,'');
			var timeArray = time.split(':');
			var timeStamp = parseInt(timeArray[0])*60 + parseInt(timeArray[1]);
			return timeStamp;
		}

		function transformElement(element, value) {
			element.css({
			    '-moz-transform': value,
			    '-webkit-transform': value,
				'-ms-transform': value,
				'-o-transform': value,
				'transform': value
			});
		}
	}

	// ----- END SCHEDULE PLAN ------