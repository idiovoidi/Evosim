import { ComponentType } from '../core/Entity.js';

/**
 * VisualIndicatorSystem - Renders visual feedback for entity states and actions
 * 
 * This system manages and renders various visual indicators including:
 * - State indicators (hungry, fleeing, hunting, eating, reproducing)
 * - Relationship lines (predator-prey connections)
 * - Motion trails for fast-moving entities
 * - Detection ranges and danger zones
 */
export class VisualIndicatorSystem {
    constructor(renderer) {
        this.renderer = renderer;
        this.world = renderer.world;
        this.enabled = true;
        
        // Active visual effects (trails, temporary indicators, etc.)
        this.effects = [];
        
        // Configuration for different indicator types
        this.indicatorConfig = {
            hungry: { icon: '🍖', color: '#FFA500', offset: -25 },
            fleeing: { icon: '😰', color: '#FF0000', offset: -25 },
            hunting: { icon: '🎯', color: '#FF4444', offset: -25 },
            eating: { icon: '🍽️', color: '#00FF00', offset: -25 },
            reproducing: { icon: '💕', color: '#FF69B4', offset: -30 },
            attacking: { icon: '⚔️', color: '#FF0000', offset: -25 },
            seeking_food: { icon: '🔍', color: '#FFD700', offset: -25 },
            wandering: null, // No indicator for wandering
            swimming: null, // No indicator for swimming
            soaring: null // No indicator for soaring
        };
        
        // Relationship visualization settings
        this.relationshipConfig = {
            predatorPrey: { color: '#FF0000', dash: [5, 5], width: 1 },
            dangerRadius: { color: '#FFFF00', alpha: 0.1, width: 1 },
            senseRange: { color: '#00FF00', alpha: 0.2, width: 1 }
        };
        
        // Motion trail settings
        this.trailConfig = {
            maxLength: 10,
            fadeRate: 0.1,
            minVelocity: 2.0
        };
        
        // Track entity position history for trails
        this.positionHistory = new Map();
    }
    
    /**
     * Enable or disable the visual indicator system
     * @param {boolean} enabled - Whether indicators should be rendered
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    /**
     * Update the visual indicator system
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (!this.enabled) return;
        
        // Update active effects (fade out, remove expired)
        this.effects = this.effects.filter(effect => {
            effect.age += dt;
            return effect.age < effect.maxAge;
        });
        
        // Update position history for motion trails
        this.updatePositionHistory();
    }
    
    /**
     * Update position history for all entities to enable motion trails
     */
    updatePositionHistory() {
        const entities = this.world.getActiveEntities();
        
        for (const entity of entities) {
            if (!entity.hasComponents(ComponentType.POSITION, ComponentType.VELOCITY)) continue;
            
            const pos = entity.getComponent(ComponentType.POSITION);
            const vel = entity.getComponent(ComponentType.VELOCITY);
            
            // Calculate speed
            const speed = Math.sqrt(vel.dx * vel.dx + vel.dy * vel.dy);
            
            // Only track fast-moving entities
            if (speed < this.trailConfig.minVelocity) {
                this.positionHistory.delete(entity.id);
                continue;
            }
            
            // Get or create history array
            if (!this.positionHistory.has(entity.id)) {
                this.positionHistory.set(entity.id, []);
            }
            
            const history = this.positionHistory.get(entity.id);
            
            // Check for significant direction change
            if (history.length >= 2) {
                const prev = history[history.length - 1];
                const prevPrev = history[history.length - 2];
                
                // Calculate previous direction vector
                const prevDx = prev.x - prevPrev.x;
                const prevDy = prev.y - prevPrev.y;
                const prevSpeed = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
                
                // Calculate current direction vector
                const currDx = pos.x - prev.x;
                const currDy = pos.y - prev.y;
                const currSpeed = Math.sqrt(currDx * currDx + currDy * currDy);
                
                // Normalize and calculate dot product to detect direction change
                if (prevSpeed > 0.1 && currSpeed > 0.1) {
                    const prevNormX = prevDx / prevSpeed;
                    const prevNormY = prevDy / prevSpeed;
                    const currNormX = currDx / currSpeed;
                    const currNormY = currDy / currSpeed;
                    
                    const dotProduct = prevNormX * currNormX + prevNormY * currNormY;
                    
                    // If dot product < 0.5, direction changed by more than 60 degrees
                    // Clear trail to avoid confusing visual artifacts
                    if (dotProduct < 0.5) {
                        history.length = 0; // Clear the trail
                    }
                }
            }
            
            // Add current position
            history.push({ x: pos.x, y: pos.y, time: Date.now() });
            
            // Limit history length
            if (history.length > this.trailConfig.maxLength) {
                history.shift();
            }
        }
        
        // Clean up history for inactive entities
        const activeIds = new Set(entities.map(e => e.id));
        for (const id of this.positionHistory.keys()) {
            if (!activeIds.has(id)) {
                this.positionHistory.delete(id);
            }
        }
    }
    
