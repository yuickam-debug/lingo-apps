import { useApp } from '../context/AppContext';
import { resetAllData } from '@lingo/shared/storage';
import type { AppSettings } from '@lingo/shared/types';

export function Settings() {
  const { settings, updateSettings } = useApp();

  const set = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings({ ...settings, [key]: value });
  };

  const handleReset = () => {
    if (confirm('Reset all saved words and settings? This cannot be undone.')) {
      resetAllData('de');
      window.location.reload();
    }
  };

  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Settings</h2>
      </div>

      <div className="settings-section">
        <div className="settings-group">
          <div className="settings-row">
            <div className="settings-label-wrap">
              <div className="settings-label">Dark Mode</div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.theme === 'dark'}
                onChange={(e) => set('theme', e.target.checked ? 'dark' : 'light')}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-row">
            <div className="settings-label-wrap">
              <div className="settings-label">Playback Speed</div>
              <div className="settings-sublabel">TTS shadowing rate</div>
            </div>
            <select
              className="settings-select"
              value={settings.shadowingSpeed}
              onChange={(e) =>
                set('shadowingSpeed', parseFloat(e.target.value) as AppSettings['shadowingSpeed'])
              }
            >
              <option value={0.7}>0.7×</option>
              <option value={1.0}>1.0×</option>
              <option value={1.2}>1.2×</option>
            </select>
          </div>

          <div className="settings-row">
            <div className="settings-label-wrap">
              <div className="settings-label">Pause Between Sentences</div>
              <div className="settings-sublabel">Shadowing gap</div>
            </div>
            <span className="range-value">{settings.shadowingPauseMs}ms</span>
            <input
              type="range"
              min={500}
              max={3000}
              step={250}
              value={settings.shadowingPauseMs}
              onChange={(e) => set('shadowingPauseMs', parseInt(e.target.value))}
              style={{ width: '100px' }}
            />
          </div>
        </div>

        <div className="settings-group">
          <div className="settings-row">
            <div className="settings-label-wrap">
              <div className="settings-label" style={{ color: '#ef4444' }}>
                Reset All Data
              </div>
              <div className="settings-sublabel">
                Clears saved words and settings
              </div>
            </div>
            <button className="btn-remove" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--ink-2)', marginTop: '8px' }}>
          DELingo · Week 1 Build
        </p>
      </div>
    </div>
  );
}
