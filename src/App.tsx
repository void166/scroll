import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollTrigger } from './animations/gsap';
import { initBackgroundScheduler } from './animations/scrollAnimations';
import { preloadGate, startStreaming, IS_COMPACT } from './lib/frameLoader';
import { JOURNEY, PLATES } from './data/site';

import { Loader } from './components/Loader';
import { Navigation } from './components/Navigation';
import { Cursor } from './components/Cursor';
import { Film } from './components/Film';
import { Journeys } from './components/Journeys';
import { Approach } from './components/Approach';
import { Enquire } from './components/Enquire';
import { Footer } from './components/Footer';

export default function App() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const backdropRef = useRef<HTMLDivElement>(null);

  /* ---- assets ------------------------------------------------------- */
  useEffect(() => {
    let cancelled = false;
    document.body.classList.add('is-loading');
    window.scrollTo(0, 0);

    preloadGate(
      { sequence: JOURNEY, stills: Object.values(PLATES) },
      (value) => {
        if (!cancelled) setProgress(value);
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- page-wide scroll behaviour ------------------------------------ */
  useLayoutEffect(() => {
    if (loading) return;

    initBackgroundScheduler(backdropRef.current);
    // Sticky stages and lazy images settle a beat after the curtain lifts.
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 240);

    return () => window.clearTimeout(id);
  }, [loading]);

  const handleLoaderDone = () => {
    document.body.classList.remove('is-loading');
    setLoading(false);
    // The rest of the reel arrives behind the viewer, nearest-frame first.
    startStreaming(JOURNEY);
  };

  return (
    <>
      <div className="backdrop" ref={backdropRef} />

      {loading && <Loader progress={progress} onComplete={handleLoaderDone} />}

      {!IS_COMPACT && <Cursor />}
      <Navigation ready={!loading} />

      <main>
        <Film ready={!loading} />
        <Journeys />
        <Approach />
        <Enquire />
        <Footer />
      </main>

      <div className="veil" />
      <div className="grain" />
    </>
  );
}
