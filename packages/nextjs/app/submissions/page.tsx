"use client";

import { useEffect, useMemo, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

type Submission = {
  submitter: string;
  repoLink: string;
  videoLink: string;
  timestamp: bigint;
  totalScore: bigint;
  scored: boolean;
};

const SubmissionsPageInner = () => {
  const { data: submissions, isLoading } = useScaffoldReadContract({
    contractName: "SubmissionPortal",
    functionName: "getAllSubmissions",
  });

  const sorted = useMemo(() => {
    if (!submissions) return [];
    const list = (submissions as readonly Submission[]).map((s, idx) => ({ ...s, id: idx }));
    const anyScored = list.some(s => s.scored);
    if (!anyScored) return list;
    return [...list].sort((a, b) => {
      if (a.scored && !b.scored) return -1;
      if (!a.scored && b.scored) return 1;
      if (b.totalScore === a.totalScore) return 0;
      return b.totalScore > a.totalScore ? 1 : -1;
    });
  }, [submissions]);

  return (
    <div className="flex flex-col grow pt-10 px-5 max-w-5xl mx-auto w-full">
      <h1 className="text-4xl font-bold mb-2">Submissions Gallery</h1>
      <p className="opacity-70 mb-8">
        Every Ship-to-Earn build, on-chain. Sorted by score once scoring begins.
      </p>

      {isLoading && (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="alert">
          <span>No submissions yet. Be the first to ship!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
        {sorted.map(s => (
          <div key={s.id} className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex items-center justify-between gap-3">
                <h2 className="card-title text-base">Submission #{s.id}</h2>
                {s.scored ? (
                  <span className="badge badge-primary">
                    Score: {(Number(s.totalScore) / 100).toFixed(2)}%
                  </span>
                ) : (
                  <span className="badge badge-ghost">Awaiting scoring</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="opacity-70">By</span>
                <Address address={s.submitter as `0x${string}`} />
              </div>
              <div className="text-sm">
                <span className="opacity-70">Repo:</span>{" "}
                <a className="link link-primary break-all" href={s.repoLink} target="_blank" rel="noreferrer">
                  {s.repoLink}
                </a>
              </div>
              <div className="text-sm">
                <span className="opacity-70">Demo:</span>{" "}
                <a className="link link-primary break-all" href={s.videoLink} target="_blank" rel="noreferrer">
                  {s.videoLink}
                </a>
              </div>
              <div className="text-xs opacity-60">
                Submitted: {new Date(Number(s.timestamp) * 1000).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SubmissionsPage: NextPage = () => {
  // Gate hooks that rely on WagmiProvider until after client mount so the
  // static-export prerender pass doesn't trip on `useConfig` outside the
  // provider tree.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex justify-center pt-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }
  return <SubmissionsPageInner />;
};

export default SubmissionsPage;
