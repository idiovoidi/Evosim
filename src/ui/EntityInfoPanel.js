import { ComponentType } from "../core/Entity.js";

/**
 * Enhanced entity information panel with detailed stats and visual trait bars
 */
export class EntityInfoPanel {
  constructor(world) {
    this.world = world;
    this.panel = document.getElementById("entity-info");
    this.detailsDiv = document.getElementById("entity-details");

    // Behavior state descriptions
    this.behaviorDescriptions = {
      idle: "Resting and conserving energy",
      wandering: "Exploring the environment",
      seeking_food: "Searching for food sources",
      eating: "Consuming food to restore energy",
      fleeing: "Escaping from a predator",
      hunting: "Pursuing prey",
      reproducing: "Creating offspring",
      migrating: "Moving to a new area",
      drinking: "Replenishing water",
      sleeping: "Recovering energy",
    };
  }

  /**
   * Update the entity info panel display
   */
  update() {
    const entity = this.world.selectedEntity;

    if (!entity || !entity.active) {
      this.panel.style.display = "none";
      this.world.selectedEntity = null;
      return;
    }

    this.panel.style.display = "block";

    const stats = entity.getComponent(ComponentType.STATS);
    const pos = entity.getComponent(ComponentType.POSITION);
    const vel = entity.getComponent(ComponentType.VELOCITY);
    const status = entity.getComponent(ComponentType.STATUS);
    const traits = entity.getComponent(ComponentType.TRAITS);
    const genetics = entity.getComponent(ComponentType.GENETICS);

    // Build the enhanced info panel HTML
    let html = this.buildBasicInfo(stats, pos, vel, status);

    // Add territory statistics section
    const territory = entity.getComponent(ComponentType.TERRITORY);
    const thirst = entity.getComponent(ComponentType.THIRST);
    if (territory || thirst) {
      html += this.buildResourceCompetitionInfo(entity, territory, thirst, pos);
    }

    // Add biome information section
    const biome = entity.getComponent(ComponentType.BIOME);
    const habitat = entity.getComponent(ComponentType.HABITAT);
    if (biome) {
      html += this.buildBiomeInfo(biome, habitat, pos);
    }

    if (traits && genetics) {
      html += this.buildTraitBars(traits);
    }

    // Add action history section
    html += this.buildActionHistory(status);

    this.detailsDiv.innerHTML = html;
  }

  /**
   * Build basic entity information section
   */
  buildBasicInfo(stats, pos, vel, status) {
    const speed = Math.sqrt(vel.dx * vel.dx + vel.dy * vel.dy);
    const energyPercent = (stats.energy / stats.maxEnergy) * 100;
    const behaviorDesc =
      this.behaviorDescriptions[status.state] || "Unknown behavior";

    // Get generation from stats
    const generation = stats.generation || 1;

    return `
            <div style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="font-size: 16px;">${this.getSpeciesEmoji(
                      stats.species
                    )} ${this.capitalize(stats.species)}</strong>
                    <span style="color: #888; font-size: 11px;">Gen ${generation}</span>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="color: #aaa; font-size: 12px;">Energy</span>
                    <span style="font-size: 12px; font-weight: bold; color: ${this.getEnergyColor(
                      energyPercent
                    )};">
                        ${Math.round(stats.energy)}/${stats.maxEnergy}
                    </span>
                </div>
                <div style="background: #1a1a1a; height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="
                        width: ${energyPercent}%; 
                        height: 100%; 
                        background: ${this.getEnergyGradient(energyPercent)};
                        transition: width 0.3s ease;
                    "></div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px; padding: 10px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid ${this.getStateColor(
              status.state
            )};">
                <div style="font-size: 11px; color: #888; margin-bottom: 3px;">CURRENT STATE</div>
                <div style="font-weight: bold; font-size: 13px; margin-bottom: 3px;">${this.capitalize(
                  status.state.replace("_", " ")
                )}</div>
                <div style="font-size: 11px; color: #aaa; font-style: italic;">${behaviorDesc}</div>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; font-size: 12px;">
                <div>
                    <div style="color: #888;">Age</div>
                    <div style="font-weight: bold;">${Math.round(
                      stats.age
                    )}s</div>
                </div>
                <div>
                    <div style="color: #888;">Speed</div>
                    <div style="font-weight: bold;">${speed.toFixed(1)}</div>
                </div>
                <div>
                    <div style="color: #888;">Position</div>
                    <div style="font-weight: bold; font-size: 10px;">(${Math.round(
                      pos.x
                    )}, ${Math.round(pos.y)})</div>
                </div>
                <div>
                    <div style="color: #888;">Generation</div>
                    <div style="font-weight: bold;">${generation}</div>
                </div>
            </div>
        `;
  }

