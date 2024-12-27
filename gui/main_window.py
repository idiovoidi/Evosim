from PyQt6.QtWidgets import (QMainWindow, QWidget, QSplitter, QVBoxLayout,
                            QToolBar, QComboBox, QLabel, QHBoxLayout, QPushButton)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont, QIcon
from .log_panel import LogPanel
from .ecosystem_widget import EcosystemWidget

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Ecosystem Simulation")
        
        # Create toolbar with enhanced controls
        self.toolbar = QToolBar()
        self.addToolBar(self.toolbar)
        
        # Add simulation controls
        controls_layout = QHBoxLayout()
        
        # Speed control
        speed_label = QLabel("Simulation Speed:")
        self.speed_combo = QComboBox()
        self.speed_combo.addItems(["0.25x", "0.5x", "1x", "2x", "5x", "10x"])
        self.speed_combo.setCurrentText("1x")
        self.speed_combo.currentTextChanged.connect(self.change_simulation_speed)
        
        # Add pause/play button
        self.pause_button = QPushButton()
        self.pause_button.setCheckable(True)
        self.pause_button.toggled.connect(self.toggle_simulation)
        self.update_pause_button_state(False)
        
        # Create widget to hold the controls
        controls_widget = QWidget()
        controls_widget.setLayout(controls_layout)
        controls_layout.addWidget(speed_label)
        controls_layout.addWidget(self.speed_combo)
        controls_layout.addWidget(self.pause_button)
        controls_layout.addStretch()
        
        self.toolbar.addWidget(controls_widget)
        
        # Window dimensions
        map_width = 40 * 50  # 40 cells * 50 pixels
        map_height = 40 * 50
        log_width = 400
        
        total_width = map_width + log_width + 50
        total_height = map_height + 100  # Extra space for toolbar
        
        self.setGeometry(50, 50, total_width, total_height)
        
        # Create main widget and layout
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
        
        # Create splitter for ecosystem and log
        splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Create and add ecosystem
        self.ecosystem = EcosystemWidget(None)  # Will set log_panel after creation
        
        # Create and add log panel with enhanced formatting
        self.log_panel = LogPanel()
        self.log_panel.setFont(QFont('Courier', 11))
        self.ecosystem.log_panel = self.log_panel  # Set log_panel after creation
        
        # Add widgets to splitter
        splitter.addWidget(self.ecosystem)
        splitter.addWidget(self.log_panel)
        
        # Set initial sizes
        splitter.setSizes([map_width, log_width])
        
        layout.addWidget(splitter)
        
        # Initialize simulation state
        self.is_paused = False
    
    def change_simulation_speed(self, speed_text: str) -> None:
        """Change the simulation update rate"""
        if not speed_text:
            return
            
        speed_multiplier = float(speed_text.rstrip('x'))
        base_interval = 16  # Base interval in milliseconds (60 FPS)
        
        new_interval = int(base_interval / speed_multiplier)
        self.ecosystem.timer.setInterval(new_interval)
        
        self.log_panel.log(f"Simulation speed changed to {speed_text}")
    
    def toggle_simulation(self, paused: bool) -> None:
        """Toggle the simulation between running and paused states"""
        self.is_paused = paused
        if paused:
            self.ecosystem.timer.stop()
            self.log_panel.log("Simulation paused")
        else:
            self.ecosystem.timer.start()
            self.log_panel.log("Simulation resumed")
        self.update_pause_button_state(paused)
    
    def update_pause_button_state(self, paused: bool) -> None:
        """Update the pause button icon and tooltip"""
        self.pause_button.setIcon(QIcon.fromTheme('media-playback-start' if paused else 'media-playback-pause'))
        self.pause_button.setToolTip('Resume simulation' if paused else 'Pause simulation') 