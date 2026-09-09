// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title ParametricInsurance
/// @notice Self-executing parametric insurance. A policyholder pays a
/// premium for coverage that triggers automatically once a trusted oracle
/// reports an observed value crossing the policy's threshold (a flight
/// delay in minutes, a rainfall measurement, ...) — no claim forms, no
/// manual adjustment, payout is a single on-chain transfer.
contract ParametricInsurance is Ownable, Pausable, ReentrancyGuard {
    enum Status {
        Active,
        PaidOut,
        Expired
    }

    struct Policy {
        address holder;
        uint256 coverageAmount;
        uint256 premiumPaid;
        uint256 triggerThreshold;
        uint256 expiresAt;
        string metricType;
        Status status;
    }

    uint256 private _nextPolicyId = 1;
    uint256 public premiumRateBps = 500; // 5% of coverage, owner-adjustable
    address public oracle;

    mapping(uint256 => Policy) private _policies;

    event OracleUpdated(address indexed oracle);
    event PremiumRateUpdated(uint256 bps);
    event PolicyPurchased(
        uint256 indexed policyId,
        address indexed holder,
        uint256 coverageAmount,
        uint256 premiumPaid,
        uint256 triggerThreshold,
        uint256 expiresAt,
        string metricType
    );
    event OracleDataSubmitted(uint256 indexed policyId, uint256 observedValue, bool triggered);
    event ClaimPaid(uint256 indexed policyId, address indexed holder, uint256 amount);
    event PolicyExpired(uint256 indexed policyId);
    event PoolFunded(address indexed from, uint256 amount);
    event PoolWithdrawn(address indexed to, uint256 amount);

    modifier onlyOracle() {
        require(msg.sender == oracle, "ParametricInsurance: caller is not the oracle");
        _;
    }

    constructor(address initialOracle) Ownable(msg.sender) {
        oracle = initialOracle == address(0) ? msg.sender : initialOracle;
    }

    /// @notice Premium required for a given coverage amount at the current rate.
    function calculatePremium(uint256 coverageAmount) public view returns (uint256) {
        return (coverageAmount * premiumRateBps) / 10_000;
    }

    /// @notice Buys a policy. `triggerThreshold` and `metricType` describe
    /// the condition an oracle report is checked against (e.g. threshold
    /// `120`, metricType `"flight_delay_minutes"`). Premium is charged
    /// automatically from `msg.value` at the current rate.
    function purchasePolicy(
        uint256 coverageAmount,
        uint256 triggerThreshold,
        uint256 durationSeconds,
        string calldata metricType
    ) external payable whenNotPaused nonReentrant returns (uint256 policyId) {
        require(coverageAmount > 0, "ParametricInsurance: coverage must be > 0");
        require(durationSeconds > 0, "ParametricInsurance: duration must be > 0");

        uint256 premium = calculatePremium(coverageAmount);
        require(msg.value == premium, "ParametricInsurance: incorrect premium sent");

        policyId = _nextPolicyId++;
        uint256 expiresAt = block.timestamp + durationSeconds;

        _policies[policyId] = Policy({
            holder: msg.sender,
            coverageAmount: coverageAmount,
            premiumPaid: premium,
            triggerThreshold: triggerThreshold,
            expiresAt: expiresAt,
            metricType: metricType,
            status: Status.Active
        });

        emit PolicyPurchased(
            policyId,
            msg.sender,
            coverageAmount,
            premium,
            triggerThreshold,
            expiresAt,
            metricType
        );
    }

    /// @notice Oracle reports the real-world observed value for a policy.
    /// Crossing the threshold pays the coverage amount out immediately —
    /// this single call is the entire "claim".
    function submitOracleData(
        uint256 policyId,
        uint256 observedValue
    ) external onlyOracle whenNotPaused nonReentrant {
        Policy storage policy = _policies[policyId];
        require(policy.holder != address(0), "ParametricInsurance: policy does not exist");
        require(policy.status == Status.Active, "ParametricInsurance: policy not active");

        if (block.timestamp > policy.expiresAt) {
            policy.status = Status.Expired;
            emit PolicyExpired(policyId);
            return;
        }

        bool triggered = observedValue >= policy.triggerThreshold;
        emit OracleDataSubmitted(policyId, observedValue, triggered);

        if (!triggered) {
            return;
        }

        require(
            address(this).balance >= policy.coverageAmount,
            "ParametricInsurance: pool underfunded"
        );

        policy.status = Status.PaidOut;

        (bool sent, ) = policy.holder.call{value: policy.coverageAmount}("");
        require(sent, "ParametricInsurance: payout transfer failed");

        emit ClaimPaid(policyId, policy.holder, policy.coverageAmount);
    }

    /// @notice Anyone can close out a policy once its coverage window has
    /// passed without a triggering event — the premium stays with the pool.
    function expirePolicy(uint256 policyId) external {
        Policy storage policy = _policies[policyId];
        require(policy.holder != address(0), "ParametricInsurance: policy does not exist");
        require(policy.status == Status.Active, "ParametricInsurance: policy not active");
        require(block.timestamp > policy.expiresAt, "ParametricInsurance: policy not yet expired");

        policy.status = Status.Expired;
        emit PolicyExpired(policyId);
    }

    function getPolicy(uint256 policyId) external view returns (Policy memory) {
        return _policies[policyId];
    }

    function totalPolicies() external view returns (uint256) {
        return _nextPolicyId - 1;
    }

    function poolBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function setOracle(address newOracle) external onlyOwner {
        require(newOracle != address(0), "ParametricInsurance: zero address");
        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }

    function setPremiumRateBps(uint256 bps) external onlyOwner {
        require(bps <= 10_000, "ParametricInsurance: rate too high");
        premiumRateBps = bps;
        emit PremiumRateUpdated(bps);
    }

    /// @notice Tops up the payout pool beyond what premiums have collected.
    function fundPool() external payable onlyOwner {
        emit PoolFunded(msg.sender, msg.value);
    }

    function withdrawPool(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= address(this).balance, "ParametricInsurance: amount exceeds pool");

        (bool sent, ) = owner().call{value: amount}("");
        require(sent, "ParametricInsurance: withdrawal transfer failed");

        emit PoolWithdrawn(owner(), amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    receive() external payable {
        emit PoolFunded(msg.sender, msg.value);
    }
}
