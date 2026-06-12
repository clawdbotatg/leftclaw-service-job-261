"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { base } from "viem/chains";
import { useAccount, useSwitchChain } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

const SCORING_BREAKDOWN = [
  { label: "CLAWD Burned", weight: 40 },
  { label: "Unique Paying Wallets", weight: 30 },
  { label: "Leftclaw Service Calls", weight: 20 },
  { label: "Novelty / Completeness", weight: 10 },
];

const HomeInner = () => {
  const { address, chain, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const [repoLink, setRepoLink] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  const { data: hasSubmitted } = useScaffoldReadContract({
    contractName: "SubmissionPortal",
    functionName: "hasSubmitted",
    args: [address],
  });

  const { data: submissionsOpen } = useScaffoldReadContract({
    contractName: "SubmissionPortal",
    functionName: "submissionsOpen",
  });

  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "SubmissionPortal",
  });

  const onWrongNetwork = isConnected && chain?.id !== base.id;

  const handleSubmit = async () => {
    if (!repoLink.trim() || !videoLink.trim()) {
      notification.warning("Please fill in both the repo URL and demo video URL.");
      return;
    }
    try {
      await writeContractAsync({
        functionName: "submit",
        args: [repoLink.trim(), videoLink.trim()],
      });
      setJustSubmitted(true);
      setRepoLink("");
      setVideoLink("");
      notification.success("Submission recorded!");
    } catch (err) {
      console.error(err);
    }
  };

  const renderAction = () => {
    if (!isConnected) {
      return (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm opacity-70">Connect your wallet to submit a build.</p>
          <RainbowKitCustomConnectButton />
        </div>
      );
    }
    if (onWrongNetwork) {
      return (
        <button className="btn btn-warning" onClick={() => switchChain({ chainId: base.id })}>
          Switch to Base
        </button>
      );
    }
    if (hasSubmitted) {
      return (
        <div className="alert alert-success">
          <span>You have already submitted a build.</span>
          <Link href="/submissions" className="link link-primary">
            View the gallery
          </Link>
        </div>
      );
    }
    if (submissionsOpen === false) {
      return (
        <div className="alert alert-error">
          <span>Submissions are currently closed.</span>
        </div>
      );
    }
    return (
      <button
        className="btn btn-primary w-full"
        onClick={handleSubmit}
        disabled={isMining || !repoLink.trim() || !videoLink.trim()}
      >
        {isMining ? "Submitting..." : "Submit Build"}
      </button>
    );
  };

  return (
    <div className="flex items-center flex-col grow pt-10">
      <section className="px-5 max-w-3xl text-center">
        <h1 className="text-5xl font-bold mb-2">Ship to Earn</h1>
        <p className="text-lg opacity-80">
          Submit your CLAWD/CV-powered build for Labs #36. Top 3 entries split a 15M CLAWD prize pool after a 30-day
          scoring window.
        </p>
      </section>

      <section className="w-full max-w-2xl px-5 mt-10">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Submit your build</h2>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Repository URL</span>
              </div>
              <input
                type="url"
                placeholder="https://github.com/you/your-build"
                className="input input-bordered w-full"
                value={repoLink}
                onChange={e => setRepoLink(e.target.value)}
                disabled={!!hasSubmitted || isMining}
              />
            </label>

            <label className="form-control w-full">
              <div className="label">
                <span className="label-text">Demo Video URL</span>
              </div>
              <input
                type="url"
                placeholder="https://youtu.be/your-demo"
                className="input input-bordered w-full"
                value={videoLink}
                onChange={e => setVideoLink(e.target.value)}
                disabled={!!hasSubmitted || isMining}
              />
            </label>

            <div className="mt-4">{renderAction()}</div>

            {justSubmitted && (
              <div className="alert alert-info mt-4">
                <span>Thanks! Your submission is live on-chain.</span>
                <Link href="/submissions" className="link link-primary">
                  See it in the gallery
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="w-full max-w-2xl px-5 mt-10">
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg">Scoring breakdown</h3>
            <p className="text-sm opacity-70">
              After 30 days, every submission is scored. Top 3 receive 50% / 30% / 20% of the prize pool.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              {SCORING_BREAKDOWN.map(item => (
                <div key={item.label} className="flex items-center justify-between bg-base-100 rounded-box px-4 py-3">
                  <span>{item.label}</span>
                  <span className="badge badge-primary badge-lg">{item.weight}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="pb-20" />
    </div>
  );
};

const Home: NextPage = () => {
  // Gate wagmi-backed hooks until after client mount so static-export
  // prerendering doesn't try to read provider context that doesn't exist yet.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex justify-center pt-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }
  return <HomeInner />;
};

export default Home;
