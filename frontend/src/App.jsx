import { useEffect, useState } from "react";
import { ethers } from "ethers";
import "./App.css";
import FreelanceMarketplace from "./FreelanceMarketplace.json";

const CONTRACT_ADDRESS =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const HARDHAT_CHAIN_ID = "0x7A69";

const HARDHAT_NETWORK = {
  chainId: HARDHAT_CHAIN_ID,
  chainName: "Hardhat Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["http://127.0.0.1:8545"],
};

function App() {
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);

  const [walletAddress, setWalletAddress] = useState("");
  const [connected, setConnected] = useState(false);

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [payment, setPayment] = useState("");

  const [creatingJob, setCreatingJob] = useState(false);

  // =========================
  // CONNECT WALLET
  // =========================

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("Please install MetaMask.");
        return;
      }

      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: HARDHAT_CHAIN_ID }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [HARDHAT_NETWORK],
          });
        } else if (switchError.code === -32002) {
          alert(
            "MetaMask already has a pending request. Open MetaMask and complete or cancel it."
          );
          return;
        } else {
          throw switchError;
        }
      }

      let accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (!accounts || accounts.length === 0) {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
      }

      if (!accounts || accounts.length === 0) {
        alert("No MetaMask account found.");
        return;
      }

      const browserProvider = new ethers.BrowserProvider(
        window.ethereum
      );

      const network = await browserProvider.getNetwork();

      if (network.chainId.toString() !== "31337") {
        alert("Please select Hardhat Local in MetaMask.");
        return;
      }

      const signer = await browserProvider.getSigner();
      const address = await signer.getAddress();

      const marketplaceContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        FreelanceMarketplace.abi,
        signer
      );

      setProvider(browserProvider);
      setContract(marketplaceContract);
      setWalletAddress(address);
      setConnected(true);

      console.log("Connected wallet:", address);

      await loadJobs(browserProvider);
    } catch (error) {
      console.error("Wallet connection error:", error);

      if (error.code === -32002) {
        alert(
          "MetaMask has a pending request. Open MetaMask and complete or cancel it."
        );
      } else {
        alert(
          error.shortMessage ||
          error.reason ||
          error.message ||
          "Could not connect wallet."
        );
      }
    }
  }

  // =========================
  // LOAD JOBS
  // =========================

  async function loadJobs(existingProvider = null) {
    try {
      setLoadingJobs(true);

      let readProvider = existingProvider;

      if (!readProvider) {
        if (!window.ethereum) {
          setJobs([]);
          return;
        }

        readProvider = new ethers.BrowserProvider(
          window.ethereum
        );
      }

      const marketplace = new ethers.Contract(
        CONTRACT_ADDRESS,
        FreelanceMarketplace.abi,
        readProvider
      );

      const count = await marketplace.jobCount();

      const loadedJobs = [];

      for (let i = 1; i <= Number(count); i++) {
        const job = await marketplace.jobs(i);

        loadedJobs.push({
          id: Number(job.id),
          client: job.client,
          freelancer: job.freelancer,
          title: job.title,
          description: job.description,
          payment: ethers.formatEther(job.payment),
          completed: job.completed,
          paid: job.paid,
        });
      }

      loadedJobs.reverse();

      setJobs(loadedJobs);

      console.log("Jobs loaded:", loadedJobs);
    } catch (error) {
      console.error("Load jobs error:", error);

      if (error.code === -32002) {
        console.log(
          "MetaMask RPC request is temporarily unavailable."
        );
      }
    } finally {
      setLoadingJobs(false);
    }
  }

  // =========================
  // CREATE JOB
  // =========================

  async function createJob(event) {
    event.preventDefault();

    try {
      if (!contract) {
        alert("Please connect your wallet first.");
        return;
      }

      if (!title.trim()) {
        alert("Please enter a job title.");
        return;
      }

      if (!description.trim()) {
        alert("Please enter a job description.");
        return;
      }

      if (!payment || Number(payment) <= 0) {
        alert("Payment must be greater than zero.");
        return;
      }

      setCreatingJob(true);

      const tx = await contract.createJob(
        title,
        description,
        {
          value: ethers.parseEther(payment),
        }
      );

      console.log(
        "Create job transaction:",
        tx.hash
      );

      await tx.wait();

      alert("Job posted successfully!");

      setTitle("");
      setDescription("");
      setPayment("");

      await loadJobs(provider);
    } catch (error) {
      console.error(
        "Create job error:",
        error
      );

      alert(
        error.shortMessage ||
        error.reason ||
        error.message ||
        "Could not create job."
      );
    } finally {
      setCreatingJob(false);
    }
  }

  // =========================
  // ACCEPT JOB
  // =========================

  async function acceptJob(jobId) {
    try {
      if (!contract) {
        alert("Please connect your wallet first.");
        return;
      }

      const tx = await contract.acceptJob(jobId);

      console.log(
        "Accept job transaction:",
        tx.hash
      );

      await tx.wait();

      alert("Job accepted successfully!");

      await loadJobs(provider);
    } catch (error) {
      console.error(
        "Accept job error:",
        error
      );

      alert(
        error.shortMessage ||
        error.reason ||
        error.message ||
        "Could not accept job."
      );
    }
  }

  // =========================
  // SUBMIT WORK
  // =========================

  async function submitWork(jobId) {
    try {
      if (!contract) {
        alert("Please connect your wallet first.");
        return;
      }

      const tx = await contract.submitWork(jobId);

      console.log(
        "Submit work transaction:",
        tx.hash
      );

      await tx.wait();

      alert("Work submitted successfully!");

      await loadJobs(provider);
    } catch (error) {
      console.error(
        "Submit work error:",
        error
      );

      alert(
        error.shortMessage ||
        error.reason ||
        error.message ||
        "Could not submit work."
      );
    }
  }

  // =========================
  // RELEASE PAYMENT
  // =========================

  async function releasePayment(jobId) {
    try {
      if (!contract) {
        alert("Please connect your wallet first.");
        return;
      }

      const tx = await contract.releasePayment(jobId);

      console.log(
        "Release payment transaction:",
        tx.hash
      );

      await tx.wait();

      alert("Payment released successfully!");

      await loadJobs(provider);
    } catch (error) {
      console.error(
        "Release payment error:",
        error
      );

      alert(
        error.shortMessage ||
        error.reason ||
        error.message ||
        "Could not release payment."
      );
    }
  }

  // =========================
  // LOAD JOBS ON START
  // =========================

  useEffect(() => {
    if (window.ethereum) {
      loadJobs();
    }
  }, []);

  // =========================
  // METAMASK LISTENERS
  // =========================

  useEffect(() => {
    if (!window.ethereum) return;

    function handleAccountsChanged(accounts) {
      if (!accounts || accounts.length === 0) {
        setWalletAddress("");
        setConnected(false);
        setContract(null);
      } else {
        setWalletAddress("");
        setConnected(false);
        setContract(null);
      }
    }

    function handleChainChanged() {
      window.location.reload();
    }

    window.ethereum.on(
      "accountsChanged",
      handleAccountsChanged
    );

    window.ethereum.on(
      "chainChanged",
      handleChainChanged
    );

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );

      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, []);

  // =========================
  // HELPER
  // =========================

  function shortAddress(address) {
    if (!address) return "";

    return `${address.slice(
      0,
      6
    )}...${address.slice(-4)}`;
  }

  // =========================
  // DASHBOARD CALCULATIONS
  // =========================

  const myPostedJobs = jobs.filter(
    (job) =>
      connected &&
      job.client.toLowerCase() ===
      walletAddress.toLowerCase()
  );

  const myAcceptedJobs = jobs.filter(
    (job) =>
      connected &&
      job.freelancer.toLowerCase() ===
      walletAddress.toLowerCase()
  );

  const myActiveJobs = myAcceptedJobs.filter(
    (job) => !job.completed
  );

  const myCompletedJobs = myAcceptedJobs.filter(
    (job) => job.completed
  );

  const myEarnings = myAcceptedJobs
    .filter((job) => job.paid)
    .reduce(
      (total, job) =>
        total + Number(job.payment),
      0
    );

  // =========================
  // UI
  // =========================

  return (
    <div className="app">

      {/* =========================
          NAVBAR
      ========================= */}

      <nav className="navbar">

        <div className="navbar-container">

          <div className="logo">
            Block<span>Lance</span>
          </div>

          <div className="nav-links">

            <a href="#home">
              Home
            </a>

            <a href="#jobs">
              Jobs
            </a>

            <a href="#post-job">
              Post Job
            </a>

            <a href="#dashboard">
              Dashboard
            </a>

            <a href="#how-it-works">
              How It Works
            </a>

          </div>

          <button
            className="connect-btn"
            onClick={connectWallet}
          >
            {connected
              ? `Connected ${shortAddress(
                walletAddress
              )}`
              : "Connect Wallet"}
          </button>

        </div>

      </nav>

      {/* =========================
          HERO
      ========================= */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-content">

          <p className="hero-tag">
            DECENTRALIZED FREELANCE MARKETPLACE
          </p>

          <h1>
            <span className="build-work">Build. Work.</span> <span>Earn.</span>
          </h1>

          <p className="hero-description">
            Connect with talented freelancers,
            discover exciting projects, and manage
            freelance work through a transparent
            marketplace.
          </p>

          <div className="hero-buttons">

            <a
              href="#jobs"
              className="primary-btn"
            >
              Find Jobs
            </a>

            <a
              href="#post-job"
              className="secondary-btn"
            >
              Post a Job
            </a>

          </div>

        </div>

      </section>

      {/* =========================
          STATS
      ========================= */}

      <section className="stats-section">

        <div className="stat-card">
          <h3>
            {jobs.length}
          </h3>

          <p>
            Jobs Posted
          </p>
        </div>

        <div className="stat-card">
          <h3>
            24/7
          </h3>

          <p>
            Marketplace
          </p>
        </div>

        <div className="stat-card">
          <h3>
            100%
          </h3>

          <p>
            Transparent
          </p>
        </div>

      </section>

      {/* =========================
          JOBS
      ========================= */}

      <section
        className="jobs-section"
        id="jobs"
      >

        <div className="section-heading">

          <div>

            <p className="section-tag">
              EXPLORE OPPORTUNITIES
            </p>

            <h2>
              Latest Jobs
            </h2>

          </div>

          <button
            className="secondary-btn"
            onClick={() =>
              loadJobs(provider)
            }
          >
            Refresh Jobs ↻
          </button>

        </div>

        {loadingJobs && (
          <div className="empty-jobs">
            <h3>
              Loading jobs...
            </h3>
          </div>
        )}

        {!loadingJobs &&
          jobs.length > 0 && (

            <div className="jobs-grid">

              {jobs.map((job) => {

                const zeroAddress =
                  "0x0000000000000000000000000000000000000000";

                const isClient =
                  connected &&
                  walletAddress.toLowerCase() ===
                  job.client.toLowerCase();

                const isAccepted =
                  job.freelancer.toLowerCase() !==
                  zeroAddress.toLowerCase();

                const isFreelancer =
                  connected &&
                  isAccepted &&
                  walletAddress.toLowerCase() ===
                  job.freelancer.toLowerCase();

                return (

                  <div
                    className="job-card"
                    key={job.id}
                  >

                    <div className="job-icon">
                      💼
                    </div>

                    <div className="job-card-content">

                      <h3>
                        {job.title}
                      </h3>

                      <p className="job-description">
                        {job.description}
                      </p>

                      <div className="job-meta">

                        <span>
                          {job.payment} ETH
                        </span>

                        <span>
                          Job #{job.id}
                        </span>

                      </div>

                      <div className="job-status">

                        {job.paid ? (

                          <span>
                            🟢 Payment Released
                          </span>

                        ) : job.completed ? (

                          <span>
                            🔵 Work Completed
                          </span>

                        ) : isAccepted ? (

                          <span>
                            🟡 Accepted
                          </span>

                        ) : (

                          <span>
                            🟢 Available
                          </span>

                        )}

                      </div>

                      <div className="job-actions">

                        {isClient &&
                          !job.paid && (
                            <span className="job-owner-label">
                              Your Job
                            </span>
                          )}

                        {!isAccepted &&
                          !isClient &&
                          !job.paid && (

                            <button
                              className="apply-btn"
                              onClick={() =>
                                acceptJob(
                                  job.id
                                )
                              }
                              disabled={!connected}
                            >
                              Accept Job
                            </button>

                          )}

                        {isFreelancer &&
                          !job.completed &&
                          !job.paid && (

                            <button
                              className="apply-btn"
                              onClick={() =>
                                submitWork(
                                  job.id
                                )
                              }
                            >
                              Submit Work
                            </button>

                          )}

                        {isClient &&
                          job.completed &&
                          !job.paid && (

                            <button
                              className="apply-btn"
                              onClick={() =>
                                releasePayment(
                                  job.id
                                )
                              }
                            >
                              Release Payment
                            </button>

                          )}

                        {job.paid && (

                          <span className="job-owner-label">
                            ✓ Payment Released
                          </span>

                        )}

                      </div>

                    </div>

                  </div>

                );
              })}

            </div>

          )}

      </section>

      {/* =========================
          POST JOB
      ========================= */}

      <section
        className="post-job-section"
        id="post-job"
      >

        <p className="section-tag">
          HIRE TALENT
        </p>

        <h2>
          Post a Job
        </h2>

        <p className="post-job-description">
          Have a project in mind? Post your job
          and connect with skilled freelancers.
        </p>

        <form
          className="post-job-form"
          onSubmit={createJob}
        >

          <input
            type="text"
            placeholder="Job Title"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
          />

          <textarea
            placeholder="Describe your project..."
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value
              )
            }
          />

          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Payment in ETH"
            value={payment}
            onChange={(event) =>
              setPayment(
                event.target.value
              )
            }
          />

          <button
            type="submit"
            className="primary-btn"
            disabled={creatingJob}
          >
            {creatingJob
              ? "Posting Job..."
              : "Post Job"}
          </button>

        </form>

      </section>

      {/* =========================
          DASHBOARD
      ========================= */}

      <section
        className="dashboard-section"
        id="dashboard"
      >

        <div className="section-heading">

          <div>

            <p className="section-tag">
              YOUR ACTIVITY
            </p>

            <h2>
              My Dashboard
            </h2>

          </div>

        </div>

        {!connected ? (

          <div className="dashboard-login">

            <div className="dashboard-login-icon">
              👛
            </div>

            <h3>
              Connect your wallet
            </h3>

            <p>
              Connect MetaMask to view your
              jobs, accepted work and earnings.
            </p>

            <button
              className="primary-btn"
              onClick={connectWallet}
            >
              Connect Wallet
            </button>

          </div>

        ) : (

          <>

            <div className="dashboard-wallet">

              <span>
                Connected Wallet
              </span>

              <strong>
                {shortAddress(
                  walletAddress
                )}
              </strong>

            </div>

            <div className="dashboard-grid">

              <div className="dashboard-card">

                <div className="dashboard-icon">
                  💼
                </div>

                <h3>
                  Jobs Posted
                </h3>

                <p>
                  {myPostedJobs.length}
                </p>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-icon">
                  🛠️
                </div>

                <h3>
                  Jobs Accepted
                </h3>

                <p>
                  {myAcceptedJobs.length}
                </p>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-icon">
                  ⏳
                </div>

                <h3>
                  Work in Progress
                </h3>

                <p>
                  {myActiveJobs.length}
                </p>

              </div>

              <div className="dashboard-card">

                <div className="dashboard-icon">
                  ✅
                </div>

                <h3>
                  Completed Work
                </h3>

                <p>
                  {myCompletedJobs.length}
                </p>

              </div>

            </div>

            <div className="dashboard-earnings">

              <div>

                <div className="earnings-icon">
                  💰
                </div>

                <div>
                  <h3>
                    Total Earnings
                  </h3>

                  <p>
                    Payments received from
                    completed freelance jobs
                  </p>
                </div>

              </div>

              <strong>
                {myEarnings.toFixed(4)} ETH
              </strong>

            </div>

          </>

        )}

      </section>

      {/* =========================
          HOW IT WORKS
      ========================= */}

      <section
        className="how-section"
        id="how-it-works"
      >

        <div className="section-heading">

          <div>

            <p className="section-tag">
              SIMPLE PROCESS
            </p>

            <h2>
              How It Works
            </h2>

          </div>

        </div>

        <div className="how-grid">

          <div className="how-card">

            <div className="how-number">
              01
            </div>

            <h3>
              Connect Wallet
            </h3>

            <p>
              Connect your MetaMask wallet
              to interact with the marketplace.
            </p>

          </div>

          <div className="how-card">

            <div className="how-number">
              02
            </div>

            <h3>
              Find or Post a Job
            </h3>

            <p>
              Clients can create jobs while
              freelancers can explore available
              opportunities.
            </p>

          </div>

          <div className="how-card">

            <div className="how-number">
              03
            </div>

            <h3>
              Complete & Earn
            </h3>

            <p>
              Freelancers submit their work
              and clients release the agreed payment.
            </p>

          </div>

        </div>

      </section>

      {/* =========================
          FOOTER
      ========================= */}

      <footer className="footer">

        <div className="logo">
          Block<span>Lance</span>
        </div>

        <p>
          Decentralized freelance marketplace.
        </p>

      </footer>

    </div>
  );
}

export default App;