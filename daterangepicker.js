function DaterangePicker(selector) {
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

	/** helpers */
	function dateWithoutTime(d) {
		return new Date(d.getFullYear(), d.getMonth(), d.getDate())
	}
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
		return d ? d.getFullYear().toString() +'-'+ pad2(d.getMonth() + 1) +'-'+ pad2(d.getDate()) : 'nil';
	}
	function fromString(s) {
		if (/^\d\d\d\d-\d\d-\d\d$/.test(s)) {
			return new Date(s.substring(0, 4), s.substring(5, 7) - 1, s.substring(8, 10));
		} else {
			return null;
		}
	}
	/** end of helpers */

	var model = new (Backbone.Model.extend({
		defaults: {
			sampling: false
		},

		updateInputs: function() {
			$(this.get('start_date_input')).val(asString(this.startDate()))
			$(this.get('end_date_input')).val(asString(this.endDate()))
		},
		readInputs: function() {
			this.set({
				start_date: fromString($(this.get('start_date_input')).val()),
				end_date: fromString($(this.get('end_date_input')).val())
			})
		},

		startDate: function() {
			return this.get('start_date');
		},
		endDate: function() {
			return this.get('end_date');
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
		},

		sampling: function() {
			return this.get('sampling');
		}
	}))({
		start_date_input: $(selector).data('start_date_input'),
		end_date_input: $(selector).data('end_date_input')
	});

	var CalendarView = Backbone.View.extend({
		className: 'calendar',
	  events: {
	    "mouseover .date"  	: "showSample",
	    "mouseout .date"  	: "hideSample",
			"click .date"				: "selectDate",
			"click .prev_month" : "prevMonth",
			"click .next_month" : "nextMonth"
	  },

		render: function() {
			this.$el.html('');
			var today = this.options.today,
					bm = beginningOfMonth(today),
					em = endOfMonth(today),
					d = beginningOfWeek(bm),
					e = endOfWeek(em);

			var nav_div = $('<div class="nav"><a href="#" class="prev_month">&lt;</a><a href="#" class="next_month">&gt;</a><span class="title"></span></div>')
			nav_div.find('.title').html(month_names[today.getMonth()] +', '+ today.getFullYear());
			this.$el.append(nav_div);

			var i = 0;
			while (d <= e && i < 50) {
				var a = $('<a href="#"></a>').html($('<span></span>').html(d.getDate()));
				a.addClass('date').data({value: asString(d)});
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
			this.model.addDate(fromString($(e.target).parent().data('value')))
		},

		showSample: function(e) {
			this.model.sampleDate(fromString($(e.target).parent().data('value')))
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
					var d = fromString($(this).data('value'))
					if (d >= sd && d <= ed) {
						$(this).addClass('hilite');
						if (/* d == sd XXX weird: doesn't work */ d >= sd && !(d > sd)) { $(this).addClass('startrange') }
						if (/* d == ed */ d <= ed && !(d < ed)) { $(this).addClass('endrange') }
					}
				})
			}
		},

		prevMonth: function() {
			var d = this.options.today;
			this.options.today = new Date(d.getFullYear(), d.getMonth() - 1, 1);
			this.render();
		},
		nextMonth: function() {
			var d = this.options.today;
			this.options.today = new Date(d.getFullYear(), d.getMonth() + 1, 1);
			this.render();
		}
	});

	var MainView = Backbone.View.extend({
		render: function() {
			this.calendar_view = new CalendarView({
				model: model,
				today: model.startDate() || model.endDate() || new Date()
			});

			this.$el.addClass('daterangepicker').append(this.calendar_view.render().$el).hide();
			$(selector).after(this.$el)
			return this;
		},

	  toggleCalendar: function() {
			this.$el.toggle();
	    return this;
	  }
	});
	model.readInputs();
	var main_view = new MainView().render();
	$(selector).on('click', _.bind(main_view.toggleCalendar, main_view))

	return {m : model};
}