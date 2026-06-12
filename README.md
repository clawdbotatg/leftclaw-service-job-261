# Labs #36 — Ship-to-Earn Submission Portal

A decentralized submission portal for Labs #36 where developers submit their CLAWD/CV-powered builds to compete for a 15M CLAWD prize pool.

## Live App

[https://bafybeibgrqvrlndfxm23y5jcsm3z4nxxex5ktjrdu7xnznm6stxvsdtxra.ipfs.community.bgipfs.com/](https://bafybeibgrqvrlndfxm23y5jcsm3z4nxxex5ktjrdu7xnznm6stxvsdtxra.ipfs.community.bgipfs.com/)

## Contracts

| Contract | Address | Network |
|---|---|---|
| SubmissionPortal | [0xbb442f9809f728cfc85cf4b35f0b1f35a6e0b9c0](https://basescan.org/address/0xbb442f9809f728cfc85cf4b35f0b1f35a6e0b9c0) | Base |

Owner: `0x1d266aae9E1f8cb9228821C40fB5DbC7C771cbce` (client wallet)

## What It Does

1. **Submit** — Developers connect a wallet and submit a repo link + demo video link. One submission per wallet, onchain.
2. **Gallery** — Public view of all submissions with scores (after scoring period).
3. **Admin** — Owner-only dashboard to open/close submissions, set scores (0–100), and distribute prizes.

## Scoring (after 30-day window)

| Criterion | Weight |
|---|---|
| CLAWD Burned | 40% |
| Unique Paying Wallets | 30% |
| Leftclaw Service Calls | 20% |
| Novelty / Completeness | 10% |

Top 3 receive 50% / 30% / 20% of the prize pool.

## Admin Setup (Client Actions Required)

After the portal is live, the owner must:

1. **Set the CLAWD prize token** — call `setPrizeToken(clawdAddress)` with the CLAWD ERC-20 address on Base.
2. **Open submissions** — call `openSubmissions()` when ready to accept entries.
3. **Deposit prize pool** — transfer 15M CLAWD tokens to the `SubmissionPortal` contract address.
4. **Close submissions** — call `closeSubmissions()` after the 30-day window.
5. **Set scores** — call `setScores([id0, id1, ...], [score0, score1, ...])` with scores in basis points (0–10000).
6. **Distribute prizes** — call `distributePrizes(firstId, secondId, thirdId)` to pay top 3.

All admin actions are available on the `/admin` page when connected as the owner wallet.

## Development

```bash
git clone https://github.com/clawdbotatg/leftclaw-service-job-261
cd leftclaw-service-job-261
yarn install
yarn chain         # local Anvil node
yarn deploy        # deploy to local
yarn start         # frontend at localhost:3000
```

Deploy to Base:

```bash
source .env
yarn deploy --network base --file DeploySubmissionPortal.s.sol
yarn verify --network base
```

## Stack

- **Smart Contracts**: Solidity + Foundry + OpenZeppelin 5.x
- **Frontend**: Next.js 16 + Scaffold-ETH 2 + RainbowKit + DaisyUI
- **Deployment**: BGIPFS (decentralized, censorship-resistant)
- **Chain**: Base (EVM L2, chain ID 8453)
