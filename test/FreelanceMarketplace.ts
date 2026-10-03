import { expect } from "chai";
import { network } from "hardhat";

describe("FreelanceMarketplace", function () {

  // TEST 1
  it("Should complete the full freelance workflow", async function () {

    const { ethers } = await network.connect();

    const [client, freelancer] = await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    expect(await marketplace.jobCount()).to.equal(1);

    await marketplace.connect(freelancer).acceptJob(1);

    let job = await marketplace.jobs(1);

    expect(job.freelancer).to.equal(freelancer.address);

    await marketplace.connect(freelancer).submitWork(1);

    job = await marketplace.jobs(1);

    expect(job.completed).to.equal(true);

    await marketplace.connect(client).releasePayment(1);

    job = await marketplace.jobs(1);

    expect(job.paid).to.equal(true);
  });


  // TEST 2
  it("Should prevent the client from accepting their own job", async function () {

    const { ethers } = await network.connect();

    const [client] = await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    await expect(
      marketplace.connect(client).acceptJob(1)
    ).to.be.revertedWith("Client cannot accept own job");
  });


  // TEST 3
  it("Should prevent an unassigned freelancer from submitting work", async function () {

    const { ethers } = await network.connect();

    const [client, freelancer, attacker] =
      await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    await marketplace.connect(freelancer).acceptJob(1);

    await expect(
      marketplace.connect(attacker).submitWork(1)
    ).to.be.revertedWith("Not the assigned freelancer");
  });


  // TEST 4
  it("Should prevent anyone other than the client from releasing payment", async function () {

    const { ethers } = await network.connect();

    const [client, freelancer, attacker] =
      await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    // Client creates the job
    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    // Freelancer accepts the job
    await marketplace.connect(freelancer).acceptJob(1);

    // Freelancer submits the work
    await marketplace.connect(freelancer).submitWork(1);

    // Attacker tries to release the payment
    await expect(
      marketplace.connect(attacker).releasePayment(1)
    ).to.be.revertedWith("Only client can release payment");
  });

 it("Should prevent payment from being released twice", async function () {

    const { ethers } = await network.connect();

    const [client, freelancer] =
      await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    await marketplace.connect(freelancer).acceptJob(1);

    await marketplace.connect(freelancer).submitWork(1);

    // First payment release
    await marketplace.connect(client).releasePayment(1);

    // Second payment release should fail
    await expect(
      marketplace.connect(client).releasePayment(1)
    ).to.be.revertedWith("Payment already released");

  });

    // TEST 6
  it("Should prevent accepting a non-existent job", async function () {

    const { ethers } = await network.connect();

    const [freelancer] = await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    // Try to accept a job that does not exist
    await expect(
      marketplace.connect(freelancer).acceptJob(999)
    ).to.be.revertedWith("Job does not exist");
  });

    // TEST 7
  it("Should send the correct payment to the freelancer", async function () {

    const { ethers } = await network.connect();

    const [client, freelancer] = await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    // Client creates the job with 1 ETH
    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    // Freelancer accepts the job
    await marketplace.connect(freelancer).acceptJob(1);

    // Freelancer submits the work
    await marketplace.connect(freelancer).submitWork(1);

    // Record freelancer balance before payment
    const balanceBefore =
      await ethers.provider.getBalance(freelancer.address);

    // Client releases payment
    await marketplace.connect(client).releasePayment(1);

    // Record freelancer balance after payment
    const balanceAfter =
      await ethers.provider.getBalance(freelancer.address);

    // Freelancer should receive exactly 1 ETH
    expect(balanceAfter - balanceBefore).to.equal(payment);
  });

    // TEST 8
  it("Should prevent another freelancer from accepting an already accepted job", async function () {

    const { ethers } = await network.connect();

    const [client, freelancer1, freelancer2] =
      await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    // Client creates the job
    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    // Freelancer 1 accepts the job
    await marketplace.connect(freelancer1).acceptJob(1);

    // Freelancer 2 tries to accept the same job
    await expect(
      marketplace.connect(freelancer2).acceptJob(1)
    ).to.be.revertedWith("Job already accepted");
  });

    // TEST 9
  it("Should prevent the assigned freelancer from accepting the job again", async function () {

    const { ethers } = await network.connect();

    const [client, freelancer] = await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    // Client creates the job
    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    // Freelancer accepts the job
    await marketplace.connect(freelancer).acceptJob(1);

    // Same freelancer tries to accept it again
    await expect(
      marketplace.connect(freelancer).acceptJob(1)
    ).to.be.revertedWith("Job already accepted");
  });

    // TEST 10
  it("Should prevent work from being submitted twice", async function () {

    const { ethers } = await network.connect();

    const [client, freelancer] = await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    // Client creates the job
    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    // Freelancer accepts the job
    await marketplace.connect(freelancer).acceptJob(1);

    // Freelancer submits the work
    await marketplace.connect(freelancer).submitWork(1);

    // Freelancer tries to submit the work again
    await expect(
      marketplace.connect(freelancer).submitWork(1)
    ).to.be.revertedWith("Work already submitted");
  });

    // TEST 11
  it("Should prevent payment release before work is completed", async function () {

    const { ethers } = await network.connect();

    const [client, freelancer] = await ethers.getSigners();

    const Marketplace =
      await ethers.getContractFactory("FreelanceMarketplace");

    const marketplace = await Marketplace.deploy();

    await marketplace.waitForDeployment();

    const payment = ethers.parseEther("1");

    // Client creates the job
    await marketplace.connect(client).createJob(
      "Build a Website",
      "Create a portfolio website",
      { value: payment }
    );

    // Freelancer accepts the job
    await marketplace.connect(freelancer).acceptJob(1);

    // Client tries to release payment before work is submitted
    await expect(
      marketplace.connect(client).releasePayment(1)
    ).to.be.revertedWith("Work not completed");
  });

  

});
