import React, { useState, useEffect } from 'react';

const SplashScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animação simples para a barra de progresso para dar feedback visual
    const interval = setInterval(() => {
        setProgress(oldProgress => {
            if (oldProgress >= 95) { // Para um pouco antes de 100% para indicar espera
                return oldProgress;
            }
            const diff = (100 - oldProgress) / 10;
            return oldProgress + Math.random() * diff;
        });
    }, 800);

    return () => {
        clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 animate-fade-in">
      <div className="splash-dot"></div>
      <h1 className="text-3xl font-bold text-gray-200 mt-8 tracking-wider">FORRO</h1>
      <p className="text-gray-400 mt-2">Carregando perfis de usuário...</p>
      <div className="w-64 bg-gray-700/50 rounded-full h-1.5 mt-4 overflow-hidden">
        <div 
          className="bg-cyan-400 h-1.5" 
          style={{ width: `${progress}%`, transition: 'width 0.8s ease-out' }}
        ></div>
      </div>
    </div>
  );
};

export default SplashScreen;