"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FaEnvelope, FaChartBar, FaWhatsapp } from "react-icons/fa";
import { SiGithub, SiLinkedin } from "react-icons/si";
import Link from "next/link";
import Image from "next/image";
import { getIconComponent } from "@/lib/iconMap";
import { useI18n } from "@/components/i18n/LocaleProvider";

interface AboutSettings {
  sections: {
    hero: { enabled: boolean; title: string };
    stats: { enabled: boolean; title: string };
    aboutMe: { enabled: boolean; title: string };
    skills: { enabled: boolean; title: string };
    education: { enabled: boolean; title: string };
    experience: { enabled: boolean; title: string };
    letsConnect: { enabled: boolean; title: string };
  };
  hero: {
    profileImage: string;
    availabilityBadge: {
      enabled: boolean;
      text: string;
    };
    terminalBio: string[];
  };
  stats: Array<{
    enabled: boolean;
    label: string;
    value: string;
    icon: string;
  }>;
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

export default function AboutPage() {
  const [settings, setSettings] = useState<AboutSettings | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [skills, setSkills] = useState<{ category: any; skills: any[] }[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [aboutCards, setAboutCards] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [settingsResponse, dataResponse] = await Promise.all([
          fetch('/api/about-settings'),
          fetch('/api/about')
        ]);

        const settingsData = await settingsResponse.json();
        const data = await dataResponse.json();

        setSettings(settingsData);
        setStats(data.stats);
        setSkills(data.skills);
        setEducation(data.education);
        setExperience(data.experience);
        setAboutCards(data.aboutCards);
        setProfile(data.profile);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (loading) return;

    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="bg-[#0B0F14] min-h-screen flex items-center justify-center">
        <div className="text-[#9CA3AF]">{t.home.loading}</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="bg-[#0B0F14] min-h-screen flex items-center justify-center">
        <div className="text-[#9CA3AF]">這頁暫時讀不到，請再整理一次。</div>
      </div>
    );
  }

  const name = profile?.name?.trim() || "";
  const title = profile?.title?.trim() || "";
  const email = profile?.email?.trim() || "";
  const phone = [profile?.phone, profile?.phone2].map((value) => value?.trim()).filter(Boolean).join(" / ");
  const photo = settings.hero?.profileImage?.trim() || "";
  const badgeText = settings.hero?.availabilityBadge?.enabled
    ? settings.hero.availabilityBadge.text?.trim() || ""
    : "";
  const bioLines = Array.isArray(settings.hero?.terminalBio)
    ? settings.hero.terminalBio.filter((line) => line.trim())
    : [];
  const showResume = Boolean(settings.buttons?.downloadResume?.enabled && settings.buttons.downloadResume.text?.trim());
  const showRoadmap = Boolean(settings.buttons?.seeRoadmap?.enabled && settings.buttons.seeRoadmap.text?.trim());
  const hasHero = Boolean(photo || badgeText || name || title || email || phone || bioLines.length || showResume || showRoadmap);
  const hasStats = Boolean(
    settings.sections?.stats?.enabled && settings.stats?.some((stat) => stat.enabled && stat.label?.trim()),
  );
  const hasAbout = Boolean(settings.sections?.aboutMe?.enabled && aboutCards.length > 0);
  const hasSkills = Boolean(settings.sections?.skills?.enabled && skills.length > 0);
  const hasEducation = Boolean(settings.sections?.education?.enabled && education.length > 0);
  const hasExperience = Boolean(settings.sections?.experience?.enabled && experience.length > 0);
  const hasContact = Boolean(
    settings.sections?.letsConnect?.enabled &&
      [
        settings.letsConnect?.email,
        settings.letsConnect?.linkedin,
        settings.letsConnect?.github,
        settings.letsConnect?.whatsapp,
      ].some((item) => item?.enabled && item.address?.trim()),
  );

