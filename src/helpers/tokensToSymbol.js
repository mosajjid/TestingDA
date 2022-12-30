import contracts from "../config/contracts";
import BUSDSymbol from "./../assets/images/busd_logo.png";
import BNBSymbol from "./../assets/images/bnb.png";
import HNTRSymbol from "./../assets/images/hntr.png";

export const Tokens = {
  [contracts["BUSD"].toLowerCase()]: { icon: BUSDSymbol, symbolName: "BUSD", PFaddress: "0x9331b55D9830EF609A2aBCfAc0FBCE050A52fdEa" },
  [contracts["BNB"].toLowerCase()]: { icon: BNBSymbol, symbolName: "BNB", PFaddress: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" },
  [contracts["HNTR"].toLowerCase()]: { icon: HNTRSymbol, symbolName: "HNTR" }
};
