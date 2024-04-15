import { Temporal } from '@atuin/shared/model';
import fns from '../vendor/date-fns-importer';
import _ from '../vendor/lodash-importer';
import { TemporalSlice } from './temporal-slice';
import { Timespan } from './timespan';

/**
 * Helper class which represents a mark for the start or end of an temporal instances and
 * stores a reference to the original temporal.
 */
class TemporalBoundaryMark {
    public static TYPE_FROM = 'from';
    public static TYPE_TO = 'to';

    public index: number;

    constructor(public time: Date, public origin: Temporal, public type: string, public data: any = null) {
        this.time = new Date(time.getTime());
        this.index = this.time.getTime();
    }
}

/**
 * A wrapper class for a collection of temporals treated as timespans. Provides some utitlity
 * methods for handling timespan collection queries, combinations or projections.
 */
export class TimespanCollection {
    protected _items: Temporal[];

    public set items(value: Temporal[]) {
        this._items = value;
    }

    public get items(): Temporal[] {
        return this._items;
    }

    constructor(items: Temporal[] = null) {
        this.items = items ? items : [];
    }

    /**
     * Returns a new collection with all temporal instances which overlap the given timespan.
     *
     * @param span The timespan to query for
     * @return A new timespan collection with the temporals overlapping the given timespan
     */
    public query(span: Temporal): TimespanCollection {
        let result: any;

        result = this._items.filter((item: Timespan) => {
            return Timespan.prototype.overlaps.apply(item, [span]);
        });

        return new TimespanCollection(result);
    }

    /**
     * Returns a new collection with all temporal instances truncated to the given span.
     * If a temporal instance is not within the span it, the resulting collection won't contain it.
     *
     * @param span The timespan to truncate
     * @return A new timespan collection with temporal slices truncated to the given
     * timespan. Each temporal slice contains the original temporal.
     */
    public truncate(span: Temporal): TimespanCollection {
        let result: any;

        result = this._items
            .filter((item: Timespan) => {
                return Timespan.prototype.overlaps.apply(item, [span]);
            })
            .map((item: Temporal) => {
                const slice: Timespan = new TemporalSlice(item.from, item.to, item);
                slice.truncate(span);
                return slice;
            });

        return new TimespanCollection(result);
    }

    /**
     * Removes a item from the collection and returns a new item list.
     * @param item The item to remove
     */
    public remove(item: Temporal): TimespanCollection {
        this._items = this._items.filter((i) => i !== item);
        return new TimespanCollection(this._items);
    }

    /**
     * Adds a item form the collection and returns a new item list.
     * @param item the item to add.
     */
    public add(item: Temporal): TimespanCollection {
        this._items = [...this._items, item];
        return new TimespanCollection(this._items);
    }

    /**
     * Wrapper for the filter functionality of the item array, but returns
     * a new timespan collection instance.
     * @param fn The filter arguments (see Array.prototype.filter)
     */
    public filter(...args): TimespanCollection {
        return new TimespanCollection(Array.prototype.filter.apply(this._items, args));
    }

    /**
     * Wrapper for the reduce functionality of the item array.
     * @param fn The reduce arguments function (see Array.prototype.reduce)
     */
    public reduce(...args): any {
        return Array.prototype.reduce.apply(this._items, args);
    }

    /**
     * Returns the number of items in the collection.
     */
    public get size(): number {
        return this._items.length;
    }

    /**
     * Creates the projection of this collection's items and returns it as a new collection.
     *
     * @param span The timespan to project in (truncates the list of temporal items before projection)
     * @param getLevelFn Function which returns a level as number for a given temporal instance. The
     * value defines the stacking order for the projection. Temporals with a higher level are projected
     * on top of ones with a lower order.
     */
    public project(span: Temporal, getLevelFn: Function = null): TimespanCollection {
        // create a start and end mark for every temporal
        const marks: TemporalBoundaryMark[] = this.createMarks(span, this._items, getLevelFn);
        return this.createProjectionSlices(marks);
    }

    /**
     * Creates an aggregation of this collection's items and returns it as new collection. If no
     * aggregation function or startValue is provided, the method simply counts the number of temporals in slices.
     * The result of the aggregation function gets stored within the origin property of
     * each resulting temporal slice.
     *
     * @param span The timespan to aggregate in  (truncates the list of temporal items before projection)
     * @param aggregateFn A function similar to the reduce method of the Array.prototpye. It gets called for
     * every start and end of an temporal item of this collection. It must provide two
     * arguments: the first is the aggregation and the second the current value. When a temporal instance starts,
     * the current value is the value set to this temporal instance. Otherwise, if a temporal instance
     * ends the value is null.
     * @param startValue A start parameter for custom aggregation.
     */
    public aggregate(span: Temporal, aggregateFn: Function = null, startValue: any = null): TimespanCollection {
        // create a start and end mark for every temporal
        const marks: TemporalBoundaryMark[] = this.createMarks(span, this._items);
        return this.createAggregationSlices(marks, aggregateFn, startValue);
    }

