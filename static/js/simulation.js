class EcosystemSimulation {
    constructor() {
        this.canvas = document.getElementById("renderCanvas");
        this.engine = new BABYLON.Engine(this.canvas, true);
        this.scene = null;
        this.ws = null;
        
        // Setup WebSocket first
        this.setupWebSocket();
        
        // Create scene after WebSocket is ready
        this.ws.onopen = () => {
            console.log("WebSocket connected");
            this.createScene();
            
            // Request map data
            this.ws.send(JSON.stringify({
                type: "getMapData"
            }));
        };
        
        // Start render loop
        this.engine.runRenderLoop(() => {
            if (this.scene) {
                this.scene.render();
            }
        });
        
        window.addEventListener("resize", () => {
            this.engine.resize();
        });
    }
    
    createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        
        // Create camera
        const camera = new BABYLON.ArcRotateCamera(
            "camera",
            Math.PI / 4,
            Math.PI / 3,
            150,
            BABYLON.Vector3.Zero(),
            this.scene
        );
        camera.lowerRadiusLimit = 10;
        camera.upperRadiusLimit = 500;
        camera.attachControl(this.canvas, true);
        
        // Add lighting
        const light = new BABYLON.HemisphericLight(
            "light",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        light.intensity = 0.7;
        
        // Create terrain renderer
        this.terrainRenderer = new TerrainRenderer(this.scene);
    }
    
    setupWebSocket() {
        this.ws = new WebSocket('ws://localhost:8765');
        
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log("Received message:", data);
            
            if (data.type === "mapData") {
                this.handleMapData(data.data);
            }
        };
    }
    
    handleMapData(mapData) {
        console.log("Handling map data");
        this.terrainRenderer.createTerrain(mapData);
    }
}

// Create simulation when page loads
window.addEventListener('DOMContentLoaded', () => {
    const simulation = new EcosystemSimulation();
}); 