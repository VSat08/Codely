import React, { useState, useEffect, useRef } from 'react';

const MODELS = {
  gemini_free: [
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash (Recommended)' },
    { value: 'gemini-3.5-flash', label: 'gemini-3.5-flash (Warning: 20 req/day limit)' },
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
    { value: 'gemini-2.0-flash-lite', label: 'gemini-2.0-flash-lite' },
  ],
  gemini_byok: [
    { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash (Fast)' },
    { value: 'gemini-3.5-flash', label: 'gemini-3.5-flash (Newest Flagship)' },
    { value: 'gemini-2.5-pro', label: 'gemini-2.5-pro (Deep Reasoning)' },
    { value: 'gemini-2.0-flash', label: 'gemini-2.0-flash' },
    { value: 'gemini-2.0-flash-lite', label: 'gemini-2.0-flash-lite' },
  ],
  claude: [
    { value: 'claude-3-5-sonnet-20241022', label: 'claude-3.5-sonnet (Best Overall)' },
    { value: 'claude-3-5-haiku-20241022', label: 'claude-3.5-haiku (Fast)' },
    { value: 'claude-3-opus-20240229', label: 'claude-3-opus (Deep Reasoning)' },
    { value: 'claude-3-haiku-20240307', label: 'claude-3-haiku-20240307' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'gpt-4o (Best Overall)' },
    { value: 'gpt-4o-mini', label: 'gpt-4o-mini (Fast/Cheap)' },
    { value: 'o1-preview', label: 'o1-preview (Deep Reasoning)' },
    { value: 'o1-mini', label: 'o1-mini' },
    { value: 'gpt-4-turbo', label: 'gpt-4-turbo' },
    { value: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo' },
  ]
};

function CustomSelect({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <div 
        className="input" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption?.label}
        </span>
        <span className="material-symbols-outlined" style={{ color: 'var(--text-secondary)' }}>expand_more</span>
      </div>
      {isOpen && (
        <div className="ai-dropdown-menu" style={{ width: '100%', top: 'calc(100% + 4px)', zIndex: 1000, maxHeight: '200px', overflowY: 'auto', padding: '6px' }}>
          {options.map(opt => (
            <button
              key={opt.value}
              className={`ai-dropdown-item ${value === opt.value ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onChange(opt.value); setIsOpen(false); }}
              style={{ width: '100%', padding: '8px 12px' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function AIChatSettings({
  provider,
  setProvider,
  aiModel,
  setAiModel,
  apiKey,
  setApiKey,
  getUsageStats,
  providerLimits,
  onClose
}) {
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (getUsageStats) {
      getUsageStats(aiModel).then((data) => {
        if (mounted && data) {
          setUsage(data);
        }
      });
    }
    return () => { mounted = false; };
  }, [getUsageStats, aiModel]);

  const handleRefreshUsage = () => {
    if (!getUsageStats || isRefreshing) return;
    setIsRefreshing(true);
    getUsageStats(aiModel).then((data) => {
      if (data) setUsage(data);
      // Give it at least a 600ms spin for visual feedback
      setTimeout(() => setIsRefreshing(false), 600);
    });
  };

  const handleDone = () => {
    if (provider !== 'gemini' && !apiKey.trim()) {
      setError('An API key is required for BYOK providers.');
      return;
    }
    setError('');
    onClose();
  };

  const handleClose = () => {
    // If user tries to close/cancel while in an invalid state, revert to the free tier so they aren't stuck
    if (provider !== 'gemini' && !apiKey.trim()) {
      setProvider('gemini');
    }
    setError('');
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleProviderChange = (e) => {
    setProvider(e.target.value);
    setError('');
  };

  const currentModels = provider === 'gemini' 
    ? (apiKey ? MODELS.gemini_byok : MODELS.gemini_free)
    : MODELS[provider] || [];

  // Helper to format reset time from various formats
  const formatResetTime = (resetValue) => {
    if (!resetValue) return null;
    // OpenAI uses durations like "6m30s" or "1s"
    if (/^\d+m?\d*s?$/.test(resetValue) || /^\d+ms$/.test(resetValue)) return resetValue;
    // Claude uses RFC 3339 timestamps
    try {
      const resetDate = new Date(resetValue);
      const diffMs = resetDate.getTime() - Date.now();
      if (diffMs <= 0) return 'now';
      if (diffMs < 60000) return `${Math.ceil(diffMs / 1000)}s`;
      return `${Math.ceil(diffMs / 60000)}m`;
    } catch { return resetValue; }
  };

  // Get effective provider limits — from usage response or real-time socket events
  const effectiveProviderLimits = usage?.lastProviderLimits || providerLimits;

  return (
    <div className="ai-settings-modal-overlay" onClick={handleOverlayClick}>
      <div className="ai-settings-modal" style={{ width: '450px' }}>
        <div className="ai-settings-header">
          <h3>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>tune</span>
            AI Settings
          </h3>
          <button className="btn btn-icon btn-ghost" onClick={handleClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="ai-settings-body">
          <div className="form-group">
            <label>Provider</label>
            <CustomSelect 
              value={provider} 
              onChange={(val) => { setProvider(val); setError(''); }}
              options={[
                { value: 'gemini', label: ' Gemini (Free/BYOK)' },
                { value: 'claude', label: 'Claude (BYOK)' },
                { value: 'openai', label: 'OpenAI (BYOK)' }
              ]}
            />
          </div>

          <div className="form-group">
            <label>Model</label>
            <CustomSelect 
              value={aiModel} 
              onChange={(val) => setAiModel(val)}
              options={currentModels}
            />
          </div>

          {provider === 'gemini' && !apiKey && (
            <div className="form-group">
              <div style={{ 
                padding: '12px 14px', 
                background: 'var(--success-subtle)', 
                borderRadius: '8px', 
                border: '1px solid var(--success-border)',
                fontSize: '0.82rem',
                lineHeight: '1.5',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span>
                  Free tier active
                </strong>
                <div style={{ marginTop: '4px' }}>You're using Codely's built-in Gemini AI at no cost.</div>
              </div>
            </div>
          )}

          {provider !== 'gemini' && (
            <div className="form-group">
              <label>API Key</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                  placeholder={provider === 'claude' ? 'sk-ant-...' : 'sk-...'}
                  className="input"
                  style={{ borderColor: error ? 'var(--danger)' : undefined, width: '100%', paddingRight: '40px' }}
                />
                {apiKey && (
                  <button 
                    className="btn-icon btn-ghost"
                    onClick={() => { setApiKey(''); setError(''); }}
                    style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', padding: '4px' }}
                    title="Clear API Key"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                )}
              </div>
              {error ? (
                <p className="help-text" style={{ color: 'var(--danger)' }}>{error}</p>
              ) : (
                <div className="help-text" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px' }}>lock</span>
                    <span>Stored in your browser session only (clears on tab close).</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px' }}>bolt</span>
                    <span>Key is proxied through our server for CORS — never saved.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {provider === 'gemini' && (
            <div className="form-group">
              <label>Custom Gemini Key (Optional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setError(''); }}
                  placeholder="AIzaSy..."
                  className="input"
                  style={{ width: '100%', paddingRight: '40px' }}
                />
                {apiKey && (
                  <button 
                    className="btn-icon btn-ghost"
                    onClick={() => { setApiKey(''); setError(''); }}
                    style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', padding: '4px' }}
                    title="Remove key and return to free tier"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                  </button>
                )}
              </div>
              <div className="help-text" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Override the free tier with your own API key. <strong>Clear the input to return to the Free Tier.</strong></div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px', marginTop: '2px' }}>lock</span>
                  <em>Keys are securely kept in session storage and never saved to a database.</em>
                </div>
              </div>
            </div>
          )}

          {/* ── Section A: Plan Usage & Allowances ── */}
          {usage && (
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-primary)' }}>
              
              {provider === 'gemini' && !apiKey ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--accent)' }}>analytics</span>
                      Usage Limits
                      <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal', fontSize: '0.75rem', marginLeft: '4px' }}>Free Tier</span>
                    </h4>
                    <button 
                      className="btn-icon btn-ghost" 
                      onClick={handleRefreshUsage}
                      style={{ width: '28px', height: '28px', opacity: 0.7 }}
                      title="Refresh usage limits"
                    >
                      <span 
                        className="material-symbols-outlined" 
                        style={{ 
                          fontSize: '16px', 
                          animation: isRefreshing ? 'spin 1s linear infinite' : 'none' 
                        }}
                      >
                        refresh
                      </span>
                    </button>
                  </div>
                  
                  {usage.globalQuotaStatus && usage.globalQuotaStatus.exhausted && usage.globalQuotaStatus.resetAt > Date.now() && (
                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--danger)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>error</span>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>API Quota Exhausted</h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        The global API limit for <strong>{aiModel}</strong> has been reached. Please switch to another free model or provide your own API key.
                      </p>
                      <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 500 }}>
                        Resets in {Math.max(1, Math.ceil((usage.globalQuotaStatus.resetAt - Date.now()) / 1000))} seconds
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Your Personal Allowance</div>
                    <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                      To ensure fair usage across the platform, your requests are dynamically limited based on the model's actual capacity.
                    </p>
                    
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <span>Minute limits</span>
                        <span>{usage.countMin} / {usage.maxMin} requests</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          background: usage.countMin / usage.maxMin > 0.8 ? 'var(--warning, #f59e0b)' : 'var(--accent)', 
                          width: `${Math.min((usage.countMin / usage.maxMin) * 100, 100)}%`,
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                        Resets in {Math.max(1, Math.ceil((60000 - (Date.now() - usage.windowStartMin)) / 1000))} seconds
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        <span>Hourly limits</span>
                        <span>{usage.countHour} / {usage.maxHour} requests</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ 
                          height: '100%', 
                          background: usage.countHour / usage.maxHour > 0.8 ? 'var(--warning, #f59e0b)' : 'var(--accent)', 
                          width: `${Math.min((usage.countHour / usage.maxHour) * 100, 100)}%`,
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                        Resets in {Math.max(1, Math.ceil((3600000 - (Date.now() - usage.windowStartHour)) / 60000))} minutes
                      </div>
                    </div>
                  </div>

                  {usage.geminiFreeModelLimits && (
                    <div style={{ paddingTop: '16px', borderTop: '1px dashed var(--border-primary)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>Global Model Capacity</div>
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr 1fr', 
                        gap: '10px', 
                        marginBottom: '14px' 
                      }}>
                        <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{usage.geminiFreeModelLimits.rpm}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>RPM</div>
                        </div>
                        <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {usage.geminiFreeModelLimits.rpd >= 1000 ? `${(usage.geminiFreeModelLimits.rpd / 1000).toFixed(0)}K` : usage.geminiFreeModelLimits.rpd}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>RPD</div>
                        </div>
                        <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {usage.geminiFreeModelLimits.tpm >= 1000 ? `${(usage.geminiFreeModelLimits.tpm / 1000).toFixed(0)}K` : usage.geminiFreeModelLimits.tpm}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>TPM</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
                        <span>Approximate limits. <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-google)', textDecoration: 'none', fontWeight: 500 }}>Check AI Studio →</a></span>
                      </div>
                    </div>
                  )}
                </>
              ) : provider === 'gemini' && apiKey ? (
                <>
                  {/* Gemini BYOK Limits */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--brand-google)' }}>cloud</span>
                      Gemini API Limits
                      <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal', fontSize: '0.75rem', marginLeft: '4px' }}>Custom Key</span>
                    </h4>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    You are using your own API key. Codely's platform limits are disabled.
                  </div>
                  {usage.geminiFreeModelLimits && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr', 
                      gap: '10px'
                    }}>
                      <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{usage.geminiFreeModelLimits.rpm}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>RPM</div>
                      </div>
                      <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {usage.geminiFreeModelLimits.rpd >= 1000 ? `${(usage.geminiFreeModelLimits.rpd / 1000).toFixed(0)}K` : usage.geminiFreeModelLimits.rpd}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>RPD</div>
                      </div>
                      <div style={{ padding: '10px', background: 'var(--bg-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {usage.geminiFreeModelLimits.tpm >= 1000 ? `${(usage.geminiFreeModelLimits.tpm / 1000).toFixed(0)}K` : usage.geminiFreeModelLimits.tpm}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', marginTop: '2px', fontWeight: 500 }}>TPM</div>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>info</span>
                    <span>Note: Gemini API does not return live usage data in headers. These are the baseline free-tier limits.</span>
                  </div>
                </>
              ) : null}
            </div>
          )}

          {/* OpenAI / Claude BYOK — live header data */}
          {(provider === 'openai' || provider === 'claude') && apiKey && (
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: provider === 'openai' ? '#10a37f' : '#d97706' }}>cloud</span>
                  {provider === 'openai' ? 'OpenAI' : 'Claude'} API Limits
                  <span style={{ color: 'var(--text-tertiary)', fontWeight: 'normal', fontSize: '0.75rem', marginLeft: '4px' }}>{aiModel}</span>
                </h4>
              </div>

              {effectiveProviderLimits && effectiveProviderLimits.provider === provider && effectiveProviderLimits.limits ? (() => {
                const lim = effectiveProviderLimits.limits;
                const reqLimit = parseInt(lim.requestsLimit) || null;
                const reqRemaining = parseInt(lim.requestsRemaining) || null;
                const tokLimit = parseInt(lim.tokensLimit || lim.inputTokensLimit) || null;
                const tokRemaining = parseInt(lim.tokensRemaining || lim.inputTokensRemaining) || null;
                const reqReset = formatResetTime(lim.requestsReset);
                const tokReset = formatResetTime(lim.tokensReset || lim.inputTokensReset);

                return (
                  <>
                    {reqLimit && reqRemaining !== null && (
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          <span>Requests remaining</span>
                          <span style={{ fontWeight: 500 }}>{reqRemaining.toLocaleString()} / {reqLimit.toLocaleString()}</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            background: reqRemaining / reqLimit < 0.2 ? 'var(--danger, #ef4444)' : reqRemaining / reqLimit < 0.5 ? 'var(--warning, #f59e0b)' : 'var(--accent)',
                            width: `${Math.min((reqRemaining / reqLimit) * 100, 100)}%`,
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        {reqReset && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                            Resets in {reqReset}
                          </div>
                        )}
                      </div>
                    )}

                    {tokLimit && tokRemaining !== null && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          <span>Tokens remaining</span>
                          <span style={{ fontWeight: 500 }}>{tokRemaining.toLocaleString()} / {tokLimit.toLocaleString()}</span>
                        </div>
                        <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            background: tokRemaining / tokLimit < 0.2 ? 'var(--danger, #ef4444)' : tokRemaining / tokLimit < 0.5 ? 'var(--warning, #f59e0b)' : 'var(--accent)',
                            width: `${Math.min((tokRemaining / tokLimit) * 100, 100)}%`,
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }}></div>
                        </div>
                        {tokReset && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                            Resets in {tokReset}
                          </div>
                        )}
                      </div>
                    )}

                    {!reqLimit && !tokLimit && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        Rate limit headers not available from this provider.
                      </div>
                    )}

                    {effectiveProviderLimits.timestamp && (
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '8px', opacity: 0.7 }}>
                        Last updated: {new Date(effectiveProviderLimits.timestamp).toLocaleTimeString()}
                      </div>
                    )}
                  </>
                );
              })() : (
                <div style={{ 
                  padding: '16px', 
                  background: 'var(--bg-tertiary)', 
                  borderRadius: '10px', 
                  textAlign: 'center' 
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'block' }}>query_stats</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Send a message to see live API limits
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                    Rate limits are captured from API response headers after each request.
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
        
        <div className="ai-settings-footer">
          <button className="btn btn-primary" onClick={handleDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

