import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { migrateLegacyStorage } from '@/services/storage';
import { trackAppOpened } from '@/services/analytics';
import { useSettingsStore } from '@/store/settingsStore';
import { useSessionsStore } from '@/store/sessionsStore';
import { RecordingControlsProvider } from '@/context/RecordingControls';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { AppShell } from '@/components/layout/AppShell';
import { ArchiveScreen } from '@/screens/ArchiveScreen';
import { LiveScreen } from '@/screens/LiveScreen';
import { StudioScreen } from '@/screens/StudioScreen';
import { InsightsScreen } from '@/screens/InsightsScreen';
import { LexiconScreen } from '@/screens/LexiconScreen';
import { SettingsModal } from '@/modals/SettingsModal';
import { TranscriptionConfigModal } from '@/modals/TranscriptionConfigModal';
import { SessionSummaryModal } from '@/modals/SessionSummaryModal';
import { GrammarDrawer } from '@/modals/GrammarDrawer';

export default function App() {
  // One-time startup: migrate legacy storage, then hydrate the stores.
  useEffect(() => {
    migrateLegacyStorage();
    useSettingsStore.getState().loadFromStorage();
    useSessionsStore.getState().loadFromStorage();
    trackAppOpened();
  }, []);

  useEscapeKey();

  return (
    <BrowserRouter>
      <RecordingControlsProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<ArchiveScreen />} />
            <Route path="live" element={<LiveScreen />} />
            <Route path="studio/:id" element={<StudioScreen />} />
            <Route path="insights" element={<InsightsScreen />} />
            <Route path="lexicon" element={<LexiconScreen />} />
          </Route>
        </Routes>

        {/* Global overlays — mounted once, shown via store flags. */}
        <SettingsModal />
        <TranscriptionConfigModal />
        <SessionSummaryModal />
        <GrammarDrawer />
      </RecordingControlsProvider>
    </BrowserRouter>
  );
}
