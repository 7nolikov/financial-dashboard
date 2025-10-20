import React from 'react';
import { useStore } from '../../state/store';
import * as htmlToImage from 'html-to-image';

export function ShareModal() {
  const open = useStore((s) => s.openShare);
  const setOpen = useStore((s) => s.setOpenShare);
  if (!open) return null;
  
  async function download() {
    try {
      const el = document.getElementById('timeline-capture');
      if (!el) {
        alert('Chart not found. Please try again.');
        return;
      }
      
      // Show loading state
      const button = document.querySelector('[data-download-btn]') as HTMLButtonElement;
      if (button) {
        button.textContent = 'Generating...';
        button.disabled = true;
      }
      
      const dataUrl = await htmlToImage.toJpeg(el, { 
        quality: 0.95, 
        backgroundColor: '#ffffff',
        pixelRatio: 2 // Higher quality
      });
      
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `financial-timeline-${new Date().toISOString().slice(0, 10)}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Reset button
      if (button) {
        button.textContent = 'Download .jpg';
        button.disabled = false;
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
      
      // Reset button
      const button = document.querySelector('[data-download-btn]') as HTMLButtonElement;
      if (button) {
        button.textContent = 'Download .jpg';
        button.disabled = false;
      }
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium">Share Preview</div>
          <button className="text-xs px-2 py-1 border rounded hover:bg-gray-50" onClick={() => setOpen(false)}>Close</button>
        </div>
        <div className="border rounded overflow-auto flex-1 p-2 bg-slate-50">
          <div id="share-preview" className="min-w-[600px]">
            {document.getElementById('timeline-capture')?.cloneNode(true) as React.ReactNode}
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button 
            data-download-btn
            className="px-3 py-1 border rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50" 
            onClick={download}
          >
            Download .jpg
          </button>
        </div>
      </div>
    </div>
  );
}


