// import { ADDRESS, RPC_HTTP_URL } from "@/constants";
import useWeb3 from "@/hooks/useWeb3";
import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { ERC20ABI, MintNftABI, LoadNftABI } from "common/abi";

// chain BNB testnet
// const RPC_HTTP_URL = "https://data-seed-prebsc-2-s3.binance.org:8545";
// const PRIVATE_KEY =
//     "5fa1b1906e9f83b324e4d28313a9e87ff37b1994e2b440eaad694901a42d6a2d";
// const ACCOUNT_ADDRESS = "0xc4Bae590dE2099A279f88f3Fd0a8793e2455781f";

// chain Polygon mainnet
const RPC_HTTP_URL = "https://polygon-rpc.com";
const PRIVATE_KEY =
    "29a502352c86bd27095184f27fea2d34602820c39cb61f44e185b2a5e3198d71";
const ACCOUNT_ADDRESS = "0x25Dd27FbbAcE7f3CdF6F3dF59B87951fA8F853cf";

let tokenList = [];
let txnList = [];

const HomeScreen = () => {
    const [balance, setBalance] = useState("");
    const [account, setAccount] = useState("");
    const [receiverAddress, setReceiverAddress] = useState("");
    const [tokenAddress, setTokenAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [addAssetAddress, setAddAssetAddress] = useState("");
    const [assetList, setAssetList] = useState([]);
    const [activityList, setActivityList] = useState([]);
    const [nfts, setNfts] = useState([]);
    const [transferType, setTransferType] = useState("matic_transfer");
    const [detailTxn, setDetailTxn] = useState({});

    const web3 = new Web3(new Web3.providers.HttpProvider(RPC_HTTP_URL));

    useEffect(() => {
        getAccountBalance();
        getDetailTxnByHash("0x6df23fc8310e838f8a0016131a107b17a409177c9648f620d6ce723a8a46e614");
    }, []);

    const getDetailTxnByHash = async (hash: string) => {
        const detail = await web3.eth.getTransaction(hash.toString());
        console.log("detail", detail);
        return detail;
    };

    const getAccountBalance = async () => {
        const res = await web3.eth.getBalance(ACCOUNT_ADDRESS);
        const convertBalance = web3.utils.fromWei(res.toString(), "ether");
        console.log("convertBalance", convertBalance);
        setBalance(convertBalance);
    };

    const handleTransfer = async () => {
        const nonce = await web3.eth.getTransactionCount(
            ACCOUNT_ADDRESS,
            "latest"
        );
        const value = web3.utils.toWei(amount.toString(), "ether");
        const gasPrice = await web3.eth.getGasPrice();
        const gas = await web3.eth.estimateGas({
            from: ACCOUNT_ADDRESS,
            to: receiverAddress,
            value: Number(1000000000000000),
        });

        let transaction;
        if (transferType === "token_transfer") {
            const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);
            const data = tokenContract.methods
                .transfer(receiverAddress, value)
                .encodeABI();

            transaction = {
                to: tokenAddress,
                value: "0x00",
                gasPrice: gasPrice,
                // gasLimit: 22000,
                nonce: nonce,
                data: data,
            };
            const gasLimit = await web3.eth.estimateGas({
                ...transaction,
                from: ACCOUNT_ADDRESS,
            });

            console.log("gas", gas);

            transaction.gas = gasLimit;
        } else {
            transaction = {
                to: receiverAddress,
                value: value,
                gas: gas,
                gasPrice: gasPrice,
                // gasLimit: 0,
                nonce: nonce,
            };
        }
        console.log("transaction :>> ", transaction);

        const signTxn = await web3.eth.accounts.signTransaction(
            transaction,
            PRIVATE_KEY
        );
        console.log("signTxn :>> ", signTxn);

        web3.eth.sendSignedTransaction(
            signTxn.rawTransaction,
            (error, hash) => {
                if (error) {
                    console.log("error: ", error);
                } else {
                    console.log(
                        "transaction submitted on blockchain with hash: ",
                        hash
                    );
                    getDetailTxnByHash(hash).then((detail) =>
                        setDetailTxn(detail)
                    );

                    const ref = `https://polygonscan.com/tx/${hash}`;
                    const txn = {
                        tokenAddress: tokenAddress ? tokenAddress : "MATIC",
                        transferAmount: amount,
                        txnHash: (
                            <a href={ref} rel="noreferrer" target="_blank">
                                {`${hash.slice(0, 5)}...${hash.slice(38)}`}
                            </a>
                        ),
                    };

                    txnList.push(txn);
                    setActivityList([]);
                    setActivityList(txnList);
                    getAccountBalance();
                }
            }
        );
    };

    const handleAddAsset = async () => {
        const tokenContract = new web3.eth.Contract(ERC20ABI, addAssetAddress);
        const balance = await tokenContract.methods
            .balanceOf(ACCOUNT_ADDRESS)
            .call();
        const tokenBalance = web3.utils.fromWei(balance.toString(), "ether");

        const asset = {
            assetNumber: tokenList.length + 1,
            tokenAddress: addAssetAddress,
            tokenBalance: tokenBalance,
        };

        tokenList.push(asset);
        setAssetList([]);
        setAssetList(tokenList);
    };

    const handleMintNFT = async () => {
        const contract = new web3.eth.Contract(
            MintNftABI, // from ABI encode
            "0x9aE5c1cf82aF51CBB83D9A7B1C52aF4B48E0Bb5E" // contract address
        );
        console.log("contract", contract.methods);

        const nonce = await web3.eth.getTransactionCount(
            ACCOUNT_ADDRESS,
            "latest"
        );
        console.log("nonce", nonce);
        const gasPrice = await web3.eth.getGasPrice();
        console.log("gasPrice", gasPrice);
        const dataParams = contract.methods.mint().encodeABI();
        console.log("dataParams", dataParams);

        const rawTxn = {
            to: "0x9aE5c1cf82aF51CBB83D9A7B1C52aF4B48E0Bb5E",
            from: ACCOUNT_ADDRESS,
            gasPrice: gasPrice,
            nonce: nonce,
            data: dataParams,
        };

        const gas = await web3.eth.estimateGas(rawTxn);
        console.log("gas", gas);
        rawTxn.gas = gas;
        console.log("rawTxn :>> ", rawTxn);

        const signedTransaction = await web3.eth.accounts.signTransaction(
            rawTxn,
            PRIVATE_KEY
        );
        console.log("Signed Transaction:", signedTransaction);

        const receipt = signedTransaction.rawTransaction
            ? await web3.eth.sendSignedTransaction(
                  signedTransaction.rawTransaction
              )
            : "";
        console.log("Receipt:", receipt);

        const hash = receipt.logs[0].topics.at(-1);

        getDetailTxnByHash(receipt.transactionHash).then((detail) => setDetailTxn(detail));

        const result = await contract.methods
            .tokenURI(parseInt(hash, 16))
            .call();

        console.log("result: ", result); // https://file.coin98.com/nft/matic/506
    };

    const handleLoadNFT = async () => {
        const contract = new web3.eth.Contract(
            LoadNftABI, // from ABI encode
            "0x9aE5c1cf82aF51CBB83D9A7B1C52aF4B48E0Bb5E" // contract address
        );

        console.log("contract.methods :>> ", contract.methods);
        const balanceOf = await contract.methods
            .balanceOf(ACCOUNT_ADDRESS)
            .call();
        console.log("balanceOf", balanceOf);

        for (let i = 0; i < balanceOf; i++) {
            const tokenId = await contract.methods.tokenByIndex(i).call();
            console.log("tokenId", tokenId);

            const tokenMetaData = await contract.methods
                .tokenURI(tokenId)
                .call();
            setNfts((prev) => [...prev, tokenMetaData]);
            console.log("tokenMetaData", tokenMetaData);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexFlow: "column",
                gap: 20,
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h3>{ACCOUNT_ADDRESS}</h3>: <p>{balance} MATIC</p>
            </div>
            <div>
                <h2>ASSETS</h2>
                <table>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid white" }}>
                                Token address
                            </th>
                            <th style={{ border: "1px solid white" }}>
                                Balance
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {assetList.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ border: "1px solid white" }}>
                                    {item.tokenAddress}
                                </td>
                                <td style={{ border: "1px solid white" }}>
                                    {item.tokenBalance}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                Add Asset (Token):{" "}
                <input
                    placeholder="Asset token"
                    onChange={(e) => setAddAssetAddress(e.target.value)}
                />
                <button type="button" onClick={() => handleAddAsset()}>
                    Add Asset
                </button>
            </div>

            <div>
                <div>
                    <input
                        type="radio"
                        name="radio-group"
                        value="matic_transfer"
                        onChange={(e) => setTransferType(e.target.value)}
                        defaultChecked
                    />
                    MATIC
                </div>
                <div>
                    <input
                        type="radio"
                        name="radio-group"
                        value="token_transfer"
                        onChange={(e) => setTransferType(e.target.value)}
                    />
                    Token
                </div>
            </div>

            <div>
                Token Address:{" "}
                <input
                    placeholder="Token address"
                    onChange={(e) => setTokenAddress(e.target.value)}
                    disabled={transferType === "matic_transfer"}
                />
            </div>

            <div>
                Send to:{" "}
                <input
                    placeholder="Receiver address"
                    onChange={(e) => setReceiverAddress(e.target.value)}
                />
            </div>

            <div>
                Amount:{" "}
                <input
                    placeholder="0.00"
                    onChange={(e) => setAmount(e.target.value)}
                />
            </div>

            <div>
                <button type="button" onClick={() => handleTransfer()}>
                    Send
                </button>
            </div>

            <div>
                <h2>ACTIVITY</h2>
                <table>
                    <thead>
                        <tr>
                            <th style={{ border: "1px solid white" }}>
                                Token address
                            </th>
                            <th style={{ border: "1px solid white" }}>
                                Transfer amount
                            </th>
                            <th style={{ border: "1px solid white" }}>
                                Txn hash
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {activityList.map((item, idx) => (
                            <tr key={idx}>
                                <td style={{ border: "1px solid white" }}>
                                    {item.tokenAddress}
                                </td>
                                <td style={{ border: "1px solid white" }}>
                                    {item.transferAmount}
                                </td>
                                <td style={{ border: "1px solid white" }}>
                                    {item.txnHash}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <button type="button" onClick={() => handleMintNFT()}>
                    Mint NFT
                </button>
                <button type="button" onClick={() => handleLoadNFT()}>
                    load NFT
                </button>
            </div>

            <ul>
                {nfts.map((item, idx) => (
                    <li key={idx}>{item}</li>
                ))}
            </ul>

            {detailTxn.hash && (
                <>
                    <div>
                        <span>blockHash: </span>
                        <span>{detailTxn.blockHash}</span>
                    </div>
                    <div>
                        <span>blockNumber: </span>
                        <span>{detailTxn.blockNumber}</span>
                    </div>
                    <div>
                        <span>from: </span>
                        <span>{detailTxn.from}</span>
                    </div>
                    <div>
                        <span>gas: </span>
                        <span>{detailTxn.gas}</span>
                    </div>
                    <div>
                        <span>gasPrice: </span>
                        <span>{detailTxn.gasPrice}</span>
                    </div>
                    <div>
                        <span>hash: </span>
                        <span>{detailTxn.hash}</span>
                    </div>
                    <div>
                        <span>input: </span>
                        <span>{detailTxn.input}</span>
                    </div>
                    <div>
                        <span>nonce: </span>
                        <span>{detailTxn.nonce}</span>
                    </div>
                    <div>
                        <span>transactionIndex: </span>
                        <span>{detailTxn.transactionIndex}</span>
                    </div>
                    <div>
                        <span>type: </span>
                        <span>{detailTxn.type}</span>
                    </div>
                    <div>
                        <span>value: </span>
                        <span>{detailTxn.value}</span>
                    </div>
                </>
            )}
        </div>
    );
};

export default HomeScreen;

// useEffect(() => {
//     getAccount();
//     // getBalance();
// }, []);

// const getAccount = async () => {
//     const accounts = await web3.eth.getAccounts();
//     console.log("accounts", accounts);
//     console.log("web3", web3);
//     setAccount(accounts[0]);
// };

// const getBalance = async () => {
//     const balanceRes = await web3.eth.getBalance(account);
//     const weiToBalance = web3.utils.fromWei(balanceRes.toString(), "ether");

//     setBalance(weiToBalance);
// };
