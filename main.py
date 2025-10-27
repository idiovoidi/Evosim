import asyncio
import websockets
import json
from systems.world import World

class Simulation:
    def __init__(self):
        self.world = World(width=800, height=600)
        self.running = False
        self.clients = set()
    
    async def broadcast_map(self):
        print("Broadcasting map data...")
        map_data = {
            'type': 'mapData',
            'data': self.world.world_map.get_serializable_data()
        }
        print(f"Map dimensions: {map_data['data']['dimensions']}")
        
        # Broadcast to all clients
        if self.clients:
            await asyncio.gather(
                *[client.send(json.dumps(map_data)) for client in self.clients]
            )

simulation = Simulation()

async def handle_client(websocket, path):
    simulation.clients.add(websocket)
    print(f"Client connected from {path}")
    
    try:
        async for message in websocket:
            data = json.loads(message)
            print(f"Received data: {data}")
            
            if data["type"] == "getMapData":
                print("Received getMapData request")
                await simulation.broadcast_map()
            
    except websockets.exceptions.ConnectionClosed as e:
        print(f"Client disconnected: {e}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        simulation.clients.remove(websocket)

async def main():
    print("Starting WebSocket server on ws://localhost:8765")
    async with websockets.serve(handle_client, "localhost", 8765):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("Server stopped.") 