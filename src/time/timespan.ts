import { Temporal } from '@atuin/shared/model';
import { TimeInterval } from 'd3-time';
import { TimeUnitInterval } from './time-unit-interval';
import { TimeUtils } from './time-utils';

/**
 * A basic implementation of the <code>Temporal</code> interface.
 */
export class Timespan implements Temporal {
    public from: Date = new Date();
    public to: Date = new Date();

    /**
     *  Returns true if the given Temporals overlap each other.
     */
    public static overlap(a: Temporal, b: Temporal) {
        return a.from.getTime() < b.to.getTime() && a.to.getTime() > b.from.getTime();
    }

    /**
     * Returns true if the from and to times of the provided spans are equal.
     *
     * @param a Temporal
     * @param b Temporal
     */
    public static isEqual(a: Temporal, b: Temporal): boolean {
        return a && b && Timespan.from(a).equal(b);
    }

    constructor(from: Date, to: Date) {
        if (from.getTime() > to.getTime()) {
            throw new Error('from time can not be bigger than to time');
        }

        this.from.setTime(from.getTime());
        this.to.setTime(to.getTime());
    }

    /**
     * Deserializes a timespan url params object and returns the deserialized
     * timespan or null if deserialization was not possible.
     *
     * @param params The timespan url params object
     */
    public static deserializeFromUrlParams(params: any | { f: string; t: string }): Timespan {
        const from: Date = TimeUtils.deserializeFromUrlParam(params.f);
        const to: Date = TimeUtils.deserializeFromUrlParam(params.t);
        // compensate view offset
        if (to && TimeUtils.isValidDate(to)) {
            to.setDate(to.getDate() + 1);
        }

        if (from && to && from.getTime() < to.getTime()) {
            return new Timespan(from, to);
        }

        return null;
    }

    /**
     * Creates a new timespan instance from any item with a from and
     * to date. Date values are not referenced.
     *
     * @param item The temporal item to make a timespan instance of
     */
    public static from(item: any): Timespan {
        let t: Timespan;
        if (
            item.hasOwnProperty('from') &&
            item.from instanceof Date &&
            item.hasOwnProperty('to') &&
            item.to instanceof Date
        ) {
            t = new Timespan(item.from, item.to);
        } else {
            throw new Error(
                'unknown temporal: from and to properties are missing or of wrong type: ' + JSON.stringify(item)
            );
        }
        return t;
    }

    /**
     * Creates a new timespan for a given interval and from date.
     *
     * @param from The start date from with the span is added.
     * @param interval The span to create the timespan for
     * @param steps The number of steps of the interval which should be added
     */
    public static fromInterval(from: Date, interval: TimeUnitInterval | TimeInterval, steps = 1): Timespan {
        const t: Timespan = new Timespan(from, from);
        t.to = interval.offset(t.to, steps);
        return t;
    }

    /**
     * Returns a new timespan based on the source timespan but with the
     * offsets applied.
     *
     * @param source
     * @param interval The unit in which the offsets should be applied.
     * @param pastOffset The number of units to apply to the from date
     * @param futureOffset The number of units to apply to the to date
     */
    public static fromOffsets(
        source: Temporal,
        interval: TimeUnitInterval,
        pastOffset: number,
        futureOffset: number
    ): Timespan {
        const t: Timespan = new Timespan(source.from, source.to);
        t.from = interval.offset(t.from, -pastOffset);
        t.to = interval.offset(t.to, futureOffset);
        return t;
    }

    /**
     * Copies the from and to values from the given temporal.
     *
     * @param value The temporal to copy the values from.
     */
    public copy(value: Temporal) {
        this.from.setTime(value.from.getTime());
        this.to.setTime(value.to.getTime());
    }

    /**
     * Truncates the timespan to the dimensions of the given temporal.
     *
     * @param span The temporal instance which marks the borders to truncate to
     */
    public truncate(span: Temporal): void {
        if (this.from.getTime() < span.from.getTime()) {
            this.from.setTime(span.from.getTime());
        }

        if (this.to.getTime() > span.to.getTime()) {
            this.to.setTime(span.to.getTime());
        }
    }

    /**
     *  Returns true if the given Temporal overlaps this timespan.
     *
     * @param item The temporal instance to check for.
     */
    public overlaps(item: Temporal): boolean {
        return item && this.from.getTime() < item.to.getTime() && this.to.getTime() > item.from.getTime();
    }

    /**
     * Returns the duration of the timespan in milliseconds.
     */
    public get duration(): number {
        return this.to.getTime() - this.from.getTime();
    }

    /**
     * Returns true if the provided date or temporal is within
     * this span or exactly at one of the bounds.
     *
     * @param value The date or temporal to check for
     */
    public includes(value: Date | Temporal): boolean {
        if (value instanceof Date) {
            const date: Date = <Date>value;
            return date.getTime() >= this.from.getTime() && date.getTime() <= this.to.getTime();
        }
        // use duck-typing to check for temporal
        else if (value.from && value.from instanceof Date && value.to && value.to instanceof Date) {
            return this.includes(value.from) && this.includes(value.to);
        }
    }

    /**
     * Returns the start date of every interval that touches the timespan.
     *
     * @param interval The interval to get the dates for
     */
    public each(interval: TimeUnitInterval): Date[] {
        const f: Date = interval.floor(this.from);
        const t: Date = interval.ceil(this.to);
        return interval.range(f, t);
    }

    /**
     * Returns true if the from and to times of the provided span is equal to this spans.
     *
     * @param span The temporal to check for equality.
     */
    public equal(span: Temporal): boolean {
        return (
            span &&
            span.from &&
            span.to &&
            this.from.getTime() === span.from.getTime() &&
            this.to.getTime() === span.to.getTime()
        );
    }

    /**
     * Returns a parameter object with the timespan data serialized as strings.
     */
    public serializeAsUrlParams(): { f: string; t: string } {
        // compensate the full day view (the end of january should be displayed
        // as 31-1-2019 and not 1-2-2019
        let preparedTo: Date;
        if (this.to && TimeUtils.isValidDate(this.to)) {
            preparedTo = new Date(this.to.getTime());
            preparedTo.setDate(preparedTo.getDate() - 1);
        }

        return {
            f: TimeUtils.serializeAsUrlParam(this.from),
            t: TimeUtils.serializeAsUrlParam(preparedTo)
        };
    }

    /**
     * Returns the mean date which represents the middle time between the from
     * and to date of this timespan.
     */
    public get mean(): Date {
        return new Date(this.from.getTime() + (this.to.getTime() - this.from.getTime()) / 2);
    }

    /**
     * Returns true if the timespans from and to date are valid.
     */
    public isValid(): boolean {
        return TimeUtils.isValidDate(this.from) && TimeUtils.isValidDate(this.to);
    }

    /**
     * Returns true if this timespan complies to the provided timespan interval.
     *
     * @param interval The interval to comply to
     */
    public equalsInterval(interval: TimeUnitInterval): boolean {
        const t: Timespan = Timespan.fromInterval(this.from, interval);
        return t.equal(this);
    }
}
