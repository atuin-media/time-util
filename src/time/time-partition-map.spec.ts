import { TimePartition } from './time-partition';
import { TimePartitionMap } from './time-partition-map';
import { TimeUnitInterval } from './time-unit-interval';
import { Timespan } from './timespan';

describe('TimePartitionMap', () => {
    let timespan: Timespan;
    let refTimespan: Timespan;
    let from: Date;
    let to: Date;
    beforeEach(() => {
        from = TimeUnitInterval.ONE_WEEK_INTERVAL.floor(new Date('2018-11-01T06:30:00'));
        to = TimeUnitInterval.ONE_WEEK_INTERVAL.ceil(new Date('2018-11-01T12:00:00'));
        timespan = new Timespan(from, to);
        refTimespan = new Timespan(new Date('2018-11-01T11:00:00'), new Date('2018-11-02T02:00:00'));
    });

    it('should create seven partitions for the week timespan', () => {
        const pm: TimePartitionMap<TimePartition> = new TimePartitionMap(
            TimePartition,
            TimeUnitInterval.ONE_DAY_INTERVAL,
            timespan
        );
        expect(pm.partitions.length).toBe(7);
    });

    it('should add the timespan to every touched partition', () => {
        const pm: TimePartitionMap<TimePartition> = new TimePartitionMap(
            TimePartition,
            TimeUnitInterval.ONE_DAY_INTERVAL,
            timespan,
            [refTimespan]
        );
        expect(pm.partitions[0].items.length).toBe(0);
        expect(pm.partitions[1].items.length).toBe(0);
        expect(pm.partitions[2].items.length).toBe(0);
        expect(pm.partitions[3].items.length).toBe(1);
        expect(pm.partitions[4].items.length).toBe(1);
        expect(pm.partitions[5].items.length).toBe(0);
        expect(pm.partitions[6].items.length).toBe(0);
    });

    it('should immutable when setting the valid timespan', () => {
        const pm: TimePartitionMap<TimePartition> = new TimePartitionMap(
            TimePartition,
            TimeUnitInterval.ONE_DAY_INTERVAL,
            timespan,
            [refTimespan]
        );

        const t: Timespan = Timespan.from(timespan);
        t.to.setDate(t.to.getDate() - 2);

        const n: TimePartitionMap<TimePartition> = pm.setValidTimespan(t);

        // the map should be different
        expect(n === pm).toBeFalsy();

        // the overlapping partitions should be the same
        n.partitions.forEach((p: TimePartition, index: number) => expect(p).toEqual(pm.partitions[index]));
    });

    it('should immutable when setting the content', () => {
        const pm: TimePartitionMap<TimePartition> = new TimePartitionMap(
            TimePartition,
            TimeUnitInterval.ONE_DAY_INTERVAL,
            timespan,
            [refTimespan]
        );

        const t: Timespan = Timespan.from(refTimespan);
        t.to.setDate(t.to.getDate() + 1);

        const n: TimePartitionMap<TimePartition> = pm.setContent([refTimespan, t]);

        // the map should be different
        expect(n === pm).toBeFalsy();

        // only the partitions which are affected by the new timeframe should be new
        expect(pm.partitions[0] === n.partitions[0]).toBeTruthy();
        expect(pm.partitions[1] === n.partitions[1]).toBeTruthy();
        expect(pm.partitions[2] === n.partitions[2]).toBeTruthy();
        expect(pm.partitions[3] === n.partitions[3]).toBeFalsy();
        expect(pm.partitions[4] === n.partitions[4]).toBeFalsy();
        expect(pm.partitions[5] === n.partitions[5]).toBeFalsy();
        expect(pm.partitions[6] === n.partitions[6]).toBeTruthy();
    });
});
