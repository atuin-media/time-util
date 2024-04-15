import fns from '../vendor/date-fns-importer';
import { TimeUnitInterval } from './time-unit-interval';

/**
 * This class represents a collection of static time utility methods.
 */
export class TimeUtils {
    /**
     * Rounds the time to the next lowest span value.
     *
     * @param time The time to floor to. This Date object gets modified.
     * @param interval The span to round to.
     */
    public static floor(time: Date, interval: TimeUnitInterval): void {
        time.setTime(interval.floor(time).getTime());
    }

    /**
     * Rounds the time to the nearest span value.
     *
     * @param time The time to round. This Date object gets modified.
     * @param interval The span to round to.
     */
    public static round(time: Date, interval: TimeUnitInterval): void {
        time.setTime(interval.round(time).getTime());
    }

    /**
     * Returns the number of the week of a given date.
     *
     * @param date The date to get the week number for
     */
    public static getWeek(date: Date): number {
        return fns.getWeek(date, {
            weekStartsOn: 1,
            firstWeekContainsDate: 4
        });
    }

    /**
     * Wrapper for the parse function of date-fns: https://date-fns.org/v2.0.0-alpha.27/docs/parse
     */
    public static parse(dateString: string, formatString: string, baseDate: Date): Date {
        return fns.parse(dateString, formatString, baseDate);
    }

    /**
     * Returns only the date as a serialized string to use as URL parameter.
     *
     * @param date The date to serialize
     */
    public static serializeAsUrlParam(date: Date): string {
        return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    }

    /**
     * Returns a date object from a serialized url param date or null if
     * deserialization was not possible.
     *
     * @param paramValue The url param string value
     */
    public static deserializeFromUrlParam(paramValue: string): Date {
        const check = /(\d{1,2}-\d{1,2}-\d{2,4})/;

        if (paramValue && paramValue.match(check)) {
            return TimeUtils.parse(paramValue, 'd-M-y', new Date(0));
        }

        return null;
    }

    /**
     * Checks if a date is null or invalid.
     *
     * @param d The date to check.
     */
    public static isValidDate(d: Date) {
        return d instanceof Date && !isNaN(d.getTime());
    }

    /**
     * Returns true if the provided date is a saturday or sunday.
     *
     * @param d
     */
    public static isWeekend(d: Date): boolean {
        return d && (d.getDay() === 6 || d.getDay() === 0);
    }

    /**
     * returns a formatted date string with leading zeros
     *
     * @param date
     * @param format yyyy-dd-mm hh:ii:ss or parts of it
     */
    public static formatDateTime(date: Date, format: string) {
        const _padStart = (value: number): string => value.toString().padStart(2, '0');
        return format
            .replace(/yyyy/g, _padStart(date.getFullYear()))
            .replace(/dd/g, _padStart(date.getDate()))
            .replace(/mm/g, _padStart(date.getMonth() + 1))
            .replace(/hh/g, _padStart(date.getHours()))
            .replace(/ii/g, _padStart(date.getMinutes()))
            .replace(/ss/g, _padStart(date.getSeconds()))
            .replace(/ww/g, _padStart(this.getWeek(date)))
            .replace(/dow/g, _padStart(date.getDay()));
    }
}
