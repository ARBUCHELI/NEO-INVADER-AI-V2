import {
  GameState,
  Enemy,
  Bullet,
  GameMetrics,
  Barrier,
  Mothership,
  Particle,
} from '@/types/game'
import { soundManager } from './sounds'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const PLAYER_SIZE = 40
const ENEMY_SIZE = 30
const BULLET_SIZE = 5

// Barrier constants
const BARRIER_WIDTH = 80
const BARRIER_HEIGHT = 40
const BARRIER_SEGMENTS_X = 8
const BARRIER_SEGMENTS_Y = 5
const BARRIER_SEGMENT_SIZE = 7

// Direction state for enemies
let enemyDirection = 1

// --- INITIAL GAME STATE ---
export const createInitialGameState = (): GameState => ({
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  score: 0,
  lives: 3,
  level: 1,
  playerX: CANVAS_WIDTH / 2,
  enemies: createEnemies(1),
  bullets: [],
  enemyBullets: [],
  barriers: createBarriers(),
  mothership: null,
  particles: [],
  lastHitTime: 0,
})

// --- INITIAL METRICS ---
export const createInitialMetrics = (): GameMetrics => ({
  shotsAttempted: 0,
  shotsHit: 0,
  reactionTimes: [],
  survivalTime: 0,
  enemiesKilled: 0,
  levelStartTime: Date.now(),
})

// --- BARRIER CREATION ---
export const createBarriers = (): Barrier[] => {
  const barriers: Barrier[] = []
  const barrierCount = 4
  const spacing = CANVAS_WIDTH / (barrierCount + 1)

  for (let i = 0; i < barrierCount; i++) {
    const segments: boolean[][] = []
    for (let y = 0; y < BARRIER_SEGMENTS_Y; y++) {
      segments[y] = []
      for (let x = 0; x < BARRIER_SEGMENTS_X; x++) {
        segments[y][x] = true
      }
    }

    barriers.push({
      x: spacing * (i + 1) - BARRIER_WIDTH / 2,
      y: CANVAS_HEIGHT - 150,
      health: 100,
      segments,
      segmentSize: BARRIER_SEGMENT_SIZE,
    })
  }

  return barriers
}

// --- PARTICLE CREATION ---
export const createExplosion = (
  x: number,
  y: number,
  color: string
): Particle[] => {
  const particles: Particle[] = []
  const particleCount = 15

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount
    const speed = 2 + Math.random() * 3

    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      color,
    })
  }

  return particles
}

// --- ENEMY CREATION ---
// Add a random phase to each enemy for chaotic movement
export const createEnemies = (level: number): Enemy[] => {
  const enemies: Enemy[] = []
  const rows = Math.min(3 + Math.floor(level / 2), 6)
  const cols = 10
  const spacing = 60
  const startX = (CANVAS_WIDTH - cols * spacing) / 2
  const startY = 50

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      enemies.push({
        x: startX + col * spacing,
        y: startY + row * 50,
        type: row % 3,
        isAlive: true,
        speed: 0.5 + level * 0.1,
        phase: Math.random() * Math.PI * 2, // random horizontal phase
      } as Enemy)
    }
  }
  return enemies
}

// --- BARRIER COLLISION DETECTION ---
const checkBarrierCollision = (state: GameState): GameState => {
  const newState = { ...state }

  const handleBulletHit = (bullet: Bullet, isEnemyBullet: boolean) => {
    for (const barrier of newState.barriers) {
      if (
        bullet.x >= barrier.x &&
        bullet.x <= barrier.x + BARRIER_WIDTH &&
        bullet.y >= barrier.y &&
        bullet.y <= barrier.y + BARRIER_HEIGHT
      ) {
        const segmentX = Math.floor(
          (bullet.x - barrier.x) / barrier.segmentSize
        )

        // Determine iteration direction based on bullet direction
        const rows = isEnemyBullet
          ? [...barrier.segments.keys()] // top to bottom for enemy
          : [...barrier.segments.keys()].reverse() // bottom to top for player

        for (const row of rows) {
          if (
            segmentX >= 0 &&
            segmentX < barrier.segments[row].length &&
            barrier.segments[row][segmentX]
          ) {
            barrier.segments[row][segmentX] = false
            soundManager.barrierHit()
            return true
          }
        }
      }
    }
    return false
  }

  // --- Update collision call ---
  newState.bullets = newState.bullets.filter(
    bullet => bullet.isActive && !handleBulletHit(bullet, false)
  )
  newState.enemyBullets = newState.enemyBullets.filter(
    bullet => bullet.isActive && !handleBulletHit(bullet, true)
  )

  return newState
}

