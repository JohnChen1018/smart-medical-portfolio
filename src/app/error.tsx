"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <div className="bg-[#0B0F14] px-6 py-20">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-black text-[#E6EDF3]">{t.crash.title}</h1>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-full bg-[#4ADE80] px-5 py-2.5 font-bold text-[#0B0F14]"
        >
          {t.crash.reload}
        </button>
      </div>
    </div>
  );
}
