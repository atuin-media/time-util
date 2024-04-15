import { Temporal } from './temporal.model';
import _ from '../vendor/lodash-importer';
import { TimePartition } from './time-partition';
import { TimeUnitInterval } from './time-unit-interval';
import { Timespan } from './timespan';
import { TimespanCollection } from './timespan-collection';

/**
 * Generic class which divides its valid timespan by the given interval in a list
 * of <code>TimePartition</code> instances. Every partition holds a list of the
 * temporal instances which overlap the partitions span. Instances of the class
 * are iterable.
 */
export class TimePartitionMap<T extends TimePartition> extends TimespanCollection {
    // for faster partition access, this map stores the partition by their from dates time as its key
    public timestampIndexMap: Map<number, number> = new Map();
    public validTimespan: Timespan;
    // the temporals which are distributed to this instances partitions
    public content: Temporal[] = [];

    /**
     * Creates a new TimePartitionMap instance.
     *
     * @param partitionItemType The type of the partition to create for each interval step.
     * @param interval The time unit interval to create the partitions for (e.g. the
     * length of one partition)
     * @param validTimespan The valid timespan of the map. This defines the total span
     * which gets divided in partitions of the given interval duration
     * @param content The items to distribute among the created partitions
     */
    constructor(
        protected partitionItemType: new (from: Date, interval: TimeUnitInterval, index: number) => T,
        protected interval: TimeUnitInterval = TimeUnitInterval.ONE_DAY_INTERVAL,
        validTimespan: Temporal = null,
        content: Temporal[] = null
    ) {
        super();

        if (validTimespan) {
            this.validTimespan = Timespan.from(validTimespan);
            // init the partitions
            this.getAffectedPartitionKeys(validTimespan).forEach((date: Date, i: number) => {
                this.items.push(new partitionItemType(date, interval, i));
                this.timestampIndexMap.set(date.getTime(), i);
            });
        }

        if (content) {
            this.content = content;
            // initially add the content to their partitions
            content.forEach((item: Temporal) => {
                this.getAffectedPartitionKeys(item).forEach((date: Date) => {
                    const t: number = date.getTime();
                    if (this.timestampIndexMap.has(t)) {
                        const partitionIndex: number = this.timestampIndexMap.get(t);
                        const partition: T = <T>this.items[partitionIndex];
                        partition.items.push(item);
                        partition.commit();
                    }
                });
            });
        }
    }

    /**
     * Creates a shallow basic clone of this partition map.
     */
    public clone(): TimePartitionMap<T> {
        return new TimePartitionMap(this.partitionItemType, this.interval);
    }

    /**
     * Returns the partitions of this collection.
     */
    public get partitions(): T[] {
        return this.items as T[];
    }

    /**
     * Creates a new partition map with the new valid timespan and distributes
     * this maps content among the new map. If the provided valid timespan is
     * the same the method returns this map. Otherwise this method won't change
     * any properties of this map (pure for immutability).
     *
     * @param value The new valid timespan
     * @return A new partition map or this if nothing has changed
     */
    public setValidTimespan(value: Temporal): TimePartitionMap<T> {
        // return this because nothing has changed if there is no span or
        // if the provided span is equal to the current one
        if (!value || (this.validTimespan && this.validTimespan.equal(value))) {
            return this;
        }

        // create the new time interval map
        let state: TimePartitionMap<T> = this.clone();
        state.validTimespan = Timespan.from(value);

        const keys: Date[] = state.getAffectedPartitionKeys(state.validTimespan);
        // find the untouched intervals
        const untouchedIntervalMap: Map<number, T> = new Map();
        if (this.timestampIndexMap) {
            keys.forEach((key: Date) => {
                const t: number = key.getTime();
                if (this.timestampIndexMap.has(t)) {
                    untouchedIntervalMap.set(t, <T>this.items[this.timestampIndexMap.get(t)]);
                }
            });
        }

        keys.forEach((date: Date, i: number) => {
            let partition: T;
            // reuse untouched time intervals
            if (untouchedIntervalMap.has(date.getTime())) {
                partition = untouchedIntervalMap.get(date.getTime());
            } else {
                partition = new this.partitionItemType(date, this.interval, i);
                partition.commit();
            }
            state.items.push(partition);
            state.timestampIndexMap.set(date.getTime(), i);
        });

        // if there are any items to process, generate a new state
        if (this.content) {
            const skip: number[] = Array.from(untouchedIntervalMap.keys());
            state = state._setContent(this.content, skip);
        }

        return state;
    }

    /**
     * Creates a new partition map with the provided content. This method only
     * changes the affected partitions by the new content. Thereby only the
     * differences from the current content to the new content are applied (add, remove).
     *
     * @param value The new list of temporals to distribute among this map.
     * @return A new partition map or this if nothing has changed
     */
    public setContent(value: Temporal[]): TimePartitionMap<T> {
        if (value) {
            return this._setContent(value);
        }
        return this;
    }

    /**
     * Internal method for setting the content of the map.
     *
     * @param value The new temporals
     * @param skip List of partition index which may be skipped during content
     * integration, because they won't change anyway. This list is important if
     * only the valid timespan has changed and the existing content has to be
     * distributed among the new partitions.
     *
     */
    protected _setContent(value: Temporal[], skip: number[] = null): TimePartitionMap<T> {
        let state: TimePartitionMap<T>;

        // get differences to previous item list
        const diffs: Temporal[] = _.xor(this.content, value);

        if (diffs.length > 0) {
            // copy the time interval map
            state = this.clone();
            state.content = value;
            state.items = [...this.items];
            this.timestampIndexMap.forEach((v: number, key: number) => state.timestampIndexMap.set(key, v));

            if (this.validTimespan) {
                state.validTimespan = Timespan.from(this.validTimespan);

                // update the required intervals
                diffs.forEach((item: Temporal) => {
                    const affectedKeys: Date[] = state.getAffectedPartitionKeys(item);
                    const operation: string = this.content.indexOf(item) === -1 ? 'add' : 'remove';

                    affectedKeys.forEach((date: Date) => {
                        const t: number = date.getTime();
                        if ((!skip || skip.indexOf(t) === -1) && this.timestampIndexMap.has(t)) {
                            const partitionIndex: number = this.timestampIndexMap.get(t);
                            //const partition: T = <T>(<TimePartition>state.items[partitionIndex]).clone();
                            const partition: T = new this.partitionItemType(date, this.interval, partitionIndex);
                            // trigger the pure operation on the items timespan collection
                            // of the interval item which creates a new collection
                            partition.items = this.items[partitionIndex][operation](item).items;
                            // call the commit of the partition, in order to perform internal
                            // calculations by subclasses
                            partition.commit();
                            // replace the partition
                            state.items[partitionIndex] = partition;
                        }
                    });
                });
            }
        }

        return state ? state : this;
    }

    /**
     * Helper function which returns an array of dates as keys of the affected intervals. Hence
     * the intervals which are touched by the temporal instance.
     *
     * @param item The temporal instance to get the keys for
     */
    protected getAffectedPartitionKeys(item: Temporal): Date[] {
        // clip the temporal span to the span of the model
        const t: Timespan = Timespan.from(item);
        t.truncate(this.validTimespan);

        return t.each(this.interval);
    }
}
