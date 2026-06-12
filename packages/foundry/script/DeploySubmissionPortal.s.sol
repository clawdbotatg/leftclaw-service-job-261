// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { SubmissionPortal } from "../contracts/SubmissionPortal.sol";

/**
 * @notice Deploy script for SubmissionPortal.
 * @dev Inherits ScaffoldETHDeploy which provides:
 *      - ScaffoldEthDeployerRunner modifier (sets up `deployer`, broadcasts, exports)
 *
 * The CLAWD prize token address is left as address(0) at deploy; the owner
 * (CLIENT_WALLET) must call `setPrizeToken(...)` once CLAWD is finalized.
 *
 * Example:
 *   yarn deploy --file DeploySubmissionPortal.s.sol --network base
 */
contract DeploySubmissionPortal is ScaffoldETHDeploy {
    address constant CLAWD_TOKEN = address(0); // owner sets via setPrizeToken later
    address constant CLIENT_WALLET = 0x1d266aae9E1f8cb9228821C40fB5DbC7C771cbce;

    function run() external ScaffoldEthDeployerRunner {
        SubmissionPortal portal = new SubmissionPortal(CLAWD_TOKEN, CLIENT_WALLET);
        deployments.push(Deployment({ name: "SubmissionPortal", addr: address(portal) }));
        console.logString(string.concat("SubmissionPortal deployed at: ", vm.toString(address(portal))));
    }
}
