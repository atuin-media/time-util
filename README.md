# time-util library

Typescript library for working with time spans and time units using d3-time, date-fns and lodash. 

The aim of this library is to make computing with time spans and the querying of time ranges as performant 
and convenient as possible.

A typical use case would be, for example, the division of several overlapping time spans into independent 
time spans: A working time from 09:00 to 17:00 is overlaid with two breaks and one would like to have the 
working time minus the breaks as three independent time spans.

## Example usage

TimespanCollection
```typescript
// create a timespan collection
const t1 = {
	from: new Date('2018-11-01T05:00:00.000Z'),
	to: new Date('2018-11-01T11:00:00.000Z'),
	type: 0
};
// ...
const collection = new TimespanCollection([t1, t2, t3, t4, t5, t6, t7, t8]);

// query or a specific span
const queryResult: TimespanCollection = collection.query({
	from: new Date('2018-10-31T00:00:00.000Z'),
	to: new Date('2018-11-01T12:00:00.000Z')
});

// truncated by a given span
const refTimespan = new Timespan(new Date('2018-10-30T23:00:00.000Z'), new Date('2018-11-01T14:00:00.000Z'));
const truncated: TimespanCollection = collection.truncate(refTimespan);

// project the items of the collection within the reference timespan based on
// their type (higher levels are projected on top of ones with a lower order)
const projection: TimespanCollection = collection.project(refTimespan, (i) => i.type);
```

TimePartitionMap
```typescript
// create a week timespan
from = TimeUnitInterval.ONE_WEEK_INTERVAL.floor(new Date('2018-11-01T06:30:00'));
to = TimeUnitInterval.ONE_WEEK_INTERVAL.ceil(new Date('2018-11-01T12:00:00'));
timespan = new Timespan(from, to);

// create an arbitrary reference timespan
refTimespan = new Timespan(new Date('2018-11-01T11:00:00'), new Date('2018-11-02T02:00:00'));

// creates seven partitions for the week timespan
const days: TimePartitionMap<TimePartition> = new TimePartitionMap(
    TimePartition,
    TimeUnitInterval.ONE_DAY_INTERVAL,
    timespan
);

// creates seven partitions for the week timespan and distributes the reference timespan
// among all the partitions it intersects with.
const pm: TimePartitionMap<TimePartition> = new TimePartitionMap(
    TimePartition,
    TimeUnitInterval.ONE_DAY_INTERVAL,
    timespan,
    [refTimespan]
);
```
