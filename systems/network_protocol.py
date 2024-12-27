from typing import Dict, Any
from dataclasses import dataclass
import json

@dataclass
class ClientMessage:
    type: str
    data: Dict[str, Any]

    @classmethod
    def from_json(cls, json_str: str) -> 'ClientMessage':
        data = json.loads(json_str)
        return cls(
            type=data['type'],
            data=data.get('data', {})
        )

@dataclass
class ServerMessage:
    type: str
    data: Dict[str, Any]

    def to_json(self) -> str:
        return json.dumps({
            'type': self.type,
            'data': self.data
        })

class MessageTypes:
    # Client -> Server
    START_SIMULATION = "start"
    STOP_SIMULATION = "stop"
    SET_SPEED = "setSpeed"
    SPAWN_ENTITY = "spawnEntity"
    
    # Server -> Client
    STATE_UPDATE = "stateUpdate"
    ENTITY_DIED = "entityDied"
    ENTITY_BORN = "entityBorn"
    STATISTICS = "statistics" 