    /**
     * Render all visual indicators
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    render(ctx) {
        if (!this.enabled) return;
        
        const entities = this.world.getActiveEntities();
        
        // Render motion trails first (behind entities)
        this.renderMotionTrails(ctx, entities);
        
        // Render relationship lines
        this.renderRelationships(ctx, entities);
        
        // Render interaction highlights for hovered entity
        this.renderInteractionHighlights(ctx, entities);
        
        // Render state indicators for each entity
        for (const entity of entities) {
            this.renderIndicators(ctx, entity);
        }
        
        // Render active effects
        this.renderEffects(ctx);
    }
    
    /**
     * Render state indicators for a specific entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Entity} entity - Entity to render indicators for
     */
    renderIndicators(ctx, entity) {
        if (!entity.hasComponents(ComponentType.POSITION, ComponentType.STATUS, ComponentType.STATS)) {
            return;
        }
        
        const pos = entity.getComponent(ComponentType.POSITION);
        const status = entity.getComponent(ComponentType.STATUS);
        const stats = entity.getComponent(ComponentType.STATS);
        const appearance = entity.getComponent(ComponentType.APPEARANCE);
        const traits = entity.getComponent(ComponentType.TRAITS);
        
        if (!appearance || !appearance.visible) return;
        
        // Check if entity is in viewport
        const size = 24 * appearance.size * traits.size;
        if (!this.renderer.isInViewport(pos, size)) return;
        
        // Determine which indicator to show based on state and energy
        let indicatorType = null;
        
        // Priority: reproducing > hungry > state-based indicators
        if (status.showingHeart > 0) {
            indicatorType = 'reproducing';
        } else if (stats.energy < stats.maxEnergy * 0.3) {
            indicatorType = 'hungry';
        } else if (status.state && this.indicatorConfig[status.state]) {
            indicatorType = status.state;
        }
        
        // Render the indicator
        if (indicatorType) {
            const config = this.indicatorConfig[indicatorType];
            this.renderIndicator(ctx, pos, config, size);
        }
    }
    
    /**
     * Render a single indicator icon
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} position - Entity position {x, y}
     * @param {Object} config - Indicator configuration {icon, color, offset}
     * @param {number} entitySize - Size of the entity
     */
    renderIndicator(ctx, position, config, entitySize) {
        const x = position.x;
        const y = position.y + config.offset;
        
        ctx.save();
        
        // Draw icon
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(config.icon, x, y);
        
        ctx.restore();
    }
    
    /**
     * Render relationship lines between entities
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Array} entities - Array of entities
     */
    renderRelationships(ctx, entities) {
        // Render predator-prey connections
        for (const entity of entities) {
            if (!entity.hasComponents(ComponentType.POSITION, ComponentType.STATUS, ComponentType.STATS)) {
                continue;
            }
            
            const stats = entity.getComponent(ComponentType.STATS);
            const status = entity.getComponent(ComponentType.STATUS);
            const pos = entity.getComponent(ComponentType.POSITION);
            
            // Draw line from predator to prey when hunting
            if ((stats.species === 'predator' || stats.species === 'bird') && 
                (status.state === 'hunting' || status.state === 'attacking')) {
                
                // Find the target prey
                const traits = entity.getComponent(ComponentType.TRAITS);
                const senseRadius = (stats.species === 'predator' ? 300 : 250) * traits.senseRadius;
                const nearby = this.world.getNearbyEntities(pos, senseRadius);
                
                const preySpecies = stats.species === 'predator' ? 'herbivore' : ['fish', 'herbivore'];
                const prey = nearby.filter(n => {
                    const targetSpecies = n.entity.getComponent(ComponentType.STATS)?.species;
                    return Array.isArray(preySpecies) 
                        ? preySpecies.includes(targetSpecies)
                        : targetSpecies === preySpecies;
                });
                
                if (prey.length > 0) {
                    const targetPos = prey[0].entity.getComponent(ComponentType.POSITION);
                    this.renderPredatorPreyLine(ctx, pos, targetPos);
                }
            }
        }
        
        // Render danger radius and sense range for selected entity
        const selectedEntity = this.world.selectedEntity;
        if (selectedEntity && selectedEntity.hasComponents(ComponentType.POSITION, ComponentType.STATS, ComponentType.TRAITS)) {
            const pos = selectedEntity.getComponent(ComponentType.POSITION);
            const stats = selectedEntity.getComponent(ComponentType.STATS);
            const traits = selectedEntity.getComponent(ComponentType.TRAITS);
            
            // Render sense range
            const senseRadius = this.getSenseRadius(stats.species, traits);
            this.renderSenseRange(ctx, pos, senseRadius);
            
            // If herbivore, show danger zones around nearby predators
            if (stats.species === 'herbivore') {
                const nearby = this.world.getNearbyEntities(pos, senseRadius);
                const predators = nearby.filter(n => 
                    n.entity.getComponent(ComponentType.STATS)?.species === 'predator'
                );
                
                for (const predator of predators) {
                    const predatorPos = predator.entity.getComponent(ComponentType.POSITION);
                    this.renderDangerRadius(ctx, predatorPos, 150);
                }
            }
        }
    }
    
