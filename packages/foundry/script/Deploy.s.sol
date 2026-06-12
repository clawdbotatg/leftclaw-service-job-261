//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DeployHelpers.s.sol";
import { DeploySubmissionPortal } from "./DeploySubmissionPortal.s.sol";

/**
 * @notice Main deployment script for all contracts.
 * @dev Run with `yarn deploy` (no `--file` flag).
 */
contract DeployScript is ScaffoldETHDeploy {
    function run() external {
        DeploySubmissionPortal deploySubmissionPortal = new DeploySubmissionPortal();
        deploySubmissionPortal.run();
    }
}
