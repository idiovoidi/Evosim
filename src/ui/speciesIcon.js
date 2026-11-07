import { SPECIES } from '../config/species.js';
import { fitCanvas } from './dom.js';

/**
 * Draw a creature (or a neutral specimen of a species) centred in a small
 * canvas, reusing the world sprite artist.
 */
export function drawPortrait(canvas, artist, creatureOrSpecies, time = 0) {
    const { ctx, width, height } = fitCanvas(canvas);
    ctx.clearRect(0, 0, width, height);
    const c = typeof creatureOrSpecies === 'string' ? specimen(creatureOrSpecies) : creatureOrSpecies;
    const span = c.speciesId === 'bird' ? 6 : c.speciesId === 'predator' ? 4.4 : 3.4;
    const scale = Math.min(width, height) / (c.traits.radius * span);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    artist.draw(ctx, { ...proxy(c), x: 0, y: 0, heading: -Math.PI / 2 }, time);
    ctx.restore();
}

const specimens = new Map();

function specimen(id) {
    if (!specimens.has(id)) {
        const s = SPECIES[id];
        specimens.set(id, {
            speciesId: id,
            species: s,
            radius: s.radius,
            speed: 0,
            animPhase: 0,
            needs: { resting: false },
            mind: { action: 'wander' },
            traits: { radius: s.radius, cruiseSpeed: s.speed / 2, hue: s.palette.hue, saturation: s.palette.sat, lightness: s.palette.light },
        });
    }
    return specimens.get(id);
}

/** A stable stand-in so the artist's style cache keys on the real creature's traits. */
function proxy(c) {
    return {
        speciesId: c.speciesId,
        species: c.species,
        radius: c.traits.radius,
        speed: c.speed,
        animPhase: c.animPhase,
        needs: c.needs,
        mind: c.mind,
        traits: c.traits,
    };
}
