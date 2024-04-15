export interface TimeUnitFormats {
    tiny?: string;
    short?: string;
    medium?: string;
    long?: string;
}

/**
 * This class represents a unit of time with its duration in milliseconds.
 * For instance the unit has a name of "minute" and a milliseconds value of 60000
 */
export class TimeUnit {
    constructor(
        public name: string,
        public milliseconds: number,
        public formats: { [key: string]: TimeUnitFormats } = {}
    ) {}

    public static MILLISECOND: TimeUnit = new TimeUnit('millisecond', 1);
    public static SECOND: TimeUnit = new TimeUnit('second', 1000);
    public static MINUTE: TimeUnit = new TimeUnit('minute', 60 * 1000);
    public static HOUR: TimeUnit = new TimeUnit('hour', 60 * 60 * 1000);
    public static DAY: TimeUnit = new TimeUnit('day', 24 * 60 * 60 * 1000, {
        de: {
            tiny: 'dd',
            short: 'EE dd',
            medium: 'EE dd.MM.yy',
            long: 'EEEE, dd.MM. y'
        },
        en: {
            tiny: 'd',
            short: 'M/d',
            medium: 'EE MM/dd/yy',
            long: 'EEEE, MM/dd, y'
        }
    });
    public static WEEK: TimeUnit = new TimeUnit('week', 7 * 24 * 60 * 60 * 1000, {
        de: { tiny: 'w', short: 'ww', medium: 'ww yy', long: 'ww y' },
        en: { tiny: 'w', short: 'ww', medium: 'ww yy', long: 'ww y' }
    });
    public static MONTH: TimeUnit = new TimeUnit('month', 31 * 24 * 60 * 60 * 1000);
    public static YEAR: TimeUnit = new TimeUnit('year', 365.25 * 24 * 60 * 60 * 1000);

    /**
     * Returns the time unit associated with the provided name parameter.
     *
     * @param name The name of the time unit in lowercase
     */
    public static fromName(name: string): TimeUnit {
        switch (name) {
            case 'millisecond':
                return TimeUnit.MILLISECOND;
            case 'second':
                return TimeUnit.SECOND;
            case 'minute':
                return TimeUnit.MINUTE;
            case 'hour':
                return TimeUnit.HOUR;
            case 'day':
                return TimeUnit.DAY;
            case 'week':
                return TimeUnit.WEEK;
            case 'month':
                return TimeUnit.MONTH;
            case 'year':
                return TimeUnit.YEAR;
            default:
                throw new Error('unknown time unit name: ' + name);
                return null;
        }
    }
}
