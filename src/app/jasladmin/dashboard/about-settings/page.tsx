"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  FaUser,
  FaToggleOn,
  FaToggleOff,
  FaSave,
  FaUndo,
  FaImage,
  FaHeading,
  FaTerminal,
  FaChartBar,
  FaLink,
  FaEnvelope,
  FaGithub,
  FaLinkedin,
  FaWhatsapp,
  FaEdit,
  FaTimesCircle,
  FaUpload,
  FaTimes
} from "react-icons/fa";

interface StatItem {
  enabled: boolean;
  label: string;
  value: string;
  icon: string;
}

interface AboutSettings {
  sections: {
    hero: { enabled: boolean; title: string; icon: string };
    stats: { enabled: boolean; title: string; icon: string };
    aboutMe: { enabled: boolean; title: string; icon: string };
    skills: { enabled: boolean; title: string; icon: string };
    education: { enabled: boolean; title: string; icon: string };
    experience: { enabled: boolean; title: string; icon: string };
    letsConnect: { enabled: boolean; title: string; icon: string };
  };
  hero: {
    profileImage: string;
    availabilityBadge: {
      enabled: boolean;
      text: string;
    };
    terminalBio: string[];
  };
  stats: StatItem[];
  buttons: {
    downloadResume: {
      enabled: boolean;
      text: string;
      link: string;
    };
    seeRoadmap: {
      enabled: boolean;
      text: string;
      link: string;
    };
  };
  letsConnect: {
    email: { enabled: boolean; address: string };
    linkedin: { enabled: boolean; address: string };
    github: { enabled: boolean; address: string };
    whatsapp: { enabled: boolean; address: string };
  };
}

