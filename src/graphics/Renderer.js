import { ComponentType } from "../core/Entity.js";
import { VisualIndicatorSystem } from "./VisualIndicatorSystem.js";
import { DebugRenderer } from "./DebugRenderer.js";
import { HeatmapRenderer } from "./HeatmapRenderer.js";

export class Renderer {
  constructor(ctx, world) {
    this.ctx = ctx;
    this.world = world;
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1.0,
    };
    this.cullingMargin = 50; // Render slightly off-screen entities
    this.culledEntityCount = 0; // Track culled entities for performance monitoring
    this.lastDrawCallCount = 0; // Track draw calls for performance monitoring
    this.lastEntityCount = 0; // Track entity count for draw call comparison
    this.batchingEnabled = true; // Allow toggling batching for comparison
    this.lodDistance = 2000; // Distance threshold for LOD (configurable)
    this.lodEnabled = false; // LOD disabled by default for full detail
    this.showDetailedPerformance = false; // Toggle for detailed performance view
    
    // Initialize visual indicator system
    this.visualIndicators = new VisualIndicatorSystem(this);
    
    // Initialize debug renderer
    this.debugRenderer = new DebugRenderer(world, this);
    
    // Initialize heatmap renderer
    this.heatmapRenderer = new HeatmapRenderer(world);
  }

  setZoom(zoom) {
    this.camera.zoom = zoom;
  }

  /**
   * Handle world resize events
   * @param {number} width - New world width
   * @param {number} height - New world height
   */
  resize(width, height) {
    // Resize heatmap renderer
    this.heatmapRenderer.resize(width, height);
  }

  /**
   * Set the LOD distance threshold
   * @param {number} distance - Distance in pixels beyond which entities are rendered simply
   */
  setLODDistance(distance) {
    this.lodDistance = distance;
  }

  /**
   * Enable or disable LOD system
   * @param {boolean} enabled - Whether LOD should be enabled
   */
  setLODEnabled(enabled) {
    this.lodEnabled = enabled;
  }

  /**
   * Get LOD configuration
   * @returns {Object} - LOD settings
   */
  getLODSettings() {
    return {
      enabled: this.lodEnabled,
      distance: this.lodDistance,
    };
  }

  /**
   * Calculate distance from camera center to entity position
   * @param {Object} position - Entity position {x, y}
   * @returns {number} - Distance in pixels (screen space)
   */
  getDistanceFromCamera(position) {
    const canvas = this.ctx.canvas;
    
    // Calculate camera center in world space
    const cameraCenterX = (-this.camera.x + canvas.width / 2) / this.camera.zoom;
    const cameraCenterY = (-this.camera.y + canvas.height / 2) / this.camera.zoom;
    
    // Calculate distance
    const dx = position.x - cameraCenterX;
    const dy = position.y - cameraCenterY;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Get a color for an entity based on its species
   * Used for LOD rendering of distant entities
   * @param {Entity} entity - Entity to get color for
   * @returns {string} - CSS color string
   */
  getEntityColor(entity) {
    const appearance = entity.getComponent(ComponentType.APPEARANCE);
    
    // Map emojis to colors for distant rendering
    const colorMap = {
      '🐰': '#C8A882', // Herbivore - tan/brown
      '🦊': '#FF6B35', // Predator - orange/red
      '🌿': '#4CAF50', // Plant - green
      '🐟': '#2196F3', // Fish - blue
      '🦅': '#8B4513', // Bird - brown
    };
    
    return colorMap[appearance.emoji] || '#888888'; // Default gray
  }

  /**
   * Check if an entity is within the visible viewport
   * @param {Object} position - Entity position {x, y}
   * @param {number} size - Entity size
   * @returns {boolean} - True if entity is visible or near viewport
   */
  isInViewport(position, size) {
    const canvas = this.ctx.canvas;

    // Calculate viewport bounds in world space
    const viewportLeft = -this.camera.x / this.camera.zoom;
    const viewportTop = -this.camera.y / this.camera.zoom;
    const viewportRight = viewportLeft + canvas.width / this.camera.zoom;
    const viewportBottom = viewportTop + canvas.height / this.camera.zoom;

    // Add margin to render slightly off-screen entities
    const margin = this.cullingMargin / this.camera.zoom;
    const halfSize = size / 2;

    // Check if entity bounds intersect with viewport (with margin)
    return (
      position.x + halfSize > viewportLeft - margin &&
      position.x - halfSize < viewportRight + margin &&
      position.y + halfSize > viewportTop - margin &&
      position.y - halfSize < viewportBottom + margin
    );
  }

  render() {
    const ctx = this.ctx;
    const canvas = ctx.canvas;

    // Begin render timing
    this.world.performanceMonitor.beginSection('render');

    // Reset culled entity count for this frame
    this.culledEntityCount = 0;

    // Update visual indicators (position history, effects)
    // Use a fixed dt of 16ms (60fps) for consistent animation
    this.visualIndicators.update(0.016);

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();

    // Apply camera transform
    ctx.translate(this.camera.x, this.camera.y);
    ctx.scale(this.camera.zoom, this.camera.zoom);

    // Render terrain
    this.renderTerrain();

    // Render heatmap overlay (after terrain, before entities)
    this.heatmapRenderer.render(ctx);

    // Sort entities by layer
    const entities = this.world
      .getActiveEntities()
      .filter((e) => e.hasComponent(ComponentType.APPEARANCE))
      .sort((a, b) => {
        const layerA = a.getComponent(ComponentType.APPEARANCE).layer;
        const layerB = b.getComponent(ComponentType.APPEARANCE).layer;
        return layerA - layerB;
      });

    // Render entities using batching
    this.renderEntitiesBatched(entities);

    // Render visual indicators (state indicators, relationships, trails)
    this.visualIndicators.render(ctx);

    // Render effects
    this.renderEffects(entities);

    // Render debug visualizations (before restoring camera transform)
    this.debugRenderer.render(ctx);

    ctx.restore();
    
    // End render timing
    this.world.performanceMonitor.endSection('render');
    
    // End frame timing
    this.world.performanceMonitor.endFrame();
    
    // Render performance overlay (after camera transform is restored)
    this.world.performanceMonitor.render(ctx, this.showDetailedPerformance || false);
  }

  renderTerrain() {
    const terrain = this.world.terrain;
    const ctx = this.ctx;

    for (let y = 0; y < terrain.tilesY; y++) {
      for (let x = 0; x < terrain.tilesX; x++) {
        const tile = terrain.terrainMap[y][x];
        const color = terrain.getTerrainColor(tile.type);

        ctx.fillStyle = color;
        ctx.fillRect(
          x * terrain.tileSize,
          y * terrain.tileSize,
          terrain.tileSize,
          terrain.tileSize
        );
      }
    }
  }

  /**
   * Render entities using batching to reduce draw calls
   * Groups entities by emoji and size, then renders each batch with a single style setup
   * Implements LOD system to render distant entities as simple shapes
   * @param {Array} entities - Array of entities to render
   */
  renderEntitiesBatched(entities) {
    const ctx = this.ctx;

    // Group entities by emoji and size for batching (close entities)
    const batches = new Map();
    // Group distant entities by species color for simple rendering
    const distantBatches = new Map();
    let visibleEntityCount = 0;

    for (const entity of entities) {
      const appearance = entity.getComponent(ComponentType.APPEARANCE);
      if (!appearance.visible) continue;

      const pos = entity.getComponent(ComponentType.POSITION);
      const traits = entity.getComponent(ComponentType.TRAITS);
      const size = 24 * appearance.size * traits.size;

      // Viewport culling - skip entities outside viewport
      if (!this.isInViewport(pos, size)) {
        this.culledEntityCount++;
        continue;
      }

      visibleEntityCount++;

      // LOD: Check distance from camera center
      const distance = this.lodEnabled ? this.getDistanceFromCamera(pos) : 0;

      if (this.lodEnabled && distance > this.lodDistance) {
        // Distant entity - render as simple colored rectangle
        const color = this.getEntityColor(entity);
        
        if (!distantBatches.has(color)) {
          distantBatches.set(color, []);
        }
        
        distantBatches.get(color).push({ pos, size });
      } else {
        // Close entity - render with full detail
        // Create batch key based on emoji and size
        const batchKey = `${appearance.emoji}_${Math.round(size)}`;

        if (!batches.has(batchKey)) {
          batches.set(batchKey, {
            emoji: appearance.emoji,
            size: size,
            entities: [],
          });
        }

        batches.get(batchKey).entities.push(entity);
      }
    }

    // Track draw calls for performance monitoring
    let drawCallCount = 0;

    // Render distant entities as simple colored rectangles (batched by color)
    for (const [color, positions] of distantBatches.entries()) {
      ctx.fillStyle = color;
      
      for (const { pos } of positions) {
        ctx.fillRect(pos.x - 2, pos.y - 2, 4, 4);
      }
      
      drawCallCount++;
    }

    // Render each close entity batch with single style setup
    for (const batch of batches.values()) {
      // Set up font and style once per batch
      ctx.font = `${batch.size}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Render all entities in this batch
      for (const entity of batch.entities) {
        const pos = entity.getComponent(ComponentType.POSITION);
        ctx.fillText(batch.emoji, pos.x, pos.y);
      }

      drawCallCount++;
    }

    // Store metrics for performance monitoring
    this.lastDrawCallCount = drawCallCount;
    this.lastEntityCount = visibleEntityCount;

    // Render health bars and highlights in a second pass (only for close entities)
    // (These can't be batched as effectively due to varying colors)
    for (const batch of batches.values()) {
      for (const entity of batch.entities) {
        this.renderEntityExtras(entity, batch.size);
      }
    }
  }

  /**
   * Render entity health bars and selection highlights
   * @param {Entity} entity - Entity to render extras for
   * @param {number} size - Calculated entity size
   */
  renderEntityExtras(entity, size) {
    const ctx = this.ctx;
    const pos = entity.getComponent(ComponentType.POSITION);
    const stats = entity.getComponent(ComponentType.STATS);

    // Draw health bar
    if (stats) {
      const barWidth = 30;
      const barHeight = 4;
      const healthPercent = stats.energy / stats.maxEnergy;

      ctx.fillStyle = "#333";
      ctx.fillRect(
        pos.x - barWidth / 2,
        pos.y - size / 2 - 8,
        barWidth,
        barHeight
      );

      ctx.fillStyle =
        healthPercent > 0.5
          ? "#4CAF50"
          : healthPercent > 0.25
          ? "#FFC107"
          : "#f44336";
      ctx.fillRect(
        pos.x - barWidth / 2,
        pos.y - size / 2 - 8,
        barWidth * healthPercent,
        barHeight
      );
    }

    // Highlight selected entity
    if (entity === this.world.selectedEntity) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /**
   * Get the number of draw calls in the last frame (for performance monitoring)
   * @returns {number} - Count of draw calls
   */
  getDrawCallCount() {
    return this.lastDrawCallCount || 0;
  }

  /**
   * Get batching statistics for performance monitoring
   * @returns {Object} - Batching statistics including draw call reduction
   */
  getBatchingStats() {
    const reduction =
      this.lastEntityCount > 0
        ? (
            ((this.lastEntityCount - this.lastDrawCallCount) /
              this.lastEntityCount) *
            100
          ).toFixed(1)
        : 0;

    return {
      visibleEntities: this.lastEntityCount,
      drawCalls: this.lastDrawCallCount,
      reduction: `${reduction}%`,
      batchingEnabled: this.batchingEnabled,
    };
  }

  renderEntity(entity) {
    const pos = entity.getComponent(ComponentType.POSITION);
    const appearance = entity.getComponent(ComponentType.APPEARANCE);
    const stats = entity.getComponent(ComponentType.STATS);
    const traits = entity.getComponent(ComponentType.TRAITS);

    if (!appearance.visible) return;

    const ctx = this.ctx;
    const size = 24 * appearance.size * traits.size;

    // Viewport culling - skip entities outside viewport
    if (!this.isInViewport(pos, size)) {
      this.culledEntityCount++;
      return;
    }

    // Draw emoji
    ctx.font = `${size}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(appearance.emoji, pos.x, pos.y);

    // Draw health bar
    if (stats) {
      const barWidth = 30;
      const barHeight = 4;
      const healthPercent = stats.energy / stats.maxEnergy;

      ctx.fillStyle = "#333";
      ctx.fillRect(
        pos.x - barWidth / 2,
        pos.y - size / 2 - 8,
        barWidth,
        barHeight
      );

      ctx.fillStyle =
        healthPercent > 0.5
          ? "#4CAF50"
          : healthPercent > 0.25
          ? "#FFC107"
          : "#f44336";
      ctx.fillRect(
        pos.x - barWidth / 2,
        pos.y - size / 2 - 8,
        barWidth * healthPercent,
        barHeight
      );
    }

    // Highlight selected entity
    if (entity === this.world.selectedEntity) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size / 2 + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderEffects(entities) {
    const ctx = this.ctx;

    for (const entity of entities) {
      const status = entity.getComponent(ComponentType.STATUS);
      if (!status || status.showingHeart <= 0) continue;

      // Decrease heart effect timer over time
      status.showingHeart -= 0.016;
    }
  }

  /**
   * Get the number of entities culled in the last frame
   * @returns {number} - Count of culled entities
   */
  getCulledEntityCount() {
    return this.culledEntityCount;
  }
}
