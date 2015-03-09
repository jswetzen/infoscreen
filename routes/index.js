var config = require('../config');
var express = require('express');
var router = express.Router();
var cacheRequest = require('../private_modules/cache-request.js');
var dateFormat = require('dateformat');
require('date-utils');

var calendarId = 'saron.se_jciitm8g9msvr988n17svf3414%40group.calendar.google.com';
var timeMin = encodeURIComponent(Date.today().toISOString()),
    timeMax = encodeURIComponent(Date.today().addWeeks(1).removeMinutes(1).toISOString());

var calendarRequest='https://www.googleapis.com/calendar/v3/calendars/'+calendarId+'/events?orderBy=startTime&singleEvents=true&timeMax='+timeMax+'&timeMin='+timeMin+'&key='+config.google_api_key;


function getDayDescription(day) {
  today = Date.today();
  if (day.equals(today)) { return 'idag'; }
  if (day.equals(Date.tomorrow())) { return 'imorgon'; }
  if ((today.getDay() - day.getDay()) <= today.getDay() && today.isBefore(day)) { return 'i veckan'; }
  return 'nästa vecka';

}

function renderPage(calData, day) {
  day = (typeof day === 'undefined') ? 0 : day;

  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
    'Oct', 'Nov', 'Dec'],
  daynames = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag',
    'Lördag'],
  data = {},
  output = '',
  days = [],
  events = [];

  // Calculate display offsets
  var startMinutes = 6  * 60 + 30,
  endMinutes   = 22 * 60 + 0,
  totalMinutes = endMinutes - startMinutes;
  /*
   * To calculate the top value in percent for an object, calculate the
   * minutes between startMinutes and the event start time. So in percent
   * that is minutes/totalMinutes.
   * Height is similar: duration in minutes/totalMinutes.
   */

  // Create the coming seven days
  for (var daydiff=0; daydiff <7; daydiff++) {
    day = Date.today().addDays(daydiff);
    title = 'Händer ' + getDayDescription(day);
    day.add({hours: 6, minutes: 30});
    days.push({
      date: day,
      weekday: day.getDay(),
      title: title,
      name: daynames[day.getDay()],
      events: []
    });
  }

  // Go through the events
  for (var key in calData.items) {
    var start = new Date(calData.items[key].start.dateTime),
    end = new Date(calData.items[key].end.dateTime),
    event = {
      summary: calData.items[key].summary,
      start: start,
      end: end,
      starttime: start.toFormat('HH24:MI'),
      endtime: end.toFormat('HH24:MI'),
    };

    event.duration = start.getMinutesBetween(end)/totalMinutes;

    // Put the event in the corresponding day
    for (i=0; i< days.length; i++) {
      if (days[i].weekday == event.start.getDay()) {
        days[i].events.push(event);
      }
    }
    events.push(event);
  }

  // Calculate offsets for the events on each day
  for (i=0; i < days.length; i++) {
    days[i].events[0].startoffset =
      days[i].date.getMinutesBetween(days[i].events[0].start)/totalMinutes;
    for (j=1; j < days[i].events.length; j++) {
      var ev1_end = days[i].events[j-1].end;
      var ev2_start = days[i].events[j].start;
      var offset = ev1_end.getMinutesBetween(ev2_start)/totalMinutes;
      days[i].events[j].startoffset = offset;
    }
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

  data.day = days[0];
  data.totalMinutes = totalMinutes;
  return data;
}

/* GET home page. */
router.get('/', function(req, res, next) {
  cacheRequest.get(calendarRequest, 'cal_cache.cache', function(data) {
    res.render('dayview', renderPage(JSON.parse(data)));
  });
});


module.exports = router;
