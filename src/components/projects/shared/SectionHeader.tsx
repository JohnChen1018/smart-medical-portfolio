export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-black md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-[#9CA3AF]">{subtitle}</p>}
    </div>
  );
}
