from PyQt6.QtCore import QUrl
from PyQt6.QtMultimedia import QMediaPlayer, QAudioOutput
import os

class SoundManager:
    def __init__(self):
        self.sounds = {}
        self.players = {}
        self.audio_outputs = {}
        
        # Load sound effects
        self.load_sounds({
            'birth': 'sounds/birth.wav',
            'death': 'sounds/death.wav',
            'eat': 'sounds/eat.wav',
            'build': 'sounds/build.wav',
            'water': 'sounds/water.wav',
            'ambient': 'sounds/ambient.wav'
        })
        
        # Start ambient sound loop
        self.play_ambient()
    
    def load_sounds(self, sound_files):
        for name, path in sound_files.items():
            if os.path.exists(path):
                self.players[name] = QMediaPlayer()
                self.audio_outputs[name] = QAudioOutput()
                self.players[name].setAudioOutput(self.audio_outputs[name])
                self.players[name].setSource(QUrl.fromLocalFile(path))
                
                # Set volumes
                if name == 'ambient':
                    self.audio_outputs[name].setVolume(0.3)  # Lower volume for ambient
                else:
                    self.audio_outputs[name].setVolume(0.7)
    
    def play_sound(self, sound_name):
        if sound_name in self.players:
            self.players[sound_name].setPosition(0)
            self.players[sound_name].play()
    
    def play_ambient(self):
        if 'ambient' in self.players:
            self.players['ambient'].setLoops(QMediaPlayer.Loops.Infinite)
            self.players['ambient'].play() 