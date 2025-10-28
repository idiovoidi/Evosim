import { ComponentType } from "../core/Entity.js";

export class MovementSystem {
  constructor(world) {
    this.world = world;
  }

  update(dt) {
    for (const entity of this.world.getActiveEntities()) {
      if (!entity.hasComponents(ComponentType.POSITION, ComponentType.VELOCITY))
        continue;

      const pos = entity.getComponent(ComponentType.POSITION);
      const vel = entity.getComponent(ComponentType.VELOCITY);
      const stats = entity.getComponent(ComponentType.STATS);

      // Get biome effects if available
      let movementMultiplier = 1.0;
      if (entity.hasComponent(ComponentType.BIOME)) {
        const biomeComp = entity.getComponent(ComponentType.BIOME);
        movementMultiplier = biomeComp.biomeEffects.movementMultiplier;

        // Special handling for fish entities outside water biomes
        if (stats && stats.species === "fish") {
          const currentBiome = biomeComp.currentBiome;
          if (currentBiome !== "water" && currentBiome !== "deep_water") {
            // Fish outside water: reduce movement by 80% or more
            movementMultiplier *= 0.2;
          }
        }

        // Special handling for bird entities with minimal penalties
        if (stats && stats.species === "bird") {
          // Birds have aerial movement, apply minimal penalties (max 5%)
          // If biome would reduce movement, cap the penalty
          if (movementMultiplier < 1.0) {
            movementMultiplier = Math.max(0.95, movementMultiplier);
          }
        }
      }

      // Store old position for QuadTree update
      const oldX = pos.x;
      const oldY = pos.y;

      // Apply movement with biome modifier
      const modifiedDx = vel.dx * movementMultiplier;
      const modifiedDy = vel.dy * movementMultiplier;

      // Update position
      pos.set(pos.x + modifiedDx, pos.y + modifiedDy);

      // Wrap around world boundaries
      if (pos.x < 0) pos.x = this.world.width;
      if (pos.x > this.world.width) pos.x = 0;
      if (pos.y < 0) pos.y = this.world.height;
      if (pos.y > this.world.height) pos.y = 0;

      // Update QuadTree if position changed significantly
      // Note: QuadTree is rebuilt periodically, but we update for large movements
      const dx = pos.x - oldX;
      const dy = pos.y - oldY;
      const distSq = dx * dx + dy * dy;

      // Only update QuadTree for significant movements (> 10 pixels)
      // This reduces overhead while keeping spatial queries accurate
      if (distSq > 100) {
        this.world.quadTree.remove(entity);
        this.world.quadTree.insert(entity, pos);
      }
    }
  }
}
