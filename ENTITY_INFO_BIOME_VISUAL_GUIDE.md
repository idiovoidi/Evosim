# Entity Info Panel - Biome Information Visual Guide

## Overview
This guide demonstrates the visual appearance and behavior of the biome information section in the Entity Info Panel.

## Visual Examples

### Example 1: Herbivore in Preferred Biome (Grassland)

```
┌─────────────────────────────────────────────┐
│ 🐰 Herbivore                      Gen 3     │
├─────────────────────────────────────────────┤
│ Energy: 85/100                    [████████] │
│                                              │
│ CURRENT STATE                                │
│ │ Seeking Food                               │
│ │ Searching for food sources                 │
│                                              │
│ Age: 45s    Speed: 2.3                      │
│ Position: (320, 240)    Generation: 3       │
├─────────────────────────────────────────────┤
│ BIOME INFORMATION                            │
│ ┌───────────────────────────────────────┐   │
│ │ CURRENT BIOME              [████]     │   │
│ │ Grassland                  (green)    │   │
│ │ ───────────────────────────────────── │   │
│ │ Habitat Preference                    │   │
│ │ ● Preferred (1.8x)         [GREEN]    │   │
│ │ Time in Biome                         │   │
│ │ 1m 23s                                │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ ACTIVE EFFECTS                               │
│ ⚡ Movement Speed        ↑ 108%  [GREEN]    │
│ 🔥 Energy Drain          ↓ 90%   [GREEN]    │
│ 👁️ Visibility Range      → 100%  [GRAY]     │
│                                              │
├─────────────────────────────────────────────┤
│ GENETIC TRAITS                               │
│ ...                                          │
└─────────────────────────────────────────────┘
```

**Interpretation:**
- Herbivore is in its preferred biome (Grassland)
- Slight movement speed bonus (8%)
- Reduced energy consumption (10% less)
- Neutral visibility
- Has been in this biome for 1 minute 23 seconds

---

### Example 2: Predator in Avoided Biome (Forest)

```
┌─────────────────────────────────────────────┐
│ 🦊 Predator                       Gen 2     │
├─────────────────────────────────────────────┤
│ Energy: 62/100                    [██████  ] │
│                                              │
│ CURRENT STATE                                │
│ │ Hunting                                    │
│ │ Pursuing prey                              │
│                                              │
│ Age: 78s    Speed: 1.8                      │
│ Position: (540, 380)    Generation: 2       │
├─────────────────────────────────────────────┤
│ BIOME INFORMATION                            │
│ ┌───────────────────────────────────────┐   │
│ │ CURRENT BIOME              [████]     │   │
│ │ Dense Forest               (dark grn) │   │
│ │ ───────────────────────────────────── │   │
│ │ Habitat Preference                    │   │
│ │ ○ Neutral (1.2x)           [GRAY]     │   │
│ │ Time in Biome                         │   │
│ │ 34s                                   │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ ACTIVE EFFECTS                               │
│ ⚡ Movement Speed        ↓ 70%   [RED]      │
│ 🔥 Energy Drain          ↑ 95%   [ORANGE]   │
│ 👁️ Visibility Range      ↓ 60%   [RED]      │
│ 🌿 Concealment           ↑ +50%  [GREEN]    │
│                                              │
├─────────────────────────────────────────────┤
│ GENETIC TRAITS                               │
│ ...                                          │
└─────────────────────────────────────────────┘
```

**Interpretation:**
- Predator is in a challenging biome (Dense Forest)
- Significant movement penalty (30% slower)
- Slightly increased energy drain (5% more)
- Reduced visibility range (40% less) - harder to spot prey
- BUT: 50% concealment bonus - harder for prey to spot predator
- Strategic trade-off: slower but stealthier

---

### Example 3: Fish in Preferred Biome (Deep Water)

```
┌─────────────────────────────────────────────┐
│ 🐟 Fish                           Gen 1     │
├─────────────────────────────────────────────┤
│ Energy: 95/100                    [█████████] │
│                                              │
│ CURRENT STATE                                │
│ │ Wandering                                  │
│ │ Exploring the environment                  │
│                                              │
│ Age: 12s    Speed: 3.1                      │
│ Position: (180, 120)    Generation: 1       │
├─────────────────────────────────────────────┤
│ BIOME INFORMATION                            │
│ ┌───────────────────────────────────────┐   │
│ │ CURRENT BIOME              [████]     │   │
│ │ Deep Water                 (blue)     │   │
│ │ ───────────────────────────────────── │   │
│ │ Habitat Preference                    │   │
│ │ ● Preferred (2.0x)         [GREEN]    │   │
│ │ Time in Biome                         │   │
│ │ 12s                                   │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ ACTIVE EFFECTS                               │
│ ⚡ Movement Speed        ↑ 200%  [GREEN]    │
│ 🔥 Energy Drain          ↓ 70%   [GREEN]    │
│ 👁️ Visibility Range      ↓ 60%   [RED]      │
│ 🌿 Concealment           ↑ +40%  [GREEN]    │
│                                              │
├─────────────────────────────────────────────┤
│ GENETIC TRAITS                               │
│ ...                                          │
└─────────────────────────────────────────────┘
```

