/** Steering helpers: write a unit desired direction and a speed into creature.mind. */

export function steerTowards(c, tx, ty, speed) {
    const dx = tx - c.x;
    const dy = ty - c.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    const m = c.mind;
    if (d > 1e-6) {
        m.desiredX = dx / d;
        m.desiredY = dy / d;
    }
    m.desiredSpeed = speed;
    return d;
}

export function steerAway(c, tx, ty, speed) {
    const dx = c.x - tx;
    const dy = c.y - ty;
    const d = Math.sqrt(dx * dx + dy * dy);
    const m = c.mind;
    if (d > 1e-6) {
        m.desiredX = dx / d;
        m.desiredY = dy / d;
    }
    m.desiredSpeed = speed;
    return d;
}

/** Arrive: like seek but slows inside `slowRadius`. */
export function arrive(c, tx, ty, speed, slowRadius) {
    const d = steerTowards(c, tx, ty, speed);
    if (d < slowRadius) c.mind.desiredSpeed = speed * (d / slowRadius);
    return d;
}

/** Blend the cached flocking vector into the desired direction. */
export function addFlocking(c, weight) {
    const m = c.mind;
    m.desiredX += m.flockX * weight;
    m.desiredY += m.flockY * weight;
    const len = Math.sqrt(m.desiredX * m.desiredX + m.desiredY * m.desiredY);
    if (len > 1e-6) {
        m.desiredX /= len;
        m.desiredY /= len;
    }
}

export function stop(c) {
    c.mind.desiredSpeed = 0;
}

/** Sprint when there is stamina left, otherwise fall back to cruising. */
export function chaseSpeed(c) {
    if (c.needs.stamina > 0.05) {
        c.needs.sprinting = true;
        return c.traits.maxSpeed;
    }
    return c.traits.cruiseSpeed;
}
