"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { IconPicker } from "@/components/ui/IconPicker";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaIdCard,
  FaEdit,
  FaSave,
  FaLinkedin,
  FaGithub,
  FaWhatsapp,
  FaPlus,
  FaTrash,
  FaTimes,
  FaExclamationTriangle,
  FaPalette,
  FaVenusMars
} from "react-icons/fa";

interface PersonalInfo {
  name: string;
  nickname: string;
  title: string;
  bio: string;
  dateOfBirth: string;
  nic: string;
  address: string;
  gender: string;
}

interface ContactInfo {
  email: string;
  email2: string;
  phone: string;
  phone2: string;
  linkedin: string;
  github: string;
  whatsapp: string;
}

interface AboutCard {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  content: string;
  displayOrder: number;
}

const defaultPersonalInfo: PersonalInfo = {
  name: "",
  nickname: "",
  title: "",
  bio: "",
  dateOfBirth: "",
  nic: "",
  address: "",
  gender: ""
};

const defaultContactInfo: ContactInfo = {
  email: "",
  email2: "",
  phone: "",
  phone2: "",
  linkedin: "",
  github: "",
  whatsapp: ""
};



export default function AdminAboutMe() {
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(defaultPersonalInfo);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(defaultContactInfo);
  const [aboutCards, setAboutCards] = useState<AboutCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);
  const [isEditingCard, setIsEditingCard] = useState<string | null>(null);
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [deleteCardModal, setDeleteCardModal] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null
  });
  const [cardForm, setCardForm] = useState({
    title: "",
    icon: "",
    iconColor: "#4ADE80",
    content: "",
    displayOrder: 0
  });

  useEffect(() => {
    loadAboutMeData();
    loadAboutCards();
  }, []);

  const loadAboutMeData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/manage');
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          setPersonalInfo({
            name: data.profile.name || defaultPersonalInfo.name,
            nickname: data.profile.nickname || defaultPersonalInfo.nickname,
            title: data.profile.title || defaultPersonalInfo.title,
            bio: data.profile.bio || defaultPersonalInfo.bio,
            dateOfBirth: data.profile.dateOfBirth || defaultPersonalInfo.dateOfBirth,
            nic: data.profile.nic || defaultPersonalInfo.nic,
            address: data.profile.address || defaultPersonalInfo.address,
            gender: data.profile.gender || defaultPersonalInfo.gender
          });
          setContactInfo({
            email: data.profile.email || defaultContactInfo.email,
            email2: data.profile.email2 || '',
            phone: data.profile.phone || defaultContactInfo.phone,
            phone2: data.profile.phone2 || '',
            linkedin: data.profile.linkedinUrl || defaultContactInfo.linkedin,
            github: data.profile.githubUrl || defaultContactInfo.github,
            whatsapp: data.profile.whatsappUrl || defaultContactInfo.whatsapp
          });
        }
      }
    } catch (error) {
      console.error('Error loading about me data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAboutCards = async () => {
    try {
      const response = await fetch('/api/about-cards');
      if (response.ok) {
        const data = await response.json();
        setAboutCards(data);
      }
    } catch (error) {
      console.error('Error loading about cards:', error);
    }
  };

  const handleEditPersonalInfo = () => {
    setEditingSection('personal');
    setEditData(personalInfo);
  };

  const handleEditContactInfo = () => {
    setEditingSection('contact');
    setEditData(contactInfo);
  };

  const handleSave = async () => {
    try {
      let updatedPersonalInfo = personalInfo;
      let updatedContactInfo = contactInfo;
      
      if (editingSection === 'personal') {
        updatedPersonalInfo = editData;
        setPersonalInfo(editData);
      } else if (editingSection === 'contact') {
        updatedContactInfo = editData;
        setContactInfo(editData);
      }
      
      const response = await fetch('/api/profile/manage', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: 'default',
          profileData: {
            name: updatedPersonalInfo.name,
            nickname: updatedPersonalInfo.nickname,
            title: updatedPersonalInfo.title,
            bio: updatedPersonalInfo.bio,
            dateOfBirth: updatedPersonalInfo.dateOfBirth,
            nic: updatedPersonalInfo.nic,
            address: updatedPersonalInfo.address,
            gender: updatedPersonalInfo.gender,
            email: updatedContactInfo.email,
            email2: updatedContactInfo.email2,
            phone: updatedContactInfo.phone,
            phone2: updatedContactInfo.phone2,
            linkedinUrl: updatedContactInfo.linkedin,
            githubUrl: updatedContactInfo.github,
            whatsappUrl: updatedContactInfo.whatsapp
          }
        })
      });
      
      if (response.ok) {
        setEditingSection(null);
        setEditData(null);
      } else {
        alert('Failed to save data');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data');
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditData(null);
  };

  const handleEditCard = (card: AboutCard) => {
    setCardForm({
      title: card.title,
      icon: card.icon,
      iconColor: card.iconColor,
      content: card.content,
      displayOrder: card.displayOrder
    });
    setIsEditingCard(card.id);
    setIsAddingCard(false);
  };

  const handleAddCard = () => {
    setCardForm({
      title: "",
      icon: "",
      iconColor: "#4ADE80",
      content: "",
      displayOrder: aboutCards.length
    });
    setIsAddingCard(true);
    setIsEditingCard(null);
  };

  const handleCardCancel = () => {
    setIsEditingCard(null);
    setIsAddingCard(false);
    setCardForm({
      title: "",
      icon: "",
      iconColor: "#4ADE80",
      content: "",
      displayOrder: 0
    });
  };

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isAddingCard) {
        await fetch('/api/about-cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cardForm)
        });
      } else if (isEditingCard) {
        await fetch('/api/about-cards', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: isEditingCard, ...cardForm })
        });
      }
      handleCardCancel();
      await loadAboutCards();
    } catch (error) {
      console.error('Error saving about card:', error);
    }
  };

  const handleDeleteCard = async (id: string) => {
    setDeleteCardModal({ isOpen: true, id });
  };

  const confirmDeleteCard = async () => {
    if (deleteCardModal.id) {
      try {
        await fetch(`/api/about-cards?id=${deleteCardModal.id}`, {
          method: 'DELETE'
        });
        setDeleteCardModal({ isOpen: false, id: null });
        await loadAboutCards();
      } catch (error) {
        console.error('Error deleting about card:', error);
      }
    }
  };

  const cancelDeleteCard = () => {
    setDeleteCardModal({ isOpen: false, id: null });
  };

  if (isLoading) {
    return <div className="text-[#9CA3AF] text-sm animate-pulse">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-[#E6EDF3] mb-1">About Me</h1>
          <p className="text-[#9CA3AF] text-sm">Manage your personal information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="bg-gradient-to-br from-[#111827] to-[#0d1117] border border-[#1F2937] shadow-xl">
          <div className="p-5 border-b border-[#1F2937]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 rounded-xl text-[#4ADE80] shadow-lg">
                  <FaUser size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#E6EDF3]">Personal Information</h2>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Your basic details</p>
                </div>
              </div>
              <button onClick={handleEditPersonalInfo} className="p-1.5 rounded-lg flex items-center justify-center text-[#4ADE80] bg-[#4ADE80]/0 hover:bg-[#4ADE80]/20 hover:text-[#4ADE80] transition-all duration-200">
                <FaEdit size={11} />
              </button>
            </div>
          </div>

          {editingSection === 'personal' ? (
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                  <FaUser size={11} className="text-[#4ADE80]" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={editData?.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                  <FaUser size={11} className="text-[#4ADE80]" />
                  Job Title
                </label>
                <input
                  type="text"
                  value={editData?.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  placeholder="Full Stack Developer & DevOps Engineer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                  <FaUser size={11} className="text-[#4ADE80]" />
                  Bio
                </label>
                <textarea
                  value={editData?.bio || ''}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm resize-none min-h-[100px] transition-all"
                  placeholder="Brief professional bio for your resume and profile"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                    <FaUser size={11} className="text-[#4ADE80]" />
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={editData?.nickname || ''}
                    onChange={(e) => setEditData({ ...editData, nickname: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                    <FaCalendarAlt size={11} className="text-[#4ADE80]" />
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={editData?.dateOfBirth || ''}
                    onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                  <FaVenusMars size={11} className="text-[#4ADE80]" />
                  Gender
                </label>
                <select
                  value={editData?.gender || 'Male'}
                  onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                  <FaIdCard size={11} className="text-[#4ADE80]" />
                  NIC
                </label>
                <input
                  type="text"
                  value={editData?.nic || ''}
                  onChange={(e) => setEditData({ ...editData, nic: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                  <FaMapMarkerAlt size={11} className="text-[#4ADE80]" />
                  Address
                </label>
                <textarea
                  value={editData?.address || ''}
                  onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm resize-none min-h-[80px] transition-all"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-[#1F2937]">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} className="flex items-center gap-2">
                  <FaSave size={12} />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaUser size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">Full Name</p>
                  <p className="text-sm text-[#E6EDF3] font-medium">{personalInfo.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaUser size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">Job Title</p>
                  <p className="text-sm text-[#E6EDF3] font-medium">{personalInfo.title}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaUser size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">Bio</p>
                  <p className="text-sm text-[#E6EDF3] font-medium leading-relaxed">{personalInfo.bio}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                    <FaUser size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">Nickname</p>
                    <p className="text-sm text-[#E6EDF3] font-medium">{personalInfo.nickname}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                    <FaCalendarAlt size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">Date of Birth</p>
                    <p className="text-sm text-[#E6EDF3] font-medium">{personalInfo.dateOfBirth}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaVenusMars size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">Gender</p>
                  <p className="text-sm text-[#E6EDF3] font-medium">{personalInfo.gender}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaIdCard size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">NIC</p>
                  <p className="text-sm text-[#E6EDF3] font-medium">{personalInfo.nic}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaMapMarkerAlt size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">Address</p>
                  <p className="text-sm text-[#E6EDF3] font-medium leading-relaxed">{personalInfo.address}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="bg-gradient-to-br from-[#111827] to-[#0d1117] border border-[#1F2937] shadow-xl">
          <div className="p-5 border-b border-[#1F2937]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 rounded-xl text-[#4ADE80] shadow-lg">
                  <FaEnvelope size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#E6EDF3]">Contact Information</h2>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Your contact details</p>
                </div>
              </div>
              <button onClick={handleEditContactInfo} className="p-1.5 rounded-lg flex items-center justify-center text-[#4ADE80] bg-[#4ADE80]/0 hover:bg-[#4ADE80]/20 hover:text-[#4ADE80] transition-all duration-200">
                <FaEdit size={11} />
              </button>
            </div>
          </div>

          {editingSection === 'contact' ? (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                    <FaEnvelope size={11} className="text-[#4ADE80]" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={editData?.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                    <FaEnvelope size={11} className="text-[#4ADE80]" />
                    Email 2
                  </label>
                  <input
                    type="email"
                    value={editData?.email2 || ''}
                    onChange={(e) => setEditData({ ...editData, email2: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                    <FaPhone size={11} className="text-[#4ADE80]" />
                    Phone
                  </label>
                  <input
                    type="text"
                    value={editData?.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                    <FaPhone size={11} className="text-[#4ADE80]" />
                    Phone 2
                  </label>
                  <input
                    type="text"
                    value={editData?.phone2 || ''}
                    onChange={(e) => setEditData({ ...editData, phone2: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-[#1F2937]">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                    <FaLinkedin size={11} className="text-blue-400" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={editData?.linkedin || ''}
                    onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                    <FaGithub size={11} className="text-white" />
                    GitHub
                  </label>
                  <input
                    type="url"
                    value={editData?.github || ''}
                    onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#9CA3AF] flex items-center gap-2">
                    <FaWhatsapp size={11} className="text-[#25D366]" />
                    WhatsApp
                  </label>
                  <input
                    type="url"
                    value={editData?.whatsapp || ''}
                    onChange={(e) => setEditData({ ...editData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 focus:border-[#4ADE80] text-sm transition-all"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-[#1F2937]">
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} className="flex items-center gap-2">
                  <FaSave size={12} />
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaEnvelope size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">Email</p>
                  <p className="text-sm text-[#E6EDF3] font-medium">{contactInfo.email}</p>
                </div>
              </div>
              {contactInfo.email2 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                    <FaEnvelope size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">Email 2</p>
                    <p className="text-sm text-[#E6EDF3] font-medium">{contactInfo.email2}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaPhone size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">Phone</p>
                  <p className="text-sm text-[#E6EDF3] font-medium">{contactInfo.phone}</p>
                </div>
              </div>
              {contactInfo.phone2 && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                    <FaPhone size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">Phone 2</p>
                    <p className="text-sm text-[#E6EDF3] font-medium">{contactInfo.phone2}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaLinkedin size={14} className="text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">LinkedIn</p>
                  <a href={contactInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4ADE80] font-medium hover:underline">
                    {contactInfo.linkedin}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaGithub size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">GitHub</p>
                  <a href={contactInfo.github} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4ADE80] font-medium hover:underline">
                    {contactInfo.github}
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#1F2937]/30 rounded-lg text-[#9CA3AF]">
                  <FaWhatsapp size={14} className="text-[#25D366]" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-[#9CA3AF] mb-0.5">WhatsApp</p>
                  <a href={contactInfo.whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm text-[#4ADE80] font-medium hover:underline">
                    {contactInfo.whatsapp}
                  </a>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="bg-gradient-to-br from-[#111827] to-[#0d1117] border border-[#1F2937] shadow-xl lg:col-span-2">
          <div className="p-5 border-b border-[#1F2937]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#4ADE80]/20 to-[#4ADE80]/5 rounded-xl text-[#4ADE80] shadow-lg">
                  <FaPalette size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#E6EDF3]">About Me Cards</h2>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">Manage cards displayed on about page</p>
                </div>
              </div>
              <Button variant="primary" size="sm" onClick={handleAddCard} className="gap-2">
                <FaPlus size={12} />
                Add Card
              </Button>
            </div>
          </div>

          <div className="p-5">
            {aboutCards.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[#374151] rounded-xl bg-[#111827]/20">
                <FaPalette size={32} className="mx-auto text-[#374151] mb-3" />
                <p className="text-[#9CA3AF] text-sm mb-2">No about cards yet</p>
                <Button onClick={handleAddCard} variant="primary" size="sm">
                  <FaPlus size={12} className="mr-1" />
                  Add First Card
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aboutCards.map((card) => (
                  <div key={card.id} className="group p-4 rounded-xl border bg-[#1F2937]/30 border-[#1F2937] hover:bg-[#1F2937]/50 hover:border-[#374151] transition-all duration-200">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg text-lg" style={{ backgroundColor: `${card.iconColor}20`, color: card.iconColor }}>
                          <span className="text-sm">{card.icon}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-[#E6EDF3]">{card.title}</h3>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditCard(card)}
                          className="p-1.5 rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#4ADE80]/10 hover:text-[#4ADE80] transition-all duration-200"
                        >
                          <FaEdit size={11} />
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="p-1.5 text-[#9CA3AF] hover:text-red-500 transition-colors"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed">{card.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {(isAddingCard || isEditingCard) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#111827] to-[#0d1117] border border-[#1F2937] rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#E6EDF3]">
                {isEditingCard ? "Edit About Card" : "Add New About Card"}
              </h3>
              <button
                onClick={handleCardCancel}
                className="text-[#9CA3AF] hover:text-[#E6EDF3] transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            <form onSubmit={handleCardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1">Title</label>
                  <input
                    type="text"
                    value={cardForm.title}
                    onChange={(e) => setCardForm({ ...cardForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 text-sm transition-all"
                    required
                  />
                </div>
                <IconPicker
                  value={cardForm.icon}
                  onChange={(iconName) => setCardForm({ ...cardForm, icon: iconName })}
                  label="Icon"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1">Icon Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={cardForm.iconColor}
                      onChange={(e) => setCardForm({ ...cardForm, iconColor: e.target.value })}
                      className="w-12 h-10 rounded-lg border border-[#374151] bg-[#1F2937]/50 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={cardForm.iconColor}
                      onChange={(e) => setCardForm({ ...cardForm, iconColor: e.target.value })}
                      className="flex-1 px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 text-sm transition-all"
                      placeholder="#4ADE80"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9CA3AF] mb-1">Display Order</label>
                  <input
                    type="number"
                    value={cardForm.displayOrder}
                    onChange={(e) => setCardForm({ ...cardForm, displayOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 text-sm transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9CA3AF] mb-1">Content</label>
                <textarea
                  value={cardForm.content}
                  onChange={(e) => setCardForm({ ...cardForm, content: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1F2937]/50 border border-[#374151] rounded-lg text-[#E6EDF3] focus:outline-none focus:ring-2 focus:ring-[#4ADE80]/50 text-sm resize-none min-h-[120px] transition-all"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={handleCardCancel} variant="ghost" size="sm">
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="flex items-center gap-2">
                  <FaSave size={12} />
                  {isEditingCard ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteCardModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#111827] to-[#0d1117] border border-red-500/30 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-[#1F2937]">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-500/10 rounded-xl shrink-0 border border-red-500/30">
                  <FaExclamationTriangle size={24} className="text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#E6EDF3]">Delete About Card</h3>
                  <p className="text-sm text-[#9CA3AF] mt-1">Are you sure you want to delete this about card? This action cannot be undone.</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-[#0d1117]/50 flex justify-end gap-3">
              <Button onClick={cancelDeleteCard} variant="ghost">
                Cancel
              </Button>
              <Button onClick={confirmDeleteCard} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
