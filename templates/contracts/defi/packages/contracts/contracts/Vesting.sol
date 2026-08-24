// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title Vesting
/// @notice Linear token vesting with an optional cliff, one schedule per
/// beneficiary, revocable by an admin. The `defi` create-mst-app template.
contract Vesting is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public immutable token;

    struct Schedule {
        uint256 totalAmount;
        uint256 released;
        uint64 start;
        uint64 cliff;
        uint64 duration;
        bool revocable;
        bool revoked;
    }

    mapping(address => Schedule) public schedules;

    event ScheduleCreated(
        address indexed beneficiary,
        uint256 amount,
        uint64 start,
        uint64 cliff,
        uint64 duration
    );
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event ScheduleRevoked(address indexed beneficiary, uint256 refunded);

    constructor(address _token) {
        token = IERC20(_token);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    function createSchedule(
        address beneficiary,
        uint256 amount,
        uint64 start,
        uint64 cliffDuration,
        uint64 duration,
        bool revocable
    ) external onlyRole(ADMIN_ROLE) {
        require(beneficiary != address(0), "Vesting: zero beneficiary");
        require(schedules[beneficiary].totalAmount == 0, "Vesting: schedule exists");
        require(duration > 0, "Vesting: zero duration");
        require(cliffDuration <= duration, "Vesting: cliff after duration");

        schedules[beneficiary] = Schedule({
            totalAmount: amount,
            released: 0,
            start: start,
            cliff: start + cliffDuration,
            duration: duration,
            revocable: revocable,
            revoked: false
        });

        token.safeTransferFrom(msg.sender, address(this), amount);
        emit ScheduleCreated(beneficiary, amount, start, start + cliffDuration, duration);
    }

    function vestedAmount(address beneficiary) public view returns (uint256) {
        Schedule storage s = schedules[beneficiary];
        if (s.totalAmount == 0) return 0;
        if (block.timestamp < s.cliff) return 0;
        if (s.revoked) return s.released;
        if (block.timestamp >= s.start + s.duration) return s.totalAmount;
        return (s.totalAmount * (block.timestamp - s.start)) / s.duration;
    }

    function releasableAmount(address beneficiary) public view returns (uint256) {
        return vestedAmount(beneficiary) - schedules[beneficiary].released;
    }

    function release() external nonReentrant {
        uint256 releasable = releasableAmount(msg.sender);
        require(releasable > 0, "Vesting: nothing to release");
        schedules[msg.sender].released += releasable;
        token.safeTransfer(msg.sender, releasable);
        emit TokensReleased(msg.sender, releasable);
    }

    function revoke(address beneficiary) external onlyRole(ADMIN_ROLE) nonReentrant {
        Schedule storage s = schedules[beneficiary];
        require(s.totalAmount > 0, "Vesting: no schedule");
        require(s.revocable, "Vesting: not revocable");
        require(!s.revoked, "Vesting: already revoked");

        uint256 vested = vestedAmount(beneficiary);
        uint256 refund = s.totalAmount - vested;
        s.revoked = true;

        if (refund > 0) {
            token.safeTransfer(msg.sender, refund);
        }
        emit ScheduleRevoked(beneficiary, refund);
    }
}
