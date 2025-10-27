class TerrainRenderer {
    constructor(scene) {
        this.scene = scene;
        this.terrainContainer = new BABYLON.TransformNode("terrainContainer", this.scene);
    }
    
    createTerrain(mapData) {
        console.log("Creating terrain with data:", mapData);
        
        // Dispose of old terrain meshes
        this.terrainContainer.getChildMeshes().forEach(mesh => mesh.dispose());
        
        const width = mapData.dimensions.width;
        const height = mapData.dimensions.height;
        const tileSize = mapData.dimensions.tileSize;
        
        // Create a mesh for each tile
        mapData.tiles.forEach(tile => {
            const box = BABYLON.MeshBuilder.CreateBox(
                `tile-${tile.x}-${tile.z}`,
                {
                    width: tileSize,
                    height: Math.max(0.1, tile.height),
                    depth: tileSize
                },
                this.scene
            );
            
            // Position the tile
            box.position.x = tile.x * tileSize;
            box.position.y = tile.height / 2;  // Center height
            box.position.z = tile.z * tileSize;
            
            // Assign to container
            box.parent = this.terrainContainer;
            
            // Create material
            const material = new BABYLON.StandardMaterial(
                `material-${tile.x}-${tile.z}`,
                this.scene
            );
            
            // Set color based on terrain type
            const color = tile.properties.color;
            material.diffuseColor = new BABYLON.Color3(color.r, color.g, color.b);
            
            box.material = material;
        });
    }
}