# BlockLance 🚀

BlockLance is a decentralized freelance marketplace built using blockchain technology.

It allows clients to post freelance jobs and freelancers to accept jobs, submit their work, and receive payment through a smart contract.

## Features

- 🔗 Connect wallet using MetaMask
- 📝 Post freelance jobs
- 👨‍💻 Accept available jobs
- 📤 Submit completed work
- 💰 Release payment in ETH
- ⛓️ Blockchain-based transactions
- 🔐 Smart contract controlled payments

## Workflow

Client → Post Job → Freelancer Accepts → Submit Work → Client Releases Payment

## Tech Stack

- Solidity
- Hardhat
- React.js
- Ethers.js
- MetaMask
- Vite
- JavaScript
- CSS

## Smart Contract

The main smart contract is:

`FreelanceMarketplace.sol`

It handles:

- Job creation
- Job acceptance
- Work submission
- Payment release

## Project Structure

```text
blocklance/
├── contracts/
│   └── FreelanceMarketplace.sol
├── frontend/
│   ├── src/
│   └── package.json
├── ignition/
│   └── modules/
├── test/
├── hardhat.config.ts
├── package.json
└── README.md