  /**
   * Build resource competition information section
   */
  buildResourceCompetitionInfo(entity, territory, thirst, pos) {
    let html = `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;">
        <div style="font-size: 12px; color: #888; margin-bottom: 10px; font-weight: bold;">RESOURCE COMPETITION</div>
    `;

    // Territory information
    if (territory) {
      const territoryColor = territory.conflictCount > 0 ? '#F44336' : '#FFD700';
      html += `
        <div style="margin-bottom: 12px; padding: 10px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid ${territoryColor};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <div style="font-size: 11px; color: #888; margin-bottom: 2px;">TERRITORY</div>
              <div style="font-weight: bold; font-size: 13px; color: ${territoryColor};">Claimed</div>
            </div>
            <div style="font-size: 11px; color: #aaa;">
              Radius: ${Math.round(territory.radius)}
            </div>
          </div>
      `;
      
      if (territory.conflictCount > 0) {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #2a2a2a;">
            <span style="font-size: 11px; color: #aaa;">⚔️ Conflicts</span>
            <span style="font-size: 11px; font-weight: bold; color: #F44336;">${territory.conflictCount}</span>
          </div>
        `;
      }
      
      html += `</div>`;
    } else {
      // Show "Territory: None" for land entities that could have territory
      const stats = entity.getComponent(ComponentType.STATS);
      if (stats && (stats.species === 'herbivore' || stats.species === 'predator')) {
        html += `
          <div style="margin-bottom: 12px; padding: 10px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid #666;">
            <div style="font-size: 11px; color: #888; margin-bottom: 2px;">TERRITORY</div>
            <div style="font-weight: bold; font-size: 13px; color: #666;">None</div>
          </div>
        `;
      }
    }

    // Thirst information
    if (thirst) {
      const thirstPercent = (thirst.thirst / thirst.maxThirst) * 100;
      let thirstColor = '#4CAF50'; // Green
      if (thirstPercent < 30) {
        thirstColor = '#F44336'; // Red
      } else if (thirstPercent < 60) {
        thirstColor = '#FFC107'; // Yellow
      }
      
      html += `
        <div style="margin-bottom: 12px; padding: 10px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid ${thirstColor};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <div style="font-size: 11px; color: #888; margin-bottom: 2px;">THIRST</div>
              <div style="font-weight: bold; font-size: 13px; color: ${thirstColor};">${Math.round(thirstPercent)}%</div>
            </div>
            <div style="font-size: 11px; color: #aaa;">
              ${thirst.isDrinking ? '💧 Drinking' : ''}
            </div>
          </div>
          <div style="background: #0a0a0a; height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="
              width: ${thirstPercent}%; 
              height: 100%; 
              background: linear-gradient(90deg, ${thirstColor}88, ${thirstColor});
              transition: width 0.3s ease;
            "></div>
          </div>
        </div>
      `;
    }

    // Grazing pressure information (for all entities)
    if (this.world.grazingPressureGrid) {
      const pressure = this.world.grazingPressureGrid.getPressure(pos.x, pos.y);
      let pressureColor = '#4CAF50'; // Green
      if (pressure > 15) {
        pressureColor = '#F44336'; // Red
      } else if (pressure > 5) {
        pressureColor = '#FFC107'; // Yellow
      }
      
      html += `
        <div style="margin-bottom: 12px; padding: 10px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid ${pressureColor};">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 11px; color: #888; margin-bottom: 2px;">GRAZING PRESSURE</div>
              <div style="font-weight: bold; font-size: 13px; color: ${pressureColor};">${pressure.toFixed(1)}</div>
            </div>
            <div style="font-size: 11px; color: #aaa;">
              ${pressure < 5 ? '✓ Low' : pressure < 15 ? '⚠ Medium' : '✗ High'}
            </div>
          </div>
        </div>
      `;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Build biome information section
   */
  buildBiomeInfo(biome, habitat, pos) {
    // Get current biome from world
    const currentBiome = this.world.biomeGenerator.getBiomeAt(pos.x, pos.y);
    
    if (!currentBiome) {
      return '';
    }

    const preference = habitat ? habitat.getPreference(currentBiome.id) : 1.0;
    const isPreferred = habitat ? habitat.isPreferred(currentBiome.id) : false;
    const isAvoided = habitat ? habitat.isAvoided(currentBiome.id) : false;
    
    // Determine preference status and color
    let preferenceStatus = 'Neutral';
    let preferenceColor = '#888';
    let preferenceIcon = '○';
    
    if (isPreferred) {
      preferenceStatus = 'Preferred';
      preferenceColor = '#4CAF50';
      preferenceIcon = '●';
    } else if (isAvoided) {
      preferenceStatus = 'Avoided';
      preferenceColor = '#F44336';
      preferenceIcon = '●';
    }
    
    // Format time in biome
    const timeInBiome = Math.round(biome.timeInBiome);
    const timeDisplay = timeInBiome < 60 
      ? `${timeInBiome}s` 
      : `${Math.floor(timeInBiome / 60)}m ${timeInBiome % 60}s`;

    // Get modifier values
    const movementMod = biome.biomeEffects.movementMultiplier;
    const energyMod = biome.biomeEffects.energyMultiplier;
    const visibilityMod = biome.biomeEffects.visibilityMultiplier;
    const concealmentBonus = biome.biomeEffects.concealmentBonus;

    let html = `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;">
        <div style="font-size: 12px; color: #888; margin-bottom: 10px; font-weight: bold;">BIOME INFORMATION</div>
        
        <!-- Current Biome -->
        <div style="margin-bottom: 12px; padding: 10px; background: #1a1a1a; border-radius: 4px; border-left: 3px solid ${currentBiome.color};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <div>
              <div style="font-size: 11px; color: #888; margin-bottom: 2px;">CURRENT BIOME</div>
              <div style="font-weight: bold; font-size: 14px; color: ${currentBiome.color};">${currentBiome.name}</div>
            </div>
            <div style="
              width: 24px; 
              height: 24px; 
              background: ${currentBiome.color}; 
              border-radius: 4px;
              border: 2px solid #333;
            "></div>
          </div>
          
          <!-- Habitat Preference -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 1px solid #2a2a2a;">
            <span style="font-size: 11px; color: #aaa;">Habitat Preference</span>
            <span style="font-size: 11px; font-weight: bold; color: ${preferenceColor};">
              ${preferenceIcon} ${preferenceStatus} (${preference.toFixed(1)}x)
            </span>
          </div>
          
          <!-- Time in Biome -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 4px;">
            <span style="font-size: 11px; color: #aaa;">Time in Biome</span>
            <span style="font-size: 11px; font-weight: bold; color: #888;">${timeDisplay}</span>
          </div>
        </div>
        
        <!-- Active Biome Effects -->
        <div style="margin-bottom: 10px;">
          <div style="font-size: 11px; color: #888; margin-bottom: 6px;">ACTIVE EFFECTS</div>
    `;

    // Movement modifier
    const movementColor = this.getModifierColor(movementMod);
    const movementIcon = this.getModifierIcon(movementMod);
    html += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; padding: 6px; background: #1a1a1a; border-radius: 3px;">
            <span style="font-size: 11px; color: #aaa;">
              <span style="margin-right: 4px;">⚡</span>Movement Speed
            </span>
            <span style="font-size: 11px; font-weight: bold; color: ${movementColor};">
              ${movementIcon} ${this.formatModifier(movementMod)}
            </span>
          </div>
    `;

    // Energy modifier
    const energyColor = this.getModifierColor(energyMod, true); // Inverse for energy (lower is better)
    const energyIcon = this.getModifierIcon(energyMod, true);
    html += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; padding: 6px; background: #1a1a1a; border-radius: 3px;">
            <span style="font-size: 11px; color: #aaa;">
              <span style="margin-right: 4px;">🔥</span>Energy Drain
            </span>
            <span style="font-size: 11px; font-weight: bold; color: ${energyColor};">
              ${energyIcon} ${this.formatModifier(energyMod)}
            </span>
          </div>
    `;

    // Visibility modifier
    const visibilityColor = this.getModifierColor(visibilityMod);
    const visibilityIcon = this.getModifierIcon(visibilityMod);
    html += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; padding: 6px; background: #1a1a1a; border-radius: 3px;">
            <span style="font-size: 11px; color: #aaa;">
              <span style="margin-right: 4px;">👁️</span>Visibility Range
            </span>
            <span style="font-size: 11px; font-weight: bold; color: ${visibilityColor};">
              ${visibilityIcon} ${this.formatModifier(visibilityMod)}
            </span>
          </div>
    `;

    // Concealment bonus (only show if non-zero)
    if (concealmentBonus > 0) {
      html += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; padding: 6px; background: #1a1a1a; border-radius: 3px;">
            <span style="font-size: 11px; color: #aaa;">
              <span style="margin-right: 4px;">🌿</span>Concealment
            </span>
            <span style="font-size: 11px; font-weight: bold; color: #4CAF50;">
              ↑ +${Math.round(concealmentBonus * 100)}%
            </span>
          </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Get color for modifier value
   */
  getModifierColor(value, inverse = false) {
    const threshold = 1.0;
    const isPositive = inverse ? value < threshold : value > threshold;
    const isNegative = inverse ? value > threshold : value < threshold;
    
    if (isPositive) {
      // Better than normal
      if (Math.abs(value - threshold) > 0.3) return '#4CAF50'; // Strong positive
      return '#66BB6A'; // Mild positive
    } else if (isNegative) {
      // Worse than normal
      if (Math.abs(value - threshold) > 0.3) return '#F44336'; // Strong negative
      return '#FF9800'; // Mild negative
    }
    return '#888'; // Neutral
  }

  /**
   * Get icon for modifier value
   */
  getModifierIcon(value, inverse = false) {
    const threshold = 1.0;
    const isPositive = inverse ? value < threshold : value > threshold;
    const isNegative = inverse ? value > threshold : value < threshold;
    
    if (isPositive) return '↑';
    if (isNegative) return '↓';
    return '→';
  }

  /**
   * Format modifier value for display
   */
  formatModifier(value) {
    const percent = Math.round(value * 100);
    if (percent === 100) return '100%';
    return `${percent}%`;
  }

  /**
   * Build visual trait bars section
   */
  buildTraitBars(traits) {
    const traitData = [
      { name: "Speed", value: traits.speed, icon: "⚡", color: "#FFD700" },
      {
        name: "Metabolism",
        value: traits.metabolism,
        icon: "🔥",
        color: "#FF6B6B",
      },
      {
        name: "Sense Range",
        value: traits.senseRadius,
        icon: "👁️",
        color: "#4ECDC4",
      },
      { name: "Size", value: traits.size, icon: "📏", color: "#95E1D3" },
      {
        name: "Attack",
        value: traits.attackStrength,
        icon: "⚔️",
        color: "#F38181",
      },
    ];

    let html = `
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;">
                <div style="font-size: 12px; color: #888; margin-bottom: 10px; font-weight: bold;">GENETIC TRAITS</div>
        `;

    for (const trait of traitData) {
      const percentage = Math.round(trait.value * 100);
      const barWidth = Math.min(percentage, 150); // Cap at 150% for display

      html += `
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 11px; color: #aaa;">
                            <span style="margin-right: 4px;">${
                              trait.icon
                            }</span>${trait.name}
                        </span>
                        <span style="font-size: 11px; font-weight: bold; color: ${
                          trait.color
                        };">${percentage}%</span>
                    </div>
                    <div style="background: #1a1a1a; height: 6px; border-radius: 3px; overflow: hidden; position: relative;">
                        <div style="
                            width: ${barWidth}%; 
                            height: 100%; 
                            background: linear-gradient(90deg, ${
                              trait.color
                            }88, ${trait.color});
                            transition: width 0.3s ease;
                            box-shadow: 0 0 8px ${trait.color}44;
                        "></div>
                        ${
                          percentage > 100
                            ? `<div style="position: absolute; left: 100%; top: 0; width: 2px; height: 100%; background: #666;"></div>`
                            : ""
                        }
                    </div>
                </div>
            `;
    }

    html += `</div>`;
    return html;
  }

  /**
   * Get species emoji
   */
  getSpeciesEmoji(species) {
    const emojis = {
      herbivore: "🐰",
      predator: "🦊",
      plant: "🌿",
      fish: "🐟",
      bird: "🦅",
    };
    return emojis[species] || "❓";
  }

  /**
   * Get energy bar color based on percentage
   */
  getEnergyColor(percent) {
    if (percent > 70) return "#4CAF50";
    if (percent > 40) return "#FFC107";
    if (percent > 20) return "#FF9800";
    return "#F44336";
  }

  /**
   * Get energy gradient for bar
   */
  getEnergyGradient(percent) {
    if (percent > 70) return "linear-gradient(90deg, #4CAF50, #66BB6A)";
    if (percent > 40) return "linear-gradient(90deg, #FFC107, #FFD54F)";
    if (percent > 20) return "linear-gradient(90deg, #FF9800, #FFB74D)";
    return "linear-gradient(90deg, #F44336, #EF5350)";
  }

  /**
   * Get state indicator color
   */
  getStateColor(state) {
    const colors = {
      idle: "#888",
      wandering: "#4ECDC4",
      seeking_food: "#FFD700",
      eating: "#4CAF50",
      fleeing: "#F44336",
      hunting: "#FF6B6B",
      reproducing: "#FF69B4",
      migrating: "#9C27B0",
      drinking: "#2196F3",
      sleeping: "#607D8B",
    };
    return colors[state] || "#888";
  }

  /**
   * Build action history section
   */
  buildActionHistory(status) {
    const recentActions = status.getRecentActions(5);

    if (recentActions.length === 0) {
      return `
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;">
          <div style="font-size: 12px; color: #888; margin-bottom: 10px; font-weight: bold;">ACTION HISTORY</div>
          <div style="font-size: 11px; color: #666; font-style: italic;">No actions recorded yet</div>
        </div>
      `;
    }

    let html = `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #444;">
        <div style="font-size: 12px; color: #888; margin-bottom: 10px; font-weight: bold;">ACTION HISTORY</div>
        <div style="display: flex; flex-direction: column; gap: 8px;">
    `;

    // Display actions in reverse order (most recent first)
    for (let i = recentActions.length - 1; i >= 0; i--) {
      const action = recentActions[i];
      const actionInfo = this.formatAction(action);

      html += `
        <div style="
          padding: 8px;
          background: #1a1a1a;
          border-radius: 4px;
          border-left: 3px solid ${actionInfo.color};
          font-size: 11px;
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <span style="font-weight: bold; color: ${actionInfo.color};">
              ${actionInfo.icon} ${actionInfo.label}
            </span>
            <span style="color: #666; font-size: 10px;">${Math.round(
              action.timestamp
            )}s</span>
          </div>
          <div style="color: #aaa; font-size: 10px;">
            ${actionInfo.description}
          </div>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Format action data for display
   */
  formatAction(action) {
    const { action: type, details } = action;

    switch (type) {
      case "ate":
        return {
          icon: "🍽️",
          label: "Ate Food",
          color: "#4CAF50",
          description: `Consumed ${details.target}, gained ${details.energyGained} energy`,
        };

      case "fled":
        return {
          icon: "😰",
          label: "Fled from Danger",
          color: "#F44336",
          description: `Escaped from ${details.threat} at distance ${details.distance}`,
        };

      case "hunted":
        return {
          icon: "🎯",
          label: "Hunted Prey",
          color: "#FF6B6B",
          description: `Attacked ${details.target}, gained ${details.energyGained} energy`,
        };

      case "reproduced":
        const reproType =
          details.type === "asexual" ? "asexually" : "with mate";
        return {
          icon: "💕",
          label: "Reproduced",
          color: "#FF69B4",
          description: `Reproduced ${reproType}, offspring ID: ${details.offspringId}`,
        };

      default:
        return {
          icon: "❓",
          label: "Unknown Action",
          color: "#888",
          description: "Unknown action type",
        };
    }
  }

  /**
   * Capitalize first letter of string
   */
  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
