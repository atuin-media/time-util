import { Temporal } from './temporal.model';
import { TimeUnitInterval } from './time-unit-interval';
import { Timespan } from './timespan';
import { TimespanCollection } from './timespan-collection';

/**
 * This class describes an item of a <code>TimePartitionModel</code> and contains
 * all temporal items which touches this partition.
 */
export class TimePartition extends TimespanCollection implements Temporal {
    public from: Date;
    public to: Date;
    public interval: TimeUnitInterval;
    public index: number; // index of this partition within its parent partition map
    protected _projection: TimespanCollection;

    constructor(from: Date, interval: TimeUnitInterval, index: number) {
        super();
        if (from && interval) {
            const span: Timespan = Timespan.fromInterval(from, interval);
            this.from = span.from;
            this.to = span.to;
            this.interval = interval;
            this.index = index;
        }
    }

    public clone(): TimePartition {
        return Object.assign(new TimePartition(this.from, this.interval, this.index));
    }

    /**
     * Returns the <code>TimespansCombinationModel</code> of all temporal instances within this partition.
     *
     * @param getLevelFn A pure function of type <code>(:Temporal): number</code> which returns the level of the given temporal.
     * If no function is provided, all temporals get a level of 0.
     */
    public getProjection(getLevelFn: Function = null): TimespanCollection {
        if (!this.from || !this.to) {
            return null;
        }
        // cache the projection for this time partition
        if (!this._projection) {
            this._projection = this.project(this, getLevelFn);
        }
        return this._projection;
    }

    /**
     * This method gets called by the partition map after the creation of an interval.
     * Therefore it is not necessary for this method to be pure. Overwrite this
     * method to perform some inner calculations within subclasses.
     */
    public commit() {}
}
