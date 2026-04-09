import React from 'react';
import { useStore } from '../../state/store';
import { buildShareURL } from '../../lib/sharing';
import * as htmlToImage from 'html-to-image';

export function ShareModal() {
  const open = useStore((s) => s.openShare);
  const setOpen = useStore((s) => s.setOpenShare);
  const state = useStore();
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!open) return null;

  async function download() {
    const el = document.getElementById('timeline-capture');
    if (!el) { alert('Chart not found. Please try again.'); return; }
    setLoading(true);
    try {
      const dataUrl = await htmlToImage.toJpeg(el, {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `financial-timeline-${new Date().toISOString().slice(0, 10)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    const url = buildShareURL(state);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function tweetShare() {
    const url = buildShareURL(state);
    // Build a compelling tweet message
    const dobYear = new Date(state.dobISO).getFullYear();
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - dobYear;
    const retirementAge = state.retirement?.age ?? 65;
    const text = `I just mapped out my entire financial life — from age ${currentAge} to retirement at ${retirementAge}. Income, investments, FIRE date, all in one chart. 📈 See it here:`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Share Your Financial Plan</h2>
            <p className="text-sm text-slate-500">Share a link or download as image</p>
          </div>
          <button
            className="px-3 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
        </div>

        {/* Share options */}
        <div className="px-6 py-5 space-y-4">
          {/* Copy Link */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔗</span>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800">Shareable Link</h3>
                <p className="text-sm text-blue-600 mt-0.5 mb-3">
                  Generates a URL with your entire financial scenario encoded. Anyone with the link can view your exact plan.
                </p>
                <button
                  onClick={copyLink}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? '✓ Link Copied!' : '📋 Copy Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Tweet */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">𝕏</span>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Post on X (Twitter)</h3>
                <p className="text-sm text-slate-600 mt-0.5 mb-3">
                  Share your FIRE journey with a pre-filled tweet including your retirement age and a link to your plan.
                </p>
                <button
                  onClick={tweetShare}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all"
                >
                  Post on 𝕏
                </button>
              </div>
            </div>
          </div>

          {/* Download JPG */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🖼️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">Download Image</h3>
                <p className="text-sm text-slate-600 mt-0.5 mb-3">
                  Export your financial timeline chart as a high-quality JPEG (2× resolution).
                </p>
                <button
                  onClick={download}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Generating...' : '⬇️ Download .jpg'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <p className="text-xs text-slate-400 text-center">
            🔒 Your data is never stored on any server — all sharing is done locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
