import Web3 from "web3";

const useWeb3 = () => {
    let web3;

    // const getWeb3 = async () => {
    //     if (window.ethereum) {
    //         web3 = new Web3(window.ethereum);
    //         await window.ethereum.enable();
    //     } else {
    //         const provider = new Web3.providers.HttpProvider(
    //             "https://endpoints.omniatech.io/v1/bsc/testnet/public"
    //         );
    //         web3 = new Web3(provider);
    //     }
    // };

    return { web3 };
};

export default useWeb3;
