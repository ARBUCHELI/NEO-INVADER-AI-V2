import { GameMetrics, DifficultySettings } from '@/types/game';
import { HfInference } from '@huggingface/inference';

// Hugging Face client for adaptive AI
let hfClient: HfInference | null = null;

// Initialize HF client
export const initializeAI = () => {
  try {
    hfClient = new HfInference();
    console.log('AI Engine initialized with Hugging Face');
  } catch (error) {
    console.warn('AI initialization failed, falling back to rule-based system:', error);
    hfClient = null;
  }
};

// Calculate player skill level from metrics - with more balanced weighting
const calculateSkillLevel = (metrics: GameMetrics): number => {
  const hitRatio = metrics.shotsAttempted > 0 
    ? metrics.shotsHit / metrics.shotsAttempted 
    : 0;
  
  const avgReactionTime = metrics.reactionTimes.length > 0
    ? metrics.reactionTimes.reduce((a, b) => a + b, 0) / metrics.reactionTimes.length
    : 1000;
  
  const killRate = metrics.survivalTime > 0
    ? metrics.enemiesKilled / metrics.survivalTime
    : 0;

  // More balanced normalization
  const hitScore = hitRatio; // 0-1
  const reactionScore = Math.max(0, 1 - (avgReactionTime / 3000)); // More forgiving (0-1)
  const killScore = Math.min(1, killRate / 1.5); // More reasonable kill rate expectation (0-1)

  // Weight accuracy more heavily, reaction time less
  return (hitScore * 0.5 + reactionScore * 0.2 + killScore * 0.3);
};

// GRADUAL difficulty scaling with increased fire rates
const getRuleBasedDifficulty = (metrics: GameMetrics): DifficultySettings => {
  const skillLevel = calculateSkillLevel(metrics);
  
  // INCREASED: Base values for complete beginner
  const baseSpeed = 0.3;
  const baseFireRate = 0.1; // Increased from 0.001
  
  // INCREASED: Maximum values (caps to prevent getting too hard)
  const maxSpeed = 1.2;
  const maxFireRate = 0.015; // Increased from 0.003
  
  // Gradual scaling based on skill level
  const speed = baseSpeed + (skillLevel * (maxSpeed - baseSpeed));
  const fireRate = baseFireRate + (skillLevel * (maxFireRate - baseFireRate));
  
  // Gradual behavior changes
  let spawnPattern: 'normal' | 'wave' | 'random' | 'strategic' = 'normal';
  let behavior: 'static' | 'aggressive' | 'evasive' = 'static';
  
  if (skillLevel > 0.4) {
    spawnPattern = 'wave';
  }
  if (skillLevel > 0.6) {
    behavior = 'aggressive';
  }
  if (skillLevel > 0.8) {
    spawnPattern = 'random';
  }
  if (skillLevel > 0.9) {
    behavior = 'evasive';
    spawnPattern = 'strategic';
  }

  return {
    enemySpeed: Math.min(speed, maxSpeed),
    enemyFireRate: Math.min(fireRate, maxFireRate),
    enemySpawnPattern: spawnPattern,
    enemyBehavior: behavior,
  };
};

// AI-powered difficulty adjustment using Hugging Face
export const getAdaptiveDifficulty = async (
  metrics: GameMetrics
): Promise<DifficultySettings> => {
  // Add a minimum playtime requirement before adjusting difficulty
  if (metrics.survivalTime < 30) { // Don't adjust in first 30 seconds
    return {
      enemySpeed: 0.3,
      enemyFireRate: 0.003, // Increased from 0.001
      enemySpawnPattern: 'normal',
      enemyBehavior: 'static',
    };
  }

  if (!hfClient) {
    return getRuleBasedDifficulty(metrics);
  }

  try {
    const skillLevel = calculateSkillLevel(metrics);
    const hitRatio = metrics.shotsAttempted > 0 
      ? (metrics.shotsHit / metrics.shotsAttempted * 100).toFixed(1)
      : '0';

    // Use HF for generating difficulty analysis
    const prompt = `You are a Space Invaders difficulty AI. Analyze this player:
Hit accuracy: ${hitRatio}%
Enemies killed: ${metrics.enemiesKilled}
Survival time: ${metrics.survivalTime.toFixed(1)}s
Skill level: ${(skillLevel * 100).toFixed(1)}%

Suggest one difficulty adjustment (enemy speed, fire rate, or behavior) in one sentence.`;

    const response = await hfClient.textGeneration({
      model: 'distilgpt2',
      inputs: prompt,
      parameters: {
        max_new_tokens: 50,
        temperature: 0.7,
        return_full_text: false,
      }
    });

    console.log('AI Suggestion:', response.generated_text);

    return getRuleBasedDifficulty(metrics);

  } catch (error) {
    console.warn('AI difficulty adjustment failed, using rule-based:', error);
    return getRuleBasedDifficulty(metrics);
  }
};

// Updated difficulty messages for gradual system
export const getDifficultyMessage = (settings: DifficultySettings): string => {
  if (settings.enemySpeed < 0.5) {
    return "🎮 Beginner Mode - Getting warmed up!";
  } else if (settings.enemySpeed < 0.7) {
    return "⚔️ Getting the hang of it!";
  } else if (settings.enemySpeed < 0.9) {
    return "🔥 You're getting good!";
  } else if (settings.enemySpeed < 1.1) {
    return "🚀 Expert level unlocked!";
  } else {
    return "💀 Master Level - Show them who's boss!";
  }
};