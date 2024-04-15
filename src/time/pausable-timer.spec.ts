import { PausableTimer } from './pausable-timer';

describe('PausableTimer', () => {
    it('should create', (done) => {
        const timer: PausableTimer = new PausableTimer(() => {
            setTimeout(() => {
                timer.start();
                timer.pause();
                done();
            }, 10);
        }, 100);
        expect(timer).toBeTruthy();
        timer.start();
        timer.start();
        timer.pause();
        timer.pause();
        timer.start();
    });
});
