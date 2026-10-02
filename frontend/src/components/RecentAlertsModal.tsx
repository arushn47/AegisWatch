import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { DisasterEvent } from '../types/disaster';

interface RecentAlertsModalProps {
  incidents: DisasterEvent[];
  onClose: () => void;
  onMarkRead: () => void;
  lastReadTime: number;
}

export const RecentAlertsModal: React.FC<RecentAlertsModalProps> = ({ incidents, onClose, onMarkRead, lastReadTime }) => {
  // Sort by timestamp descending
  const sortedIncidents = [...incidents]
    .filter(inc => new Date(inc.timestamp).getTime() > lastReadTime)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-surface-container border border-outline-variant/30 rounded-xl p-panel-padding-spacious shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-outline hover:text-on-surface transition-colors z-20">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="flex items-center gap-3 mb-6 relative z-10 justify-between pr-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary text-[24px]">notifications_active</span>
            </div>
            <div>
              <h1 className="font-headline-md text-headline-md text-on-surface mt-1">Recent Alerts</h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Global disasters that just occurred.</p>
            </div>
          </div>
          
          <button 
            onClick={onMarkRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors text-xs font-medium"
          >
            <CheckCircle size={14} />
            Mark All Read
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar relative z-10">
          {sortedIncidents.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant">No alerts available.</div>
          )}

          {sortedIncidents.map((incident) => {
            const timeMs = new Date(incident.timestamp).getTime();
            const isUnread = timeMs > lastReadTime;
            
            return (
              <div key={incident.id} className={`p-3 rounded-lg border flex flex-col gap-1 relative overflow-hidden ${isUnread ? 'bg-surface-container-high border-primary/30' : 'bg-surface-container-low border-outline-variant/30'}`}>
                {isUnread && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary animate-pulse"></div>}
                <div className={"absolute left-0 top-0 bottom-0 w-1 " + (incident.severity === 'extreme' ? 'bg-error' : incident.severity === 'high' ? 'bg-tertiary' : 'bg-primary')}></div>
                
                <div className="flex justify-between items-start pl-2 pr-4">
                  <h3 className={`font-medium ${isUnread ? 'text-on-surface font-semibold' : 'text-on-surface-variant'}`}>{incident.title}</h3>
                </div>
                
                <p className="text-on-surface-variant text-sm pl-2 line-clamp-1">{incident.summary}</p>
                
                <div className="flex items-center gap-2 pl-2 mt-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                    incident.severity === 'extreme' ? 'bg-error/20 text-error' :
                    incident.severity === 'high' ? 'bg-tertiary/20 text-tertiary' :
                    'bg-primary/20 text-primary'
                  }`}>
                    {incident.type}
                  </span>
                  <span className="text-xs text-outline">{incident.timeAgo}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
