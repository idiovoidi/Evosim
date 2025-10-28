/**
 * EcosystemEventDetector - Detect and notify about significant ecosystem events
 * 
 * Monitors population changes and ecosystem state to detect:
 * - Species extinctions
 * - Population milestones (new records)
 * - Ecosystem imbalances (predator/prey ratios)
 * 
 * Requirements: 13.1, 13.2, 13.3
 */

/**
 * Configuration for event detection
 */
const EVENT_CONFIG = {
    // How often to check for events (in seconds)
    CHECK_INTERVAL: 1.0,
    
    // Minimum time before checking for events (to avoid spam at startup)
    STARTUP_DELAY: 5.0,
    
    // Population milestone thresholds
    MILESTONE_THRESHOLDS: [50, 100, 200, 500, 1000],
    
    // Ecosystem balance thresholds
    BALANCE: {
        // Predator to herbivore ratio thresholds
        PREDATOR_HERBIVORE_MIN: 0.1,  // Too few predators
        PREDATOR_HERBIVORE_MAX: 0.8,  // Too many predators
        
        // Plant to herbivore ratio thresholds
        PLANT_HERBIVORE_MIN: 1.0,     // Too few plants
        
        // Minimum populations to trigger balance warnings
        MIN_POPULATION_FOR_WARNING: 10
    }
};

export class EcosystemEventDetector {
    constructor(world, notificationManager) {
        this.world = world;
        this.notificationManager = notificationManager;
        
        // Tracking state
        this.lastCheckTime = 0;
        this.startTime = 0;
        
        // Population tracking
        this.previousPopulations = {
            herbivore: 0,
            predator: 0,
            plant: 0,
            fish: 0,
            bird: 0
        };
        
        // Track which species have gone extinct
        this.extinctSpecies = new Set();
        
        // Track population records for milestones
        this.populationRecords = {
            herbivore: 0,
            predator: 0,
            plant: 0,
            fish: 0,
            bird: 0,
            total: 0
        };
        
        // Track which milestones have been reached
        this.reachedMilestones = {
            herbivore: new Set(),
            predator: new Set(),
            plant: new Set(),
            fish: new Set(),
            bird: new Set(),
            total: new Set()
        };
        
        // Track last balance warning time to avoid spam
        this.lastBalanceWarning = {
            predatorHerbivore: 0,
            plantHerbivore: 0
        };
        
        // Minimum time between balance warnings (seconds)
        this.balanceWarningCooldown = 30.0;
        
        console.log('✅ EcosystemEventDetector initialized');
    }
    
    /**
     * Update event detection (called each frame)
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        this.startTime += dt;
        
        // Skip checks during startup delay
        if (this.startTime < EVENT_CONFIG.STARTUP_DELAY) {
            return;
        }
        
        // Check for events at regular intervals
        this.lastCheckTime += dt;
        if (this.lastCheckTime >= EVENT_CONFIG.CHECK_INTERVAL) {
            this.lastCheckTime = 0;
            this.checkForEvents();
        }
    }
    
    /**
     * Check for all types of events
     */
    checkForEvents() {
        const stats = this.world.getStats();
        
        // Check for extinctions
        this.checkExtinctions(stats);
        
        // Check for population milestones
        this.checkMilestones(stats);
        
        // Check for ecosystem imbalances
        this.checkEcosystemBalance(stats);
        
        // Update previous populations
        this.previousPopulations = {
            herbivore: stats.herbivores,
            predator: stats.predators,
            plant: stats.plants,
            fish: stats.fish,
            bird: stats.birds
        };
    }
    
    /**
     * Check for species extinctions
     * @param {Object} stats - Current population statistics
     */
    checkExtinctions(stats) {
        const species = [
            { name: 'herbivore', displayName: 'Herbivores', count: stats.herbivores },
            { name: 'predator', displayName: 'Predators', count: stats.predators },
            { name: 'plant', displayName: 'Plants', count: stats.plants },
            { name: 'fish', displayName: 'Fish', count: stats.fish },
            { name: 'bird', displayName: 'Birds', count: stats.birds }
        ];
        
        for (const sp of species) {
            // Check if species just went extinct
            if (sp.count === 0 && 
                this.previousPopulations[sp.name] > 0 && 
                !this.extinctSpecies.has(sp.name)) {
                
                // Mark as extinct
                this.extinctSpecies.add(sp.name);
                
                // Notify
                this.notificationManager.notifyExtinction(sp.displayName);
                
                console.log(`💀 EXTINCTION: ${sp.displayName} have gone extinct!`);
            }
            
            // Check if species recovered from extinction
            if (sp.count > 0 && this.extinctSpecies.has(sp.name)) {
                this.extinctSpecies.delete(sp.name);
                this.notificationManager.notifyInfo(`${sp.displayName} have returned!`);
                console.log(`🌱 RECOVERY: ${sp.displayName} have returned!`);
            }
        }
    }
    
