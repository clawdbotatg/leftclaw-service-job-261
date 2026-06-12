"use client";

import { useEffect, useMemo, useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

type Submission = {
  submitter: string;
  repoLink: string;
  videoLink: string;
  timestamp: bigint;
  totalScore: bigint;
  scored: boolean;
};

const AdminPageInner = () => {
  const { address } = useAccount();

  const { data: ownerAddress, isLoading: ownerLoading } = useScaffoldReadContract({
    contractName: "SubmissionPortal",
    functionName: "owner",
  });

  const { data: submissions } = useScaffoldReadContract({
    contractName: "SubmissionPortal",
    functionName: "getAllSubmissions",
  });

  const { data: submissionsOpen } = useScaffoldReadContract({
    contractName: "SubmissionPortal",
    functionName: "submissionsOpen",
  });

  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "SubmissionPortal",
  });

  const isOwner = useMemo(() => {
    if (!address || !ownerAddress) return false;
    return address.toLowerCase() === (ownerAddress as string).toLowerCase();
  }, [address, ownerAddress]);

  const [scoreInputs, setScoreInputs] = useState<Record<number, string>>({});
  const [firstId, setFirstId] = useState<string>("");
  const [secondId, setSecondId] = useState<string>("");
  const [thirdId, setThirdId] = useState<string>("");

  const list = useMemo(() => {
    if (!submissions) return [];
    return (submissions as readonly Submission[]).map((s, idx) => ({ ...s, id: idx }));
  }, [submissions]);

  if (ownerLoading) {
    return (
      <div className="flex justify-center pt-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center pt-20 px-5">
        <h1 className="text-3xl font-bold mb-2">Admin access required</h1>
        <p className="opacity-70">Connect with the contract owner wallet to manage submissions.</p>
      </div>
    );
  }

  const toggleSubmissions = async () => {
    try {
      await writeContractAsync({
        functionName: submissionsOpen ? "closeSubmissions" : "openSubmissions",
      });
      notification.success(submissionsOpen ? "Submissions closed" : "Submissions opened");
    } catch (err) {
      console.error(err);
    }
  };

  const setScore = async (id: number) => {
    const raw = scoreInputs[id];
    if (raw === undefined || raw === "") {
      notification.warning("Enter a score 0-100 first.");
      return;
    }
    const pct = Number(raw);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      notification.warning("Score must be a number between 0 and 100.");
      return;
    }
    // Convert percentage (0-100) to basis points (0-10000)
    const bps = BigInt(Math.round(pct * 100));
    try {
      await writeContractAsync({
        functionName: "setScores",
        args: [[BigInt(id)], [bps]],
      });
      notification.success(`Score set for submission #${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  const distribute = async () => {
    if (firstId === "" || secondId === "" || thirdId === "") {
      notification.warning("Pick all three winners.");
      return;
    }
    const ids = [firstId, secondId, thirdId].map(v => Number(v));
    if (new Set(ids).size !== 3) {
      notification.warning("Winners must be distinct submissions.");
      return;
    }
    try {
      await writeContractAsync({
        functionName: "distributePrizes",
        args: [BigInt(ids[0]), BigInt(ids[1]), BigInt(ids[2])],
      });
      notification.success("Prizes distributed");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col grow pt-10 px-5 max-w-6xl mx-auto w-full pb-20">
      <h1 className="text-4xl font-bold mb-1">Admin Dashboard</h1>
      <p className="opacity-70 mb-6">Manage submissions, set scores, and distribute prizes.</p>

      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="card-title">Submissions window</h2>
            <p className="text-sm opacity-70">
              Status: {submissionsOpen ? <span className="text-success">OPEN</span> : <span className="text-error">CLOSED</span>}
            </p>
          </div>
          <button className="btn btn-primary" onClick={toggleSubmissions} disabled={isMining}>
            {submissionsOpen ? "Close Submissions" : "Open Submissions"}
          </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <h2 className="card-title">All submissions</h2>
          {list.length === 0 ? (
            <p className="opacity-70">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Submitter</th>
                    <th>Links</th>
                    <th>Score (bps)</th>
                    <th>Set score (0-100)</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(s => (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>
                        <Address address={s.submitter as `0x${string}`} />
                      </td>
                      <td className="text-xs space-y-1">
                        <div>
                          <a className="link" href={s.repoLink} target="_blank" rel="noreferrer">
                            repo
                          </a>
                        </div>
                        <div>
                          <a className="link" href={s.videoLink} target="_blank" rel="noreferrer">
                            video
                          </a>
                        </div>
                      </td>
                      <td>
                        {s.scored ? (
                          <span className="badge badge-primary">{s.totalScore.toString()}</span>
                        ) : (
                          <span className="badge badge-ghost">unscored</span>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            placeholder="0-100"
                            className="input input-sm input-bordered w-24"
                            value={scoreInputs[s.id] ?? ""}
                            onChange={e => setScoreInputs(prev => ({ ...prev, [s.id]: e.target.value }))}
                          />
                          <button className="btn btn-sm btn-primary" onClick={() => setScore(s.id)} disabled={isMining}>
                            Set Score
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-100 shadow-md">
        <div className="card-body">
          <h2 className="card-title">Distribute prizes</h2>
          <p className="text-sm opacity-70">
            Pick the top 3 submission IDs. Pool is split 50% / 30% / 20% and sent to each submitter.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {[
              { label: "1st (50%)", value: firstId, set: setFirstId },
              { label: "2nd (30%)", value: secondId, set: setSecondId },
              { label: "3rd (20%)", value: thirdId, set: setThirdId },
            ].map(({ label, value, set }) => (
              <label key={label} className="form-control">
                <div className="label">
                  <span className="label-text">{label}</span>
                </div>
                <select
                  className="select select-bordered"
                  value={value}
                  onChange={e => set(e.target.value)}
                >
                  <option value="">Choose submission…</option>
                  {list.map(s => (
                    <option key={s.id} value={s.id}>
                      #{s.id} — {s.submitter.slice(0, 8)}… {s.scored ? `(${s.totalScore.toString()} bps)` : "(unscored)"}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
          <button className="btn btn-primary mt-4" onClick={distribute} disabled={isMining}>
            Distribute Prizes
          </button>
        </div>
      </div>
    </div>
  );
};

const AdminPage: NextPage = () => {
  // Wait for client mount before initializing wagmi-backed hooks so the
  // static-export prerender doesn't crash on `useConfig`.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex justify-center pt-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }
  return <AdminPageInner />;
};

export default AdminPage;
