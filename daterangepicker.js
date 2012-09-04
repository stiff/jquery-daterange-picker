(function() {

  DaterangePicker = function(selector) {
    var r = null;

    $(selector).each(function() {
      var model = new DaterangeModel({
        start_date_input: $(this).data('start-date-input'),
        end_date_input: $(this).data('end-date-input')
      });
      model.readInputs();

      var main_view = new MainView({
        model: model
      }).render();
      $(this).after(main_view.$el.css({
        left: $(this).offset().left - 75 + 'px',
        top: 25 + $(this).offset().top + 'px'
      }))

      $(this).on('click', _.bind(main_view.toggleCalendar, main_view));

      r = r || { model: model, view: main_view};
    })

    return r;
  }
  DaterangePicker.version = '0.0.3'

  var month_names = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь'
  ];

  var DaterangeModel = Backbone.Model.extend({
    defaults: {
      sampling: false
    },

    updateInputs: function() {
      $(this.get('start_date_input')).val(asString(this.startDate()))
      $(this.get('end_date_input')).val(asString(this.endDate()))
      this.trigger('after_select', this);
    },
    readInputs: function() {
      this.set({
        start_date: fromString($(this.get('start_date_input')).val()) || -Infinity,
        end_date: fromString($(this.get('end_date_input')).val()) || Infinity
      })
    },

    startDate: function() {
      return this.get('start_date');
    },
    endDate: function() {
      return this.get('end_date');
    },
    sampling: function() {
      return this.get('sampling');
    },

    addDate: function(date) {
      if (this.sampling()) {
        this.set({
          start_date: _.min([this.startDate(), date]),
          end_date: _.max(_.compact([this.startDate(), this.endDate(), date])),
          sampling: false
        })
        this.updateInputs()
      } else {
        this.set({
          persisted_start_date: date,
          persisted_end_date: null,
          start_date: date,
          end_date: null,
          sampling: true
        })        
      }
    },

    sampleDate: function(date) {
      if (this.sampling()) {
        this.set({
          start_date: _([this.startDate(), date]).min(),
          end_date: _([this.startDate(), date]).max()
        })
      }
    },
    unsample: function() {
      if (this.sampling()) {
        this.set({
          start_date: this.get('persisted_start_date'),
          end_date: this.get('persisted_end_date')
        })
      }
    }
  });

  var CalendarView = Backbone.View.extend({
    className: 'calendar',
    events: {
      "mouseover .date"   : "showSample",
      "mouseout .date"    : "hideSample",
      "click .date"       : "selectDate",
      "click .prev_month" : "prevMonth",
      "click .next_month" : "nextMonth"
    },

    render: function() {
      this.$el.html('');
      var today = new Date(this.options.today),
          bm = beginningOfMonth(today),
          em = endOfMonth(today),
          d = beginningOfWeek(bm),
          e = endOfWeek(em);

      var nav_div = $('<div class="nav"><a href="#" class="prev_month">&lt;</a><a href="#" class="next_month">&gt;</a><span class="title"></span></div>')
      nav_div.find('.title').html(month_names[today.getMonth()] +', '+ today.getFullYear());
      this.$el.append(nav_div);
  
      var infinity_div = $('<div class="infinities"><a href="#" class="minusinfin date" data-value="-Infinity"><span>-&infin;</span></a><a href="#" class="plusinfin date" data-value="Infinity"><span>+&infin;</span></a></div>');
      this.$el.append(infinity_div).append('<div class="clr"></div>')

      var i = 0;
      while (d <= e && i < 50) {
        var a = $('<a href="#"></a>').html($('<span></span>').html(d.getDate()));
        a.addClass('date').data({value: d.getTime()});
        if ((d < bm) || (d > em)) {
          a.addClass('inactive')
        }
        this.$el.append(a);

        d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
        i = i + 1;
      }
      this.$el.append('<div class="clr"></div>');

      /* there's no need to do this every render */
      this.model.off(null, null, this);
      this.model.on('change:start_date', this.highlightSample, this);
      this.model.on('change:end_date', this.highlightSample, this);

      this.highlightSample();
      this.delegateEvents();
      return this;
    },

    selectDate: function(e) {
      this.model.addDate(Number($(e.target).parent().data('value')))
    },

    showSample: function(e) {
      this.model.sampleDate(Number($(e.target).parent().data('value')))
    },

    hideSample: function() {
      this.model.unsample();
    },

    highlightSample: function() {
      var m = this.model,
          sd = m.startDate(),
          ed = m.endDate() || sd;
      if (sd) {
        this.$el.find('.date').removeClass('hilite startrange endrange');
        this.$el.find('.date').each(function() {
          var d = Number($(this).data('value'));
          if (d >= sd && d <= ed) {
            $(this).addClass('hilite');
            if (d == sd) { $(this).addClass('startrange') }
            if (d == ed) { $(this).addClass('endrange') }
          }
        })
      }
    },

    prevMonth: function() {
      var d = new Date(this.options.today);
      this.options.today = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
      this.render();
    },
    nextMonth: function() {
      var d = new Date(this.options.today);
      this.options.today = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
      this.render();
    }
  });

  var MainView = Backbone.View.extend({
    className: 'daterangepicker',
    events: {
      "mouseout"  : 'checkForClose',
      "mouseover" : 'doNotClose'
    },

    render: function() {
      var today = this.model.startDate() > -Infinity ? this.model.startDate() : (this.model.endDate() < Infinity ? this.model.endDate() : new Date().getTime());
      this.calendar_view = new CalendarView({
        model: this.model,
        today: today
      });

      this.$el.append(this.calendar_view.render().$el).hide();

      this.model.off(null, null, this)
      this.model.on('after_select', function() {
        this.rangeSelected = true;
      }, this)

      return this;
    },

    hide: function() {
      this.$el.hide();
      return this;
    },
    show: function() {
      $('.daterangepicker').css({zIndex: this.$el.css('zIndex') - 1})
      this.$el.css({zIndex: this.$el.css('zIndex') + 1}).show();
      this.rangeSelected = false;
      return this;
    },

    toggleCalendar: function() {
      if (this.$el.is(':visible')) {
        this.hide()
      } else {
        this.show();
      }
      return this;
    },

    checkForClose: function() {
      if (this.rangeSelected) {
        this.closeTimeout = _.delay(_.bind(this.hide, this), 350)
      }
    },
    doNotClose: function() {
      if (this.closeTimeout) {
        window.clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
      }
    }
  });

  /** helpers */
  function beginningOfWeek(d) {
    d = new Date(d);
    var day = d.getDay();
    d.setDate(d.getDate() - day + (day == 0 ? -6:1));
    return d;
  }
  function endOfWeek(d) {
    d = new Date(d);
    var day = d.getDay();
    d.setDate(d.getDate() + 6 - day + (day == 0 ? -6:1));
    return d;
  }
  function beginningOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }
  function endOfMonth(d) {
    return new Date(d.getFullYear(), d.getMonth() + 1, 0);
  }
  function pad2(x) {
    return x > 9 ? x.toString() : ('0' + x);
  }
  function asString(d) {
    var dd = new Date(d);
    return (d && d > -Infinity && d <Infinity) ? dd.getFullYear().toString() +'-'+ pad2(dd.getMonth() + 1) +'-'+ pad2(dd.getDate()) : '';
  }
  function fromString(s) {
    if (/^\d\d\d\d-\d\d-\d\d$/.test(s)) {
      return new Date(s.substring(0, 4), s.substring(5, 7) - 1, s.substring(8, 10));
    } else {
      return null;
    }
  }
  /** end of helpers */
})();
