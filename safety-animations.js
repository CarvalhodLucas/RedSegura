/**
 * RedSegura Valencia - Motor de Animações Globais em Plano de Fundo
 * Organizado sem sobreposição de textos, botões ou elementos de conteúdo.
 */

(function () {
  'use strict';

  function initGlobalAnimations() {
    if (document.getElementById('global-safety-canvas')) return;

    // --- 1. CANVAS GLOBAL DE PLANO DE FUNDO (Z-INDEX 1: ATRÁS DO CONTEÚDO) ---
    const bgCanvas = document.createElement('canvas');
    bgCanvas.id = 'global-safety-canvas';
    bgCanvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 1;
      opacity: 0.85;
    `;
    document.body.appendChild(bgCanvas);

    const ctx = bgCanvas.getContext('2d');
    let width = bgCanvas.width = window.innerWidth;
    let height = bgCanvas.height = window.innerHeight;

    let leftMarginMax = Math.max(40, (width - 1120) / 2 - 35);
    let rightMarginMin = Math.min(width - 40, width - (width - 1120) / 2 + 35);

    window.addEventListener('resize', () => {
      width = bgCanvas.width = window.innerWidth;
      height = bgCanvas.height = window.innerHeight;
      leftMarginMax = Math.max(40, (width - 1120) / 2 - 35);
      rightMarginMin = Math.min(width - 40, width - (width - 1120) / 2 + 35);
      initMeshNodes();
    });

    // --- 2. RASTRO DE PATINHAS DE GATO PELO MOUSE ---
    const paws = [];
    let mouse = { x: -1000, y: -1000, lastX: -1000, lastY: -1000 };

    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;

      const dist = Math.hypot(mouse.x - mouse.lastX, mouse.y - mouse.lastY);
      if (dist > 50) {
        paws.push({
          x: mouse.x,
          y: mouse.y,
          alpha: 0.7,
          scale: 0.6 + Math.random() * 0.3,
          angle: Math.atan2(mouse.y - mouse.lastY, mouse.x - mouse.lastX) + Math.PI / 2
        });
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
      }
    });

    function drawPaw(x, y, scale, angle, alpha) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);
      ctx.fillStyle = `rgba(232, 103, 46, ${alpha * 0.7})`;

      // Almofada principal
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Deditos da patinha
      const toes = [
        { x: -6, y: -7 },
        { x: -2, y: -9.5 },
        { x: 2.5, y: -9.5 },
        { x: 6.5, y: -7 }
      ];
      ctx.fillStyle = `rgba(18, 138, 152, ${alpha * 0.7})`;
      toes.forEach(t => {
        ctx.beginPath();
        ctx.arc(t.x, t.y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    // --- 3. MALHA DE SEGURANÇA EM LOSANGO (RESTRITA ESTRITAMENTE ÀS MARGENS LATERAIS) ---
    let meshNodes = [];
    let meshLinks = [];

    function initMeshNodes() {
      meshNodes = [];
      meshLinks = [];

      const cellW = 45;
      const cellH = 40;

      // Margem Esquerda (Apenas na área externa ao conteúdo principal)
      for (let y = -20; y < height + 40; y += cellH) {
        for (let x = -10; x <= leftMarginMax + 10; x += cellW) {
          const row = Math.floor(y / cellH);
          const xShift = (row % 2 === 1) ? cellW * 0.5 : 0;
          const nodeX = x + xShift;
          if (nodeX <= leftMarginMax + 15) {
            meshNodes.push({
              x: nodeX, y: y, ox: nodeX, oy: y, vx: 0, vy: 0, side: 'left'
            });
          }
        }
      }

      // Margem Direita (Apenas na área externa ao conteúdo principal)
      for (let y = -20; y < height + 40; y += cellH) {
        for (let x = rightMarginMin - 10; x <= width + 20; x += cellW) {
          const row = Math.floor(y / cellH);
          const xShift = (row % 2 === 1) ? cellW * 0.5 : 0;
          const nodeX = x + xShift;
          if (nodeX >= rightMarginMin - 15) {
            meshNodes.push({
              x: nodeX, y: y, ox: nodeX, oy: y, vx: 0, vy: 0, side: 'right'
            });
          }
        }
      }

      // Conectar em LOSANGOS
      for (let i = 0; i < meshNodes.length; i++) {
        for (let j = i + 1; j < meshNodes.length; j++) {
          const n1 = meshNodes[i];
          const n2 = meshNodes[j];
          if (n1.side === n2.side) {
            const dist = Math.hypot(n1.ox - n2.ox, n1.oy - n2.oy);
            if (dist > 30 && dist < 65) {
              meshLinks.push({ n1, n2, dist });
            }
          }
        }
      }
    }
    initMeshNodes();

    // --- 4. GATOS, CRIANÇAS E PÁSSAROS PASSEANDO EXCLUSIVAMENTE NAS MARGENS LATERAIS ---
    class RoamingCat {
      constructor(side, yPercent = 0.3, color = null) {
        this.side = side;
        this.yPercent = yPercent;
        this.customColor = color;
        this.reset();
      }

      reset() {
        this.x = this.side === 'left' ? Math.max(20, leftMarginMax * 0.25) : Math.min(width - 20, rightMarginMin + (width - rightMarginMin) * 0.75);
        this.minY = height * Math.max(0.08, this.yPercent - 0.1);
        this.maxY = height * Math.min(0.92, this.yPercent + 0.1);
        this.y = this.minY + Math.random() * (this.maxY - this.minY);
        this.scale = 0.7;
        this.speedY = (Math.random() - 0.5) * 0.6;
        this.tailWave = 0;
        this.color = this.customColor || (this.side === 'left' ? '#e8672e' : '#14283a');
        this.eyeColor = '#5fd6e3';
        this.jumpImpulse = 0;
        this.isTestingNet = false;
        this.testTime = 0;
      }

      triggerNetTest() {
        if (this.isTestingNet) return;
        this.isTestingNet = true;
        this.testTime = 0;
        this.jumpVx = this.side === 'left' ? 4 : -4;
        this.jumpVy = -6;
      }

      update(time) {
        if (this.isTestingNet) {
          this.testTime++;
          if (this.testTime < 40) {
            this.x += this.jumpVx;
            this.y += this.jumpVy;
            this.jumpVy += 0.15;
          } else if (this.testTime < 140) {
            if (this.testTime === 40) {
              this.hitX = this.x;
              this.hitY = this.y;
              meshNodes.forEach(n => {
                const d = Math.hypot(n.x - this.hitX, n.y - this.hitY);
                if (d < 160) {
                  n.vx += (n.x - this.hitX) * 0.12;
                  n.vy += (n.y - this.hitY) * 0.12;
                }
              });
            }
            this.x = this.hitX + (this.side === 'left' ? 1 : -1) * Math.sin(this.testTime * 0.08) * 6;
            this.y = this.hitY + Math.sin(this.testTime * 0.08) * 3;
          } else if (this.testTime < 200) {
            this.jumpVy += 0.15;
            this.y += this.jumpVy;
            this.x += (this.side === 'left' ? -2.66 : 2.66); 
          } else {
            this.isTestingNet = false;
          }
          return;
        }

        this.x = this.side === 'left' ? Math.max(20, leftMarginMax * 0.25) : Math.min(width - 20, rightMarginMin + (width - rightMarginMin) * 0.75);
        this.y += this.speedY;
        if (this.y < this.minY || this.y > this.maxY) this.speedY *= -1;

        this.tailWave = Math.sin(time * 0.003 + this.y) * 0.4;

        const dMouse = Math.hypot(mouse.x - this.x, mouse.y - this.y);
        if (dMouse < 90) {
          this.jumpImpulse = Math.sin(time * 0.01) * 6;
          meshNodes.forEach(n => {
            const d = Math.hypot(n.x - this.x, n.y - this.y);
            if (d < 70) {
              n.vx += (n.x - this.x) * 0.06;
              n.vy += (n.y - this.x) * 0.06;
            }
          });
        } else {
          this.jumpImpulse *= 0.9;
        }
      }

      draw() {
        if (this.isTestingNet && this.testTime >= 40 && this.testTime < 200) {
           ctx.save();
           ctx.beginPath();
           ctx.strokeStyle = `rgba(18, 138, 152, ${1 - (this.testTime-40)/160})`;
           ctx.lineWidth = 3;
           const r = 50 + Math.sin(this.testTime * 0.1) * 12;
           ctx.moveTo(this.hitX, this.hitY - r);
           ctx.lineTo(this.hitX + r, this.hitY);
           ctx.lineTo(this.hitX, this.hitY + r);
           ctx.lineTo(this.hitX - r, this.hitY);
           ctx.closePath();
           ctx.stroke();
           ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x, this.y + (this.isTestingNet ? 0 : this.jumpImpulse));
        
        let displayScale = this.side === 'left' ? this.scale : -this.scale;
        ctx.scale(displayScale, this.scale);
        
        if (this.isTestingNet) {
           if (this.testTime < 40) ctx.rotate(-Math.PI/6);
           else if (this.testTime < 140) ctx.rotate(-Math.PI/8);
        }

        // Corpo
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cabeça
        ctx.beginPath();
        ctx.arc(15, -9, 12, 0, Math.PI * 2);
        ctx.fill();

        // Orelhas
        ctx.beginPath();
        ctx.moveTo(8, -18); ctx.lineTo(13, -27); ctx.lineTo(18, -18);
        ctx.fill();

        // Olhos
        ctx.fillStyle = this.eyeColor;
        ctx.beginPath();
        ctx.arc(18, -10, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Cauda
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-18, 2);
        ctx.quadraticCurveTo(-32, -12 + Math.sin(this.tailWave) * 10, -26, -22);
        ctx.stroke();

        ctx.restore();
      }
    }

    class RoamingChild {
      constructor(side = 'right', yPercent = 0.25, clothesColor = '#128a98') {
        this.side = side;
        this.yPercent = yPercent;
        this.clothesColor = clothesColor;
        this.reset();
      }

      reset() {
        this.x = this.side === 'left' ? Math.max(20, leftMarginMax * 0.3) : Math.min(width - 30, rightMarginMin + (width - rightMarginMin) * 0.6);
        this.y = height * this.yPercent;
        this.armAngle = 0;
        this.isTestingNet = false;
        this.testTime = 0;
      }

      triggerNetTest() {
        if (this.isTestingNet) return;
        this.isTestingNet = true;
        this.testTime = 0;
        this.jumpVx = this.side === 'left' ? 2.5 : -2.5;
        this.jumpVy = 0;
      }

      update(time) {
        if (this.isTestingNet) {
          this.testTime++;
          if (this.testTime < 40) {
            this.x += this.jumpVx;
            this.armAngle = Math.PI / 1.5; 
          } else if (this.testTime < 140) {
            if (this.testTime === 40) {
              this.hitX = this.x;
              this.hitY = this.y;
              meshNodes.forEach(n => {
                const d = Math.hypot(n.x - this.hitX, n.y - this.hitY);
                if (d < 160) {
                  n.vx += (n.x - this.hitX) * 0.1;
                  n.vy += (n.y - this.hitY) * 0.1;
                }
              });
            }
            this.x = this.hitX + (this.side === 'left' ? -1 : 1) * Math.sin(this.testTime * 0.08) * 4;
            this.y = this.hitY + Math.sin(this.testTime * 0.08) * 2;
            this.armAngle = Math.PI / 1.5 + Math.sin(this.testTime * 0.2) * 0.2;
          } else if (this.testTime < 180) {
             this.x -= this.jumpVx;
             this.y += (height * this.yPercent - this.y) * 0.1;
             this.armAngle *= 0.9;
          } else {
             this.isTestingNet = false;
             this.y = height * this.yPercent;
          }
          return;
        }

        this.x = this.side === 'left' ? Math.max(20, leftMarginMax * 0.3) : Math.min(width - 30, rightMarginMin + (width - rightMarginMin) * 0.6);
        this.armAngle = Math.sin(time * 0.0025) * 0.35;
      }

      draw() {
        if (this.isTestingNet && this.testTime >= 40 && this.testTime < 200) {
           ctx.save();
           ctx.beginPath();
           ctx.strokeStyle = `rgba(18, 138, 152, ${1 - (this.testTime-40)/160})`;
           ctx.lineWidth = 3;
           const r = 50 + Math.sin(this.testTime * 0.1) * 12;
           ctx.moveTo(this.hitX, this.hitY - r);
           ctx.lineTo(this.hitX + r, this.hitY);
           ctx.lineTo(this.hitX, this.hitY + r);
           ctx.lineTo(this.hitX - r, this.hitY);
           ctx.closePath();
           ctx.stroke();
           ctx.restore();
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        let s = this.side === 'left' ? -0.75 : 0.75;
        ctx.scale(s, 0.75);
        
        if (this.isTestingNet) {
           ctx.rotate(0.1);
        }

        // Roupinha
        ctx.fillStyle = this.clothesColor;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();

        // Cabeça
        ctx.fillStyle = '#ffdbac';
        ctx.beginPath();
        ctx.arc(0, -22, 12, 0, Math.PI * 2);
        ctx.fill();

        // Cabelinho
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.arc(0, -26, 13, Math.PI, Math.PI * 2);
        ctx.fill();

        // Braço alcançando a rede
        ctx.strokeStyle = '#ffdbac';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(-28 + (this.isTestingNet ? -10 : 0), -16 + Math.sin(this.armAngle) * 15);
        ctx.stroke();

        ctx.restore();
      }
    }

    class RoamingBird {
      constructor(side, yPercent = 0.5, color = '#5fd6e3') {
        this.side = side;
        this.yPercent = yPercent;
        this.color = color;
        this.reset();
      }

      reset() {
        this.x = this.side === 'left' ? Math.max(20, leftMarginMax * 0.2) : Math.min(width - 20, rightMarginMin + (width - rightMarginMin) * 0.8);
        this.minY = height * Math.max(0.08, this.yPercent - 0.1);
        this.maxY = height * Math.min(0.92, this.yPercent + 0.1);
        this.y = this.minY + Math.random() * (this.maxY - this.minY);
        this.scale = 0.65;
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.wingFlap = 0;
        this.isTestingNet = false;
        this.testTime = 0;
      }

      triggerNetTest() {
        if (this.isTestingNet) return;
        this.isTestingNet = true;
        this.testTime = 0;
        this.jumpVx = this.side === 'left' ? 4 : -4;
        this.jumpVy = -4;
      }

      update(time) {
        if (this.isTestingNet) {
          this.testTime++;
          if (this.testTime < 40) {
            this.x += this.jumpVx;
            this.y += this.jumpVy;
          } else if (this.testTime < 140) {
            if (this.testTime === 40) {
              this.hitX = this.x;
              this.hitY = this.y;
              meshNodes.forEach(n => {
                const d = Math.hypot(n.x - this.hitX, n.y - this.hitY);
                if (d < 160) {
                  n.vx += (n.x - this.hitX) * 0.1;
                  n.vy += (n.y - this.hitY) * 0.1;
                }
              });
            }
            this.x = this.hitX + (this.side === 'left' ? 1 : -1) * Math.sin(this.testTime * 0.1) * 5;
            this.y = this.hitY + Math.cos(this.testTime * 0.1) * 3;
          } else if (this.testTime < 190) {
            this.x += (this.side === 'left' ? -2.5 : 2.5);
          } else {
            this.isTestingNet = false;
          }
          return;
        }

        this.x = this.side === 'left' ? Math.max(20, leftMarginMax * 0.2) : Math.min(width - 20, rightMarginMin + (width - rightMarginMin) * 0.8);
        this.y += this.speedY;
        if (this.y < this.minY || this.y > this.maxY) this.speedY *= -1;
        this.wingFlap = Math.sin(time * 0.015) * 10;
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        let s = this.side === 'left' ? this.scale : -this.scale;
        ctx.scale(s, this.scale);

        // Corpo do passarinho
        ctx.fillStyle = '#128a98';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cabeça
        ctx.beginPath();
        ctx.arc(10, -6, 7, 0, Math.PI * 2);
        ctx.fill();

        // Bico
        ctx.fillStyle = '#e8672e';
        ctx.beginPath();
        ctx.moveTo(16, -7); ctx.lineTo(23, -4); ctx.lineTo(16, -1);
        ctx.fill();

        // Asa animada
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(-2, -4 + this.wingFlap * 0.3, 10, 5, -0.3 + this.wingFlap * 0.05, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }

    const roamingEntities = [
      new RoamingCat('left', 0.2, '#e8672e'),        // Gato Laranja (Topo Esquerda)
      new RoamingCat('left', 0.7, '#74818a'),        // Gato Cinza (Baixo Esquerda)
      new RoamingCat('right', 0.8, '#14283a'),       // Gato Azul Escuro (Baixo Direita)
      new RoamingChild('right', 0.22, '#128a98'),    // Criança (Topo Direita)
      new RoamingChild('left', 0.45, '#e8672e'),     // Criança (Meio Esquerda)
      new RoamingBird('right', 0.5, '#5fd6e3'),      // Pássaro (Meio Direita)
      new RoamingBird('left', 0.88, '#e8672e')       // Pássaro (Baixo Esquerda)
    ];

    // --- 4.5 INTERAÇÃO DE CLIQUE: TESTE DE REDE ---
    const localImpacts = [];
    function animateStaticSVG(el, type, cx, cy) {
      if (el.dataset.testing) return;
      el.dataset.testing = "true";
      
      const isLeft = cx < width / 2;
      const jumpX = isLeft ? -30 : 30;
      const jumpY = type === 'cat' ? -20 : 0;
      
      el.style.animation = 'none';
      const anim = el.animate([
        { transform: 'translate(0px, 0px) rotate(0deg)' },
        { transform: `translate(${jumpX}px, ${jumpY}px) rotate(${isLeft? -15 : 15}deg)`, offset: 0.15 },
        { transform: `translate(${jumpX}px, ${jumpY}px) rotate(${isLeft? -10 : 10}deg)`, offset: 0.35 },
        { transform: `translate(${jumpX}px, ${jumpY}px) rotate(${isLeft? -15 : 15}deg)`, offset: 0.55 },
        { transform: 'translate(0px, 0px) rotate(0deg)', offset: 1.0 }
      ], { duration: 2500, easing: 'ease-in-out' });
      
      anim.onfinish = () => {
         el.style.animation = '';
         delete el.dataset.testing;
      };

      localImpacts.push({ x: cx, y: cy, time: 0, maxTime: 120 });
    }

    window.addEventListener('click', (e) => {
      const clickedCat = e.target.closest('.bg-float-cat');
      if (clickedCat) {
         animateStaticSVG(clickedCat, 'cat', e.clientX, e.clientY);
         return;
      }
      const clickedChild = e.target.closest('.bg-float-child');
      if (clickedChild) {
         animateStaticSVG(clickedChild, 'child', e.clientX, e.clientY);
         return;
      }

      // Verifica clique nas entidades dinâmicas do canvas
      roamingEntities.forEach(ent => {
        if (Math.hypot(ent.x - e.clientX, ent.y - e.clientY) < 70) {
          ent.triggerNetTest();
        }
      });
    });

    // --- 5. LOOP PRINCIPAL DE RENDERIZAÇÃO ---
    function loop(time) {
      ctx.clearRect(0, 0, width, height);

      // A) Desenhar Rastro de Patinhas (Suave)
      for (let i = paws.length - 1; i >= 0; i--) {
        const p = paws[i];
        drawPaw(p.x, p.y, p.scale, p.angle, p.alpha);
        p.alpha -= 0.015;
        if (p.alpha <= 0) paws.splice(i, 1);
      }

      // B) Atualizar e Desenhar Rede em Losango APENAS nas Margens Externa
      for (let i = 0; i < meshNodes.length; i++) {
        const n = meshNodes[i];
        n.vx = (n.vx + (n.ox - n.x) * 0.1) * 0.88;
        n.vy = (n.vy + (n.oy - n.y) * 0.1) * 0.88;

        const dm = Math.hypot(n.x - mouse.x, n.y - mouse.y);
        if (dm < 80 && dm > 0) {
          const push = (1 - dm / 80) * 4;
          n.vx += (n.x - mouse.x) / dm * push;
          n.vy += (n.y - mouse.y) / dm * push;
        }

        n.x += n.vx;
        n.y += n.vy;
      }

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(95, 214, 227, 0.3)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < meshLinks.length; i++) {
        const l = meshLinks[i];
        ctx.moveTo(l.n1.x, l.n1.y);
        ctx.lineTo(l.n2.x, l.n2.y);
      }
      ctx.stroke();

      // Nós discretos
      ctx.fillStyle = '#e8672e';
      meshNodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // C) Desenhar Entidades Interativas nas Margens (Gatos, Crianças, Pássaros)
      roamingEntities.forEach(ent => {
        ent.update(time);
        ent.draw();
      });

      // E) Impactos Locais (SVGs Estáticos)
      for (let i = localImpacts.length - 1; i >= 0; i--) {
        const imp = localImpacts[i];
        imp.time++;
        
        ctx.beginPath();
        const alpha = 1 - (imp.time / imp.maxTime);
        ctx.strokeStyle = `rgba(18, 138, 152, ${alpha})`;
        ctx.lineWidth = 3;
        const r = 40 + Math.sin(imp.time * 0.1) * 12;
        ctx.moveTo(imp.x, imp.y - r);
        ctx.lineTo(imp.x + r, imp.y);
        ctx.lineTo(imp.x, imp.y + r);
        ctx.lineTo(imp.x - r, imp.y);
        ctx.closePath();
        ctx.stroke();

        if (imp.time >= imp.maxTime) {
          localImpacts.splice(i, 1);
        }
      }

      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalAnimations);
  } else {
    initGlobalAnimations();
  }

  setTimeout(initGlobalAnimations, 300);
})();