**Interpretation:**
- Fish is in its ideal habitat (Deep Water)
- Maximum habitat preference (2.0x)
- Double movement speed (200%)
- Significantly reduced energy drain (30% less)
- Reduced visibility (murky water)
- Good concealment bonus
- Perfect environment for this species

---

### Example 4: Herbivore in Harsh Biome (Desert)

```
┌─────────────────────────────────────────────┐
│ 🐰 Herbivore                      Gen 4     │
├─────────────────────────────────────────────┤
│ Energy: 28/100                    [██      ] │
│                                              │
│ CURRENT STATE                                │
│ │ Seeking Food                               │
│ │ Searching for food sources                 │
│                                              │
│ Age: 92s    Speed: 1.2                      │
│ Position: (720, 560)    Generation: 4       │
├─────────────────────────────────────────────┤
│ BIOME INFORMATION                            │
│ ┌───────────────────────────────────────┐   │
│ │ CURRENT BIOME              [████]     │   │
│ │ Desert                     (tan)      │   │
│ │ ───────────────────────────────────── │   │
│ │ Habitat Preference                    │   │
│ │ ● Avoided (0.5x)           [RED]      │   │
│ │ Time in Biome                         │   │
│ │ 2m 45s                                │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ ACTIVE EFFECTS                               │
│ ⚡ Movement Speed        ↓ 80%   [ORANGE]   │
│ 🔥 Energy Drain          ↑ 140%  [RED]      │
│ 👁️ Visibility Range      ↑ 150%  [GREEN]    │
│                                              │
├─────────────────────────────────────────────┤
│ GENETIC TRAITS                               │
│ ...                                          │
└─────────────────────────────────────────────┘
```

**Interpretation:**
- Herbivore is in a very unfavorable biome (Desert)
- Strongly avoided habitat (0.5x preference)
- Movement penalty (20% slower)
- Severe energy drain (40% more) - harsh conditions
- Increased visibility (150%) - no cover, easy to spot
- No concealment bonus
- Entity is struggling (low energy, long time in harsh biome)
- Should migrate to better biome soon

---

## Color Legend

### Preference Status Colors
- **● Preferred** (Green #4CAF50): Habitat preference > 1.2x
- **○ Neutral** (Gray #888): Habitat preference = 1.0x
- **● Avoided** (Red #F44336): Habitat preference < 0.8x

### Modifier Colors
- **Strong Positive** (Bright Green #4CAF50): Modifier > 1.3 or < 0.7
- **Mild Positive** (Light Green #66BB6A): Modifier 1.0-1.3 or 0.7-1.0
- **Neutral** (Gray #888): Modifier = 1.0
- **Mild Negative** (Orange #FF9800): Modifier 0.7-1.0 or 1.0-1.3
- **Strong Negative** (Red #F44336): Modifier < 0.7 or > 1.3

### Arrow Indicators
- **↑** Increased/Bonus (better than normal)
- **→** Neutral (no change)
- **↓** Decreased/Penalty (worse than normal)

## Dynamic Behavior

### Real-Time Updates
The biome information updates automatically when:
1. Entity moves to a different biome
2. Entity is selected/reselected
3. Biome effects change (rare, but possible with future features)

### Time Tracking
- Time in biome resets to 0 when entity crosses biome boundary
- Displayed in seconds (< 60s) or minutes:seconds format (≥ 60s)
- Useful for tracking how long entity has been in harsh conditions

### Concealment Display
- Only shown when concealment bonus > 0
- Indicates entity is harder to detect in this biome
- Important for predator-prey dynamics

## Strategic Insights

### For Players
1. **Green indicators** = Entity is thriving in this biome
2. **Red indicators** = Entity is struggling, consider migration
3. **High concealment** = Good for hiding/ambushing
4. **High visibility** = Good for hunting, bad for hiding
5. **Long time in avoided biome** = Entity may be in danger

### Gameplay Implications
- Predators can use forests for stealth despite movement penalty
- Herbivores should seek grasslands for optimal grazing
- Fish must stay in water or face severe penalties
- Desert crossings are risky but sometimes necessary
- Mountain biomes offer concealment but drain energy

## Technical Notes

### Performance
- Biome lookup: O(1) constant time
- HTML generation: Only on entity selection
- No continuous polling or updates
- Minimal CPU/memory impact

### Compatibility
- Works with all entity types
- Gracefully handles missing components
- Compatible with save/load system
- Integrates with existing UI layout

### Accessibility
- Clear visual hierarchy
- Color-coded for quick scanning
- Numerical values for precision
- Icon indicators for at-a-glance understanding
