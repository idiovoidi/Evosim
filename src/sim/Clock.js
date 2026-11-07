import { TAU, clamp } from '../utils/math.js';

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];

/** Simulation time, day/night cycle and seasons. */
export class Clock {
    constructor({ dayLength, daysPerSeason }, seasonalAmplitude) {
        this.dayLength = dayLength;
        this.daysPerSeason = daysPerSeason;
        this.seasonalAmplitude = seasonalAmplitude;
        this.time = dayLength * 0.3;
    }

    advance(dt) {
        this.time += dt;
    }

    get day() {
        return Math.floor(this.time / this.dayLength) + 1;
    }

    /** 0 = midnight, 0.5 = noon. */
    get timeOfDay() {
        return (this.time / this.dayLength) % 1;
    }

    /** 0 at night, 1 at midday, smooth dawn/dusk. */
    get daylight() {
        const sun = Math.sin((this.timeOfDay - 0.25) * TAU);
        return clamp(sun * 1.6 + 0.35, 0, 1);
    }

    get isNight() {
        return this.daylight < 0.25;
    }

    get yearProgress() {
        const yearLength = this.dayLength * this.daysPerSeason * SEASONS.length;
        return (this.time / yearLength) % 1;
    }

    get season() {
        return SEASONS[Math.floor(this.yearProgress * SEASONS.length)];
    }

    get year() {
        const yearLength = this.dayLength * this.daysPerSeason * SEASONS.length;
        return Math.floor(this.time / yearLength) + 1;
    }

    /** Vegetation growth multiplier: peaks in late spring, bottoms out in winter. */
    get growthFactor() {
        const phase = this.yearProgress * TAU;
        return Math.max(0.15, 1 + this.seasonalAmplitude * Math.cos(phase - TAU * 0.2));
    }

    serialize() {
        return { time: this.time };
    }

    restore({ time }) {
        this.time = time;
    }
}