  if (!hasHero && !hasStats && !hasAbout && !hasSkills && !hasEducation && !hasExperience && !hasContact) {
    return (
      <div className="bg-[#0B0F14] px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-black text-[#E6EDF3]">{t.about.title}</h1>
          <p className="mt-3 text-lg text-[#BFD2EA]">{t.about.empty}</p>
          <Link href="/projects" className="mt-6 inline-flex rounded-full bg-[#4ADE80] px-5 py-2.5 font-bold text-[#0B0F14]">
            {t.about.seeWorks}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F14] relative overflow-hidden">
      {hasHero && (
      <section className="relative py-16 px-6 lg:px-8 border-b border-[#1F2937]">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {photo ? (
              <div className="relative shrink-0 group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#4ADE80] to-[#4ADE80] rounded-2xl blur opacity-15 group-hover:opacity-30 transition duration-1000"></div>
                <div className="relative aspect-square w-40 md:w-52 rounded-xl overflow-hidden shadow-2xl bg-[#111827] border border-[#1F2937]">
                  <Image
                    alt={name || "個人照片"}
                    className="w-full h-full object-cover transform transition duration-700 group-hover:scale-110"
                    src={photo}
                    fill
                    priority
                  />
                </div>
              </div>
              ) : null}

              <div className="flex-1 text-center md:text-left">
                {badgeText ? (
                <Badge
                  variant="outline"
                  className={`mb-3 gap-2 transition-all duration-300 ${profile?.isOpenToWork
                    ? "border-[#4ADE80]/30 bg-[#4ADE80]/10 text-[#4ADE80]"
                    : "border-[#374151] bg-[#1F2937]/50 text-[#9CA3AF]"
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full ${profile?.isOpenToWork ? "bg-[#4ADE80] animate-pulse" : "bg-[#6B7280]"}`}></span>
                  {badgeText}
                </Badge>
                ) : null}
                {name ? (
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#E6EDF3] mb-2">
                  {name}
                </h1>
                ) : null}
                {title ? (
                <p className="text-lg text-[#4ADE80] font-mono font-medium mb-6">
                  {title}
                </p>
                ) : null}

                {(email || phone) ? (
                <div className="mb-6 text-sm">
                  <p className="text-[#9CA3AF] flex items-center justify-center md:justify-start gap-2 flex-wrap">
                    {email ? (
                      <>
                        <FaEnvelope className="text-[#4ADE80]" />
                        <span>{email}</span>
                      </>
                    ) : null}
                    {email && phone ? <span className="text-[#6B7280] mx-2">|</span> : null}
                    {phone ? <span>{phone}</span> : null}
                  </p>
                </div>
                ) : null}

                {bioLines.length > 0 ? (
                <div className="relative bg-[#0D1117] border border-[#1F2937] rounded-2xl p-0 font-mono text-sm overflow-hidden shadow-2xl mb-6">
                  <div className="flex gap-1.5 px-4 py-3 border-b border-[#1F2937] bg-[#0B0F14]">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  </div>
                  <div className="p-6">
                    <p className="text-[#9CA3AF] leading-relaxed">
                      {bioLines.map((line, index) => (
                        <span key={index}>
                          {line.startsWith('$') ? (
                            <span className="text-[#9CA3AF]">{line}</span>
                          ) : (
                            <span className="text-[#4ADE80]">{line}</span>
                          )}
                          <br />
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
                ) : null}

                {(showResume || showRoadmap) ? (
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  {showResume && (
                    <Link href={settings.buttons.downloadResume.link || '#'} prefetch={false}>
                      <Button variant="primary" size="md">
                        <FaEnvelope />
                        {settings.buttons.downloadResume.text}
                      </Button>
                    </Link>
                  )}
                  {showRoadmap && (
                    <Link href={settings.buttons.seeRoadmap.link || '#'}>
                      <Button variant="outline" size="md">
                        <FaChartBar />
                        {settings.buttons.seeRoadmap.text}
                      </Button>
                    </Link>
                  )}
                </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}

      {settings.sections?.stats?.enabled && settings.stats?.some((stat) => stat.enabled && stat.label?.trim()) && (
        <section className="py-3 border-b border-[#1F2937] bg-[#0D1117]">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-4 gap-4">
              {settings.stats.filter(stat => stat.enabled).map((stat, index) => (
                <div key={index} className="group relative p-3 bg-gradient-to-br from-[#111827] to-[#0D1117] rounded-lg border border-[#1F2937] hover:border-[#4ADE80]/50 transition-all duration-300 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#4ADE80]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative flex items-center gap-3">
                    <svg className="w-4 h-4 text-[#4ADE80] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <div className="text-[#9CA3AF] text-[11px] font-mono uppercase tracking-wider leading-tight">{stat.label}</div>
                      <div className="text-[#E6EDF3] text-xl font-bold group-hover:text-[#4ADE80] transition-colors">{stat.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.sections?.aboutMe?.enabled && aboutCards.length > 0 && (
        <section id="about-me" className="py-16 px-6 lg:px-8 relative">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-[#E6EDF3] mb-6 text-center">
              {settings.sections?.aboutMe?.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aboutCards.map((card) => {
                const IconComponent = getIconComponent(card.icon);
                return (
                  <Card key={card.id} className="p-4 bg-gradient-to-br from-[#111827]/80 to-[#0D1117]/80 border border-[#1F2937] shadow-sm hover:shadow-lg transition-all duration-300 hover:from-[#111827]/90 hover:to-[#0D1117]/90 hover:border-[#4ADE80]/50 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg text-xl`} style={{ backgroundColor: `${card.iconColor}20`, color: card.iconColor } as React.CSSProperties}>
                        <IconComponent />
                      </div>
                      <h3 className="text-lg font-semibold text-[#E6EDF3]">{card.title}</h3>
                    </div>
                    <p className="text-[#9CA3AF] leading-relaxed text-sm">
                      {card.content}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {settings.sections?.skills?.enabled && skills.length > 0 && (
        <section id="skills" className="py-16 px-6 lg:px-8 bg-[#0D1117] border-t border-[#1F2937]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-[#E6EDF3] mb-6 text-center">
              {settings.sections?.skills?.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {skills.map(({ category, skills: categorySkills }) => {
                const CategoryIcon = getIconComponent(category.icon);
                return (
                  <Card key={category.id} className="p-4 bg-gradient-to-br from-[#111827]/80 to-[#0D1117]/80 border border-[#1F2937] shadow-sm hover:shadow-lg transition-all duration-300 hover:from-[#111827]/90 hover:to-[#0D1117]/90 hover:border-[#4ADE80]/50 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-[#4ADE80]/10 text-[#4ADE80]">
                        <CategoryIcon />
                      </div>
                      <h3 className="text-lg font-semibold text-[#E6EDF3]">{category.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categorySkills.map((skill) => {
                        const SkillIcon = skill.icon ? getIconComponent(skill.icon) : null;
                        return (
                          <Badge key={skill.id} variant="outline" className="gap-2 border-[#4ADE80]/30 bg-[#4ADE80]/5 text-[#4ADE80]/75 hover:border-[#4ADE80]/50 hover:bg-[#4ADE80]/15 transition-colors">
                            {SkillIcon && <SkillIcon />}
                            {skill.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {settings.sections?.education?.enabled && education.length > 0 && (
        <section id="education" className="py-24 px-6 lg:px-8 bg-[#0D1117] border-t border-[#1F2937]">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#E6EDF3] mb-8 text-center">
              {settings.sections?.education?.title}
            </h2>
            <div className="space-y-6">
              {education.map((edu) => (
                <Card key={edu.id} className="p-6 bg-gradient-to-br from-[#111827]/80 to-[#0D1117]/80 border border-[#1F2937] shadow-sm hover:shadow-lg transition-all duration-300 hover:from-[#111827]/90 hover:to-[#0D1117]/90 hover:border-[#4ADE80]/50 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-[#E6EDF3]">{edu.title}</h3>
                      <p className="text-[#4ADE80] text-sm font-medium">{edu.institution}</p>
                    </div>
                    <Badge variant="outline" className="mt-2 md:mt-0">
                      {edu.startDate} - {edu.endDate}
                    </Badge>
                  </div>
                  <p className="text-[#9CA3AF] leading-relaxed text-sm mb-3">
                    {edu.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.sections?.experience?.enabled && experience.length > 0 && (
        <section id="experience" className="py-24 px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-[#E6EDF3] mb-8 text-center">
              {settings.sections?.experience?.title}
            </h2>
            <div className="space-y-6">
              {experience.map((exp) => (
                <Card key={exp.id} className={`p-6 bg-gradient-to-br from-[#111827]/80 to-[#0D1117]/80 border shadow-sm hover:shadow-lg transition-all duration-300 hover:from-[#111827]/90 hover:to-[#0D1117]/90 hover:border-[#4ADE80]/50 relative overflow-hidden ${exp.isCurrent
                  ? 'border-[#4ADE80]/50 shadow-[0_0_20px_rgba(74,222,128,0.1)]'
                  : 'border-[#1F2937]'
                  }`}>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-semibold text-[#E6EDF3]">{exp.position}</h3>
                      <p className="text-[#4ADE80] font-medium">{exp.company}</p>
                    </div>
                    <Badge variant="primary" className="mt-2 md:mt-0">
                      {exp.startDate} - {exp.isCurrent ? "目前" : exp.endDate}
                    </Badge>
                  </div>
                  <p className="text-[#9CA3AF] leading-relaxed text-sm">
                    {exp.description}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {settings.sections?.letsConnect?.enabled && [
        settings.letsConnect?.email,
        settings.letsConnect?.linkedin,
        settings.letsConnect?.github,
        settings.letsConnect?.whatsapp,
      ].some((item) => item?.enabled && item.address?.trim()) && (
        <section id="contact" className="py-16 px-6 lg:px-8 bg-[#0D1117] border-t border-[#1F2937]">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-[#E6EDF3] mb-8 text-center">
              {settings.sections?.letsConnect?.title?.replace(/'/g, "'")}
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {settings.letsConnect?.email?.enabled && (
                <a
                  href={`mailto:${settings.letsConnect.email.address || ''}`}
                  className="flex items-center gap-3 px-6 py-3 bg-[#111827] border border-[#4ADE80]/30 hover:border-[#4ADE80]/50 hover:bg-[#4ADE80]/5 text-[#9CA3AF] hover:text-[#4ADE80] rounded-lg transition-all duration-300 font-medium"
                >
                  <FaEnvelope size={20} />
                  Email
                </a>
              )}
              {settings.letsConnect?.linkedin?.enabled && (
                <a
                  href={settings.letsConnect.linkedin.address || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-[#111827] border border-[#0077B5]/30 hover:border-[#0077B5]/50 hover:bg-[#0077B5]/5 text-[#9CA3AF] hover:text-[#0077B5] rounded-lg transition-all duration-300 font-medium"
                >
                  <SiLinkedin size={20} />
                  LinkedIn
                </a>
              )}
              {settings.letsConnect?.github?.enabled && (
                <a
                  href={settings.letsConnect.github.address || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-[#111827] border border-white/20 hover:border-white/40 hover:bg-white/5 text-[#9CA3AF] hover:text-white rounded-lg transition-all duration-300 font-medium"
                >
                  <SiGithub size={20} />
                  GitHub
                </a>
              )}
              {settings.letsConnect?.whatsapp?.enabled && (
                <a
                  href={settings.letsConnect.whatsapp.address || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 bg-[#111827] border border-[#25D366]/30 hover:border-[#25D366]/50 hover:bg-[#25D366]/5 text-[#9CA3AF] hover:text-[#25D366] rounded-lg transition-all duration-300 font-medium"
                >
                  <FaWhatsapp size={20} />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
