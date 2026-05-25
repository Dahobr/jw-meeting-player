const tutorialManager = {
    init: async () => {
        const response = await fetch('tutorial.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'tutorial.css';
        document.head.appendChild(link);
    },
    show: () => document.getElementById('tutorial-overlay').classList.remove('hidden'),
    hide: () => document.getElementById('tutorial-overlay').classList.add('hidden'),
    isSkipped: () => localStorage.getItem('tutorial-skipped') === 'true',
    setSkipped: (skipped) => localStorage.setItem('tutorial-skipped', skipped)
};

export default tutorialManager;
