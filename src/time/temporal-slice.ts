/**
 * This class represents a slice of an timespan.
 * It contains a reference to the original temporal instance.
 */
import { Timespan } from './timespan';

export class TemporalSlice extends Timespan {
    public origin: any;

    constructor(from: Date, to: Date, origin: any) {
        super(from, to);
        // in case the origin is itself a temporal slice, directly link to the origin of this slice
        if (origin instanceof TemporalSlice) {
            this.origin = (origin as TemporalSlice).origin;
        } else {
            this.origin = origin;
        }
    }
}
