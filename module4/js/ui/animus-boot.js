/**
 * Animus Boot Sequence
 * FIX : délais réduits sur mobile + détection connexion lente
 */
(function(global){'use strict';

const BOOT_MESSAGES = [
  'INITIALISATION DU JUMEAU NUMERIQUE...',
  'SYNCHRONISATION DES DONNEES M1...',
  'CHARGEMENT DU MODULE PAIE M2...',
  'CONNEXION AU MOTEUR RPG M3...',
  'CALIBRATION DES CAPTEURS BIOMETRIQUES...',
  'ANALYSE DES VIOLATIONS LEGALES...',
  'CONSTRUCTION DE LA MATRICE PREDICTIVE...',
  'CHARGEMENT DES 1000 SCENARIOS...',
  'APPRENTISSAGE ADAPTATIF EN COURS...',
  'DIGITAL TWIN PRET — SYNCHRONISATION COMPLETE.',
];

// Détection mobile/connexion lente
// Sur iPhone, Safari throttle les timers → on réduit drastiquement les délais
const _isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const _slowConnection = (navigator.connection && 
  (navigator.connection.saveData || 
   ['slow-2g','2g'].includes(navigator.connection.effectiveType)));
const _fastMode = _isMobile || _slowConnection;

class AnimusBoot {
  constructor(){
    this._screen = document.getElementById('animus-boot');
    this._status = document.getElementById('boot-status');
    this._bar    = document.getElementById('boot-progress-bar');
    this._step   = 0;
    this._particles = [];
  }

  start(onComplete){
    // Sur mobile : animation ultra-rapide (< 2s total)
    if (_fastMode) {
      this._runFast(onComplete);
      return;
    }
    this._spawnParticles();
    this._runSequence(onComplete);
  }

  // Mode rapide pour mobile : pas de typage, juste la barre de progression
  _runFast(onComplete){
    const total = BOOT_MESSAGES.length;
    let step = 0;
    if(this._status) this._status.textContent = 'DIGITAL TWIN — CHARGEMENT...';
    const tick = () => {
      step++;
      const pct = Math.round((step / total) * 100);
      if(this._bar) this._bar.style.width = pct + '%';
      if(step >= total){
        // Sur mobile : pas d'animation CSS (peut bloquer sur iOS Safari)
        // → masquage direct sans délai
        if(this._screen){
          this._screen.style.opacity = '0';
          this._screen.style.transition = 'opacity 0.2s';
          setTimeout(()=>{
            if(this._screen) this._screen.style.display = 'none';
            if(onComplete) onComplete();
          }, 250);
        } else {
          if(onComplete) onComplete();
        }
        return;
      }
      setTimeout(tick, 80);
    };
    tick();
  }

  _runSequence(onComplete){
    const total = BOOT_MESSAGES.length;
    const tick = () => {
      if(this._step >= total){
        setTimeout(()=>{
          if(this._screen) this._screen.classList.add('hide');
          setTimeout(()=>{
            if(this._screen) this._screen.style.display='none';
            this._killParticles();
            if(onComplete) onComplete();
          }, 800);
        }, 400);
        return;
      }
      const msg = BOOT_MESSAGES[this._step];
      this._typeMessage(msg, ()=>{
        this._step++;
        const pct = Math.round((this._step / total) * 100);
        if(this._bar) this._bar.style.width = pct + '%';
        const delay = this._step === total ? 500 : 120 + Math.random()*200;
        setTimeout(tick, delay);
      });
    };
    tick();
  }

  _typeMessage(msg, cb){
    if(!this._status){ cb(); return; }
    this._status.textContent = '';
    let i = 0;
    const speed = msg.length > 30 ? 18 : 30;
    const timer = setInterval(()=>{
      this._status.textContent += msg[i];
      i++;
      if(i >= msg.length){ clearInterval(timer); setTimeout(cb, 80); }
    }, speed);
  }

  _spawnParticles(){
    const container = document.getElementById('animus-boot');
    if(!container) return;
    for(let i = 0; i < 20; i++){
      const p = document.createElement('div');
      p.className = 'data-particle';
      const x = Math.random() * 100;
      const h = 40 + Math.random() * 120;
      const dur = 2 + Math.random() * 4;
      const delay = Math.random() * 3;
      p.style.cssText = `left:${x}%;height:${h}px;animation-duration:${dur}s;animation-delay:-${delay}s;`;
      container.appendChild(p);
      this._particles.push(p);
    }
  }

  _killParticles(){
    this._particles.forEach(p => p.remove());
    this._particles = [];
  }
}

global.AnimusBoot = AnimusBoot;
}(typeof window !== 'undefined' ? window : global));
