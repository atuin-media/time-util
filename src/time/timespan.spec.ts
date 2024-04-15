import { Temporal } from '@atuin/shared/model';
import { TimeUnitInterval } from './time-unit-interval';
import { Timespan } from './timespan';

describe('Timespan', () => {
    let timespan: Timespan;
    let refTimespan: Timespan;
    let from: Date;
    let to: Date;
    beforeEach(() => {
        from = new Date('2018-11-01T06:30:00');
        to = new Date('2018-11-01T12:00:00');
        timespan = new Timespan(from, to);
        refTimespan = new Timespan(new Date('2018-11-01T11:00:00'), new Date('2018-11-02T02:00:00'));
    });

    it('should create a new timespan with new date objects', () => {
        const t: Timespan = new Timespan(from, to);
        expect(t.from === from).toBeFalsy();
        expect(t.to === to).toBeFalsy();
    });

    it('should throw an error if from time is after to time', () => {
        from = new Date('2018-11-02T06:30:00');
        expect(() => new Timespan(from, to)).toThrow();
    });

    it('should create a valid timespan from span', () => {
        timespan = Timespan.fromInterval(from, TimeUnitInterval.ONE_WEEK_INTERVAL);
        to = new Date('2018-11-08T06:30:00');
        expect(timespan.from).toEqual(from);
        expect(timespan.to).toEqual(to);
    });

    it('should truncate the timespan', () => {
        to = new Date(timespan.to.getTime());
        timespan.truncate(refTimespan);
        expect(timespan.from).toEqual(refTimespan.from);
        expect(timespan.to).toEqual(timespan.to);
    });

    it('returns the correct duration', () => {
        expect(timespan.duration).toBe(5.5 * 60 * 60 * 1000);
    });

    it('should correctly compare to interval', () => {
        const t: Temporal = {
            from: new Date('2019-10-05T22:00:00.000Z'),
            to: new Date('2019-10-12T22:00:00.000Z')
        };

        expect(Timespan.from(t).equalsInterval(TimeUnitInterval.ONE_DAY_INTERVAL)).toBeFalsy();
        expect(Timespan.from(t).equalsInterval(TimeUnitInterval.ONE_WEEK_INTERVAL)).toBeTruthy();
    });

    it('should serialize as url parameter', () => {
        const t: Temporal = {
            from: new Date('2019-08-23T20:00:00.000Z'),
            to: new Date('2019-08-26T10:00:00.000Z')
        };

        const param = Timespan.from(t).serializeAsUrlParams();
        expect(param.f).toBe('23-8-2019');
        expect(param.t).toBe('25-8-2019');
    });

    it('should deserialize as url parameter', () => {
        const param = { f: '23-8-2019', t: '25-8-2019' };
        const r: Timespan = Timespan.deserializeFromUrlParams(param);

        expect(r.from.getFullYear()).toBe(2019);
        expect(r.to.getFullYear()).toBe(2019);
        expect(r.from.getMonth()).toBe(7);
        expect(r.to.getMonth()).toBe(7);
        expect(r.from.getDate()).toBe(23);
        expect(r.to.getDate()).toBe(26);
    });

    it('should copy another timespan', () => {
        const t: Temporal = {
            from: new Date('2019-08-23T22:00:00.000Z'),
            to: new Date('2019-08-25T22:00:00.000Z')
        };

        const copy = new Timespan(new Date(), new Date());
        copy.copy(t);
        expect(t.from === copy.from).toBeFalsy();
        expect(t.from.getTime() === copy.from.getTime()).toBeTruthy();
        expect(t.to === copy.to).toBeFalsy();
        expect(t.to.getTime() === copy.to.getTime()).toBeTruthy();
    });

    it('should calculate the mean date', () => {
        const t: Temporal = {
            from: new Date('2019-08-23T22:00:00.000Z'),
            to: new Date('2019-08-25T22:00:00.000Z')
        };

        const mean = Timespan.from(t).mean;
        const ft = t.from.getTime() - mean.getTime();
        const tt = mean.getTime() - t.to.getTime();
        expect(tt).toBe(ft);
    });
});
