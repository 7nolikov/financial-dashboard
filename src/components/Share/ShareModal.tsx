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
  const [showTweetPreview, setShowTweetPreview] = React.useState(false);

  if (!open) return null;

  // FIRE calculation for viral share copy.
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
    if (point.invest >= fireNumber && fireNumber > 0) {
      fireAge = Math.floor(point.m / 12);
      break;
    }
  }
  const currentAge = Math.floor(currentAgeMonths / 12);

  async function download() {
    const el = document.getElementById('timeline-capture');
    if (!el) {
      alert('Chart not found. Please try again.');
      return;
    }
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
    const fireStr =
      fireNumber >= 1_000_000
        ? `€${(fireNumber / 1_000_000).toFixed(1)}M`
        : `€${(fireNumber / 1_000).toFixed(0)}K`;

    if (fireNumber <= 0) {
      return `In 2026, the average European has a €470K retirement gap. I just mapped my entire financial life to see where I stand.\n\nFree tool, zero signup, data never leaves your browser:`;
    }
    if (fireProgress >= 100) {
      return `While most people won't retire when they think they will, I mapped my financial life and I've already hit my FIRE number (${fireStr}).\n\nIn a world of pension cuts and AI job risk, knowing your number matters. Free tool, zero signup:`;
    }
    if (fireProgress < 10) {
      return `Hard truth: I need ${fireStr} to retire and I'm only ${fireProgress.toFixed(0)}% there at age ${currentAge}.\n\nWith pensions shrinking and living costs up 18% since 2020, the gap is brutal. At least now I can see it.\n\nFree tool, no signup, totally private. Face your numbers:`;
    }
    if (fireAge != null) {
      const yearsToFire = fireAge - currentAge;
      const earlyBy = retirementAge - fireAge;
      const earlyStr = earlyBy > 0 ? ` — ${earlyBy} years before the system says I can` : '';
      return `The average European has a €470K retirement gap. I just ran my numbers.\n\nFIRE number: ${fireStr}. I'm ${fireProgress.toFixed(0)}% there. Independence at age ${fireAge}${earlyStr}.\n\n${yearsToFire > 0 ? `${yearsToFire} years to go. ` : ''}What's YOUR number? Free, private, zero signup:`;
    }
    return `In 2026, most Europeans won't retire when they think they will. I just faced my numbers.\n\nFIRE number: ${fireStr}. Progress: ${fireProgress.toFixed(0)}% at age ${currentAge}. Not enough.\n\nFree tool that maps your entire financial life. No signup, totally private:`;
  }

  function redditShare() {
    const url = buildShareURL(state);
    const title =
      fireProgress >= 100
        ? `I mapped my financial life and I've hit FIRE — here's the free tool I used`
        : `Just faced my real retirement numbers. The gap is ${fireProgress < 30 ? 'brutal' : 'real'}. Free tool, no signup.`;
    const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
    window.open(redditUrl, '_blank', 'noopener,noreferrer');
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

  function whatsAppShare() {
    const url = buildShareURL(state);
    const text = buildViralText();
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  const viralText = buildViralText();
  const shareUrl = buildShareURL(state);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => setOpen(false)}
    >
      {/* Sheet on mobile (slides from bottom), centered modal on desktop */}
      <div
        className="bg-white w-full sm:rounded-xl sm:shadow-2xl sm:max-w-lg flex flex-col rounded-t-2xl shadow-2xl max-h-[92vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Share Your Financial Plan
            </h2>
            <p className="text-xs text-slate-500">Zero data leaves your browser</p>
          </div>
          <button
            className="px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all text-sm font-medium"
            onClick={() => setOpen(false)}
            aria-label="Close share modal"
          >
            ✕
          </button>
        </div>

        {/* Scrollable options */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-5 py-4 space-y-3">
          {/* Copy Link */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">🔗</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-blue-800 text-sm">Shareable Link</h3>
                <p className="text-xs text-blue-600 mt-0.5 mb-2 line-clamp-2">
                  Full scenario encoded in URL — anyone with the link sees your exact plan.
                </p>
                <button
                  onClick={copyLink}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? '✓ Copied!' : '📋 Copy Link'}
                </button>
              </div>
            </div>
          </div>

          {/* Tweet with preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">𝕏</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm">Post on X (Twitter)</h3>
                <p className="text-xs text-slate-600 mt-0.5 mb-2">
                  Pre-filled with your real FIRE number — the numbers that get reactions.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={tweetShare}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-black text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all"
                  >
                    Post on 𝕏
                  </button>
                  <button
                    onClick={() => setShowTweetPreview((v) => !v)}
                    className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all"
                  >
                    {showTweetPreview ? 'Hide preview' : 'Preview text'}
                  </button>
                </div>
                {showTweetPreview && (
                  <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {viralText}
                    {'\n'}
                    <span className="text-blue-500 break-all">{shareUrl.slice(0, 60)}…</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* WhatsApp */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">💬</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-emerald-800 text-sm">Share on WhatsApp</h3>
                <p className="text-xs text-emerald-700 mt-0.5 mb-2">
                  Challenge a friend or family member to run their numbers too.
                </p>
                <button
                  onClick={whatsAppShare}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#25D366] text-white rounded-lg text-sm font-semibold hover:bg-[#1ebe58] transition-all"
                >
                  Send on WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* Reddit */}
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">🔶</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-orange-800 text-sm">Share on Reddit</h3>
                <p className="text-xs text-orange-700 mt-0.5 mb-2">
                  Perfect for r/personalfinance, r/fire, r/europeanfire communities.
                </p>
                <button
                  onClick={redditShare}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#FF4500] text-white rounded-lg text-sm font-semibold hover:bg-[#e03d00] transition-all"
                >
                  Post on Reddit
                </button>
              </div>
            </div>
          </div>

          {/* LinkedIn */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">💼</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-blue-900 text-sm">Share on LinkedIn</h3>
                <p className="text-xs text-blue-700 mt-0.5 mb-2">
                  Great for FIRE community discussions and professional networks.
                </p>
                <button
                  onClick={linkedInShare}
                  className="w-full sm:w-auto px-4 py-2.5 bg-[#0077B5] text-white rounded-lg text-sm font-semibold hover:bg-[#005885] transition-all"
                >
                  Share on LinkedIn
                </button>
              </div>
            </div>
          </div>

          {/* Download JPG */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl shrink-0">🖼️</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm">Download Image</h3>
                <p className="text-xs text-slate-600 mt-0.5 mb-2">
                  Export your financial timeline as a high-quality JPEG (2× resolution).
                </p>
                <button
                  onClick={download}
                  disabled={loading}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  {loading ? 'Generating…' : '⬇️ Download .jpg'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 rounded-b-xl shrink-0 safe-bottom">
          <p className="text-xs text-slate-400 text-center">
            🔒 Data never stored on any server — all sharing is done locally in your browser.
          </p>
        </div>
      </div>
    </div>
  );
}
