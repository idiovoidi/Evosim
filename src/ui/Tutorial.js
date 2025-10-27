export class Tutorial {
    constructor() {
        this.currentStep = 0;
        this.active = false;
        this.steps = [
            {
                title: '🌍 Welcome to the Ecosystem!',
                text: 'Watch 5 species interact in a living, breathing world with genetic evolution.',
                highlight: null,
                position: 'center'
            },
            {
                title: '👀 Observe Life',
                text: 'Herbivores 🐰 graze, predators 🦊 hunt, plants 🌿 grow, fish 🐟 school, and birds 🦅 soar.',
                highlight: 'canvas',
                position: 'center'
            },
            {
                title: '🔍 Inspect Entities',
                text: 'Click any creature to see its energy, age, genetic traits, and current behavior.',
                highlight: 'canvas',
                position: 'left'
            },
            {
                title: '📊 Track Populations',
                text: 'Watch population counts change in real-time as the ecosystem balances itself.',
                highlight: 'sidebar',
                position: 'right'
            },
            {
                title: '⚡ Control Time',
                text: 'Adjust simulation speed to watch evolution unfold faster, or pause to observe details.',
                highlight: 'controls',
                position: 'right'
            },
            {
                title: '🧬 Evolution in Action',
                text: 'Each creature has unique genes. Watch as natural selection favors the fittest!',
                highlight: null,
                position: 'center'
            },
            {
                title: '🎮 Ready!',
                text: 'Enjoy the simulation! Press H anytime for help, or Space to pause.',
                highlight: null,
                position: 'center'
            }
        ];
    }
    
    start() {
        // Check if tutorial was completed
        if (localStorage.getItem('tutorial-completed')) {
            return false;
        }
        
        this.active = true;
        this.currentStep = 0;
        this.showStep();
        return true;
    }
    
    restart() {
        localStorage.removeItem('tutorial-completed');
        this.start();
    }
    
    showStep() {
        const step = this.steps[this.currentStep];
        this.createOverlay(step);
    }
    
    createOverlay(step) {
        // Remove existing overlay
        const existing = document.getElementById('tutorial-overlay');
        if (existing) existing.remove();
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.innerHTML = `
            <div class="tutorial-backdrop"></div>
            <div class="tutorial-box ${step.position}">
                <h3>${step.title}</h3>
                <p>${step.text}</p>
                <div class="tutorial-buttons">
                    ${this.currentStep > 0 ? '<button id="tutorial-prev" class="tutorial-btn">← Back</button>' : ''}
                    <button id="tutorial-skip" class="tutorial-btn secondary">Skip</button>
                    <button id="tutorial-next" class="tutorial-btn primary">
                        ${this.currentStep < this.steps.length - 1 ? 'Next →' : 'Got it! 🎉'}
                    </button>
                </div>
                <div class="tutorial-progress">
                    Step ${this.currentStep + 1} of ${this.steps.length}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // Highlight element
        if (step.highlight) {
            const el = document.getElementById(step.highlight) || 
                       document.querySelector(`.${step.highlight}`);
            if (el) {
                el.classList.add('tutorial-highlight');
                el.style.position = 'relative';
                el.style.zIndex = '10001';
            }
        }
        
        // Event listeners
        const nextBtn = document.getElementById('tutorial-next');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
        
        const prevBtn = document.getElementById('tutorial-prev');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previous());
        }
        
        const skipBtn = document.getElementById('tutorial-skip');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.complete());
        }
        
        // Keyboard navigation
        this.keyHandler = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                this.next();
            } else if (e.key === 'ArrowLeft') {
                this.previous();
            } else if (e.key === 'Escape') {
                this.complete();
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }
    
    next() {
        this.clearHighlights();
        
        if (this.currentStep < this.steps.length - 1) {
            this.currentStep++;
            this.showStep();
        } else {
            this.complete();
        }
    }
    
    previous() {
        this.clearHighlights();
        if (this.currentStep > 0) {
            this.currentStep--;
            this.showStep();
        }
    }
    
    complete() {
        this.active = false;
        this.clearHighlights();
        
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 300);
        }
        
        localStorage.setItem('tutorial-completed', 'true');
        
        // Remove keyboard handler
        if (this.keyHandler) {
            document.removeEventListener('keydown', this.keyHandler);
            this.keyHandler = null;
        }
    }
    
    clearHighlights() {
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
            el.style.position = '';
            el.style.zIndex = '';
        });
    }
}
