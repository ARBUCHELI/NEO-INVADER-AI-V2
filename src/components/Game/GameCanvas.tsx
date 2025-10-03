import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { GameState } from '@/types/game';
import { CONSTANTS } from '@/lib/gameLogic';

interface GameCanvasProps {
  gameState: GameState;
}

const GameCanvas = ({ gameState }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);
  const gameStateRef = useRef<GameState>(gameState);

  // Keep latest game state
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!canvasRef.current || p5Instance.current) return;

    const sketch = (p: p5) => {
      let canvas: p5.Renderer;

      // --- Setup ---
      p.setup = () => {
        canvas = p.createCanvas(CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT);
        canvas.parent(canvasRef.current!);
        resizeToParent();
      };

      const resizeToParent = () => {
        if (!canvasRef.current) return;
        const parentWidth = canvasRef.current.offsetWidth;
        const aspect = CONSTANTS.CANVAS_HEIGHT / CONSTANTS.CANVAS_WIDTH;
        p.resizeCanvas(parentWidth, parentWidth * aspect);
      };

      p.windowResized = () => {
        resizeToParent();
      };

      // --- Draw Loop ---
      p.draw = () => {
        const state = gameStateRef.current;

        // Background
        p.background(15, 10, 40);

        // Scale everything to fit resized canvas
        const scaleX = p.width / CONSTANTS.CANVAS_WIDTH;
        const scaleY = p.height / CONSTANTS.CANVAS_HEIGHT;
        p.scale(scaleX, scaleY);

        // Draw stars
        p.fill(255, 255, 255, 150);
        p.noStroke();
        for (let i = 0; i < 50; i++) {
          const x = (i * 73) % CONSTANTS.CANVAS_WIDTH;
          const y = (i * 97) % CONSTANTS.CANVAS_HEIGHT;
          p.circle(x, y, 2);
        }

        if (!state.isPlaying) return;

        // --- PLAYER ---
        p.push();
        p.translate(state.playerX, CONSTANTS.CANVAS_HEIGHT - 60);

        const pixelSize = 4;
        const tankBody = [
          [0,1,1,1,0],
          [1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1],
          [1,1,1,1,1,1,1],
        ];

        p.fill(0, 255, 255);
        p.noStroke();
        for (let y = 0; y < tankBody.length; y++) {
          for (let x = 0; x < tankBody[y].length; x++) {
            if (tankBody[y][x]) {
              p.rect(
                (x - Math.floor(tankBody[y].length / 2)) * pixelSize,
                (y - Math.floor(tankBody.length / 2)) * pixelSize,
                pixelSize,
                pixelSize
              );
            }
          }
        }

        // Turret
        p.fill(0, 255, 200);
        for (let i = 0; i < 4; i++) {
          p.rect(0, -i * pixelSize - pixelSize, pixelSize, pixelSize);
        }

        // Glow
        p.fill(0, 255, 255, 50);
        p.circle(0, 0, CONSTANTS.PLAYER_SIZE + 10);
        p.pop();

        // --- ENEMIES ---
        state.enemies.forEach(enemy => {
          if (!enemy.isAlive) return;

          const colors = [
            [255, 0, 255],
            [157, 0, 255],
            [0, 255, 200],
          ];
          const color = colors[enemy.type];

          p.fill(color[0], color[1], color[2]);
          p.noStroke();
          p.push();
          p.translate(enemy.x, enemy.y);

          const ps = 3;
          if (enemy.type === 0) {
            p.rect(-4*ps,-4*ps,ps,ps); p.rect(3*ps,-4*ps,ps,ps);
            for(let i=-4;i<=3;i++){ p.rect(i*ps,-2*ps,ps,ps); p.rect(i*ps,-1*ps,ps,ps);}
            p.rect(-3*ps,0,ps,ps); p.rect(-2*ps,0,ps,ps); p.rect(1*ps,0,ps,ps); p.rect(2*ps,0,ps,ps);
            p.rect(-4*ps,ps,ps,ps); p.rect(-1*ps,ps,ps); p.rect(0,ps,ps,ps); p.rect(3*ps,ps,ps,ps);
          } else if(enemy.type===1){
            p.rect(-3*ps,-4*ps,ps,ps); p.rect(2*ps,-4*ps,ps,ps);
            for(let i=-3;i<=2;i++){ p.rect(i*ps,-3*ps,ps,ps); p.rect(i*ps,-2*ps,ps,ps);}
            p.rect(-2*ps,-1*ps,ps,ps); p.rect(1*ps,-1*ps,ps,ps);
            for(let i=-4;i<=3;i++) p.rect(i*ps,0,ps,ps);
            p.rect(-4*ps,ps,ps,ps); p.rect(-2*ps,ps,ps,ps); p.rect(1*ps,ps,ps,ps); p.rect(3*ps,ps,ps,ps);
          } else {
            p.rect(-2*ps,-4*ps,ps,ps); p.rect(-1*ps,-4*ps,ps,ps); p.rect(0,-4*ps,ps,ps); p.rect(1*ps,-4*ps,ps,ps);
            for(let i=-3;i<=2;i++){ p.rect(i*ps,-3*ps,ps,ps); p.rect(i*ps,-2*ps,ps,ps);}
            p.rect(-2*ps,-1*ps,ps,ps); p.rect(1*ps,-1*ps,ps,ps);
            for(let i=-3;i<=2;i++) p.rect(i*ps,0,ps,ps);
            p.rect(-3*ps,ps,ps,ps); p.rect(-1*ps,ps,ps,ps); p.rect(0,ps,ps,ps); p.rect(2*ps,ps,ps,ps);
          }

          p.fill(color[0], color[1], color[2], 20);
          p.circle(0,0,CONSTANTS.ENEMY_SIZE + 15);
          p.pop();
        });

        // --- BARRIERS ---
        state.barriers.forEach(barrier => {
          p.push();
          p.translate(barrier.x, barrier.y);
          for (let y = 0; y < barrier.segments.length; y++) {
            for (let x = 0; x < barrier.segments[y].length; x++) {
              if (barrier.segments[y][x]) {
                const segmentHealth = 1 - (x / barrier.segments[y].length);
                p.fill(80, 150 * segmentHealth + 55, 50);
                p.noStroke();
                p.rect(x*barrier.segmentSize, y*barrier.segmentSize, barrier.segmentSize-1, barrier.segmentSize-1);
              }
            }
          }
          p.pop();
        });

        // --- PLAYER BULLETS ---
        p.fill(0,255,255);
        p.noStroke();
        state.bullets.forEach(bullet => {
          if (bullet.isActive){
            p.circle(bullet.x, bullet.y, CONSTANTS.BULLET_SIZE*2);
            p.fill(0,255,255,100);
            p.circle(bullet.x, bullet.y + 5, CONSTANTS.BULLET_SIZE);
            p.fill(0,255,255);
          }
        });

        // --- ENEMY BULLETS ---
        p.fill(255,0,100);
        state.enemyBullets.forEach(bullet => {
          if (bullet.isActive){
            p.circle(bullet.x, bullet.y, CONSTANTS.BULLET_SIZE*2);
            p.fill(255,0,100,100);
            p.circle(bullet.x, bullet.y - 5, CONSTANTS.BULLET_SIZE);
            p.fill(255,0,100);
          }
        });

        // --- MOTHERSHIP ---
        if(state.mothership){
          p.fill(155,155,100);
          p.noStroke();
          p.push();
          p.translate(state.mothership.x,state.mothership.y);
          const ps = 3;
          p.rect(-ps,-1*ps,ps,ps);
          p.rect(-2*ps,-4*ps,4*ps,ps);
          p.rect(-3*ps,-3*ps,6*ps,ps);
          p.rect(-5*ps,-2*ps,10*ps,2*ps);
          p.rect(-4*ps,0,8*ps,ps);
          p.fill(0,255,255);
          p.rect(-1*ps,-1*ps,2*ps,ps);
          p.fill(255,255,0,30);
          p.circle(0,0,50);
          p.fill(255,255,255);
          p.textSize(10);
          p.textAlign(p.CENTER);
          p.text(state.mothership.points.toString(),0,20);
          p.pop();
        }

        // --- PARTICLES ---
        state.particles.forEach(particle => {
          const alpha = (particle.life / particle.maxLife) * 255;
          const colorMatch = particle.color.match(/\w\w/g);
          if(colorMatch){
            const r = parseInt(colorMatch[0],16);
            const g = parseInt(colorMatch[1],16);
            const b = parseInt(colorMatch[2],16);
            p.fill(r,g,b,alpha);
            p.noStroke();
            p.circle(particle.x, particle.y,4);
          }
        });

        // --- UI ---
        p.fill(0,255,255);
        p.textSize(16);
        p.textAlign(p.LEFT);
        p.text(`SCORE: ${state.score}`,20,30);
        p.text(`LIVES: ${'❤'.repeat(state.lives)}`,20,55);
        p.text(`LEVEL: ${state.level}`, CONSTANTS.CANVAS_WIDTH-120,30);
      };
    };

    p5Instance.current = new p5(sketch);

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={canvasRef} 
      className="relative w-full max-w-[800px] mx-auto"
      style={{ aspectRatio: '4 / 3' }}
    />
  );
};

export default GameCanvas;
