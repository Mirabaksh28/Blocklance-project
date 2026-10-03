// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract FreelanceMarketplace {

    uint256 public jobCount;

    struct Job {
        uint256 id;
        address client;
        address freelancer;
        string title;
        string description;
        uint256 payment;
        bool completed;
        bool paid;
    }

    mapping(uint256 => Job) public jobs;

    event JobCreated(
        uint256 indexed jobId,
        address indexed client,
        string title,
        uint256 payment
    );

    event JobAccepted(
        uint256 indexed jobId,
        address indexed freelancer
    );

    event WorkSubmitted(uint256 indexed jobId);

    event PaymentReleased(
        uint256 indexed jobId,
        address indexed freelancer,
        uint256 amount
    );

    function createJob(
        string memory _title,
        string memory _description
    ) external payable {

        require(msg.value > 0, "Payment must be greater than zero");

        jobCount++;

        jobs[jobCount] = Job({
            id: jobCount,
            client: msg.sender,
            freelancer: address(0),
            title: _title,
            description: _description,
            payment: msg.value,
            completed: false,
            paid: false
        });

        emit JobCreated(
            jobCount,
            msg.sender,
            _title,
            msg.value
        );
    }

    function acceptJob(uint256 _jobId) external {

        Job storage job = jobs[_jobId];

        require(job.id != 0, "Job does not exist");
        require(job.freelancer == address(0), "Job already accepted");
        require(msg.sender != job.client, "Client cannot accept own job");

        job.freelancer = msg.sender;

        emit JobAccepted(_jobId, msg.sender);
    }

    function submitWork(uint256 _jobId) external {

        Job storage job = jobs[_jobId];

        require(
            job.freelancer == msg.sender,
            "Not the assigned freelancer"
        );

        require(!job.completed, "Work already submitted");
        require(!job.paid, "Job already paid");

        job.completed = true;

        emit WorkSubmitted(_jobId);
    }

    function releasePayment(uint256 _jobId) external {

        Job storage job = jobs[_jobId];

        require(
            job.client == msg.sender,
            "Only client can release payment"
        );

        require(job.completed, "Work not completed");
        require(!job.paid, "Payment already released");
        require(
            job.freelancer != address(0),
            "No freelancer assigned"
        );

        job.paid = true;

        uint256 amount = job.payment;

        (bool success, ) = payable(job.freelancer).call{
            value: amount
        }("");

        require(success, "Payment transfer failed");

        emit PaymentReleased(
            _jobId,
            job.freelancer,
            amount
        );
    }
}
