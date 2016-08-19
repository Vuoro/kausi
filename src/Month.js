import React, { Component } from "react";
import moment from "moment";
import reactMixin from "react-mixin";
import ReactFire from "reactfire";
import classNames from "classnames";
import { random } from 'lodash/number';

import Button from "./Button";

class Month extends Component {
  constructor(props) {
    super(props);

    this.state = {
      todos: [],
    };

    this.renderDays = this.renderDays.bind(this);
    this.goToDay = this.goToDay.bind(this);
    this.bindFirebase = this.bindFirebase.bind(this);
  }

  componentWillMount() {
    this.bindFirebase(this.props.firebaseRef, this.props.targetDay, this.props.weekRange);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.targetDay !== this.props.targetDay
      || nextProps.firebaseRef !== this.props.firebaseRef
      || nextProps.startAt !== this.props.weekRange
    ) {
      this.unbind("todos");
      this.bindFirebase(nextProps.firebaseRef, nextProps.targetDay, nextProps.weekRange);
    }
  }

  bindFirebase(firebaseRef, targetDay, weekRange) {
    // console.log("Start at " + moment(targetDay).subtract(weekRange, "weeks").format("ddd DD MM HH:mm"));
    // console.log("Target is " + moment(targetDay).format("ddd DD MM HH:mm"));
    // console.log("Stop at " + moment(targetDay).add(weekRange+1, "weeks").format("ddd DD MM HH:mm"));

    this.bindAsArray(
      firebaseRef
        .orderByChild("date")
        .startAt(moment(targetDay).subtract(weekRange, "weeks").valueOf())
        .endAt(moment(targetDay).add(weekRange+1, "weeks").valueOf()),
      "todos",
      function(error) {
        console.log("Firebase subscription cancelled:")
        console.log(error);
        this.setState({todos: []})
      }.bind(this)
    );
  }

  renderDays(week) {
    return week.map(function(day) {
      let text = "";

      this.state.todos.forEach(function(todo) {
        if (todo.date === day.valueOf()) {
          text = todo.text;
        }
      });

      let month, year, textMarker;

      if (text) {
        let lines = [];
        for (let i = 0; i < (text.length/30); i++) {
          lines.push(i);
        }

        textMarker = (
          <div className="child-margins-y-0-25 margin-0-25 margin-top">
            {lines.map(function(i) {
              return <div key={i} style={{width: `${random(62, 100)}%`}} className="border-top"/>;
            })}
          </div>
        );
      }

      if (moment(day).startOf("month").isSame(day)) {
        month = day.format("MMM");
        year = day.format("YYYY");
      }

      return (
        <button
          key={day.valueOf()}
          className={classNames({
            "faint-bottom-border button size-0-75 flex vertical text-align-left padding-0-25 all-caps overflow-hidden": true,
            "color-bright-6": day.isSame(this.props.today),
          })}
          onClick={this.goToDay}
          data-day={day.valueOf()}
        >
          <div className="no-events">
            {day.format("DD")} {month} {year}
            {textMarker}
          </div>
        </button>
      );
    }.bind(this));
  }

  goToDay(event) {
    if (event.target.dataset.day) {
      this.props.goToDay(moment(+event.target.dataset.day));
    }
  }

  render() {
    const firstOfFocusedWeek = moment(this.props.targetDay).startOf("isoweek");

    let pastWeeks = [];
    for (let i = 1; i < this.props.weekRange+1; i++) {
      pastWeeks.unshift(
        {
          firstDay: moment(firstOfFocusedWeek).subtract(i, "weeks"),
          days: [],
        }
      );
    }

    let focusedWeek = [
      {
        firstDay: firstOfFocusedWeek,
        days: [],
      }
    ];

    let futureWeeks = [];
    for (let i = 1; i < this.props.weekRange+1; i++) {
      futureWeeks.push(
        {
          firstDay: moment(firstOfFocusedWeek).add(i, "weeks"),
          days: [],
        }
      );
    }

    let allWeeks = [];
    allWeeks = allWeeks.concat(pastWeeks, focusedWeek, futureWeeks);

    allWeeks.forEach(function(week){
      for (let i = 0; i < 7; i++) {
        week.days.push(moment(week.firstDay).add(i, "days"));
      }
    });

    const weeks = allWeeks.map(function(week) {
      const isCurrentWeek = (
        moment(this.props.today).isBetween(week.days[0], week.days[6], null, "[]")
      );
      const isFutureWeek = (
        moment(this.props.today).isBefore(week.days[0])
      );

      let number = isCurrentWeek ? 2 : 1;
      if (isFutureWeek) { number = 3; }

      return (
        <div
          key={week.days[0].valueOf()}
          className={classNames({
            [`week flex even-children bg-${number} color-${number+3}`]: true,
          })}
        >
          {this.renderDays(week.days)}
        </div>
      );
    }.bind(this));

    return (
      <div className="month grow flex vertical">
        <div className="grow flex vertical even-children">
          {weeks}
        </div>

        <div className="flex even-children bg-5 color-1">
          <Button
            label="&uarr;"
            onClick={this.props.moveBackward}
          />
          <Button
            label="&darr;"
            onClick={this.props.moveForward}
          />
        </div>
      </div>
    );
  }
}

reactMixin(Month.prototype, ReactFire);
export default Month;