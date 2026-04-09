import React from 'react';
import { useStore } from '../../state/store';
import { useSeries } from '../../state/SeriesContext';
import { buildShareURL } from '../../lib/sharing';
import * as htmlToImage from 'html-to-image';

export function ShareModal() {
  const open = useStore((s) => s.openShare);
  const setOpen = useStore((s) => s.setOpenShare);
  const state = useStore();
  const series = useSeries();
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  if (!open) return null;

  // Use same series-based FIRE calculation as FireInsights for consistency.
  const dobYear = new Date(state.dobISO).getFullYear();
  const currentYear = new Date().getFullYear();
  const currentAgeMonths = Math.max(0, (currentYear - dobYear) * 12);
  const currentMonthPoint = series[Math.min(currentAgeMonths, series.length - 1)];
  const annualExpenses = (currentMonthPoint?.expense ?? 0) * 12;
  const fireNumber = annualExpenses * 25;
  const currentInvestments = currentMonthPoint?.invest ?? 0;
  const fireProgress = fireNumber > 0 ? Math.min(100, (currentInvestments / fireNumber) * 100) : 0;
  let fireAge: number | null = null;
  for (const point of series) {
    if (point.invest >= fireNumber && fireNumber > 0) { fireAge = Math.floor(point.m / 12); break; }
  }
  const currentAge = Math.floor(currentAgeMonths / 12);

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

  function buildViralText(): string {
    const retirementAge = state.retirement?.age ?? 65;
    const fireStr = fireNumber >= 1_000_000
      ? `$${(fireNumber / 1_000_000).toFixed(1)}M`
      : `$${(fireNumber / 1_000).toFixed(0)}K`;

    if (fireNumber <= 0) {
      return `Just mapped my entire financial life — income, investments, debt and retirement in one interactive chart.\n\nFree, zero signup, your data never leaves your browser. Try it yourself:`;
    }
    if (fireProgress >= 100) {
      return `I mapped my financial life and I've hit my FIRE number (${fireStr}). Financially independent.\n\nFree tool, zero signup, all data stays private in your browser. Run your own numbers:`;
    }
    if (fireProgress < 10) {
      return `Hard truth: I need ${fireStr} to be financially independent and I'm only ${fireProgress.toFixed(0)}% there.\n\nJust mapped my retirement trajectory. The gap is very real.\n\nFree tool, no signup, your numbers stay private. Check yours:`;
    }
    if (fireAge != null) {
      const yearsToFire = fireAge - currentAge;
      const earlyBy = retirementAge - fireAge;
      const earlyStr = earlyBy > 0 ? ` — ${earlyBy} years before standard retirement` : '';
      return `Just ran the numbers. My FIRE number is ${fireStr} and I'm ${fireProgress.toFixed(0)}% there.\n\nAt my current rate I'll hit financial independence at age ${fireAge}${earlyStr}.\n\n${yearsToFire > 0 ? `${yearsToFire} years to go. ` : ''}Free tool, zero signup, data never leaves your browser. Run yours:`;
    }
    return `Ran my numbers. FIRE number: ${fireStr}. I'm ${fireProgress.toFixed(0)}% there at age ${currentAge}.\n\nNeed to increase savings rate to reach independence before retirement at ${retirementAge}.\n\nFree tool, zero signup, data stays private. Try it:`;
  }

  function tweetShare() {
    const url = buildShareURL(state);
    const text = buildViralText();
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  function linkedInShare() {
    const url = buildShareURL(state);
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer,width=600,height=600');
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
                  Pre-filled tweet with your real FIRE number and progress — the kind of numbers that get reactions.
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

          {/* LinkedIn */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💼</span>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Share on LinkedIn</h3>
                <p className="text-sm text-blue-700 mt-0.5 mb-3">
                  Share your financial plan with your professional network. Great for FIRE community discussions.
                </p>
                <button
                  onClick={linkedInShare}
                  className="px-4 py-2 bg-[#0077B5] text-white rounded-lg text-sm font-semibold hover:bg-[#005885] transition-all"
                >
                  Share on LinkedIn
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
