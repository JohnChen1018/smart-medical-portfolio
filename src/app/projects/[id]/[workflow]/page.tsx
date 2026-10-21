import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FaChevronLeft } from "react-icons/fa";
import {
  getWorkflowContent,
  workflowSteps,
} from "@/lib/medicalPortfolio";
import { getMergedMedicalProjects } from "@/lib/portal-admin";

export const dynamic = "force-dynamic";

export default async function WorkflowPage({
  params,
}: {
  params: Promise<{ id: string; workflow: string }>;
}) {
  const { id, workflow } = await params;
  const medicalProjects = await getMergedMedicalProjects();
  const project = medicalProjects.find((item) => item.id === id);
  const step = workflowSteps.find((item) => item.key === workflow);

  if (!project || !step) {
    return notFound();
  }

  const content = getWorkflowContent(project, workflow);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3]">
      <nav
        className="sticky z-40 border-b border-[#1F2937] bg-[#0B0F14]/90 px-6 py-4 backdrop-blur-md"
        style={{ top: "var(--site-header-h, 4rem)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center gap-2 text-sm text-[#9CA3AF] transition hover:text-[#E6EDF3]"
          >
            <FaChevronLeft className="text-xs" />
            回這個作品
          </Link>
          <span className="rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10 px-3 py-1 text-xs text-[#C4B5FD]">
            {step.label}
          </span>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="mb-3 text-sm font-semibold text-[#C4B5FD]">
              {project.title}
            </p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              {step.label}
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#BFD2EA]">{step.description}</p>
          </div>

          <div className="lg:col-span-5">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-[#1F2937] bg-[#111827] shadow-2xl">
              <Image
                src={
                  project.imageUrl ||
                  "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=900&h=650&fit=crop"
                }
                alt={project.title}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F14]/80 to-transparent" />
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-[#1F2937] bg-[#111827]/60 p-6 md:p-8">
          {content ? (
            <div className="prose prose-invert max-w-none prose-headings:text-[#E6EDF3] prose-p:text-[#BFD2EA] prose-li:text-[#BFD2EA] prose-strong:text-[#E6EDF3] prose-a:text-[#22D3EE]">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h2 className="mt-8 border-b border-[#334155] pb-3 text-2xl font-black text-[#E6EDF3]">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-6 text-xl font-bold text-[#C4B5FD]">
                      {children}
                    </h3>
                  ),
                  table: ({ children }) => (
                    <div className="my-6 overflow-x-auto rounded-2xl border border-[#334155]">
                      <table className="w-full border-collapse text-sm">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border-b border-[#334155] bg-[#0F172A] px-4 py-3 text-left font-bold text-[#E6EDF3]">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-b border-[#1F2937] px-4 py-3 text-[#BFD2EA]">
                      {children}
                    </td>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#22D3EE] underline underline-offset-4"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-[#9CA3AF]">這個流程目前尚未補內容。</p>
          )}
        </section>

        <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-5">
          {workflowSteps.map((item) => (
            <Link
              key={item.key}
              href={`/projects/${project.id}/${item.key}`}
              className={`rounded-2xl border px-4 py-3 text-center text-sm transition ${
                item.key === workflow
                  ? "border-[#8B5CF6]/60 bg-[#8B5CF6]/20 text-[#C4B5FD]"
                  : "border-[#1F2937] bg-[#111827]/60 text-[#9CA3AF] hover:border-[#8B5CF6]/40 hover:text-[#E6EDF3]"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
