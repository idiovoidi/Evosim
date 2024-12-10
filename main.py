import sys
import os
from pathlib import Path

# Get the absolute path of the project root directory
ROOT_DIR = Path(__file__).resolve().parent

# Add the root directory to Python path
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from PyQt6.QtWidgets import QApplication
from gui.main_window import MainWindow

def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
