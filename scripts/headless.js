/**
 * Run the simulation without a browser and print a population report.
 *   node scripts/headless.js [simSeconds=1800] [seed=1] [reportEvery=60]
 */
import { Simulation } from '../src/sim/Simulation.js';
import { SPECIES_IDS } from '../src/config/species.js';
import { BIOMES } from '../src/config/biomes.js';

const [secondsArg, seedArg, everyArg] = process.argv.slice(2);
const seconds = Number(secondsArg ?? 1800);
const every = Number(everyArg ?? 60);
const seed = seedArg === undefined ? 1 : Number.isFinite(Number(seedArg)) ? Number(seedArg) : seedArg;

const t0 = performance.now();
const sim = new Simulation({ seed });
const terrain = sim.world.terrain;
const tGen = performance.now() - t0;

const biomeShare = new Map();
for (let i = 0; i < terrain.count; i++) {
    const id = BIOMES[terrain.biome[i]].id;
    biomeShare.set(id, (biomeShare.get(id) ?? 0) + 1);
}
console.log(`terrain ${terrain.cols}x${terrain.rows} generated in ${tGen.toFixed(0)}ms`);
console.log([...biomeShare].map(([id, n]) => `${id}:${((n / terrain.count) * 100).toFixed(1)}%`).join('  '));

const deaths = {};
sim.events.on('death', ({ creature, cause }) => {
    const key = `${creature.speciesId}:${cause}`;
    deaths[key] = (deaths[key] ?? 0) + 1;
});

sim.populate();
const header = ['time', ...SPECIES_IDS, 'veg', 'algae', 'maxGen', 'ms/step'];
console.log(header.join('\t'));

const stepsPerReport = Math.round(every / sim.config.timestep);
for (let t = 0; t < seconds; t += every) {
    const s0 = performance.now();
    for (let i = 0; i < stepsPerReport; i++) sim.step();
    const ms = (performance.now() - s0) / stepsPerReport;
    const w = sim.world;
    console.log([
        Math.round(w.time),
        ...SPECIES_IDS.map((id) => w.counts[id]),
        w.vegetation.totals.land.toFixed(0),
        w.vegetation.totals.water.toFixed(0),
        w.totals.maxGeneration,
        ms.toFixed(2),
    ].join('\t'));
}

console.log('\ndeaths by cause:');
console.log(Object.entries(deaths).sort().map(([k, v]) => `  ${k}: ${v}`).join('\n'));

const latest = sim.stats.latest;
console.log('\nmean genes:');
for (const id of SPECIES_IDS) {
    const t = latest.traits[id];
    if (!t) continue;
    console.log(`  ${id}: ${Object.entries(t).map(([k, v]) => `${k}=${v.toFixed(2)}`).join(' ')}`);
}
