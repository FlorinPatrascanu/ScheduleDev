var scheduleConfig = {
  timeframe: [8,20],
  gridHeightCell: 40,
  gridWidthCell: 300,
}

function createTimeGridArray(){
  var timeframeArray = []
  for (var i = scheduleConfig.timeframe[0]; i < scheduleConfig.timeframe[1]; i++) {
    timeframeArray.push(i);
  }
  var timeTable = _.reduce(timeframeArray, function(result, val, key){
    var intervals = ["00","15","30","45"];
    var hour = val < 10 ? "0"+ val : val;
    var obj = {};
    obj.hour = hour;
    obj.intervals = [];
    _.map(intervals, function(inter){
      (obj.intervals).push(inter);
    });
    result.push(obj);
    return result;
  },[]);

  return timeTable;
}


function createFlatTimeGridArray(){
  var timeframeArray = []
  for (var i = scheduleConfig.timeframe[0]; i < scheduleConfig.timeframe[1]; i++) {
    timeframeArray.push(i);
  }
  var timeTable = _.reduce(timeframeArray, function(result, val, key){
    var intervals = ["00","15","30","45"];
    var hour = val < 10 ? "0"+ val : val;
    var array = [];
    _.map(intervals, function(inter){
      array.push(hour+':'+inter);
    });
    result = _.concat(result, array);
    return result;
  },[]);

  return timeTable;
}
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
  var colors = ["#ff3636" , "#f322a2" , "#a72fdc" , "#7031f3" , "#4679ff" , "#05caf3" , "#20ec9f" , "#42ec20" , "#f3e910" , "#a90000" , "#a90067" , "#8500a9" , "#5e00a9", "#2000a9" , "#0065a9" , "#00a988", "#00a91b" , "#6aa900", "#a95c00"];

  var conference = _.filter(data , function(obj){
    return obj.name === "Conference Path";
  });
  var conferencePathExists = _.size(conference) > 0 ? true : false;
  var conferencePathId = "";
  if (conferencePathExists == true) {
    conferencePathId = conference[0].id;
  } else {
    conferencePathId = "CONFERENCEPATHDOESNOTEXIST";
  }
  var conferencePathArrayRaw = _.filter(data, function(obj){
    return obj.parentid === conferencePathId;
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
function resetWhenDataIsInvalid() {
  console.error("Error loading API");
  $('#event-select-wrapper').show();
  loading(false);
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
    console.log("error API:", link);
    deferred.reject();
  });
  return deferred.promise();
}
function getData(event){
  var deferred = $.Deferred();
  var eventId = event.value;
  var eventApi = event.apiKey;
  var eventTimeAdjust = parseFloat(event.timeAdjust);
  var daysUrl = 'http://api.eventpoint.com/2.3/program/days?code='+eventId+'&apikey=' + eventApi;
  var topicsUrl = 'http://api.eventpoint.com/2.3/program/topics?code='+eventId+'&apikey=' + eventApi;
  var categoriesUrl = 'https://api.eventpoint.com/2.3/program/categories?code='+eventId+'&apikey=' + eventApi;
  loading(true);
  $.when(GetAPIData(daysUrl),GetAPIData(topicsUrl),GetAPIData(categoriesUrl)).then(function(v1,v2,v3){
    var conferencePathArray = conferenceArray(v3);
    var scheduleData = _.reduce(v1, function(result, value, key){
      var date = value.date;
      // date = date.split('T')[0];
      date = moment(date).format("YYYY-MM-DD");

      var obj = {};
      obj.date = date;
      obj.topics = _.chain(v2.results)
      .filter(function(o){
        var dateAdjusted = "";
        dateAdjusted = moment(o.start).utcOffset(eventTimeAdjust).format("YYYY-MM-DD");
        return dateAdjusted == date;
      })
      .reduce(function(result, value, key){
        var obj = {};
        obj.title = value.title;
        obj.id = value.id;
        obj.description = value.description;
        obj.publishingStatus = value.publishingstatus;
        obj.room = value.room;
        obj.categoryids = value.categoryids;
        obj.start = moment(value.start).utcOffset(eventTimeAdjust).format("HH:mm");
        obj.finish = moment(value.finish).utcOffset(eventTimeAdjust).format("HH:mm");
                      // console.log("timeadjust", Math.abs(eventTimeAdjust), "times:",obj.start, "timesoriginal", value.start);

                      obj.conferencePath = _.filter(conferencePathArray, function(object){
                        return _.includes(value.categoryids, object.id)
                      });

                      result.push(obj);
                      return result;

                    },[])
      .sortBy("start")
      .value();
      result.push(obj);
      return result;
    },[]);

    $("#schedule").empty().removeClass("animated fadeOut"); // CLEARS SCHEDULE TABLE
    deferred.resolve(scheduleData);
  },function() {
    //error getting API => select again
    resetWhenDataIsInvalid();
    deferred.reject();

  });
  return deferred.promise();
}
function buildEventSelect(eventData){
  var output = '<select id="header-event-select" class="form-control">';
  output += '<option value="" disabled selected>Pick an event</option>';
  _.map(eventData, function(o){

      output += '<option value="'+o.id+'">'+o.name+'</option>';

  });
  output += '</select>';
  return output;
}
function buildEventSelectPrimary(eventData){
  var output = "";
  output += '<div id="event-select-wrapper">';
  output += '<select id="event-select" class="form-control">';
  output += '<option value="" disabled selected>Pick an event</option>';
  _.map(eventData, function(o){
    output += '<option value="'+o.id+'">'+o.name+'</option>';
  });
  output += '</select>';
  output += '</div>';
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
  return output;}

  function buildConferencePathSelect(data){
    var conferencePathArray = _.chain(data)
    .reduce(function(result, value, key){
      var topicConferenceArray = _.reduce(value.topics, function(result2, value2, key2){
                                // console.log(value2.conferencePath);
                                result2 = _.concat(result2, value2.conferencePath);
                                return result2;
                              },[]);
                              // console.log("topicConferenceArray",topicConferenceArray);
                              result = _.concat(result, topicConferenceArray);
                              return result;
                            },[])
    .uniqBy("id")
    .sortBy(function(o){return o.name})
    .value();
    var output = '<select id="header-conference-select" class="form-control">';
    output += '<option value="" seleted>Pick a conference path</option>';
    _.map(conferencePathArray, function(o){
      output += '<option value="'+o.id+'">'+o.name+'</option>';
    });
    output += '</select>';
    return output;
  }
  function renderHeader(data, event) {
    var output = '<div id="schedule-header" class="form-inline animated fadeIn">';
    output += '<i class="fa fa-calendar" aria-hidden="true"></i>';
    output += buildEventSelect(eventData);
    output += buildDaySelect(data);
    output += buildConferencePathSelect(data);
    output += '</div>';
    $("#schedule").prepend(output);
  // console.log("event",event);
  $("#header-event-select").val(event.id);
}
function renderRooms(data){
  var rooms = _.chain(data.topics)
              .reduce(function(result, value, key){
                result.push(value.room);
                return result;
              },[])
              .uniq()
              .value();
  var output = "";
  output += '<div id="header-rooms" class="animated fadeIn">';
  _.map(rooms, function(val){
    output += '<div class="item">'+val+'</div>'
  });
  output += '</div>';


  $('#schedule').prepend(output);
}
function renderGrid(timeframe){
  var output = '<div id="grid" class="animated fadeIn">';
  var timeTable = createTimeGridArray();
  // console.log(timeframeArray);
  _.map(timeTable, function(o){
    output += '<div class="hours">';
    _.map(o.intervals, function(interval){
      output += '<div class="intervals"><span>'+o.hour+':'+interval+'</span><span>'+o.hour+':'+interval+'</span></div>'
    });
    output += '</div>';
  });
  output += '</div>';
  // console.log(output);

  $("#schedule").append(output);

  $('#schedule .intervals').css("height",scheduleConfig.gridHeightCell+"px").css("lineHeight", scheduleConfig.gridHeightCell + 'px');
}

