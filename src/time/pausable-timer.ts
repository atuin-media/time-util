/**
 * This class wraps the setTimeout function and provides the additional
 * methods for pausing and resuming the timeout.
 */
export class PausableTimer {
    // the timestamp the timer has started the last time
    protected startTime: number;
    // the total remaing time of the timeout
    protected remainingTime: number;
    // the id of the current setTimeout call
    protected timerId: any;

    constructor(public callback: () => any, public delay: number) {
        this.remainingTime = delay;
    }

    /**
     * Pause the currently running timeout.
     */
    pause() {
        if (!this.callback) {
            console.warn('timer already destroyed');
            return;
        }
        clearTimeout(this.timerId);
        this.timerId = null;
        this.remainingTime -= new Date().getTime() - this.startTime;
    }

    /**
     * (Re)starts the timeout.
     */
    start() {
        if (!this.callback) {
            console.warn('timer already destroyed');
            return;
        }
        if (!this.timerId) {
            this.startTime = new Date().getTime();
            this.timerId = setTimeout(this.onTimeout.bind(this), this.remainingTime);
        }
    }

    // internal timeout callback
    protected onTimeout() {
        this.callback();
        this.destroy();
    }

    /**
     * Destroys the timeout when it completes.
     */
    protected destroy() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
        this.callback = null;
    }
}
