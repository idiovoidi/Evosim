import { ComponentType } from "./Entity.js";

/**
 * Enhanced input handler with camera controls
 * Supports mouse wheel zoom and right-click pan
 */
export class InputHandlerManager {
  constructor(canvas, world, renderer) {
    this.canvas = canvas;
    this.world = world;
    this.renderer = renderer;

    // Pan state
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;

    // Zoom settings
    this.zoomSpeed = 0.1;
    this.minZoom = 0.5;
    this.maxZoom = 3.0;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse move for hover detection and panning
    this.canvas.addEventListener("mousemove", (e) => this.handleMouseMove(e));

    // Left click for entity selection
    this.canvas.addEventListener("click", (e) => this.handleClick(e));

    // Right click for panning
    this.canvas.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    this.canvas.addEventListener("mouseup", (e) => this.handleMouseUp(e));

    // Prevent context menu on right click
    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      return false;
    });

    // Mouse wheel for zoom
    this.canvas.addEventListener("wheel", (e) => this.handleWheel(e), {
      passive: false,
    });

    // Handle mouse leaving canvas while panning
    this.canvas.addEventListener("mouseleave", () => {
      this.isPanning = false;
      this.canvas.style.cursor = "default";
    });
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle panning
    if (this.isPanning) {
      const deltaX = e.clientX - this.lastPanX;
      const deltaY = e.clientY - this.lastPanY;

      this.renderer.camera.x += deltaX;
      this.renderer.camera.y += deltaY;

      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;

      return;
    }

    // Update mouse position for world
    this.world.mousePos = { x, y };

    // Find entity at hover position
    this.updateHoveredEntity(x, y);
  }

  handleMouseDown(e) {
    // Right mouse button (button 2)
    if (e.button === 2) {
      e.preventDefault();
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      this.canvas.style.cursor = "grabbing";
    }
  }

  handleMouseUp(e) {
    // Right mouse button
    if (e.button === 2) {
      this.isPanning = false;
      this.canvas.style.cursor = "default";
    }
  }

  handleWheel(e) {
    e.preventDefault();

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate world position before zoom
    const worldXBefore =
      (mouseX - this.renderer.camera.x) / this.renderer.camera.zoom;
    const worldYBefore =
      (mouseY - this.renderer.camera.y) / this.renderer.camera.zoom;

    // Update zoom
    const zoomDelta = e.deltaY > 0 ? -this.zoomSpeed : this.zoomSpeed;
    const newZoom = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.renderer.camera.zoom + zoomDelta)
    );

    this.renderer.camera.zoom = newZoom;

    // Calculate world position after zoom
    const worldXAfter =
      (mouseX - this.renderer.camera.x) / this.renderer.camera.zoom;
    const worldYAfter =
      (mouseY - this.renderer.camera.y) / this.renderer.camera.zoom;

    // Adjust camera position to keep mouse position fixed
    this.renderer.camera.x +=
      (worldXAfter - worldXBefore) * this.renderer.camera.zoom;
    this.renderer.camera.y +=
      (worldYAfter - worldYBefore) * this.renderer.camera.zoom;

    // Update zoom slider in UI if it exists
    const zoomSlider = document.getElementById("zoom-slider");
    if (zoomSlider) {
      zoomSlider.value = newZoom;
      document.getElementById("zoom-value").textContent = `${newZoom.toFixed(
        1
      )}x`;
    }
  }

  /**
   * Update the hovered entity based on mouse position
   * @param {number} x - Mouse x position (screen space)
   * @param {number} y - Mouse y position (screen space)
   */
  updateHoveredEntity(x, y) {
    // Convert screen coordinates to world coordinates
    const worldX = (x - this.renderer.camera.x) / this.renderer.camera.zoom;
    const worldY = (y - this.renderer.camera.y) / this.renderer.camera.zoom;

    let closestEntity = null;
    let closestDist = 30 / this.renderer.camera.zoom; // Adjust hover distance by zoom

    for (const entity of this.world.getActiveEntities()) {
      if (!entity.hasComponent(ComponentType.POSITION)) continue;

      const pos = entity.getComponent(ComponentType.POSITION);
      const dx = pos.x - worldX;
      const dy = pos.y - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist) {
        closestDist = dist;
        closestEntity = entity;
      }
    }

    this.world.hoveredEntity = closestEntity;
  }

  handleClick(e) {
    // Don't select if we were panning
    if (this.isPanning) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates
    const worldX = (x - this.renderer.camera.x) / this.renderer.camera.zoom;
    const worldY = (y - this.renderer.camera.y) / this.renderer.camera.zoom;

    // Find entity at click position
    let closestEntity = null;
    let closestDist = 30 / this.renderer.camera.zoom; // Adjust click distance by zoom

    for (const entity of this.world.getActiveEntities()) {
      if (!entity.hasComponent(ComponentType.POSITION)) continue;

      const pos = entity.getComponent(ComponentType.POSITION);
      const dx = pos.x - worldX;
      const dy = pos.y - worldY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < closestDist) {
        closestDist = dist;
        closestEntity = entity;
      }
    }

    this.world.selectedEntity = closestEntity;
  }

  /**
   * Set zoom speed
   * @param {number} speed - Zoom speed multiplier
   */
  setZoomSpeed(speed) {
    this.zoomSpeed = speed;
  }

  /**
   * Set zoom limits
   * @param {number} min - Minimum zoom level
   * @param {number} max - Maximum zoom level
   */
  setZoomLimits(min, max) {
    this.minZoom = min;
    this.maxZoom = max;
  }

  /**
   * Reset camera to default position and zoom
   */
  resetCamera() {
    this.renderer.camera.x = 0;
    this.renderer.camera.y = 0;
    this.renderer.camera.zoom = 1.0;

    const zoomSlider = document.getElementById("zoom-slider");
    if (zoomSlider) {
      zoomSlider.value = 1.0;
      document.getElementById("zoom-value").textContent = "1.0x";
    }
  }
}
