/**
 * SettingsPanel - Performance and visual settings UI
 * 
 * Provides a comprehensive settings interface for:
 * - Quality presets (Low, Medium, High)
 * - Individual visual feature toggles
 * - Performance parameter sliders
 * - Settings persistence to localStorage
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { 
    QUALITY_PRESETS, 
    RENDERING_CONFIG,
    VISUAL_INDICATOR_CONFIG,
    saveConfig,
    loadConfig,
    resetConfig
} from '../utils/PerformanceConfig.js';

export class SettingsPanel {
    /**
     * Create a SettingsPanel
     * @param {World} world - World instance
     * @param {Renderer} renderer - Renderer instance
     * @param {AdaptiveQualityManager} qualityManager - Quality manager instance
     */
    constructor(world, renderer, qualityManager) {
        this.world = world;
        this.renderer = renderer;
        this.qualityManager = qualityManager;
        
        // Settings state
        this.settings = this.loadSettings();
        
        // Create UI elements
        this.createUI();
        
        // Apply loaded settings
        this.applySettings();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log('✅ SettingsPanel initialized');
    }
    
    /**
     * Create the settings UI panel
     */
    createUI() {
        // Find or create settings container in sidebar
        const sidebar = document.getElementById('sidebar');
        if (!sidebar) {
            console.error('[SettingsPanel] Sidebar not found');
            return;
        }
        
        // Create settings section
        const settingsSection = document.createElement('div');
        settingsSection.className = 'settings-panel';
        settingsSection.innerHTML = `
            <div class="stat-group">
                <h3 style="font-size: 14px; margin-bottom: 10px; cursor: pointer;" id="settings-header">
                    ⚙️ Performance Settings
                    <span id="settings-toggle" style="float: right; font-size: 12px;">▼</span>
                </h3>
                <div id="settings-content" style="display: block;">
                    <!-- Quality Presets -->
                    <div class="settings-group" style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 8px; color: #aaa; font-size: 12px;">
                            Quality Presets
                        </label>
                        <div style="display: flex; gap: 5px; margin-bottom: 8px;">
                            <button id="settings-quality-low" class="quality-preset-btn" data-quality="LOW" 
                                style="flex: 1; padding: 6px; font-size: 11px; background: #666; border: none; border-radius: 4px; color: white; cursor: pointer;">
                                LOW
                            </button>
                            <button id="settings-quality-medium" class="quality-preset-btn" data-quality="MEDIUM"
                                style="flex: 1; padding: 6px; font-size: 11px; background: #666; border: none; border-radius: 4px; color: white; cursor: pointer;">
                                MED
                            </button>
                            <button id="settings-quality-high" class="quality-preset-btn" data-quality="HIGH"
                                style="flex: 1; padding: 6px; font-size: 11px; background: #666; border: none; border-radius: 4px; color: white; cursor: pointer;">
                                HIGH
                            </button>
                        </div>
                        <button id="settings-quality-auto" 
                            style="width: 100%; padding: 8px; font-size: 12px; background: #4caf50; border: none; border-radius: 4px; color: white; cursor: pointer; margin-bottom: 5px;">
                            🔄 Auto Quality: ON
                        </butto