function renderCard(o, topics){
  var timeTable = createFlatTimeGridArray();
  var rooms = _.chain(topics)
              .reduce(function(result, value, key){
                result.push(value.room);
                return result;
              },[])
              .uniq()
              .value();
  var offsetLeft = _.indexOf(rooms, o.room)*scheduleConfig.gridWidthCell;
  var offsetTop = _.indexOf(timeTable, o.start)*scheduleConfig.gridHeightCell;
  var height = (_.indexOf(timeTable, o.finish) - _.indexOf(timeTable, o.start))*scheduleConfig.gridHeightCell;
  output = "";
  output += '<div class="item" style="width:'+scheduleConfig.gridWidthCell+'px; height:'+height+'px; top:'+offsetTop+'px; left:'+offsetLeft+'px;">';
  output += '<div class="content">';
  output += '<div class="conference-wrapper">';
  _.map(o.conferencePath, function(o){
    output += '<div class="conference" data-color="'+o.color+'" data-conference-id="'+o.id+'" style="background-color:'+o.color+';"></div>'
  });
  output += '</div>';
  output += '<h2>'+o.title+'</h2>';
  // output += '<p>'+o.start+'</p>';
  output += '</div>';
  output += '</div>';
  return output;
}
function renderTable(data) {
  // console.log(data.topics);
  $("#event").remove();
  renderRooms(data);
  output = "";
  output += '<div id="event">';
  _.map(data.topics, function(o){
    output += renderCard(o, data.topics); //need to send data.topics so that I can offsetLeft by room
  });
  output += '</div>';
  $('#schedule').append(output);
}
function Schedule(data, event){
  renderHeader(data, event);
  renderGrid(scheduleConfig.timeframe);
  renderTable(data[0]);
  $('body').on("change", "#header-day-select", function(){
   var value = $(this).val();
   var dataFilteredByDate = _.filter(data, function(o){
     return o.date == value;
   });
   renderTable(dataFilteredByDate[0]);
  });


    //Run
    // console.log("schedule",data);
    loading(false);

  }



  $(function(){
  //init first select
  $("#schedule").before(buildEventSelectPrimary(eventData));
  //on first select change
  $('body').on("change", "#event-select", function(){
    var value = $(this).val();
    $('#event-select-wrapper').hide();
    var eventSelectedArray = _.filter(eventData, function(o){
      return o.id == value;
    });
    var event = eventSelectedArray[0];
    $.when(getData(event)).then(function(data){
      Schedule(data, event); //event = need to send event information also for select to have the proper event value already selected;
    });

  });
  //application event change
  $('body').on("change", "#header-event-select", function(){
    var value = $(this).val();
    $('#schedule').addClass("animated fadeOut");
    var eventSelectedArray = _.filter(eventData, function(o){
      return o.id == value;
    });
    var event = eventSelectedArray[0];
    $.when(getData(event)).then(function(data){
      Schedule(data, event); //event = need to send event information also for select to have the proper event value already selected;
    });

  });

  //conference path filtering
  $('body').on("change","#header-conference-select", function(){
    $("#event .item").removeClass("filterIn").removeClass("filterOut");
    $("#event .item .content").css("backgroundColor","#292929");
    var value = $(this).val();
    console.log(value);
    if(value !== "") {
      $("#event .item").each(function(){
        var id = $(this).find('.conference').attr("data-conference-id");
        console.log(id == value);
        if (id == value) {
          $(this).addClass("filterIn")
          $(this).find(".content").css("backgroundColor", $(this).find('.conference').attr("data-color"));
          return;
        } else {
          $(this).addClass("filterOut");
        }
      });
    }

  });






});
