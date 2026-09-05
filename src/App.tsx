import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ScrollTrigger } from './animations/gsap';
import { initBackgroundScheduler } from './animations/scrollAnimations';
import { preload, IS_COMPACT } from './lib/frameLoader';
import { SEQUENCES, PLATES } from './data/scenes';

import { Loader } from './components/Loader';
import { Navigation } from './components/Navigation';
import { Cursor } from './components/Cursor';
import { Hero } from './components/Hero';
import { Intro } from './components/Intro';
import { StorySection } from './components/StorySection';
import { SequenceSection } from './components/SequenceSection';
import { Studies } from './components/Studies';
import { Plate } from './components/Plate';
import { Statement } from './components/Statement';
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

    preload(
      {
        sequences: [SEQUENCES.obsidian, SEQUENCES.drape],
        stills: Object.values(PLATES),
      },
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

    return () => {
      window.clearTimeout(id);
    };
  }, [loading]);

  const handleLoaderDone = () => {
    document.body.classList.remove('is-loading');
    setLoading(false);
  };

  return (
    <>
      <div className="backdrop" ref={backdropRef} />

      {loading && <Loader progress={progress} onComplete={handleLoaderDone} />}

      {!IS_COMPACT && <Cursor />}
      <Navigation ready={!loading} />

      <main>
        <Hero ready={!loading} />
        <Intro />
        <StorySection />
        <SequenceSection />
        <Studies />
        <Plate />
        <Statement />
        <Footer />
      </main>

      <div className="veil" />
      <div className="grain" />
    </>
  );
}