    /**
     * Creates a start and end mark for every temporal truncated to the valid timespan.
     */
    private createMarks(span: Temporal, items: Temporal[], getLevelFn: Function = null) {
        let marks: TemporalBoundaryMark[] = items.reduce(
            (acc: TemporalBoundaryMark[], item: Temporal): TemporalBoundaryMark[] => {
                // truncate the marks to the given span
                const from: Date = item.from.getTime() < span.from.getTime() ? span.from : item.from;
                const to: Date = item.to.getTime() > span.to.getTime() ? span.to : item.to;
                let origin: Temporal = item;
                if (item instanceof TemporalSlice) {
                    origin = item.origin;
                }
                const level: number = getLevelFn ? getLevelFn(origin) : 0;
                const fromMark: TemporalBoundaryMark = new TemporalBoundaryMark(
                    from,
                    item,
                    TemporalBoundaryMark.TYPE_FROM,
                    level
                );
                const toMark: TemporalBoundaryMark = new TemporalBoundaryMark(
                    to,
                    item,
                    TemporalBoundaryMark.TYPE_TO,
                    level
                );

                acc.push(fromMark);
                acc.push(toMark);

                return acc;
            },
            []
        );
        // sort the marks by their time and level
        marks = _.sortBy(marks, ['index']);
        return marks;
    }

    /**
     * Creates the slices based on the marks from the temporal instances.
     */
    private createProjectionSlices(marks: TemporalBoundaryMark[]) {
        const result: TimespanCollection = new TimespanCollection();
        // stores a stack for every level of temporals which is necessary because
        // there may be overlapping temporals with the same level.
        const levelStackMap: Map<number, TemporalBoundaryMark[]> = new Map();
        let time: Date;
        marks.forEach((mark: TemporalBoundaryMark) => {
            const highestPendingLevel: number = Array.from(levelStackMap.keys()).reduce((p, v) => (v > p ? v : p), -1);
            const pendingStack: TemporalBoundaryMark[] =
                highestPendingLevel > -1 ? levelStackMap.get(highestPendingLevel) : null;
            const pendingMark: TemporalBoundaryMark = pendingStack ? pendingStack[pendingStack.length - 1] : null;

            if (mark.type === TemporalBoundaryMark.TYPE_FROM) {
                // if there is a pending mark and a higher level temporal starts, create a slice for the pending temporal
                if (pendingMark && pendingMark.data <= mark.data) {
                    this.addSlice(result, new TemporalSlice(time, mark.time, pendingMark.origin));
                    time = mark.time;
                }

                // init the time
                if (!pendingMark) {
                    time = mark.time;
                }

                // create the level stack if not present
                if (!levelStackMap.has(mark.data)) {
                    levelStackMap.set(mark.data, []);
                }

                // store the mark in its level stack
                levelStackMap.get(mark.data).push(mark);
            } else {
                // check if its the current pending temporal which ends
                if (pendingMark) {
                    // either the pending marks origin is the same as the current, or
                    // the pending marks origin is at the same level and starts at the
                    // same time as the current mark (exact overlay)
                    if (
                        pendingMark.origin === mark.origin ||
                        (pendingMark.data === mark.data &&
                            pendingMark.origin.from.getTime() === mark.origin.from.getTime())
                    ) {
                        this.addSlice(result, new TemporalSlice(time, mark.time, mark.origin));
                        time = mark.time;
                    }
                }

                // only delete completed levels
                if (levelStackMap.has(mark.data)) {
                    levelStackMap.get(mark.data).pop();
                    // if the stack is complete, remove it from the map
                    if (levelStackMap.get(mark.data).length === 0) {
                        levelStackMap.delete(mark.data);
                    }
                }
            }
        });

        return result;
    }

    private createAggregationSlices(marks: TemporalBoundaryMark[], aggregateFn: Function, startValue: any = null) {
        const result: TimespanCollection = new TimespanCollection();
        let slice: TemporalSlice;
        let counter = 0;
        let aggregation: any = startValue;
        marks.forEach((mark: TemporalBoundaryMark) => {
            if (mark.type === TemporalBoundaryMark.TYPE_FROM) {
                if (slice) {
                    slice.to.setTime(mark.time.getTime());
                    this.addSlice(result, slice);
                }

                aggregation = aggregateFn ? aggregateFn(aggregation, mark.origin) : aggregation + 1;
                slice = new TemporalSlice(mark.time, mark.time, aggregation);
                counter++;
            } else {
                if (slice) {
                    slice.to.setTime(mark.time.getTime());
                    this.addSlice(result, slice);
                    slice = null;
                }
                aggregation = aggregateFn ? aggregateFn(aggregation, null) : aggregation - 1;
                counter--;
                if (counter > 0) {
                    slice = new TemporalSlice(mark.time, mark.time, aggregation);
                }
            }
        });

        return result;
    }

    private addSlice(result: TimespanCollection, slice: TemporalSlice) {
        if (fns.differenceInMilliseconds(slice.to, slice.from) > 0) {
            result.items.push(slice);
        }
    }

    [Symbol.iterator]() {
        let index = -1;
        const data = this._items;

        return {
            next: () => ({ value: data[++index], done: !(index in data) })
        };
    }
}
