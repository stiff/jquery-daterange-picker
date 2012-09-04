# Daterange Picker

This is a minimalist-style jQuery/Backbone/Underscore plugin for visual date range selectors.

Heavily inspired by a Stephen Celis' Prototype extension [Timeframe](http://stephencelis.github.com/timeframe/).

## Installation

First set up required dependencies of jQuery, Backbone and Underscore:

```html
<script src="lib/underscore.js" type="text/javascript" charset="utf-8"></script>
<script src="lib/jquery.js" type="text/javascript" charset="utf-8"></script>
<script src="lib/backbone.js" type="text/javascript" charset="utf-8"></script>
```

Then grab the `daterangepicker.js` and `daterangepicker.css`, add them to your HTML:

```html
<script src="daterangepicker.js" type="text/javascript" charset="utf-8"></script>
<link rel="stylesheet" href="daterangepicker.css" type="text/css" media="screen">
```

Ready to serve.

## Usage

Basically, what you need is a hyperlink with two linked inputs `start_date` and `end_date`:

```html
  <input type="text" name="date_from" value="2012-11-07" id="date_from"> — 
  <input type="text" name="date_to" value="2012-11-10" id="date_to">
  <a href="#" class="date-picker-handle" data-start-date-input="#date_from" data-end-date-input="#date_to">show datepicker</a>
```

Of course inputs can be hidden, text is used here for debugging purposes. Values in inputs are taken as initial range selection. If it is empty today is used. After user selects a range this inputs will be updated with selected date range.

Now instantiate the `DaterangePicker`:

```javascript
  $(function() {
    new DaterangePicker('.date-picker-handle');
  })
```

It accepts only one argument — the selector of the trigger to bind itself to. Inputs selectors are taken from `data-`-attributes of the handle.

See complete `sample.html` for more details.

## Contributing

The best way to contribute is to implement your idea. Feel free to fork and make a pull request.

## Changelog

* 0.0.1 — Initial usable version 

## TODO

* Document options and classes
* Cleanup libs.
* Add open ranges (infinite dates) support.
* Cleanup the 

---

2012 © Vladimir Meremyanin
