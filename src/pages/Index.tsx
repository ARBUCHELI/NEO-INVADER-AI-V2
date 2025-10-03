import GameController from '@/components/Game/GameController';

const Index = () => {
  return (
    <div className="min-h-screen arcade-grid flex items-center justify-center">
      <div className="container max-w-6xl">
        <GameController />
      </div>
    </div>
  );
};

export default Index;
