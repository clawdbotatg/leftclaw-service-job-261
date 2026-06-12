// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Ownable2Step } from "@openzeppelin/contracts/access/Ownable2Step.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SubmissionPortal
 * @notice Ship-to-Earn submission portal for Labs #36. Developers submit a repo
 *         and demo video link; after the contest window the owner records scores
 *         and distributes a CLAWD prize pool (50%/30%/20%) to the top 3.
 */
contract SubmissionPortal is Ownable2Step, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Submission {
        address submitter;
        string repoLink;
        string videoLink;
        uint256 timestamp;
        uint256 totalScore; // basis points, 0-10000
        bool scored;
    }

    uint256 public constant MAX_SCORE_BPS = 10_000;

    IERC20 public prizeToken;
    bool public submissionsOpen;

    Submission[] public submissions;
    mapping(address => bool) public hasSubmitted;

    event Submitted(uint256 indexed id, address indexed submitter, string repoLink, string videoLink);
    event ScoreSet(uint256 indexed id, uint256 score);
    event PrizesDistributed(address first, address second, address third, uint256 prizePool);
    event SubmissionsOpened();
    event SubmissionsClosed();
    event PrizeTokenUpdated(address indexed newToken);

    error EmptyString();
    error SubmissionsNotOpen();
    error AlreadySubmitted();
    error InvalidScore(uint256 score);
    error LengthMismatch();
    error UnknownSubmission(uint256 id);
    error NotScored(uint256 id);
    error NoPrizePool();
    error ZeroAddress();

    constructor(address _prizeToken, address _initialOwner) Ownable(_initialOwner) {
        // _prizeToken may legitimately be address(0) at deploy time when the
        // CLAWD token address is not yet known; the owner can update it later
        // via setPrizeToken before distribution.
        prizeToken = IERC20(_prizeToken);
        submissionsOpen = false;
    }

    // ---------------------------------------------------------------------
    // Owner: configuration
    // ---------------------------------------------------------------------

    function openSubmissions() external onlyOwner {
        submissionsOpen = true;
        emit SubmissionsOpened();
    }

    function closeSubmissions() external onlyOwner {
        submissionsOpen = false;
        emit SubmissionsClosed();
    }

    /**
     * @notice Allows the owner to set or update the CLAWD prize token address.
     *         Useful when the token is deployed after the portal.
     */
    function setPrizeToken(address _prizeToken) external onlyOwner {
        if (_prizeToken == address(0)) revert ZeroAddress();
        prizeToken = IERC20(_prizeToken);
        emit PrizeTokenUpdated(_prizeToken);
    }

    // ---------------------------------------------------------------------
    // Submitter: submit a build
    // ---------------------------------------------------------------------

    function submit(string calldata repoLink, string calldata videoLink) external {
        if (!submissionsOpen) revert SubmissionsNotOpen();
        if (hasSubmitted[msg.sender]) revert AlreadySubmitted();
        if (bytes(repoLink).length == 0 || bytes(videoLink).length == 0) revert EmptyString();

        // Effects
        hasSubmitted[msg.sender] = true;
        uint256 id = submissions.length;
        submissions.push(
            Submission({
                submitter: msg.sender,
                repoLink: repoLink,
                videoLink: videoLink,
                timestamp: block.timestamp,
                totalScore: 0,
                scored: false
            })
        );

        emit Submitted(id, msg.sender, repoLink, videoLink);
    }

    // ---------------------------------------------------------------------
    // Owner: scoring
    // ---------------------------------------------------------------------

    function setScores(uint256[] calldata ids, uint256[] calldata scores) external onlyOwner {
        if (ids.length != scores.length) revert LengthMismatch();
        uint256 total = submissions.length;
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 score = scores[i];
            if (id >= total) revert UnknownSubmission(id);
            if (score > MAX_SCORE_BPS) revert InvalidScore(score);

            Submission storage s = submissions[id];
            s.totalScore = score;
            s.scored = true;
            emit ScoreSet(id, score);
        }
    }

    // ---------------------------------------------------------------------
    // Owner: prize distribution
    // ---------------------------------------------------------------------

    function distributePrizes(uint256 first, uint256 second, uint256 third)
        external
        onlyOwner
        nonReentrant
    {
        uint256 total = submissions.length;
        if (first >= total) revert UnknownSubmission(first);
        if (second >= total) revert UnknownSubmission(second);
        if (third >= total) revert UnknownSubmission(third);

        Submission memory s1 = submissions[first];
        Submission memory s2 = submissions[second];
        Submission memory s3 = submissions[third];

        if (!s1.scored) revert NotScored(first);
        if (!s2.scored) revert NotScored(second);
        if (!s3.scored) revert NotScored(third);

        IERC20 token = prizeToken;
        if (address(token) == address(0)) revert ZeroAddress();

        uint256 pool = token.balanceOf(address(this));
        if (pool == 0) revert NoPrizePool();

        // 50% / 30% / 20% split. Third gets the remainder to avoid dust.
        uint256 prize1 = (pool * 50) / 100;
        uint256 prize2 = (pool * 30) / 100;
        uint256 prize3 = pool - prize1 - prize2;

        // Interactions (CEI: no state writes after this point)
        token.safeTransfer(s1.submitter, prize1);
        token.safeTransfer(s2.submitter, prize2);
        token.safeTransfer(s3.submitter, prize3);

        emit PrizesDistributed(s1.submitter, s2.submitter, s3.submitter, pool);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getSubmission(uint256 id) external view returns (Submission memory) {
        if (id >= submissions.length) revert UnknownSubmission(id);
        return submissions[id];
    }

    function getSubmissionCount() external view returns (uint256) {
        return submissions.length;
    }

    function getAllSubmissions() external view returns (Submission[] memory) {
        return submissions;
    }
}
