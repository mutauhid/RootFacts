import { useRef, useState, useEffect } from 'react';
import Header from './components/Header';
import CameraSection from './components/CameraSection';
import InfoPanel from './components/InfoPanel';
import { useAppState } from './hooks/useAppState';
import { CameraService } from './services/CameraService';
import { DetectionService } from './services/DetectionService';
import { RootFactsService } from './services/RootFactsService';
import { APP_CONFIG, isValidDetection } from './utils/config';

function App() {
  const { state, actions } = useAppState();
  const detectionCleanupRef = useRef(null);
  const isRunningRef = useRef(false);
  const loopRef = useRef(null);
  const [currentTone, setCurrentTone] = useState('normal');

  useEffect(() => {
    const detector = new DetectionService();
    const camera = new CameraService();
    const generator = new RootFactsService();

    async function initServices() {
      try {
        actions.setModelStatus('Memuat Model AI... (0%)');
        await detector.loadModel();
        actions.setModelStatus('Memuat Model AI... (50%)');
        await generator.loadModel();
        actions.setModelStatus('Model AI Siap');
        actions.setServices({ detector, camera, generator });
      } catch (e) {
        actions.setError(e.toString());
      }
    }

    initServices();

    return () => {
      stopDetectionLoop();
      camera.stopCamera();
    };
  }, []);

  const handleToneChange = (tone) => {
    setCurrentTone(tone);
    if (state.services.generator) {
      state.services.generator.setTone(tone);
    }
  };

  const startDetectionLoop = async () => {
    if (!state.services.detector || !state.services.camera || !state.services.generator) return;

    if (loopRef.current) cancelAnimationFrame(loopRef.current);

    actions.setAppState('analyzing');

    const detect = async () => {
      if (!isRunningRef.current) return;

      const { detector, camera } = state.services;
      if (camera.isReady() && detector.isLoaded()) {
        const result = await detector.predict(camera.video);
        if (isValidDetection(result)) {
          handleDetection(result);
          return;
        }
      }

      loopRef.current = requestAnimationFrame(detect);
    };

    detect();
  };

  const stopDetectionLoop = () => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
  };

  const handleDetection = async (result) => {
    stopDetectionLoop();
    actions.setAppState('result');
    actions.setDetectionResult({ className: result.label, score: result.confidence / 100 });
    actions.setFunFactData(null);

    const facts = await state.services.generator.generateFacts(result.label);
    actions.setFunFactData(facts);
  };

  const handleToggleCamera = async () => {
    if (!state.services.camera) return;

    if (state.isRunning) {
      isRunningRef.current = false;
      actions.setRunning(false);
      state.services.camera.stopCamera();
      stopDetectionLoop();
      actions.resetResults();
    } else {
      try {
        await state.services.camera.startCamera();
        isRunningRef.current = true;
        actions.setRunning(true);
        startDetectionLoop();
      } catch (e) {
        actions.setError(`Gagal mengakses kamera: ${  e.message}`);
      }
    }
  };

  const handleCopyFact = async () => {
    if (state.funFactData && state.funFactData !== 'error') {
      try {
        await navigator.clipboard.writeText(state.funFactData);
        alert('Fakta berhasil disalin!');
      } catch (e) {
        alert('Gagal menyalin fakta');
      }
    }
  };

  return (
    <div className="app-container">
      <Header modelStatus={state.modelStatus} />

      <main className="main-content">
        <CameraSection
          isRunning={state.isRunning}
          services={state.services}
          modelStatus={state.modelStatus}
          error={state.error}
          currentTone={currentTone}
          onToggleCamera={handleToggleCamera}
          onToneChange={handleToneChange}
        />

        <InfoPanel
          appState={state.appState}
          detectionResult={state.detectionResult}
          funFactData={state.funFactData}
          error={state.error}
          onCopyFact={handleCopyFact}
        />
      </main>

      <footer className="footer">
        <p>Powered by TensorFlow.js & Transformers.js</p>
      </footer>

      {state.error && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '380px',
          padding: '0.875rem 1rem',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--radius-md)',
          color: '#991b1b',
          fontSize: '0.8125rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          zIndex: 1000
        }}>
          <strong>Error:</strong> {state.error}
          <button
            onClick={() => actions.setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: '#991b1b',
              padding: 0,
              lineHeight: 1
            }}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
