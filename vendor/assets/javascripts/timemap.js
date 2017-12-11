var tm;
var tv;

window.onload = function()
{
  tm = new TimeMap([]);
  tv = new TimeMapView($('.timemap'), tm);

  tv.invalidate();
}

function hm(hours, mins)
{
  return hours*60 + mins;
}

function hm_s(rmins)
{
  var hours = Math.floor(rmins/60);
  var mins = rmins%60;

  return hours + ':' + mins;
}

function tround(mins, r)
{
  return mins - mins%r;
}


function TimeTask(id, title, start, duration)
{
  this.id = id;
  this.title = title;
  this.start = parseInt(start);
  this.duration = parseInt(duration);
}

function TimeTaskDup(tm)
{
  return new TimeTask(tm.id, tm.title, tm.start, tm.duration);
}

function TimeTaskNull(start, duration)
{
  return new TimeTask(null, null, start, duration);
}

TimeTask.prototype.end = function()
{
  return this.start+this.duration;
}


function TimeMap(tlist)
{
  this.tlist = tlist;
}

TimeMap.prototype.index = function(id)
{
  for (var i = 0; i < this.tlist.length; i++)
    if (this.tlist[i].id == id)
      return i;

  return null;
}

TimeMap.prototype.task = function(id)
{
  var ind = this.index(id);

  return ind == null ? null : this.tlist[ind];
}

TimeMap.prototype.del = function(id)
{
  var ind = this.index(id);

  if (ind == null)
    return;

  this.tlist.splice(ind, 1);
}

TimeMap.prototype.to_map = function(quant, row_width, start, end)
{
  periods = [];

  this.tlist.at = function(t, r)
  {
    for (var i = 0; i < this.length; i++) {
      if (tround(this[i].start, r) == tround(t, r)) {
        return TimeTaskDup(this[i]);
      }
    }
    
    return false;
  }

  for (var t = start; t < end; ) {
    var at = this.tlist.at(t, quant);
    if (at) {
      periods.push(at);
      t += at.duration;
    } else {
      periods.push(new TimeTaskNull(t, quant));
      t += quant;
    }
  }

  var i = 0;

  for (var wnd = { start: start, end: start + row_width}; wnd.end < end; wnd.start+=row_width, wnd.end+=row_width) {
    for (; periods[i].start < wnd.end; i++) {
      if (periods[i].end() > wnd.end) {
        var rest_duration = periods[i].end() - wnd.end;
        periods[i].duration -= rest_duration;
        ctm = TimeTaskDup(periods[i]);
        ctm.start = wnd.end
        ctm.duration = rest_duration
        periods.splice(i+1, 0, ctm);
      }
    }
  }

  i = 0;
  map = [];

  for (var wnd = { start: start, end: start + row_width}; wnd.end < end; wnd.start+=row_width, wnd.end+=row_width) {
    var row = [];

    for (; periods[i].start < wnd.end; i++)
      row.push(periods[i]);

    map.push(row);
  }

  return map;
}

//module.exports.TimeMap = TimeMap;
//module.exports.hm = hm;

