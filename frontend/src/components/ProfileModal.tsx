import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { X, User, Settings, Bell, Shield, LogOut, MapPin, Smartphone, Mail, Globe, Clock } from 'lucide-react';

export const ProfileModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy'>('profile');

  const [user, setUser] = useState<any>(null);
  
  const modalRef = useRef<HTMLDivElement>(null);

  // Form states
  const [profileData, setProfileData] = useState({
    name: 'Your Name',
    username: '',
    location: '',
  });

  const [notifData, setNotifData] = useState({
    silentInApp: false,
    pushAlerts: true,
    browserNotifs: true,
    emailDigest: false,
    smsCritical: true
  });

  const [privacyData, setPrivacyData] = useState({
    locationAccess: 'session', // session, always, never
    shareTelemetry: true,
    dataRetention: '30days'
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser(u);
      // Pre-fill fields from saved metadata
      if (u?.user_metadata) {
        setProfileData(prev => ({
          ...prev,
          name: u.user_metadata.full_name || u.user_metadata.name || prev.name,
          location: u.user_metadata.location || prev.location,
        }));
        setNotifData(prev => ({
          ...prev,
          ...(u.user_metadata.notifData || {}),
        }));
        setPrivacyData(prev => ({
          ...prev,
          ...(u.user_metadata.privacyData || {}),
        }));
      }
    });

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onClose();
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.name,
          location: profileData.location,
          notifData,
          privacyData,
        },
      });
      if (error) throw error;
      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 800);
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        ref={modalRef}
        className="w-full max-w-5xl h-[80vh] min-h-[500px] max-h-[700px] bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Sidebar Navigation */}
        <div className="md:w-64 bg-surface-container border-b md:border-b-0 md:border-r border-outline-variant/30 flex flex-col relative overflow-hidden">
          <div className="p-6 border-b border-outline-variant/20 flex flex-col items-center pt-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center text-primary mb-3 shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)]">
              <User className="w-8 h-8" />
            </div>
            <h3 className="font-headline-sm text-lg font-bold text-on-surface text-center truncate w-full">
              {profileData.name}
            </h3>

          </div>
          
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'profile' ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
            >
              <User className="w-5 h-5" /> My Profile
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'notifications' ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
            >
              <Bell className="w-5 h-5" /> Notifications
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === 'privacy' ? 'bg-primary text-on-primary shadow-md shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
            >
              <Shield className="w-5 h-5" /> Privacy
            </button>
          </nav>
          
          <div className="p-4 border-t border-outline-variant/20">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-error hover:bg-error/10 hover:border-error/30 transition-colors font-medium border border-transparent"
            >
              <LogOut className="w-5 h-5" /> Sign Out
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col relative bg-surface-container-lowest h-full overflow-hidden">
          {/* Header */}
          <div className="h-16 border-b border-outline-variant/20 flex items-center justify-between px-8 bg-surface-container-lowest/80 backdrop-blur-md z-10 shrink-0">
            <h2 className="font-headline-sm text-xl font-bold text-on-surface flex items-center gap-2">
              {activeTab === 'profile' && <><User className="w-6 h-6 text-primary" /> Profile Settings</>}
              {activeTab === 'notifications' && <><Bell className="w-6 h-6 text-primary" /> Notifications</>}
              {activeTab === 'privacy' && <><Shield className="w-6 h-6 text-primary" /> Privacy & Telemetry</>}
            </h2>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors bg-surface-container"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
            
            {activeTab === 'profile' && (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-label-mono-sm text-on-surface-variant uppercase tracking-wider">Your Name</label>
                  <input 
                    type="text" 
                    value={profileData.name}
                    onChange={e => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary outline-none transition-colors"
                  />
                </div>

                <div className="space-y-2 pt-4 border-t border-outline-variant/20">
                  <label className="text-sm font-label-mono-sm text-on-surface-variant uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    disabled
                    value={user?.email || 'secure.node@aegis.net'}
                    className="w-full bg-surface-container-highest border border-outline-variant/10 rounded-xl px-4 py-3 text-on-surface-variant opacity-70 cursor-not-allowed"
                  />
                  <p className="text-xs text-outline mt-1">Your email address cannot be changed.</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-outline-variant/20">
                  <label className="text-sm font-label-mono-sm text-on-surface-variant uppercase tracking-wider">Your Location</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={profileData.location}
                      onChange={e => setProfileData({...profileData, location: e.target.value})}
                      placeholder="City, country or coordinates"
                      className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary outline-none transition-colors"
                    />
                    <button 
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(pos => {
                            setProfileData({...profileData, location: `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`});
                          });
                        }
                      }}
                      className="px-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-xl text-primary flex items-center justify-center transition-colors"
                      title="Use my current location"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center text-on-surface-variant"><Smartphone className="w-6 h-6"/></div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-lg">Push Alerts</h4>
                      <p className="text-sm text-on-surface-variant">Critical disaster push notifications to device.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifData.pushAlerts} onChange={e => setNotifData({...notifData, pushAlerts: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center text-on-surface-variant"><Globe className="w-6 h-6"/></div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-lg">Browser Notifications</h4>
                      <p className="text-sm text-on-surface-variant">Allow pop-up alerts while using other tabs.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifData.browserNotifs} onChange={e => setNotifData({...notifData, browserNotifs: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center text-on-surface-variant"><Bell className="w-6 h-6"/></div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-lg">Silent In-App Mode</h4>
                      <p className="text-sm text-on-surface-variant">Mute interface sound effects for stealth operation.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifData.silentInApp} onChange={e => setNotifData({...notifData, silentInApp: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>

                <div className="bg-surface-container-low rounded-2xl border border-outline-variant/30 p-5 flex items-center justify-between hover:border-primary/30 transition-colors">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant/20 flex items-center justify-center text-on-surface-variant"><Mail className="w-6 h-6"/></div>
                    <div>
                      <h4 className="font-semibold text-on-surface text-lg">Email Digest</h4>
                      <p className="text-sm text-on-surface-variant">Daily summary of incidents in your sector.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={notifData.emailDigest} onChange={e => setNotifData({...notifData, emailDigest: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="space-y-4">
                  <h3 className="font-semibold text-on-surface border-b border-outline-variant/20 pb-2">Location Telemetry</h3>
                  
                  <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-2 flex flex-col sm:flex-row gap-2">
                    <button 
                      onClick={() => setPrivacyData({...privacyData, locationAccess: 'always'})}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${privacyData.locationAccess === 'always' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-surface-container-high border border-transparent'}`}
                    >
                      <Globe className="w-4 h-4"/> Always Allow
                    </button>
                    <button 
                      onClick={() => setPrivacyData({...privacyData, locationAccess: 'session'})}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${privacyData.locationAccess === 'session' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-on-surface-variant hover:bg-surface-container-high border border-transparent'}`}
                    >
                      <Clock className="w-4 h-4"/> While on Site
                    </button>
                    <button 
                      onClick={() => setPrivacyData({...privacyData, locationAccess: 'never'})}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${privacyData.locationAccess === 'never' ? 'bg-error/20 text-error border border-error/30' : 'text-on-surface-variant hover:bg-surface-container-high border border-transparent'}`}
                    >
                      <Shield className="w-4 h-4"/> Block Access
                    </button>
                  </div>
                  <p className="text-xs text-outline leading-relaxed mt-2">
                    <strong className="text-on-surface-variant">Always Allow:</strong> Permits background location checks for push alerts.<br/>
                    <strong className="text-on-surface-variant">While on Site:</strong> Temporary session memory only. Erased on tab close.<br/>
                    <strong className="text-on-surface-variant">Block:</strong> Disables "Locate Me" features and nearby hazards.
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                  <h3 className="font-semibold text-on-surface border-b border-outline-variant/20 pb-2">Data Governance</h3>
                  
                  <div className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-outline-variant/30">
                    <div>
                      <p className="font-medium text-on-surface">Share Telemetry Data</p>
                      <p className="text-xs text-outline mt-1">Contribute anonymous sensor data to the global Aegis grid.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={privacyData.shareTelemetry} onChange={e => setPrivacyData({...privacyData, shareTelemetry: e.target.checked})} className="sr-only peer" />
                      <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div className="p-4 bg-error/10 border border-error/20 rounded-xl mt-8 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-error">Delete Account</h4>
                      <p className="text-xs text-error/80 mt-1">Permanently delete your account and all your data.</p>
                    </div>
                    <button className="bg-error hover:bg-error/80 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-outline-variant/20 bg-surface-container shrink-0 flex justify-end gap-3 z-10">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-on-surface-variant font-medium hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-fixed text-on-primary font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center min-w-[140px]"
            >
              {saveStatus === 'saving' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : saveStatus === 'saved' ? '? Saved!' : saveStatus === 'error' ? 'Save Failed' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