// --- GAME UPDATE ---
export const updateGame = (
  state: GameState,
  metrics: GameMetrics,
  deltaTime: number,
  enemySpeed: number = 0.5
): { state: GameState; metrics: GameMetrics } => {
  if (!state.isPlaying || state.isPaused || state.isGameOver)
    return { state, metrics }

  let newState = { ...state }
  const newMetrics = { ...metrics }
  const moveAmount = enemySpeed * deltaTime * 60
  let changeDirection = false
  const now = Date.now()

  // --- ENEMY MOVEMENT with chaotic phase ---
  newState.enemies.forEach(enemy => {
    if (!enemy.isAlive) return

    const wave = Math.sin(now / 300 + (enemy.phase || 0)) // chaotic horizontal factor
    enemy.x += moveAmount * enemyDirection * (0.7 + 0.9 * wave)

    if (enemy.x < ENEMY_SIZE / 2 || enemy.x > CANVAS_WIDTH - ENEMY_SIZE / 2)
      changeDirection = true
  })

  if (changeDirection) {
    enemyDirection = -enemyDirection
    newState.enemies.forEach(enemy => {
      if (!enemy.isAlive) return
      // Scale drop amount with enemy speed - slower = less drop
      const dropAmount = Math.min(20 + enemySpeed * 30, 50)
      enemy.y += dropAmount

      // Check immediately after moving down - game over if too low
      if (enemy.y >= CANVAS_HEIGHT - 180) {
        newState.isGameOver = true
        newState.lives = 0
        soundManager.playerHit()
      }
    })
  }

  // --- ENEMY-BARRIER COLLISION CHECK ---
  newState.enemies.forEach(enemy => {
    if (!enemy.isAlive) return

    for (const barrier of newState.barriers) {
      if (
        enemy.x + ENEMY_SIZE / 2 >= barrier.x &&
        enemy.x - ENEMY_SIZE / 2 <= barrier.x + BARRIER_WIDTH &&
        enemy.y + ENEMY_SIZE / 2 >= barrier.y &&
        enemy.y - ENEMY_SIZE / 2 <= barrier.y + BARRIER_HEIGHT
      ) {
        newState.isGameOver = true
        newState.lives = 0
        soundManager.playerHit()
        return
      }
    }
  })

  // --- BULLET UPDATES ---
  newState.bullets = newState.bullets
    .map(b => ({ ...b, y: b.y - b.speed, isActive: b.y > 0 }))
    .filter(b => b.isActive)

  newState.enemyBullets = newState.enemyBullets
    .map(b => ({ ...b, y: b.y + b.speed, isActive: b.y < CANVAS_HEIGHT }))
    .filter(b => b.isActive)

  // --- BARRIER COLLISIONS ---
  newState = checkBarrierCollision(newState)

  // --- MOTHERSHIP UPDATE ---
  if (newState.mothership) {
    newState.mothership.x += newState.mothership.speed
    if (newState.mothership.x > CANVAS_WIDTH + 50) newState.mothership = null
  }

  // --- PARTICLES UPDATE ---
  newState.particles = newState.particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.2,
      life: p.life - 1 / 60,
    }))
    .filter(p => p.life > 0)

  // --- PLAYER BULLET COLLISIONS ---
  newState.bullets.forEach(bullet => {
    if (!bullet.isActive) return

    for (const enemy of newState.enemies) {
      if (!enemy.isAlive) continue
      const distance = Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y)
      if (distance < ENEMY_SIZE / 2 + BULLET_SIZE) {
        enemy.isAlive = false
        bullet.isActive = false
        newState.score += 10 * (enemy.type + 1)
        newMetrics.shotsHit++
        newMetrics.enemiesKilled++
        soundManager.enemyKilled()
        newState.particles.push(...createExplosion(enemy.x, enemy.y, '#ff00ff'))
        break
      }
    }

    if (newState.mothership && bullet.isActive) {
      const distance = Math.hypot(
        bullet.x - newState.mothership.x,
        bullet.y - newState.mothership.y
      )
      if (distance < 40) {
        bullet.isActive = false
        newState.score += newState.mothership.points
        newMetrics.shotsHit++
        soundManager.mothershipKilled()
        newState.particles.push(
          ...createExplosion(
            newState.mothership.x,
            newState.mothership.y,
            '#ffff00'
          )
        )
        newState.mothership = null
      }
    }
  })

  newState.bullets = newState.bullets.filter(b => b.isActive)

  // --- ENEMY BULLET COLLISIONS WITH PLAYER ---
  const HIT_COOLDOWN = 1000
  if (now - newState.lastHitTime > HIT_COOLDOWN) {
    newState.enemyBullets.forEach(bullet => {
      const distance = Math.hypot(
        bullet.x - newState.playerX,
        bullet.y - (CANVAS_HEIGHT - 60)
      )
      if (distance < PLAYER_SIZE / 2 + BULLET_SIZE) {
        bullet.isActive = false
        newState.lives--
        newState.lastHitTime = now
        soundManager.playerHit()
        newState.particles.push(
          ...createExplosion(newState.playerX, CANVAS_HEIGHT - 60, '#00ffff')
        )
        if (newState.lives <= 0) newState.isGameOver = true
      }
    })
  }

  newState.enemyBullets = newState.enemyBullets.filter(b => b.isActive)

  // --- SURVIVAL TIME ---
  // --- SURVIVAL TIME ---
  newMetrics.survivalTime = Math.floor(
    (Date.now() - newMetrics.levelStartTime) / 1000
  )

  // --- LEVEL COMPLETE ---
  if (newState.enemies.every(e => !e.isAlive)) {
    newState.level++
    newState.enemies = createEnemies(newState.level)
    newState.barriers = createBarriers()
    newMetrics.levelStartTime = Date.now()
  }

  return { state: newState, metrics: newMetrics }
}

