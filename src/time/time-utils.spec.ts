import { TimeUnitInterval } from './time-unit-interval';
import { TimeUtils } from './time-utils';

describe('TimUtils', () => {
    let date: Date;

    beforeEach(() => {
        date = new Date('2018-10-28T23:23:00');
    });

    it('should get the week of the date', () => {
        expect(TimeUtils.getWeek(date)).toBe(43);
    });

    it('should round to the next day', () => {
        TimeUtils.round(date, TimeUnitInterval.ONE_DAY_INTERVAL);
        const eqDate: Date = new Date('2018-10-29T00:00:00');
        expect(date).toEqual(eqDate);
    });

    it('should floor to monday of week', () => {
        TimeUtils.floor(date, TimeUnitInterval.ONE_WEEK_INTERVAL);
        const eqDate: Date = new Date('2018-10-22T00:00:00');
        expect(date).toEqual(eqDate);
    });

    it('it should compensate DST with rounding', () => {
        const interval: TimeUnitInterval = TimeUnitInterval.TWO_WEEKS_INTERVAL;
        TimeUtils.round(date, interval);
        const eqDate: Date = new Date('2018-10-29T00:00:00');
        expect(date).toEqual(eqDate);
    });

    it('should parse a date string', () => {
        const d: Date = TimeUtils.parse('2016-01-02', 'yyyy-MM-dd', new Date());

        expect(d.getFullYear()).toBe(2016);
        expect(d.getMonth()).toBe(0);
    });

    it('should serialize date as url parameter', () => {
        const d: Date = new Date(2019, 9, 5);
        const param = TimeUtils.serializeAsUrlParam(d);

        expect(param).toBe('5-10-2019');
    });

    it('should deserialize dates from url parameter', () => {
        const d: Date = new Date(2019, 9, 5);
        const param = TimeUtils.serializeAsUrlParam(d);

        expect(param).toBe('5-10-2019');

        const u: Date = TimeUtils.deserializeFromUrlParam(param);
        expect(u.getFullYear()).toBe(2019);
        expect(u.getMonth()).toBe(9);
    });

    it('should check valid dates', () => {
        expect(TimeUtils.isValidDate(new Date())).toBeTruthy();
        expect(TimeUtils.isValidDate(new Date(Number.NaN))).toBeFalsy();
    });

    it('should check for weekends', () => {
        const d: Date = new Date(2019, 9, 5);
        const b: Date = new Date(2019, 9, 3);

        expect(TimeUtils.isWeekend(d)).toBeTruthy();
        expect(TimeUtils.isWeekend(b)).toBeFalsy();
    });
});
