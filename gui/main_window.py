from PyQt6.QtWidgets import (QMainWindow, QWidget, QSplitter, QVBoxLayout,
                            QToolBar, QComboBox, QLabel, QHBoxLayout)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from .log_panel import LogPanel
from .ecosystem_widget import EcosystemWidget

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Ecosystem Simulation")
        
        # Create toolbar
        self.toolbar = QToolBar()
        self.addToolBar(self.toolbar)
        
        # Add speed control
        speed_layout = QHBoxLayout()
        speed_label = QLabel("Simulation Speed:")
        self.speed_combo = QComboBox()
        self.speed_combo.addItems(["0.5x", "1x", "2x", "5x", "10x"])
        self.speed_combo.setCurrentText("1x")
        self.speed_combo.currentTextChanged.connect(self.change_simulation_speed)
        
        # Create widget to hold the layout
        speed_widget = QWidget()
        speed_widget.setLayout(speed_layout)
        speed_layout.addWidget(speed_label)
        speed_layout.addWidget(self.speed_combo)
        speed_layout.addStretch()
        
        self.toolbar.addWidget(speed_widget)
        
        # Window dimensions
        map_width = 40 * 50
        map_height = 40 * 50
        log_width = 400
        
        total_width = map_width + log_width + 50
        total_height = map_height + 50
        
        self.setGeometry(50, 50, total_width, total_height)
        self.setFixedSize(total_width, total_height)
        
        # Create main widget and layout
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
        
        # Create splitter for ecosystem and log
        splitter = QSplitter(Qt.Orientation.Horizontal)
        
        # Create and add log panel
        self.log_panel = LogPanel()
        self.log_panel.setFont(QFont('Courier', 11))
        
        # Create and add ecosystem
        self.ecosystem = EcosystemWidget(self.log_panel)
        
        # Add widgets to splitter
        splitter.addWidget(self.ecosystem)
        splitter.addWidget(self.log_panel)
        
        # Set initial sizes
        splitter.setSizes([map_width, log_width])
        
        layout.addWidget(splitter)
    
    def change_simulation_speed(self, speed_text):
        """Change the simulation update rate"""
        speed_multiplier = float(speed_text.rstrip('x'))
        base_interval = 16  # Base interval in milliseconds (60 FPS)
        
        # Update timer interval
        new_interval = int(base_interval / speed_multiplier)
        self.ecosystem.timer.setInterval(new_interval)
        
        # Log speed change
        self.log_panel.log(f"Simulation speed changed to {speed_text}") 