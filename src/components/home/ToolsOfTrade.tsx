export async function ToolsOfTrade() {
  const toolLogos = [
    { name: "Python", icon: "PY" },
    { name: "PyTorch", icon: "PT" },
    { name: "TensorFlow", icon: "TF" },
    { name: "OpenCV", icon: "CV" },
    { name: "Medical Imaging", icon: "MI" },
    { name: "CNN", icon: "CN" },
    { name: "U-Net", icon: "UN" },
    { name: "ECG Signal", icon: "ECG" },
    { name: "AUC / ROC", icon: "AUC" },
    { name: "Recharts", icon: "CH" },
    { name: "Next.js", icon: "NX" },
    { name: "RWD", icon: "RW" },
  ];

  const duplicatedTools = [...toolLogos, ...toolLogos];

  return (
    <section className="w-full overflow-hidden py-8 bg-[#0D1117]/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative w-full overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-full bg-gradient-to-r from-[#0B0F14] to-transparent z-10"></div>
          <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-[#0B0F14] to-transparent z-10"></div>
          <div className="flex animate-marquee whitespace-nowrap gap-12 py-6 items-center">
            {[...duplicatedTools, ...duplicatedTools].map((tool, index) => (
              <div
                key={`${tool.name}-${index}`}
                className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer"
              >
                <span className="flex h-8 min-w-8 items-center justify-center rounded-lg border border-[#4ADE80]/20 bg-[#4ADE80]/10 px-2 text-xs font-bold text-[#4ADE80]">
                  {tool.icon}
                </span>
                <span className="text-base font-semibold text-[#9CA3AF]">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
