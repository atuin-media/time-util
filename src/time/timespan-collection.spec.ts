import { Temporal } from '@atuin/shared/model';
import { TemporalSlice } from '@atuin/shared/util-time';
import { Timespan } from './timespan';
import { TimespanCollection } from './timespan-collection';

describe('TimespanCollection', () => {
    let t1, t2, t3, t4, t5, t6, t7, t8;
    let refTimespan;
    let collection: TimespanCollection;
    beforeEach(() => {
        t1 = {
            from: new Date('2018-11-01T05:00:00.000Z'),
            to: new Date('2018-11-01T11:00:00.000Z'),
            type: 0
        };
        t2 = {
            from: new Date('2018-11-01T06:00:00.000Z'),
            to: new Date('2018-11-01T08:00:00.000Z'),
            type: 1
        };
        t3 = {
            from: new Date('2018-11-01T07:00:00.000Z'),
            to: new Date('2018-11-01T08:00:00.000Z'),
            type: 2
        };
        t4 = {
            from: new Date('2018-11-01T12:00:00.000Z'),
            to: new Date('2018-11-02T01:00:00.000Z'),
            type: 0
        };
        t5 = {
            from: new Date('2018-11-01T12:00:00.000Z'),
            to: new Date('2018-11-01T13:00:00.000Z'),
            type: 1
        };
        t6 = {
            from: new Date('2018-11-01T15:00:00.000Z'),
            to: new Date('2018-11-01T19:00:00.000Z'),
            type: 3
        };
        t7 = {
            from: new Date('2018-11-01T16:00:00.000Z'),
            to: new Date('2018-11-01T17:00:00.000Z'),
            type: 2
        };
        t8 = {
            from: new Date('2018-11-01T19:00:00.000Z'),
            to: new Date('2018-11-01T20:00:00.000Z'),
            type: 0
        };
        refTimespan = new Timespan(new Date('2018-10-30T23:00:00.000Z'), new Date('2018-11-01T23:00:00.000Z'));
        collection = new TimespanCollection([t1, t2, t3, t4, t5, t6, t7, t8]);
    });

    it('can be queried for a specific span', () => {
        const queryResult: TimespanCollection = collection.query({
            from: new Date('2018-10-31T00:00:00.000Z'),
            to: new Date('2018-11-01T12:00:00.000Z')
        });
        expect(collection.size).toBe(8);
        expect(queryResult === collection).toBeFalsy();
        expect(queryResult.size).toBe(3);
    });

    it('can be truncated by a given span', () => {
        refTimespan = new Timespan(new Date('2018-10-30T23:00:00.000Z'), new Date('2018-11-01T14:00:00.000Z'));
        const truncated: TimespanCollection = collection.truncate(refTimespan);
        expect(collection.size).toBe(8);
        expect(truncated === collection).toBeFalsy();
        expect(truncated.size).toBe(5);
        truncated.items.forEach((item: Temporal) => {
            expect(item.from.getTime()).toBeGreaterThanOrEqual(refTimespan.from.getTime());
            expect(item.to.getTime()).toBeLessThanOrEqual(refTimespan.to.getTime());
        });
    });

    it('should project its items correctly', () => {
        const projection: TimespanCollection = collection.project(refTimespan, (i) => i.type);
        expect(collection.size).toBe(8);
        expect(projection === collection).toBeFalsy();
        expect(projection.size).toBe(9);
        const result: Timespan[] = JSON.parse(
            '[{"from":"2018-11-01T05:00:00.000Z","to":"2018-11-01T06:00:00.000Z",' +
                '"origin":{"from":"2018-11-01T05:00:00.000Z","to":"2018-11-01T11:00:00.000Z","type":0}},' +
                '{"from":"2018-11-01T06:00:00.000Z","to":"2018-11-01T07:00:00.000Z","origin":{"from":"2018-11-01T06:00:00.000Z",' +
                '"to":"2018-11-01T08:00:00.000Z","type":1}},{"from":"2018-11-01T07:00:00.000Z","to":"2018-11-01T08:00:00.000Z",' +
                '"origin":{"from":"2018-11-01T07:00:00.000Z","to":"2018-11-01T08:00:00.000Z","type":2}},{"from":"2018-11-01T08:00:00.000Z",' +
                '"to":"2018-11-01T11:00:00.000Z","origin":{"from":"2018-11-01T05:00:00.000Z","to":"2018-11-01T11:00:00.000Z","type":0}},' +
                '{"from":"2018-11-01T12:00:00.000Z","to":"2018-11-01T13:00:00.000Z","origin":{"from":"2018-11-01T12:00:00.000Z","to":' +
                '"2018-11-01T13:00:00.000Z","type":1}},{"from":"2018-11-01T13:00:00.000Z","to":"2018-11-01T15:00:00.000Z","origin":' +
                '{"from":"2018-11-01T12:00:00.000Z","to":"2018-11-02T01:00:00.000Z","type":0}},{"from":"2018-11-01T15:00:00.000Z",' +
                '"to":"2018-11-01T19:00:00.000Z","origin":{"from":"2018-11-01T15:00:00.000Z","to":"2018-11-01T19:00:00.000Z","type":3}},' +
                '{"from":"2018-11-01T19:00:00.000Z","to":"2018-11-01T20:00:00.000Z","origin":{"from":"2018-11-01T19:00:00.000Z",' +
                '"to":"2018-11-01T20:00:00.000Z","type":0}},{"from":"2018-11-01T20:00:00.000Z","to":"2018-11-01T23:00:00.000Z",' +
                '"origin":{"from":"2018-11-01T12:00:00.000Z","to":"2018-11-02T01:00:00.000Z","type":0}}]'
        );
        result.forEach((item) => {
            item.from = new Date(item.from);
            item.to = new Date(item.to);
        });
        projection.items.forEach((item: Timespan, index) => {
            expect(item.from.getTime()).toBeGreaterThanOrEqual(refTimespan.from.getTime());
            expect(item.to.getTime()).toBeLessThanOrEqual(refTimespan.to.getTime());
            expect(item.from).toEqual(result[index].from);
            expect(item.to).toEqual(result[index].to);
            // none of the slices may overlap
            projection.items.forEach((i) => {
                if (i !== item) {
                    expect(item.overlaps(i)).toBeFalsy();
                }
            });
        });
    });

    it('should project overlaying items correctly', () => {
        t1 = {
            from: new Date('2018-11-01T13:00:00.000Z'),
            to: new Date('2018-11-01T19:45:00.000Z'),
            type: 0
        };
        t2 = {
            from: new Date('2018-11-01T13:00:00.000Z'),
            to: new Date('2018-11-01T19:45:00.000Z'),
            type: 0
        };
        t3 = {
            from: new Date('2018-11-01T16:00:00.000Z'),
            to: new Date('2018-11-01T16:16:00.000Z'),
            type: 1
        };
        t4 = {
            from: new Date('2018-11-01T16:00:00.000Z'),
            to: new Date('2018-11-01T16:15:00.000Z'),
            type: 1
        };
        const overlayingCollection: TimespanCollection = new TimespanCollection([t1, t2, t3, t4]);

        const projection: TimespanCollection = overlayingCollection.project(refTimespan, (i) => i.type);

        expect(projection).toBeTruthy();
        expect(projection.items.length).toBe(4);
    });

    it('should aggregate its items correctly', () => {
        const aggregation: TimespanCollection = collection.filter((item) => item.type === 0).aggregate(refTimespan);
        expect(collection.size).toBe(8);
        expect(aggregation === collection).toBeFalsy();
        expect(aggregation.size).toBe(4);
        aggregation.items.forEach((item: Timespan) => {
            expect(item.from.getTime()).toBeGreaterThanOrEqual(refTimespan.from.getTime());
            expect(item.to.getTime()).toBeLessThanOrEqual(refTimespan.to.getTime());
            // none of the slices may overlap
            aggregation.items.forEach((i) => {
                if (i !== item) {
                    expect(item.overlaps(i)).toBeFalsy();
                }
            });
        });
        // there are two working times overlapping between 19:00 and 20:00
        expect((<TemporalSlice>aggregation.items[2]).origin).toBe(2);
    });
});