    /**
     * Get sense radius for a species
     * @param {string} species - Species type
     * @param {Object} traits - Entity traits
     * @returns {number} - Sense radius
     */
    getSenseRadius(species, traits) {
        const baseRadius = {
            herbivore: 200,
            predator: 300,
            plant: 0,
            fish: 100,
            bird: 250
        };
        
        return (baseRadius[species] || 100) * traits.senseRadius;
    }
    
    /**
     * Render a line from predator to prey
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} from - Start position {x, y}
     * @param {Object} to - End position {x, y}
     */
    renderPredatorPreyLine(ctx, from, to) {
        const config = this.relationshipConfig.predatorPrey;
        
        ctx.save();
        ctx.strokeStyle = config.color;
        ctx.lineWidth = config.width;
        ctx.setLineDash(config.dash);
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * Render danger radius around a position
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} position - Center position {x, y}
     * @param {number} radius - Radius of danger zone
     */
    renderDangerRadius(ctx, position, radius) {
        const config = this.relationshipConfig.dangerRadius;
        
        ctx.save();
        ctx.strokeStyle = config.color;
        ctx.fillStyle = config.color;
        ctx.globalAlpha = config.alpha;
        ctx.lineWidth = config.width;
        
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * Render sense range around a position
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} position - Center position {x, y}
     * @param {number} radius - Sense radius
     */
    renderSenseRange(ctx, position, radius) {
        const config = this.relationshipConfig.senseRange;
        
        ctx.save();
        ctx.strokeStyle = config.color;
        ctx.fillStyle = config.color;
        ctx.globalAlpha = config.alpha;
        ctx.lineWidth = config.width;
        
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * Render motion trails for fast-moving entities
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Array} entities - Array of entities
     */
    renderMotionTrails(ctx, entities) {
        for (const entity of entities) {
            if (!this.positionHistory.has(entity.id)) continue;
            
            const history = this.positionHistory.get(entity.id);
            if (history.length < 2) continue;
            
            const stats = entity.getComponent(ComponentType.STATS);
            const appearance = entity.getComponent(ComponentType.APPEARANCE);
            
            if (!appearance || !appearance.visible) continue;
            
            // Get species color
            const color = this.getSpeciesColor(stats.species);
            
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            // Draw trail with fading alpha
            for (let i = 0; i < history.length - 1; i++) {
                const alpha = (i / history.length) * 0.5; // Fade from 0 to 0.5
                ctx.globalAlpha = alpha;
                
                ctx.beginPath();
                ctx.moveTo(history[i].x, history[i].y);
                ctx.lineTo(history[i + 1].x, history[i + 1].y);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    /**
     * Get color for a species (for trails)
     * @param {string} species - Species type
     * @returns {string} - CSS color string
     */
    getSpeciesColor(species) {
        const colorMap = {
            herbivore: '#C8A882',
            predator: '#FF6B35',
            plant: '#4CAF50',
            fish: '#2196F3',
            bird: '#8B4513'
        };
        
        return colorMap[species] || '#888888';
    }
    
    /**
     * Render active visual effects
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     */
    renderEffects(ctx) {
        for (const effect of this.effects) {
            const alpha = 1.0 - (effect.age / effect.maxAge);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            
            switch (effect.type) {
                case 'indicator':
                    this.renderEffectIndicator(ctx, effect);
                    break;
                case 'circle':
                    this.renderEffectCircle(ctx, effect);
                    break;
                case 'line':
                    this.renderEffectLine(ctx, effect);
                    break;
            }
            
            ctx.restore();
        }
    }
    
    /**
     * Render an indicator effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} effect - Effect data
     */
    renderEffectIndicator(ctx, effect) {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = effect.data.color || '#FFFFFF';
        ctx.fillText(effect.data.icon, effect.position.x, effect.position.y);
    }
    
    /**
     * Render a circle effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} effect - Effect data
     */
    renderEffectCircle(ctx, effect) {
        ctx.strokeStyle = effect.data.color || '#FFFFFF';
        ctx.lineWidth = effect.data.width || 2;
        
        ctx.beginPath();
        ctx.arc(effect.position.x, effect.position.y, effect.data.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    /**
     * Render a line effect
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} effect - Effect data
     */
    renderEffectLine(ctx, effect) {
        ctx.strokeStyle = effect.data.color || '#FFFFFF';
        ctx.lineWidth = effect.data.width || 2;
        
        if (effect.data.dash) {
            ctx.setLineDash(effect.data.dash);
        }
        
        ctx.beginPath();
        ctx.moveTo(effect.position.x, effect.position.y);
        ctx.lineTo(effect.data.target.x, effect.data.target.y);
        ctx.stroke();
    }
    
    /**
     * Add a temporary visual effect
     * @param {string} type - Effect type ('indicator', 'circle', 'line', 'trail')
     * @param {Object} position - Effect position {x, y}
     * @param {Object} data - Effect-specific data
     * @param {number} duration - Effect duration in seconds (default: 1.0)
     */
    addEffect(type, position, data, duration = 1.0) {
        this.effects.push({
            type,
            position: { ...position },
            data: { ...data },
            age: 0,
            maxAge: duration
        });
    }
    
    /**
     * Render interaction highlights for hovered or selected entity
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Array} entities - Array of all entities
     */
    renderInteractionHighlights(ctx, entities) {
        // Use hovered entity if available, otherwise use selected entity
        const targetEntity = this.world.hoveredEntity || this.world.selectedEntity;
        
        if (!targetEntity || !targetEntity.hasComponents(ComponentType.POSITION, ComponentType.STATS, ComponentType.TRAITS)) {
            return;
        }
        
        const targetPos = targetEntity.getComponent(ComponentType.POSITION);
        const targetStats = targetEntity.getComponent(ComponentType.STATS);
        const targetTraits = targetEntity.getComponent(ComponentType.TRAITS);
        
        // Get sense radius for the target entity
        const senseRadius = this.getSenseRadius(targetStats.species, targetTraits);
        
        // Find nearby entities within sense range
        const nearby = this.world.getNearbyEntities(targetPos, senseRadius);
        
        // Highlight each nearby entity based on interaction type
        for (const nearbyData of nearby) {
            const nearbyEntity = nearbyData.entity;
            
            // Skip self
            if (nearbyEntity === targetEntity) continue;
            
            // Skip entities without required components
            if (!nearbyEntity.hasComponents(ComponentType.POSITION, ComponentType.STATS)) continue;
            
            const nearbyPos = nearbyEntity.getComponent(ComponentType.POSITION);
            const nearbyStats = nearbyEntity.getComponent(ComponentType.STATS);
            
            // Determine interaction type
            const interactionType = this.getInteractionType(targetStats, nearbyStats);
            
            if (interactionType) {
                this.renderEntityHighlight(ctx, nearbyPos, interactionType);
            }
        }
    }
    
    /**
     * Determine the interaction type between two entities
     * @param {Object} entityStats - Stats component of the first entity
     * @param {Object} targetStats - Stats component of the second entity
     * @returns {string|null} - Interaction type: 'food', 'threat', 'mate', or null
     */
    getInteractionType(entityStats, targetStats) {
        const entitySpecies = entityStats.species;
        const targetSpecies = targetStats.species;
        
        // Food interactions
        if (entitySpecies === 'herbivore' && targetSpecies === 'plant') {
            return 'food';
        }
        if (entitySpecies === 'predator' && targetSpecies === 'herbivore') {
            return 'food';
        }
        if (entitySpecies === 'bird' && (targetSpecies === 'fish' || targetSpecies === 'herbivore')) {
            return 'food';
        }
        if (entitySpecies === 'fish' && targetSpecies === 'plant') {
            return 'food';
        }
        
        // Threat interactions
        if (entitySpecies === 'herbivore' && targetSpecies === 'predator') {
            return 'threat';
        }
        if (entitySpecies === 'fish' && targetSpecies === 'bird') {
            return 'threat';
        }
        if (entitySpecies === 'herbivore' && targetSpecies === 'bird') {
            return 'threat';
        }
        
        // Mate interactions (same species)
        if (entitySpecies === targetSpecies && targetSpecies !== 'plant') {
            return 'mate';
        }
        
        return null;
    }
    
    /**
     * Render a highlight around an entity based on interaction type
     * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
     * @param {Object} position - Entity position {x, y}
     * @param {string} interactionType - Type of interaction: 'food', 'threat', 'mate'
     */
    renderEntityHighlight(ctx, position, interactionType) {
        // Color coding for interaction types
        const colors = {
            food: '#4CAF50',      // Green for food
            threat: '#FF5252',    // Red for threats
            mate: '#FF69B4'       // Pink for potential mates
        };
        
        const color = colors[interactionType] || '#FFFFFF';
        const radius = 20; // Highlight radius
        
        ctx.save();
        
        // Draw outer glow
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.6;
        
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw inner glow
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius - 3, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw filled circle with low alpha
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.1;
        
        ctx.beginPath();
        ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
