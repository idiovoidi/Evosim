from PyQt6.QtCore import Qt, QPoint, QRect
from PyQt6.QtGui import QPainter, QColor, QPen, QFont
from components import ComponentType

class EntityInspector:
    def __init__(self, world):
        self.world = world
        self.selected_entity = None
        self.inspection_window_size = (200, 300)  # Width, Height
        self.font = QFont("Arial", 10)
        
    def select_entity(self, mouse_pos):
        """Select an entity at the given mouse position"""
        closest_entity = None
        closest_distance = 30  # Maximum selection distance
        
        for entity in self.world.get_entities():
            if not entity.has_component(ComponentType.POSITION):
                continue
                
            pos = entity.get_component(ComponentType.POSITION).value
            distance = ((pos[0] - mouse_pos[0])**2 + (pos[1] - mouse_pos[1])**2)**0.5
            
            if distance < closest_distance:
                closest_distance = distance
                closest_entity = entity
        
        self.selected_entity = closest_entity
        return closest_entity is not None
    
    def render(self, painter: QPainter):
        """Render the inspection window if an entity is selected"""
        if not self.selected_entity or not self.selected_entity.active:
            self.selected_entity = None
            return
            
        # Get entity components
        stats = self.selected_entity.get_component(ComponentType.STATS)
        pos = self.selected_entity.get_component(ComponentType.POSITION)
        
        # Set up the inspection window
        window_x = 10
        window_y = 10
        padding = 10
        line_height = 20
        
        # Draw background
        window_rect = QRect(
            window_x, 
            window_y, 
            self.inspection_window_size[0], 
            self.inspection_window_size[1]
        )
        painter.fillRect(window_rect, QColor(0, 0, 0, 180))
        
        # Set up text rendering
        painter.setFont(self.font)
        painter.setPen(QPen(Qt.GlobalColor.white))
        
        # Draw entity information
        current_y = window_y + padding
        
        def draw_text(text: str):
            nonlocal current_y
            point = QPoint(window_x + padding, current_y)
            painter.drawText(point, text)
            current_y += line_height
        
        # Entity type and position
        draw_text(f"Type: {stats.species_type.capitalize()}")
        draw_text(f"Position: ({int(pos.value[0])}, {int(pos.value[1])})")
        draw_text(f"Energy: {int(stats.energy)}/{stats.max_energy}")
        
        # Draw behavior state for animals
        if stats.species_type in ['predator', 'herbivore']:
            behavior = self.world.get_behavior(self.selected_entity)
            if behavior:
                current_y += line_height/2  # Add spacing
                draw_text("Current State:")
                
                # Stamina for predators
                if stats.species_type == 'predator':
                    draw_text(f"Stamina: {int(behavior.stamina)}/100")
                    
                    if behavior.current_target:
                        target_stats = behavior.current_target.get_component(ComponentType.STATS)
                        draw_text(f"Hunting: {target_stats.species_type}")
                    else:
                        draw_text("State: Searching")
                
                # Status effects
                if self.selected_entity.has_component(ComponentType.STATUS):
                    status = self.selected_entity.get_component(ComponentType.STATUS)
                    states = []
                    if status.is_hungry:
                        states.append("Hungry")
                    if hasattr(behavior, 'stamina') and behavior.stamina < 30:
                        states.append("Tired")
                    draw_text(f"Status: {', '.join(states) if states else 'Normal'}") 