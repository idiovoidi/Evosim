from PyQt6.QtWidgets import QTextEdit
from PyQt6.QtGui import QFont
from datetime import datetime

class LogPanel(QTextEdit):
    def __init__(self):
        super().__init__()
        self.setReadOnly(True)
        self.setFont(QFont('Courier', 10))
        self.document().setMaximumBlockCount(100)
    
    def log(self, message):
        timestamp = datetime.now().strftime("%H:%M:%S")
        self.append(f"[{timestamp}] {message}")
        # Auto-scroll to bottom
        self.verticalScrollBar().setValue(self.verticalScrollBar().maximum()) 