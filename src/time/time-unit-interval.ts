/**
 * This class represents an interval of a specific time unit. For instances an interval
 * of 15 minutes or one week.
 */
import { TimeInterval } from 'd3-time';
import d3 from '../vendor/d3-importer';
import { TimeUnit } from './time-unit';

export class TimeUnitInterval {
    public static QUARTER_HOUR_INTERVAL: TimeUnitInterval = new TimeUnitInterval(TimeUnit.MINUTE, 15);
    public static ONE_HOUR_INTERVAL: TimeUnitInterval = new TimeUnitInterval(TimeUnit.HOUR, 1);
    public static ONE_DAY_INTERVAL: TimeUnitInterval = new TimeUnitInterval(TimeUnit.DAY, 1);
    public static TWO_DAYS_INTERVAL: TimeUnitInterval = new TimeUnitInterval(TimeUnit.DAY, 2);
    public static ONE_WEEK_INTERVAL: TimeUnitInterval = new TimeUnitInterval(TimeUnit.WEEK, 1);
    public static TWO_WEEKS_INTERVAL: TimeUnitInterval = new TimeUnitInterval(TimeUnit.WEEK, 2);
    public static FOUR_WEEKS_INTERVAL: TimeUnitInterval = new TimeUnitInterval(TimeUnit.WEEK, 4);
    public static ONE_MONTH_INTERVAL: TimeUnitInterval = new TimeUnitInterval(TimeUnit.MONTH, 1);
    public static ONE_YEAR_INTERVAL: TimeUnitInterval = new TimeUnitInterval(TimeUnit.YEAR, 1);

    protected _interval: TimeInterval;
    protected _unifiedInterval: TimeInterval;

    constructor(public unit: TimeUnit, public steps: number = 1) {
        switch (unit) {
            case TimeUnit.MILLISECOND:
                this._interval = d3.time.timeMillisecond.every(steps);
                this._unifiedInterval = d3.time.timeMillisecond;
                break;
            case TimeUnit.SECOND:
                this._interval = d3.time.timeSecond.every(steps);
                this._unifiedInterval = d3.time.timeMillisecond;
                break;
            case TimeUnit.MINUTE:
                this._interval = d3.time.timeMinute.every(steps);
                this._unifiedInterval = d3.time.timeSecond;
                break;
            case TimeUnit.HOUR:
                this._interval = d3.time.timeHour.every(steps);
                this._unifiedInterval = d3.time.timeHour;
                break;
            case TimeUnit.DAY:
                this._interval = d3.time.timeDay.every(steps);
                this._unifiedInterval = d3.time.timeDay;
                break;
            case TimeUnit.WEEK:
                // weeks start at monday
                this._interval = d3.time.timeMonday.every(steps);
                this._unifiedInterval = d3.time.timeMonday;
                break;
            case TimeUnit.MONTH:
                this._interval = d3.time.timeMonth.every(steps);
                this._unifiedInterval = d3.time.timeMonth;
                break;
            case TimeUnit.YEAR:
                this._interval = d3.time.timeYear.every(steps);
                this._unifiedInterval = d3.time.timeYear;
                break;
            default:
                throw new Error('undefined time unit');
                break;
        }
    }

    public get millliseconds(): number {
        return this.unit.milliseconds * this.steps;
    }

    /**
     * Returns the unified time interval of this time unit interval.
     * This represents the same interval but with a fixed step size of 1, which
     * might be necessary to offset an arbitrary time (for example, if
     * you have a monday of an uneven week and want to offset it by a 2 week interval)
     */
    public getUnifiedInterval(): TimeInterval {
        return this._unifiedInterval;
    }

    ceil(date: Date): Date {
        return this._interval.ceil(date);
    }

    filter(test: (date: Date) => boolean): TimeInterval {
        return this._interval.filter(test);
    }

    floor(date: Date): Date {
        return this._interval.floor(date);
    }

    offset(date: Date, step?: number): Date {
        return this._interval.offset(date, step);
    }

    range(start: Date, stop: Date, step?: number): Date[] {
        return this._interval.range(start, stop, step);
    }

    round(date: Date): Date {
        return this._interval.round(date);
    }
}
