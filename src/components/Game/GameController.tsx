import { useState, useEffect, useRef } from 'react'
import GameCanvas from './GameCanvas'
import { GameState, GameMetrics, DifficultySettings } from '@/types/game'
import {
  createInitialGameState,
  createInitialMetrics,
  updateGame,
  shootBullet,
  enemyShoot,
  movePlayer,
  shouldSpawnMothership,
  spawnMothership,
} from '@/lib/gameLogic'
import { soundManager } from '@/lib/sounds'
import { initializeAI, getAdaptiveDifficulty, getDifficultyMessage } from '@/lib/adaptiveEngine'
import { ArcadeButton } from '@/components/ui/arcade-button'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Footer from '@/components/Footer';

const GameController = () => {
  const [gameState, setGameState] = useState<GameState>(
    createInitialGameState()
  )
  const [metrics, setMetrics] = useState<GameMetrics>(createInitialMetrics())
  const [difficulty, setDifficulty] = useState<DifficultySettings>({
    enemySpeed: 0.3,
    enemyFireRate: 0.003,
    enemySpawnPattern: 'normal',
    enemyBehavior: 'static',
  })
  const [difficultyMessage, setDifficultyMessage] = useState<string>('')

  const keysPressed = useRef<Set<string>>(new Set())
  const gameLoopRef = useRef<number>()
  const lastDifficultyCheck = useRef<number>(Date.now())

  const touchState = useRef({ moveLeft: false, moveRight: false })

  useEffect(() => initializeAI(), [])

  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
      return
    }

    let lastTime = Date.now()
    const loop = () => {
      const currentTime = Date.now()
      const deltaTime = (currentTime - lastTime) / 1000
      lastTime = currentTime

      const { state: newState, metrics: newMetrics } = updateGame(
        gameState,
        metrics,
        deltaTime,
        difficulty.enemySpeed
      )

      let finalState = enemyShoot(newState, difficulty.enemyFireRate)

      if (keysPressed.current.has('ArrowLeft') || touchState.current.moveLeft)
        finalState = movePlayer(finalState, 'left')
      if (keysPressed.current.has('ArrowRight') || touchState.current.moveRight)
        finalState = movePlayer(finalState, 'right')

      if (shouldSpawnMothership(finalState, currentTime))
        finalState = spawnMothership(finalState)

      if (
        Math.floor(currentTime / 500) !==
        Math.floor((currentTime - deltaTime * 1000) / 500)
      ) {
        soundManager.stepEnemyMove()
      }

      setGameState(finalState)
      setMetrics(newMetrics)

      if (currentTime - lastDifficultyCheck.current > 8000) {
        lastDifficultyCheck.current = currentTime
        getAdaptiveDifficulty(newMetrics).then(aiDifficulty => {
          setDifficulty(aiDifficulty)
          setDifficultyMessage(getDifficultyMessage(aiDifficulty))
        })
      }

      gameLoopRef.current = requestAnimationFrame(loop)
    }

    gameLoopRef.current = requestAnimationFrame(loop)
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [gameState, metrics, difficulty])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' && gameState.isPlaying && !gameState.isPaused) {
        e.preventDefault()
        const { state: newState, metrics: newMetrics } = shootBullet(
          gameState,
          metrics
        )
        setGameState(newState)
        setMetrics(newMetrics)
      }

      if (e.key === 'Escape' && gameState.isPlaying) {
        e.preventDefault()
        setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))
      }

      if (
        (e.key === 'ArrowLeft' || e.key === 'ArrowRight') &&
        !keysPressed.current.has(e.key)
      ) {
        e.preventDefault()
        keysPressed.current.add(e.key)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        keysPressed.current.delete(e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [gameState, metrics])

  const startGame = () => {
    setGameState({ ...createInitialGameState(), isPlaying: true })
    setMetrics(createInitialMetrics())
    setDifficulty({
      enemySpeed: 0.3,
      enemyFireRate: 0.003,
      enemySpawnPattern: 'normal',
      enemyBehavior: 'static',
    })
    setDifficultyMessage('')
    soundManager.startEnemyMove()
    toast.success('Game Started!')
  }

  const handleShoot = () => {
    if (gameState.isPlaying && !gameState.isPaused) {
      const { state: newState, metrics: newMetrics } = shootBullet(gameState, metrics)
      setGameState(newState)
      setMetrics(newMetrics)
    }
  }

  const restartGame = () => startGame()
  const pauseGame = () =>
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }))

  useEffect(() => {
    if (gameState.isGameOver) {
      soundManager.stopEnemyMove()
      toast.error('Game Over! Final Score: ' + gameState.score, {
        duration: 5000,
      })
    }
  }, [gameState.isGameOver])

  // ---------- RENDER ----------

  if (!gameState.isPlaying && !gameState.isGameOver) {
    // Welcome / Start screen
    return (
      <div className='flex flex-col items-center justify-center min-h-screen p-4 md:p-8 gap-6 text-center animate-slide-up'>
        <svg
          width='150'
          height='150'
          viewBox='0 0 50 50'
          className='animate-glow-pulse mb-1'>
          {/* simplified welcome ship */}
          <rect x='10' y='10' width='4' height='4' fill='#ff00ff' />
          <rect x='36' y='10' width='4' height='4' fill='#ff00ff' />
          <rect x='14' y='14' width='4' height='4' fill='#ff00ff' />
          <rect x='32' y='14' width='4' height='4' fill='#ff00ff' />
          <rect x='10' y='18' width='30' height='8' fill='#ff00ff' />
          <rect x='14' y='26' width='4' height='4' fill='#ff00ff' />
          <rect x='22' y='26' width='4' height='4' fill='#ff00ff' />
          <rect x='32' y='26' width='4' height='4' fill='#ff00ff' />
          <rect x='10' y='30' width='4' height='4' fill='#ff00ff' />
          <rect x='18' y='30' width='4' height='4' fill='#ff00ff' />
          <rect x='28' y='30' width='4' height='4' fill='#ff00ff' />
          <rect x='36' y='30' width='4' height='4' fill='#ff00ff' />
        </svg>
        <h1 className='text-2xl md:text-5xl font-bold pixel-font glow-text-cyan mb-1'>
          SPACE
        </h1>
        <h1 className='text-2xl md:text-5xl font-bold pixel-font glow-text-pink mb-2'>
          INVADERS
        </h1>
        <p className='text-lg md:text-xl text-accent mb-2'>
          AI-Powered Adaptive Gameplay
        </p>
        <ArcadeButton onClick={startGame} size='xl' variant='default'>
          Start Game
        </ArcadeButton>
        <div className='text-xs md:text-sm text-muted-foreground mt-2 space-y-1'>
          <p className='hidden md:block'>← → Arrow keys to move</p>
          <p className='hidden md:block'>Spacebar to shoot</p>
          <p className='hidden md:block'>ESC to pause</p>
          <p className='md:hidden'>Use touch controls to play</p>
        </div>
         <Footer/>
      </div>
    )
  }

  // Game running / paused / over
  return (
    <div className='flex flex-col md:flex-row items-start justify-center min-h-screen gap-4 p-2 md:p-8 w-full'>
      {/* Canvas */}
      <div className='flex-1 flex flex-col items-center justify-start gap-2 w-full'>
        {difficultyMessage && (
          <div className='text-center text-accent text-xs md:text-sm pixel-font animate-glow-pulse mb-2'>
            {difficultyMessage}
          </div>
        )}
        <GameCanvas gameState={gameState} />
        
        {/* Mobile Touch Controls */}
        {!gameState.isGameOver && (
          <div className='md:hidden flex gap-4 justify-center items-center mt-4 w-full px-4'>
            <ArcadeButton
              variant='accent'
              size='lg'
              className='flex-1 max-w-[120px]'
              onTouchStart={() => { touchState.current.moveLeft = true }}
              onTouchEnd={() => { touchState.current.moveLeft = false }}
              onMouseDown={() => { touchState.current.moveLeft = true }}
              onMouseUp={() => { touchState.current.moveLeft = false }}
              onMouseLeave={() => { touchState.current.moveLeft = false }}>
              <ChevronLeft className='w-8 h-8' />
            </ArcadeButton>
            <ArcadeButton
              variant='default'
              size='lg'
              className='flex-1 max-w-[120px]'
              onTouchStart={handleShoot}
              onClick={handleShoot}>
              FIRE
            </ArcadeButton>
            <ArcadeButton
              variant='accent'
              size='lg'
              className='flex-1 max-w-[120px]'
              onTouchStart={() => { touchState.current.moveRight = true }}
              onTouchEnd={() => { touchState.current.moveRight = false }}
              onMouseDown={() => { touchState.current.moveRight = true }}
              onMouseUp={() => { touchState.current.moveRight = false }}
              onMouseLeave={() => { touchState.current.moveRight = false }}>
              <ChevronRight className='w-8 h-8' />
            </ArcadeButton>
          </div>
        )}
      </div>

      {/* Right HUD */}
      <div className='flex-none w-full md:w-72 lg:w-80 bg-black/70 p-4 rounded-lg shadow-lg text-xs md:text-sm lg:text-base space-y-4 mt-2 md:mt-4 lg:mt-6'>
        {/* Controls */}
        {!gameState.isGameOver && (
          <div className='flex gap-2 justify-center flex-wrap'>
            <ArcadeButton
              onClick={pauseGame}
              variant='accent'
              size='sm'
              className='text-xs px-3 py-1'>
              {gameState.isPaused ? 'Resume' : 'Pause'}
            </ArcadeButton>
            <ArcadeButton
              onClick={restartGame}
              variant='secondary'
              size='sm'
              className='text-xs px-3 py-1'>
              Restart
            </ArcadeButton>
          </div>
        )}

        {/* Paused */}
        {gameState.isPaused && !gameState.isGameOver && (
          <div className='font-bold pixel-font glow-text-purple animate-glow-pulse text-center'>
            PAUSED
          </div>
        )}

        {/* Game Over */}
        {gameState.isGameOver && (
          <>
            <h2 className='text-lg md:text-xl lg:text-xl font-bold pixel-font glow-text-pink text-center mb-2'>
              GAME OVER
            </h2>
            <div className='space-y-1 md:space-y-2 text-center'>
              <p className='text-primary'>Final Score: {gameState.score}</p>
              <p className='text-accent'>Level Reached: {gameState.level}</p>
              <p className='text-secondary'>
                Accuracy:{' '}
                {metrics.shotsAttempted > 0
                  ? ((metrics.shotsHit / metrics.shotsAttempted) * 100).toFixed(
                      1
                    )
                  : 0}
                %
              </p>
            </div>
            <ArcadeButton
              onClick={restartGame}
              size='sm'
              variant='secondary'
              className='mt-2 w-full text-xs md:text-sm'>
              Play Again
            </ArcadeButton>
          </>
        )}

        {/* Live metrics */}
        {!gameState.isGameOver && (
          <div className='grid grid-cols-3 gap-2 text-center text-muted-foreground'>
            <div>
              <p className='font-semibold'>Accuracy</p>
              <p>
                {metrics.shotsAttempted > 0
                  ? ((metrics.shotsHit / metrics.shotsAttempted) * 100).toFixed(
                      1
                    )
                  : 0}
                %
              </p>
            </div>
            <div>
              <p className='font-semibold'>Enemies</p>
              <p>{metrics.enemiesKilled}</p>
            </div>
            <div>
              <p className='font-semibold'>Time</p>
              <p>{metrics.survivalTime}s</p>
            </div>
          </div>
        )}
        <div className='flex-none w-full md:w-72 lg:w-80 bg-black/70 p-4 rounded-lg shadow-lg text-xs md:text-sm lg:text-base space-y-4 mt-2 md:mt-4 lg:mt-6'>
          <h1 className='text-lg md:text-xl lg:text-xl font-bold pixel-font glow-text-pink text-center mb-2'>
            SPACE INVADERS
          </h1>
          <p className='text-lg md:text-xl text-accent text-center mb-2'>
            AI-Powered Adaptive Gameplay
          </p>
          <p className='text-lg md:text-xl lg:text-xl font-bold pixel-font glow-text-cyan text-center mb-2'>
            ANDRES R. BUCHELI
          </p>
          <p className='text-lg md:text-xl text-accent text-center mb-2'>
            AI Agent Developer
          </p>
          <img
            src='/atari-atavar.png'
            alt='Profile or logo'
            className='mx-auto mt-2 w-24 h-auto rounded-lg'
          />
        </div>
      </div>
    </div>
  )
}

export default GameController