const defaultSettings: AboutSettings = {
  sections: {
    hero: { enabled: true, title: "Hero Section", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    stats: { enabled: true, title: "Stats Bar", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    aboutMe: { enabled: true, title: "About Me", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
    skills: { enabled: true, title: "Skills", icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" },
    education: { enabled: true, title: "Education", icon: "M12 14l9-5-9-5 9 5 9v10l-9-5-9 5z" },
    experience: { enabled: true, title: "Experience", icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2M4 9h16M12 4v16" },
    letsConnect: { enabled: true, title: "Let's Connect", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }
  },
  hero: {
    profileImage: "",
    availabilityBadge: {
      enabled: false,
      text: ""
    },
    terminalBio: []
  },
  stats: [
    {
      enabled: true,
      label: "Pipelines Fixed",
      value: "100+",
      icon: "M4 6h16M4 12h16M4 18h16"
    },
    {
      enabled: true,
      label: "Projects",
      value: "4",
      icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    },
    {
      enabled: true,
      label: "Self Commits",
      value: "5",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      enabled: true,
      label: "Experience",
      value: "1.5y+",
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    }
  ],
  buttons: {
    downloadResume: {
      enabled: true,
      text: "Download Resume",
      link: "/api/download-resume"
    },
    seeRoadmap: {
      enabled: true,
      text: "See Roadmap",
      link: "/roadmap"
    }
  },
  letsConnect: {
    email: { enabled: false, address: "" },
    linkedin: { enabled: false, address: "" },
    github: { enabled: false, address: "" },
    whatsapp: { enabled: false, address: "" }
  }
};

export default function AdminAboutSettings() {
  const [settings, setSettings] = useState<AboutSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [terminalInput, setTerminalInput] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSection, setModalSection] = useState<string | null>(null);
  const [modalData, setModalData] = useState<any>(null);
  const [profileId, setProfileId] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [settingsRes, profileRes] = await Promise.all([
        fetch('/api/about-settings'),
        fetch('/api/profile')
      ]);
      
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
        setTerminalInput((data.hero?.terminalBio || []).join('\n'));
        setImagePreview(data.hero?.profileImage || "");
      }
      
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        if (profileData.profile) {
          setProfileId(profileData.profile.id);
          setJobTitle(profileData.profile.title || "");
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const [settingsRes, profileRes] = await Promise.all([
        fetch('/api/about-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        }),
        fetch('/api/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: profileId, title: jobTitle })
        })
      ]);
      
      if (settingsRes.ok && profileRes.ok) {
        setHasChanges(false);
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save some settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    }
  };

  const handleResetSettings = () => {
    if (confirm('Reset to default settings?')) {
      setSettings(defaultSettings);
      setTerminalInput(defaultSettings.hero.terminalBio.join('\n'));
      setImagePreview(defaultSettings.hero.profileImage);
      setHasChanges(true);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload file to server
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', 'profile');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Delete old image if it exists and is an uploaded file
        if (settings.hero.profileImage && settings.hero.profileImage.startsWith('/uploads/')) {
          try {
            await fetch('/api/delete-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filePath: settings.hero.profileImage })
            });
          } catch (error) {
            console.error('Error deleting old image:', error);
          }
        }

        // Update with new file path
        setImagePreview(result.filePath);
        updateHero('profileImage', result.filePath);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  };

  const updateSettings = (updates: Partial<AboutSettings>) => {
    setSettings({ ...settings, ...updates });
    setHasChanges(true);
  };

  const updateSection = (section: keyof AboutSettings['sections'], field: 'enabled' | 'title' | 'icon', value: any) => {
    setSettings({
      ...settings,
      sections: { ...settings.sections, [section]: { ...settings.sections[section], [field]: value } }
    });
    setHasChanges(true);
  };

  const updateHero = (field: string, value: string) => {
    setSettings({
      ...settings,
      hero: { ...settings.hero, [field]: value }
    });
    setHasChanges(true);
  };

  const updateStat = (index: number, field: 'enabled' | 'label' | 'value' | 'icon', value: any) => {
    const newStats = [...settings.stats];
    newStats[index] = { ...newStats[index], [field]: value };
    setSettings({ ...settings, stats: newStats });
    setHasChanges(true);
  };

  const updateButton = (buttonType: 'downloadResume' | 'seeRoadmap', field: 'enabled' | 'text' | 'link', value: any) => {
    setSettings({
      ...settings,
      buttons: {
        ...settings.buttons,
        [buttonType]: { ...settings.buttons[buttonType], [field]: value }
      }
    });
    setHasChanges(true);
  };

  const updateConnectLink = (platform: keyof AboutSettings['letsConnect'], field: 'enabled' | 'address', value: any) => {
    setSettings({
      ...settings,
      letsConnect: { ...settings.letsConnect, [platform]: { ...settings.letsConnect[platform], [field]: value } }
    });
    setHasChanges(true);
  };

  const updateAvailabilityBadge = (text: string) => {
    setSettings({
      ...settings,
      hero: {
        ...settings.hero,
        availabilityBadge: {
          ...settings.hero.availabilityBadge,
          text
        }
      }
    });
    setHasChanges(true);
  };

  const openEditModal = (section: string, data: any) => {
    setModalSection(section);
    setModalData(data);
    setModalOpen(true);
  };

  const getModalTitle = (section: string | null) => {
    if (!section) return '';
    if (section === 'email') return 'Email';
    if (section === 'linkedin') return 'LinkedIn';
    if (section === 'github') return 'GitHub';
    if (section === 'whatsapp') return 'WhatsApp';
    if (section.startsWith('stat-')) return 'Stat Item';
    if (section.startsWith('section-')) return 'Section';
    return section;
  };

  const closeEditModal = () => {
    setModalOpen(false);
    setModalSection(null);
    setModalData(null);
  };

  if (isLoading) {
    return <div className="text-[#9CA3AF] text-sm animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#E6EDF3] mb-1">About Settings</h1>
          <p className="text-[#9CA3AF] text-sm">Configure about page content and sections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleResetSettings} className="flex items-center gap-2">
            <FaUndo size={12} />
            Reset
          </Button>
          <Button variant="primary" size="sm" onClick={handleSaveSettings} disabled={!hasChanges} className="flex items-center gap-2">
            <FaSave size={12} />
            {hasChanges ? 'Save Changes' : 'Saved'}
          </Button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-[#1F2937]">
              <h3 className="text-base font-bold text-[#E6EDF3]">Edit {getModalTitle(modalSection)}</h3>
              <button onClick={closeEditModal} className="text-[#9CA3AF] hover:text-[#E6EDF3] transition-colors">
                <FaTimes size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {modalSection === 'email' && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                    <FaEnvelope size={11} className="text-[#4ADE80]" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={modalData?.address || ''}
                    onChange={(e) => {
                      setModalData({ ...modalData, address: e.target.value });
                      updateConnectLink('email', 'address', e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
              )}
              {modalSection === 'linkedin' && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                    <FaLinkedin size={11} className="text-[#0077B5]" />
                    LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={modalData?.address || ''}
                    onChange={(e) => {
                      setModalData({ ...modalData, address: e.target.value });
                      updateConnectLink('linkedin', 'address', e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
              )}
              {modalSection === 'github' && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                    <FaGithub size={11} className="text-white" />
                    GitHub URL
                  </label>
                  <input
                    type="url"
                    value={modalData?.address || ''}
                    onChange={(e) => {
                      setModalData({ ...modalData, address: e.target.value });
                      updateConnectLink('github', 'address', e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
              )}
              {modalSection === 'whatsapp' && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                    <FaWhatsapp size={11} className="text-[#25D366]" />
                    WhatsApp URL
                  </label>
                  <input
                    type="url"
                    value={modalData?.address || ''}
                    onChange={(e) => {
                      setModalData({ ...modalData, address: e.target.value });
                      updateConnectLink('whatsapp', 'address', e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
              )}
              {modalSection?.startsWith('stat-') && (
                <>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                      <FaHeading size={11} className="text-[#4ADE80]" />
                      Label
                    </label>
                    <input
                      type="text"
                      value={modalData?.label || ''}
                      onChange={(e) => {
                        setModalData({ ...modalData, label: e.target.value });
                        updateStat(modalData.index, 'label', e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                      <FaChartBar size={11} className="text-[#4ADE80]" />
                      Value
                    </label>
                    <input
                      type="text"
                      value={modalData?.value || ''}
                      onChange={(e) => {
                        setModalData({ ...modalData, value: e.target.value });
                        updateStat(modalData.index, 'value', e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                      <FaImage size={11} className="text-[#4ADE80]" />
                      Icon (SVG Path)
                    </label>
                    <textarea
                      value={modalData?.icon || ''}
                      onChange={(e) => {
                        setModalData({ ...modalData, icon: e.target.value });
                        updateStat(modalData.index, 'icon', e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm resize-none min-h-[80px] font-mono transition-all"
                    />
                  </div>
                </>
              )}
              {modalSection?.startsWith('section-') && (
                <>
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                      <FaHeading size={11} className="text-[#4ADE80]" />
                      Title
                    </label>
                    <input
                      type="text"
                      value={modalData?.title || ''}
                      onChange={(e) => {
                        setModalData({ ...modalData, title: e.target.value });
                        updateSection(modalData.name, 'title', e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="p-5 border-t border-[#1F2937] flex justify-end">
              <Button variant="primary" onClick={closeEditModal} className="flex items-center gap-2">
                <FaSave size={12} />
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="bg-gradient-to-br from-[#111827] to-[#0d1117] border border-[#1F2937] shadow-xl">
          <div className="p-5 border-b border-[#1F2937]">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 rounded-xl text-[#4ADE80] shadow-lg">
                <FaUser size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E6EDF3]">Hero Content</h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Configure hero section</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-[#1F2937]/30 rounded-xl border border-[#1F2937]">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#374151] bg-[#0d1117] group cursor-pointer">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile Preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#6B7280]">
                    <FaImage size={24} />
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/80 to-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer">
                  <div className="text-center text-white">
                    <FaUpload size={16} className="mx-auto mb-1" />
                    <span className="text-[10px] font-medium">Change</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#E6EDF3]">Profile Image</h3>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Hover and click to change your profile picture</p>
              </div>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-[#1F2937]">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                <FaToggleOn size={11} className="text-[#4ADE80]" />
                Availability
              </label>
              <input
                type="text"
                value={settings.hero.availabilityBadge.text}
                onChange={(e) => updateAvailabilityBadge(e.target.value)}
                className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                placeholder="Available for Work"
              />
              <p className="text-[10px] text-[#6B7280]">Customize your availability status badge text</p>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                <FaUser size={11} className="text-[#4ADE80]" />
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => {
                  setJobTitle(e.target.value);
                  setHasChanges(true);
                }}
                className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                placeholder="Full Stack Developer & DevOps Engineer"
              />
              <p className="text-[10px] text-[#6B7280]">Your professional job title displayed on the About page</p>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-[#1F2937]">
              <label className="flex items-center gap-2 text-xs font-semibold text-[#E6EDF3]">
                <FaTerminal size={11} className="text-[#4ADE80]" />
                Terminal Bio (One per line)
              </label>
              <textarea
                value={terminalInput}
                onChange={(e) => {
                  setTerminalInput(e.target.value);
                  updateSettings({
                    hero: {
                      ...settings.hero,
                      terminalBio: e.target.value.split('\n').filter(line => line.trim())
                    }
                  });
                }}
                className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm resize-none min-h-[140px] font-mono text-xs transition-all"
                placeholder="$ whoami"
              />
              <p className="text-[10px] text-[#6B7280]">Lines starting with $ will be gray (input), lines starting with &gt; will be green (output)</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-[#111827] to-[#0d1117] border border-[#1F2937] shadow-xl">
          <div className="p-5 border-b border-[#1F2937]">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 rounded-xl text-[#4ADE80] shadow-lg">
                <FaEdit size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E6EDF3]">Section Settings</h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Toggle sections on/off</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-3">
            <SectionCard
              name="stats"
              title={settings.sections.stats.title}
              subtitle="Statistics display"
              enabled={settings.sections.stats.enabled}
              onToggle={(enabled) => updateSection('stats', 'enabled', enabled)}
            />
            <SectionCard
              name="aboutMe"
              title={settings.sections.aboutMe.title}
              subtitle="About cards"
              enabled={settings.sections.aboutMe.enabled}
              onToggle={(enabled) => updateSection('aboutMe', 'enabled', enabled)}
              onEdit={() => openEditModal('section-aboutMe', { name: 'aboutMe', ...settings.sections.aboutMe })}
            />
            <SectionCard
              name="skills"
              title={settings.sections.skills.title}
              subtitle="Technical skills"
              enabled={settings.sections.skills.enabled}
              onToggle={(enabled) => updateSection('skills', 'enabled', enabled)}
              onEdit={() => openEditModal('section-skills', { name: 'skills', ...settings.sections.skills })}
            />
            <SectionCard
              name="education"
              title={settings.sections.education.title}
              subtitle="Education history"
              enabled={settings.sections.education.enabled}
              onToggle={(enabled) => updateSection('education', 'enabled', enabled)}
              onEdit={() => openEditModal('section-education', { name: 'education', ...settings.sections.education })}
            />
            <SectionCard
              name="experience"
              title={settings.sections.experience.title}
              subtitle="Work experience"
              enabled={settings.sections.experience.enabled}
              onToggle={(enabled) => updateSection('experience', 'enabled', enabled)}
              onEdit={() => openEditModal('section-experience', { name: 'experience', ...settings.sections.experience })}
            />
            <SectionCard
              name="letsConnect"
              title={settings.sections.letsConnect.title}
              subtitle="Social links"
              enabled={settings.sections.letsConnect.enabled}
              onToggle={(enabled) => updateSection('letsConnect', 'enabled', enabled)}
              onEdit={() => openEditModal('section-letsConnect', { name: 'letsConnect', ...settings.sections.letsConnect })}
            />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-[#111827] to-[#0d1117] border border-[#1F2937] shadow-xl lg:col-span-2">
          <div className="p-5 border-b border-[#1F2937]">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 rounded-xl text-[#4ADE80] shadow-lg">
                <FaChartBar size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E6EDF3]">Stats Bar</h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Configure statistics items</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-4 gap-3">
              {settings.stats.map((stat, index) => (
                <StatCard
                  key={index}
                  stat={stat}
                  index={index}
                  onToggle={(enabled) => updateStat(index, 'enabled', enabled)}
                  onEdit={() => openEditModal(`stat-${index}`, { index, ...stat })}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-[#111827] to-[#0d1117] border border-[#1F2937] shadow-xl lg:col-span-2">
          <div className="p-5 border-b border-[#1F2937]">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 rounded-xl text-[#4ADE80] shadow-lg">
                <FaEnvelope size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#E6EDF3]">Let&apos;s Connect</h2>
                <p className="text-xs text-[#9CA3AF] mt-0.5">Configure social links</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <ConnectCard
                platform="email"
                title="Email"
                enabled={settings.letsConnect.email.enabled}
                address={settings.letsConnect.email.address}
                onToggle={(enabled) => updateConnectLink('email', 'enabled', enabled)}
                onEdit={() => openEditModal('email', settings.letsConnect.email)}
              />
              <ConnectCard
                platform="linkedin"
                title="LinkedIn"
                enabled={settings.letsConnect.linkedin.enabled}
                address={settings.letsConnect.linkedin.address}
                onToggle={(enabled) => updateConnectLink('linkedin', 'enabled', enabled)}
                onEdit={() => openEditModal('linkedin', settings.letsConnect.linkedin)}
              />
              <ConnectCard
                platform="github"
                title="GitHub"
                enabled={settings.letsConnect.github.enabled}
                address={settings.letsConnect.github.address}
                onToggle={(enabled) => updateConnectLink('github', 'enabled', enabled)}
                onEdit={() => openEditModal('github', settings.letsConnect.github)}
              />
              <ConnectCard
                platform="whatsapp"
                title="WhatsApp"
                enabled={settings.letsConnect.whatsapp.enabled}
                address={settings.letsConnect.whatsapp.address}
                onToggle={(enabled) => updateConnectLink('whatsapp', 'enabled', enabled)}
                onEdit={() => openEditModal('whatsapp', settings.letsConnect.whatsapp)}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function SectionCard({
  name,
  title,
  subtitle,
  enabled,
  onToggle,
  onEdit
}: {
  name: string;
  title: string;
  subtitle: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onEdit?: () => void;
}) {
  return (
    <div className={`group flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${enabled
      ? 'bg-[#1F2937]/30 border-[#1F2937] hover:bg-[#1F2937]/50 hover:border-[#374151]'
      : 'bg-[#0d1117]/50 border-[#1F2937]/50 hover:bg-[#1F2937]/30'
      }`}>
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => onToggle(!enabled)}
          className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${enabled
            ? 'bg-[#4ADE80]/20 text-[#4ADE80] hover:bg-[#4ADE80]/30'
            : 'bg-[#6B7280]/20 text-[#6B7280] hover:bg-[#6B7280]/30'
            }`}
        >
          {enabled ? <FaToggleOn size={18} /> : <FaToggleOff size={18} />}
        </button>
        <div className="flex-1">
          <h3 className={`text-sm font-semibold ${enabled ? 'text-[#E6EDF3]' : 'text-[#6B7280]'}`}>{title}</h3>
          <p className={`text-[11px] leading-tight ${enabled ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>{subtitle}</p>
        </div>
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className={`flex-shrink-0 p-1.5 rounded-lg flex items-center justify-center transition-all duration-200 ${enabled
            ? 'text-[#4ADE80] hover:bg-[#4ADE80]/10'
            : 'text-[#6B7280] hover:bg-[#6B7280]/10'
            }`}
        >
          <FaEdit size={11} />
        </button>
      )}
    </div>
  );
}

function StatCard({
  stat,
  index,
  onToggle,
  onEdit
}: {
  stat: { enabled: boolean; label: string; value: string; icon: string };
  index: number;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <div className={`p-3 rounded-lg border transition-all duration-200 ${stat.enabled
      ? 'bg-[#1F2937]/30 border-[#1F2937]'
      : 'bg-[#0d1117]/50 border-[#1F2937]/50'
      }`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(!stat.enabled)}
          className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center transition-all duration-200 ${stat.enabled
            ? 'bg-[#4ADE80]/20 text-[#4ADE80] hover:bg-[#4ADE80]/30'
            : 'bg-[#6B7280]/20 text-[#6B7280] hover:bg-[#6B7280]/30'
            }`}
        >
          {stat.enabled ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate ${stat.enabled ? 'text-[#E6EDF3]' : 'text-[#6B7280]'}`}>
            {stat.label || 'Stat'}
          </div>
          <div className={`text-base font-bold ${stat.enabled ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
            {stat.value || '-'}
          </div>
        </div>
        <button
          onClick={onEdit}
          className={`flex-shrink-0 p-1.5 rounded flex items-center justify-center transition-all duration-200 ${stat.enabled
            ? 'text-[#4ADE80] hover:bg-[#4ADE80]/10'
            : 'text-[#6B7280] hover:bg-[#6B7280]/10'
            }`}
        >
          <FaEdit size={11} />
        </button>
      </div>
    </div>
  );
}

function ConnectCard({
  platform,
  title,
  enabled,
  address,
  onToggle,
  onEdit
}: {
  platform: string;
  title: string;
  enabled: boolean;
  address: string;
  onToggle: (enabled: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <div className={`p-3 rounded-lg border transition-all duration-200 ${enabled
      ? 'bg-[#1F2937]/30 border-[#1F2937]'
      : 'bg-[#0d1117]/50 border-[#1F2937]/50'
      }`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggle(!enabled)}
          className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center transition-all duration-200 ${enabled
            ? 'bg-[#4ADE80]/20 text-[#4ADE80] hover:bg-[#4ADE80]/30'
            : 'bg-[#6B7280]/20 text-[#6B7280] hover:bg-[#6B7280]/30'
            }`}
        >
          {enabled ? <FaToggleOn size={14} /> : <FaToggleOff size={14} />}
        </button>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold truncate ${enabled ? 'text-[#E6EDF3]' : 'text-[#6B7280]'}`}>
            {title}
          </div>
          <div className={`text-xs truncate ${enabled ? 'text-[#9CA3AF]' : 'text-[#4B5563]'}`}>
            {address || 'No address'}
          </div>
        </div>
        <button
          onClick={onEdit}
          className={`flex-shrink-0 p-1.5 rounded flex items-center justify-center transition-all duration-200 ${enabled
            ? 'text-[#4ADE80] hover:bg-[#4ADE80]/10'
            : 'text-[#6B7280] hover:bg-[#6B7280]/10'
            }`}
        >
          <FaEdit size={11} />
        </button>
      </div>
    </div>
  );
}
