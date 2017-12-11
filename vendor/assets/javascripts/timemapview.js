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

  return id == '' ? TimeTaskNull(start, duration) : this.m.task(id);
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
    }

    if (bend)
      break;
  }

  clearSelection();
}

TimeMapView.prototype.invalidate = function()
{
  var tsel = this.selTasks();

  this.e.html('');

  map = this.m.to_map(this.quant, this.row_width, this.start, this.end);

  this.e.append('<span class=TimeMapHeader>&nbsp;</span>');

  for (var i = 0; i < this.row_width/this.quant; i++) {
    var id = 'tmch_' + i;

    var s = '<span class=TimeMapCol id=' + id + '>' + (this.row_width <= hm(1,0) ? i*this.quant : hm_s(i*this.quant)) + '</span>';

    this.e.append(s);
  }

  for (var j = 0; j < map.length; j++) {
    var row = map[j];
    var id = 'tmh_' + j;

    var s = '<span class=TimeMapHeader id=' + id + '>' + hm_s(this.start + j*this.row_width) + '</span>';

    this.e.append(s);

    for (var i = 0; i < row.length; i++) {
      var t = row[i];
      var id = 'tmc_' + j + '_' + i;

      var s = '<span class=TimeMapCell id=' + id + '>' + (t.title == null ? '-' : t.title) + '</span>';

      this.e.append(s);

      $('#' + id).width(t.duration/5 * this.cellSize);
      $('#' + id).mouseenter(function() {
        $(this).parent().attr('curItem', $(this).attr('id'));
      }).mouseleave(function() {
        $(this).parent().attr('curItem', '');
      });

      $('#' + id).attr('tid', t.id == null ? '' : t.id);
      $('#' + id).attr('tstart', t.start);
      $('#' + id).attr('tduration', t.duration);
      $('#' + id).css('user-select', 'none');
    }
  }

  this.e.width((hm(1,0)/5) * (this.cellSize) + this.headersWidth);
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

TimeMapView.prototype.delSelectedTask = function()
{
  if (this.sel.length != 1)
    return;

  var task = this.selTasks()[0].id;

  if (task == null)
      return;

  this.m.del(id);

  this.abolishSelection();
  this.invalidate();
}

