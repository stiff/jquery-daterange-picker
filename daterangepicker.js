function DaterangePicker(selector) {
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
		return new Date(s.substring(0, 4), s.substring(5, 7) - 1, s.substring(8, 10));
	}
	function logString(s) {
		$('.log').prepend(s + '<br />');
	}
	function logModelState(event, model) {
		logString(event +': '+ asString(model.get('start_date')) +' — '+ asString(model.get('end_date')) + ', sampling_state = '+ model.get('sampling').toString())
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
	  events: {
	    "mouseover .date"  	: "showSample",
	    "mouseout .date"  	: "hideSample",
			"click .date"				: "selectDate",
			"click .prev_month" : "prevMonth",
			"click .next_month" : "nextMonth"
	  },

		render: function() {
			this.$el.addClass('calendar').hide();
			var today = this.options.today,
					bm = beginningOfMonth(today),
					em = endOfMonth(today),
					d = beginningOfWeek(bm),
					e = endOfWeek(em);

			var nav_div = $('<div class="nav"><a href="#" class="prev_month">&lt;</a><a href="#" class="next_month">&gt;</a><span class="title"></span></div>')
			nav_div.find('.title').html(today.getDate() +', '+ today.getFullYear());
			this.$el.append(nav_div);

			var i = 0;
			while (d <= e && i < 50) {
				var a = $('<a href="#"></a>').html(d.getDate());
				a.addClass('date').data({value: asString(d)});
				if ((d < bm) || (d > em)) {
					a.addClass('inactive')
				}
				this.$el.append(a);

				d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
				i = i + 1;
			}
			this.$el.append('<div class="clr"></div>');

			var with_log = function(msg, fx) {
				var sub_a = _.rest(arguments, 2);
				logModelState(msg, sub_a[0]);
				fx.apply(this, sub_a);
			}

			this.model.on('change:start_date', _.wrap(this.highlightSample, _.bind(with_log, this, 'start_date changed')));
			this.model.on('change:end_date', _.wrap(this.highlightSample, _.bind(with_log, this, 'end_date changed')));
			this.model.on('change:sampling', function(model, smpl) {
				logModelState('sampling changed', model)
			})

			this.delegateEvents();
			return this;
		},

	  toggle: function() {
			//	    $(this.el).html(this.template(this.model.toJSON()));
			if (this.$el.is(':visible')) {
				this.$el.hide()
			} else {
				this.$el.show()
				
			}
	    return this;
	  },

		selectDate: function(e) {
			this.model.addDate(fromString($(e.target).data('value')))
		},

		showSample: function(e) {
			this.model.sampleDate(fromString($(e.target).data('value')))
		},

		hideSample: function(e) {
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
			
		},
		nextMonth: function() {
			
		}
	});

	var MainView = Backbone.View.extend({
		calendar_view: new CalendarView({
			model: model,
			today: new Date()
		}),

		render: function() {
			this.$el.addClass('daterangepicker').append(this.calendar_view.render().$el);
			$(selector).after(this.$el)
			return this;
		},

	  toggleCalendar: function() {
			this.calendar_view.toggle();
	    return this;
	  }
	});
	var main_view = new MainView().render();
	model.readInputs();
/*	model.set({
		start_date: beginningOfWeek(dateWithoutTime(new Date())),
		end_date: endOfWeek(dateWithoutTime(new Date()))
	})*/
	$(selector).on('click', _.bind(main_view.toggleCalendar, main_view))

	return {m : model};
}