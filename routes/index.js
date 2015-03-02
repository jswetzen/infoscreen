var config = require('../config');
var express = require('express');
var router = express.Router();
var https = require('https');
var dateFormat = require('dateformat');
require('date-utils');

/* GET home page. */
router.get('/', function(req, res, next) {
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec'];
  var daynames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag',
    'Lördag'];
  var data = {title: "Express"};
  var timeMin = encodeURIComponent(Date.today().toISOString()),
      timeMax = encodeURIComponent(Date.today().addWeeks(1).removeMinutes(1).toISOString());

  var calendarRequest='https://www.googleapis.com/calendar/v3/calendars/saron.se_jciitm8g9msvr988n17svf3414%40group.calendar.google.com/events?orderBy=startTime&singleEvents=true&timeMax='+timeMax+'&timeMin='+timeMin+'&key='+config.google_api_key;

  https.get(calendarRequest, function(response) {
    var body = '';
    response.on('data', function(data) {
      body += data;
    });
    response.on('end', function() {
      var calData = JSON.parse(body),
          output = '',
          days = [],
          events = [];

      // Create the coming seven days
      for (var daydiff=0; daydiff <7; daydiff++) {
        day = new Date().addDays(daydiff);
        days.push({
          date: day,
          weekday: day.getDay(),
          name: daynames[day.getDay()],
          events: []
        });
      }

      // Go through the events
      for (var key in calData.items) {
        var event = {
          summary: calData.items[key].summary,
          start: new Date(calData.items[key].start.dateTime),
          end: new Date(calData.items[key].end.dateTime)
        };

        // Put the event in the corresponding day
        for (i=0; i< days.length; i++) {
          if (days[i].weekday == event.start.getDay()) {
            days[i].events.push(event);
          }
        }
        events.push(event);
      }

      // Output days
      for (j=0; j<days.length; j++) {
        output += '<strong>' + days[j].name + '</strong><br>';
        for (var k in days[j].events) {
          //output += JSON.stringify(days[j].events[k]) + '<br>';
          output += days[j].events[k].summary + '<br>';
        }
        output += '<p>';
      }
      res.send(output);
    });
  }).on('error', function(e) {
      console.log("Got error: " + e.message);
  });

  //res.render('index', data);
});

module.exports = router;