// --- PLAYER SHOOTING ---
export const shootBullet = (state: GameState, metrics: GameMetrics) => {
  if (state.bullets.length < 3) {
    soundManager.playerShoot()
    const bullet: Bullet = {
      x: state.playerX,
      y: CANVAS_HEIGHT - 80,
      speed: 8,
      isActive: true,
    }
    return {
      state: { ...state, bullets: [...state.bullets, bullet] },
      metrics: { ...metrics, shotsAttempted: metrics.shotsAttempted + 1 },
    }
  }
  return { state, metrics }
}

// --- ENEMY SHOOTING ---
export const enemyShoot = (state: GameState, fireRate = 0.1): GameState => {
  const alive = state.enemies.filter(e => e.isAlive)
  if (alive.length === 0) return state
  const scaledFireRate = Math.min(fireRate + state.level * 0.01, 0.5)
  if (Math.random() < scaledFireRate) {
    const shooter = alive[Math.floor(Math.random() * alive.length)]
    const bullet: Bullet = {
      x: shooter.x,
      y: shooter.y + ENEMY_SIZE / 2,
      speed: 4,
      isActive: true,
    }
    return { ...state, enemyBullets: [...state.enemyBullets, bullet] }
  }
  return state
}

// --- PLAYER MOVEMENT ---
export const movePlayer = (
  state: GameState,
  direction: 'left' | 'right'
): GameState => {
  const speed = 8
  let x = state.playerX
  if (direction === 'left') x = Math.max(PLAYER_SIZE / 2, x - speed)
  if (direction === 'right')
    x = Math.min(CANVAS_WIDTH - PLAYER_SIZE / 2, x + speed)
  return { ...state, playerX: x }
}

// --- DRAW PLAYER ---
export const drawPlayer = (ctx: CanvasRenderingContext2D, state: GameState) => {
  const now = Date.now()
  const INVINCIBILITY_DURATION = 1000
  const isInvincible = now - state.lastHitTime < INVINCIBILITY_DURATION

  ctx.fillStyle = isInvincible
    ? Math.floor(now / 100) % 2 === 0
      ? 'red'
      : 'blue'
    : 'blue'

  ctx.fillRect(
    state.playerX - PLAYER_SIZE / 2,
    CANVAS_HEIGHT - 60 - PLAYER_SIZE / 2,
    PLAYER_SIZE,
    PLAYER_SIZE
  )
}

// --- MOTHERSHIP SPAWNING ---
let lastMothershipSpawn = 0
let nextMothershipDelay = 15000

export const shouldSpawnMothership = (
  state: GameState,
  currentTime: number
): boolean => {
  if (state.mothership || !state.isPlaying || state.isPaused) return false
  if (currentTime - lastMothershipSpawn > nextMothershipDelay) {
    lastMothershipSpawn = currentTime
    nextMothershipDelay = 10000 + Math.random() * 20000
    return true
  }
  return false
}

export const spawnMothership = (state: GameState): GameState => {
  const points = [50, 100, 150, 200, 300][Math.floor(Math.random() * 5)]
  return {
    ...state,
    mothership: { x: -50, y: 30, speed: 2, isAlive: true, points },
  }
}

// --- EXPORT CONSTANTS ---
export const CONSTANTS = {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_SIZE,
  ENEMY_SIZE,
  BULLET_SIZE,
  BARRIER_WIDTH,
  BARRIER_HEIGHT,
  BARRIER_SEGMENTS_X,
  BARRIER_SEGMENTS_Y,
  BARRIER_SEGMENT_SIZE,
}
