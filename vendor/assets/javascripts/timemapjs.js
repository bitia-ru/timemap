function log(msg)
{
  $('#logger').append('<p>' + msg + '</p>');
}

function clearSelection()
{
  if (window.getSelection) {
    if (window.getSelection().empty) {  // Chrome
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {  // Firefox
      window.getSelection().removeAllRanges();
    }
  } else if (document.selection) {  // IE?
    document.selection.empty();
  }
}

function TimeMapView_onMouseDown(event) {
  self = event.data.self;

}

function TimeMapView(e, m)
{
  this.e = e;
  this.m = m;

  this.cellSize = 24;
  this.headersWidth = 34;
  this.cells = [];

  this.quant = 5;
  this.row_width = hm(1,0);
  this.start = hm(8,0);
  this.end = hm(24,0);
  this.sel = [];

  this.prefix = `${e.attr('id')}_`;

  this.e.mousedown({s: this}, function(event) { event.data.s.onMouseDown(); });
  this.e.mouseup({s: this}, function(event) { event.data.s.onMouseUp(); });

  log('started');
}

TimeMapView.prototype.elemUnderCursor = function()
{
  return $('#' + this.e.attr('curItem'));
}

TimeMapView.prototype.taskByElem = function(e)
{
  id = e.attr('tid');
  start = e.attr('tstart');
  duration = e.attr('tduration');

  return id === undefined ? TimeTaskNull(start, duration) : this.m.task(id, start);
}

TimeMapView.prototype.selTasks = function()
{
  res = [];

  for (var i = 0; i < this.sel.length; i++)
    res.push(this.taskByElem(this.sel[i]));

  if (res.length < 2)
    return res;

  if (res[0].start > res[res.length-1].start)
    res.reverse();

  return res;
}

TimeMapView.prototype.abolishSelection = function()
{
  for (var i = 0; i < this.sel.length; i++) {
    this.sel[i].removeAttr('sel');
  }

  this.sel = [];
}

TimeMapView.prototype.onMouseDown = function()
{
  this.abolishSelection();
  this.sel = [ this.elemUnderCursor() ];
}

TimeMapView.prototype.onMouseUp = function() {
  if (this.sel.length != 1) {
    console.log('onMouseUp: this.sel is bad');
    return;
  }

  var eStart = $(this.sel[0]);
  var eEnd = this.elemUnderCursor();
  var b = false;
  this.sel = [];

  if (eStart.attr('id') == eEnd.attr('id')) {
    this.sel = [ eStart ];
    eStart.attr('sel', 1);
    eStart.droppable();
    eStart.bind('drop', {s: this},
      function(ev, elem) {
        ev.data.s.mkTaskFromSelection(elem.draggable.attr('id'), elem.draggable.text());
      });
    return;
  }

  for (var i = 0; i < this.cells.length; i++) {
    var bend = false;

    if ( $(this.cells[i]).attr('tstart') == eStart.attr('tstart') ||
         $(this.cells[i]).attr('tstart') == eEnd.attr('tstart') ) {
      if (!b) b = true;
      else bend = true;
    }

    if (b) {
      this.sel.push($(this.cells[i]));
      $(this.cells[i]).attr('sel', 1);
      $(this.cells[i]).droppable();
      $(this.cells[i]).bind('drop', {s: this},
        function(ev, elem) {
          ev.data.s.mkTaskFromSelection(elem.draggable.attr('tid'), elem.draggable.text());
        });
    }

    if (bend)
      break;
  }

  clearSelection();
}

function html_span(text, id, cl) {
  var res = '<span';

  if (id != null) res += ` id=${id}`;
  if (cl != null) res += ` class=${cl}`;

  return res + `>${text}</span>`;
}

TimeMapView.prototype.invalidate = function()
{
  var tsel = this.selTasks();

  this.e.html('');

  var map = this.m.to_map(this.quant, this.row_width, this.start, this.end);

  this.e.append(html_span('&nbsp;', null, 'TimeMapHeader'));

  for (var i = 0; i < this.row_width/this.quant; i++)
    this.e.append(html_span(this.row_width <= hm(1,0) ? i*this.quant : hm_s(i*this.quant), null, 'TimeMapCol'));

  for (var j = 0; j < map.length; j++) {

    this.e.append(html_span(hm_h(this.start + j*this.row_width), null, 'TimeMapHeader'));

    for (var i = 0, row = map[j]; i < row.length; i++) {
      var t = row[i];
      var id = `${this.prefix}tmc_${j}_${i}`;

      this.e.append(html_span(t.title == null ? '&nbsp;' : t.title, id, 'TimeMapCell'));

      var nsquares = t.duration/this.quant;
      $(`#${id}`).width(nsquares * this.cellSize + (nsquares-1)*2);

      $(`#${id}`).mouseenter(function() {
        $(this).parent().attr('curItem', $(this).attr('id'));
      }).mouseleave(function() {
        $(this).parent().attr('curItem', '');
      });

      if (t.id != null) {
        $(`#${id}`).attr('tid', t.id);

        $(`#${id}`).dblclick({s: this, id: t.id, start: t.start},
          function(e) { e.data.s.delTaskByIdnStart(e.data.id, e.data.start); });
      }

      $(`#${id}`).attr('tstart', t.start);
      $(`#${id}`).attr('tduration', t.duration);
    }
  }

  this.e.width((this.row_width/this.quant) * (this.cellSize+2) + this.headersWidth+2);
  this.e.height((map.length + 1) * (this.cellSize));

  $('.TimeMapCell').height(this.cellSize);
  $('.TimeMapHeader').height(this.cellSize);
  $('.TimeMapHeader').width(this.headersWidth);
  $('.TimeMapCol').width(this.cellSize);
  $('.TimeMapCell').css('line-height', this.cellSize + 'px');
  $('.TimeMapHeader').css('line-height', this.cellSize + 'px');
  $('.TimeMapCol').css('line-height', this.cellSize + 'px');

  this.cells = $('.TimeMapCell').toArray();
}

TimeMapView.prototype.mkTaskFromSelection = function(id, text)
{
  if (this.sel.length < 1)
    return;

  var sel = this.selTasks();

  this.m.tlist.push(new TimeTask(id, text, sel[0].start, sel[sel.length-1].end() - sel[0].start));

  this.abolishSelection();
  this.invalidate();
}

TimeMapView.prototype.delTaskByIdnStart = function(id, start)
{
  this.m.del(id, start);
  this.abolishSelection();
  this.invalidate();
}

TimeMapView.prototype.delSelectedTask = function()
{
  if (this.sel.length != 1)
    return;

  var task = this.selTasks()[0].id;

  if (task == null)
      return;

  var start = this.selTasks()[0].start;

  this.m.del(id, start);

  this.abolishSelection();
  this.invalidate();
}

var tm;
var tv;

$(function () {
  tm = new TimeMap([]);
  tv = new TimeMapView($('.timemap'), tm);

  tv.invalidate();
});

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

function hm_h(rmins)
{
  var hours = Math.floor(rmins/60);

  return hours;
}

function hm_m(rmins)
{
  var mins = rmins%60;

  return mins;
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

TimeMap.prototype.index = function(id, start)
{
  for (var i = 0; i < this.tlist.length; i++)
    if (this.tlist[i].id == id && this.tlist[i].start == start)
      return i;

  return null;
}

TimeMap.prototype.task = function(id, start)
{
  var ind = this.index(id, start);

  return ind == null ? null : this.tlist[ind];
}

TimeMap.prototype.del = function(id, start)
{
  var ind = this.index(id, start);

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


