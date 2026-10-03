import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FreelanceMarketplaceModule = buildModule(
  "FreelanceMarketplaceModule",
  (m) => {
    const freelanceMarketplace = m.contract("FreelanceMarketplace");

    return { freelanceMarketplace };
  }
);

export default FreelanceMarketplaceModule;