    /**
     * Check for population milestones
     * @param {Object} stats - Current population statistics
     */
    checkMilestones(stats) {
        const populations = [
            { name: 'herbivore', displayName: 'Herbivore', count: stats.herbivores },
            { name: 'predator', displayName: 'Predator', count: stats.predators },
            { name: 'plant', displayName: 'Plant', count: stats.plants },
            { name: 'fish', displayName: 'Fish', count: stats.fish },
            { name: 'bird', displayName: 'Bird', count: stats.birds },
            { name: 'total', displayName: 'Total', count: stats.total }
        ];
        
        for (const pop of populations) {
            // Check if this is a new record
            if (pop.count > this.populationRecords[pop.name]) {
                this.populationRecords[pop.name] = pop.count;
                
                // Check if we've crossed any milestone thresholds
                for (const threshold of EVENT_CONFIG.MILESTONE_THRESHOLDS) {
                    if (pop.count >= threshold && 
                        !this.reachedMilestones[pop.name].has(threshold)) {
                        
                        // Mark milestone as reached
                        this.reachedMilestones[pop.name].add(threshold);
                        
                        // Notify
                        const message = pop.name === 'total' 
                            ? `Total population reached ${threshold}!`
                            : `${pop.displayName} population reached ${threshold}!`;
                        
                        this.notificationManager.notifyMilestone(message);
                        
                        console.log(`🎉 MILESTONE: ${message}`);
                    }
                }
            }
        }
    }
    
    /**
     * Check for ecosystem imbalances
     * @param {Object} stats - Current population statistics
     */
    checkEcosystemBalance(stats) {
        const currentTime = this.world.time;
        
        // Check predator/herbivore balance
        if (stats.herbivores >= EVENT_CONFIG.BALANCE.MIN_POPULATION_FOR_WARNING &&
            stats.predators >= EVENT_CONFIG.BALANCE.MIN_POPULATION_FOR_WARNING) {
            
            const predatorHerbivoreRatio = stats.predators / stats.herbivores;
            
            // Too many predators
            if (predatorHerbivoreRatio > EVENT_CONFIG.BALANCE.PREDATOR_HERBIVORE_MAX) {
                if (currentTime - this.lastBalanceWarning.predatorHerbivore > this.balanceWarningCooldown) {
                    this.lastBalanceWarning.predatorHerbivore = currentTime;
                    
                    this.notificationManager.notifyWarning(
                        'Predator population is too high! Herbivores may go extinct.'
                    );
                    
                    console.log(`⚠️ IMBALANCE: Too many predators (ratio: ${predatorHerbivoreRatio.toFixed(2)})`);
                }
            }
            
            // Too few predators
            if (predatorHerbivoreRatio < EVENT_CONFIG.BALANCE.PREDATOR_HERBIVORE_MIN) {
                if (currentTime - this.lastBalanceWarning.predatorHerbivore > this.balanceWarningCooldown) {
                    this.lastBalanceWarning.predatorHerbivore = currentTime;
                    
                    this.notificationManager.notifyWarning(
                        'Predator population is too low! Herbivores may overpopulate.'
                    );
                    
                    console.log(`⚠️ IMBALANCE: Too few predators (ratio: ${predatorHerbivoreRatio.toFixed(2)})`);
                }
            }
        }
        
        // Check plant/herbivore balance
        if (stats.herbivores >= EVENT_CONFIG.BALANCE.MIN_POPULATION_FOR_WARNING &&
            stats.plants >= EVENT_CONFIG.BALANCE.MIN_POPULATION_FOR_WARNING) {
            
            const plantHerbivoreRatio = stats.plants / stats.herbivores;
            
            // Too few plants
            if (plantHerbivoreRatio < EVENT_CONFIG.BALANCE.PLANT_HERBIVORE_MIN) {
                if (currentTime - this.lastBalanceWarning.plantHerbivore > this.balanceWarningCooldown) {
                    this.lastBalanceWarning.plantHerbivore = currentTime;
                    
                    this.notificationManager.notifyWarning(
                        'Plant population is too low! Herbivores may starve.'
                    );
                    
                    console.log(`⚠️ IMBALANCE: Too few plants (ratio: ${plantHerbivoreRatio.toFixed(2)})`);
                }
            }
        }
        
        // Check for critically low populations
        const criticalThreshold = 5;
        const species = [
            { name: 'Herbivores', count: stats.herbivores },
            { name: 'Predators', count: stats.predators },
            { name: 'Plants', count: stats.plants },
            { name: 'Fish', count: stats.fish },
            { name: 'Birds', count: stats.birds }
        ];
        
        for (const sp of species) {
            if (sp.count > 0 && sp.count <= criticalThreshold) {
                const warningKey = `critical_${sp.name}`;
                if (!this.lastBalanceWarning[warningKey] || 
                    currentTime - this.lastBalanceWarning[warningKey] > this.balanceWarningCooldown) {
                    
                    this.lastBalanceWarning[warningKey] = currentTime;
                    
                    this.notificationManager.notifyWarning(
                        `${sp.name} population critically low (${sp.count})!`
                    );
                    
                    console.log(`⚠️ CRITICAL: ${sp.name} population at ${sp.count}`);
                }
            }
        }
    }
    
    /**
     * Reset event detector state
     */
    reset() {
        this.lastCheckTime = 0;
        this.startTime = 0;
        
        this.previousPopulations = {
            herbivore: 0,
            predator: 0,
            plant: 0,
            fish: 0,
            bird: 0
        };
        
        this.extinctSpecies.clear();
        
        this.populationRecords = {
            herbivore: 0,
            predator: 0,
            plant: 0,
            fish: 0,
            bird: 0,
            total: 0
        };
        
        this.reachedMilestones = {
            herbivore: new Set(),
            predator: new Set(),
            plant: new Set(),
            fish: new Set(),
            bird: new Set(),
            total: new Set()
        };
        
        this.lastBalanceWarning = {
            predatorHerbivore: 0,
            plantHerbivore: 0
        };
        
        console.log('🔄 EcosystemEventDetector reset');
    }
}
