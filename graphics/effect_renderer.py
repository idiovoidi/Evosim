from PyQt6.QtGui import QPainter, QFont, QColor
from PyQt6.QtCore import QPoint

class EffectRenderer:
    @staticmethod
    def render_effect(painter, effect):
        """Render a visual effect"""
        color = effect.color
        if effect.fade:
            alpha = int(255 * effect.lifetime / effect.duration)
            color.setAlpha(alpha)
        painter.setPen(color)
        
        size = 20 * effect.scale
        painter.setFont(QFont('Segoe UI Emoji', int(size)))
        painter_pos = QPoint(
            int(effect.position[0] - size/2),
            int(effect.position[1] + size/2)
        )
        painter.drawText(painter_pos, effect.char) 