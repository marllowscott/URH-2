import { useEffect, useState, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  opacity: number;
  fadeOut: number; // 0 = normal, 1 = fading out
  type: 'slow' | 'fast'; // New property to distinguish particle types
  spawnTime: number; // When this particle was spawned
}

const Fireflies = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Store animation frame ID for cleanup
  const animationFrameRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const numSlowParticles = 80; // Reduced from 200 for better performance
    const numFastParticles = 150; // Reduced from 400 for better performance
    const initialParticles: Particle[] = [];

    // Create slow particles (original type)
    for (let i = 0; i < numSlowParticles; i++) {
      initialParticles.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        dx: (Math.random() - 0.5) * 1.5, // Slightly slower movement
        dy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 2 + 0.5, // Even smaller: 0.5-2.5px
        opacity: 0, // Start invisible for fade-in effect
        fadeOut: 0,
        type: 'slow',
        spawnTime: Date.now(),
      });
    }

    // Create fast particles (new type)
    for (let i = 0; i < numFastParticles; i++) {
      initialParticles.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        dx: (Math.random() - 0.5) * 3, // Faster movement
        dy: (Math.random() - 0.5) * 3,
        size: Math.random() * 1.5 + 0.3, // Even smaller: 0.3-1.8px
        opacity: 0, // Start invisible for fade-in effect
        fadeOut: 0,
        type: 'fast',
        spawnTime: Date.now() + Math.random() * 5000, // Stagger spawn times
      });
    }

    setParticles(initialParticles);

    const animate = () => {
      frameCountRef.current++;
      
      // Only update state every 3rd frame (20fps instead of 60fps) for better performance
      if (frameCountRef.current % 3 === 0) {
        setParticles(prevParticles => {
          const newParticles = prevParticles
            .map(particle => {
              let { x, y, dx, dy, fadeOut, opacity, type, spawnTime } = particle;

              x += dx;
              y += dy;

              // Bounce off edges
              if (x <= 0 || x >= dimensions.width - particle.size) {
                dx = -dx;
                x = Math.max(0, Math.min(dimensions.width - particle.size, x));
              }
              if (y <= 0 || y >= dimensions.height - particle.size) {
                dy = -dy;
                y = Math.max(0, Math.min(dimensions.height - particle.size, y));
              }

              // Enhanced fade in/out logic for hero effect
              const headerHeight = 80;
              const tabAreaTop = 120;
              const tabAreaBottom = 180;
              const contentWidth = Math.min(1536, dimensions.width);
              const contentLeft = (dimensions.width - contentWidth) / 2;
              const contentRight = contentLeft + contentWidth;
              const contentTop = 200;
              const contentBottom = dimensions.height - 100;

              const inHeader = particle.y < headerHeight;
              const inTabs = particle.y > tabAreaTop && particle.y < tabAreaBottom && particle.x > contentLeft && particle.x < contentRight;
              const inContent = particle.x > contentLeft && particle.x < contentRight &&
                               particle.y > contentTop && particle.y < contentBottom;

              // Smooth fade in/out transitions
              if (inContent) {
                fadeOut = Math.min(fadeOut + 0.005, 1); // Very slow fade out for content areas
              } else if (inHeader || inTabs) {
                fadeOut = Math.min(fadeOut + 0.01, 1); // Slow fade out for header/tabs
              } else {
                fadeOut = Math.max(fadeOut - 0.003, 0); // Very slow fade back in for open areas
              }

              // Enhanced fade in/out logic based on particle type and timing
              const timeSinceSpawn = Date.now() - spawnTime;
              const shouldBeVisible = timeSinceSpawn > 0; // All particles should eventually appear

              if (type === 'fast') {
                // Fast particles have more dynamic appearing/disappearing
                if (shouldBeVisible && fadeOut < 0.2) {
                  opacity = Math.min(opacity + 0.008, 0.6); // Faster fade in for fast particles
                } else if (fadeOut > 0.8 || Math.random() < 0.002) { // Random chance to disappear
                  opacity = Math.max(opacity - 0.01, 0); // Faster fade out
                }
              } else {
                // Slow particles (original behavior)
                if (fadeOut < 0.3) {
                  opacity = Math.min(opacity + 0.005, 0.8); // Slow fade in when appearing
                } else if (fadeOut > 0.7) {
                  opacity = Math.max(opacity - 0.003, 0.1); // Slow fade out when disappearing
                }
              }

              return { ...particle, x, y, dx, dy, fadeOut, opacity, type, spawnTime };
            })
            .filter(particle => particle.fadeOut < 1); // Remove completely faded particles

          // Add new particles to maintain the count, but limit spawning rate
          const targetSlowParticles = 80; // Reduced from 200
          const targetFastParticles = 150; // Reduced from 400
          const maxParticlesPerFrame = 2; // Reduced from 8 for better performance

          // Count current particles by type
          const slowCount = newParticles.filter(p => p.type === 'slow').length;
          const fastCount = newParticles.filter(p => p.type === 'fast').length;

          // Add slow particles
          const slowParticlesToAdd = Math.min(maxParticlesPerFrame, Math.max(0, targetSlowParticles - slowCount));
          for (let i = 0; i < slowParticlesToAdd; i++) {
            let x, y;
            let attempts = 0;
            do {
              const spawnNearEdge = Math.random() < 0.7;
              if (spawnNearEdge) {
                const edge = Math.floor(Math.random() * 4);
                switch (edge) {
                  case 0: x = Math.random() * dimensions.width; y = Math.random() * 50; break;
                  case 1: x = dimensions.width - Math.random() * 50; y = Math.random() * dimensions.height; break;
                  case 2: x = Math.random() * dimensions.width; y = dimensions.height - Math.random() * 50; break;
                  case 3: x = Math.random() * 50; y = Math.random() * dimensions.height; break;
                }
              } else {
                x = Math.random() * dimensions.width;
                y = Math.random() * dimensions.height;
              }
              attempts++;
            } while (attempts < 5 && (y < 80 || (y > 120 && y < 180) || (x > (dimensions.width - Math.min(1536, dimensions.width)) / 2 &&
                     x < (dimensions.width - Math.min(1536, dimensions.width)) / 2 + Math.min(1536, dimensions.width) &&
                     y > 200 && y < dimensions.height - 100)));

            newParticles.push({
              x,
              y,
              dx: (Math.random() - 0.5) * 1.5,
              dy: (Math.random() - 0.5) * 1.5,
              size: Math.random() * 2 + 0.5,
              opacity: 0,
              fadeOut: 0,
              type: 'slow',
              spawnTime: Date.now(),
            });
          }

          // Add fast particles
          const fastParticlesToAdd = Math.min(maxParticlesPerFrame, Math.max(0, targetFastParticles - fastCount));
          for (let i = 0; i < fastParticlesToAdd; i++) {
            // Fast particles spawn anywhere randomly for more dynamic effect
            const x = Math.random() * dimensions.width;
            const y = Math.random() * dimensions.height;

            newParticles.push({
              x,
              y,
              dx: (Math.random() - 0.5) * 3,
              dy: (Math.random() - 0.5) * 3,
              size: Math.random() * 1.5 + 0.3,
              opacity: 0,
              fadeOut: 0,
              type: 'fast',
              spawnTime: Date.now() + Math.random() * 3000, // Staggered spawn times
            });
          }

          return newParticles;
        });
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);
    
    // CRITICAL: Cancel animation loop on cleanup to prevent multiple loops
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [dimensions]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {particles.map((particle, index) => (
        <div
          key={index}
          className="absolute rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: '#0747a1',
            opacity: particle.opacity * (1 - particle.fadeOut),
          }}
        />
      ))}
    </div>
  );
};

export default Fireflies;