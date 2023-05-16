import Web3 from "web3";
import axios from "axios";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithCustomToken, signOut } from "firebase/auth";

import "./App.css";
import { useState } from "react";
import ConnectWalletButton from "./components/ConnectWalletButton";

import mobileCheck from "./helpers/mobileCheck";
import getLinker from "./helpers/deepLink";

const firebaseConfig = {
  apiKey: "REPLACE_HERE",
  authDomain: "REPLACE_HERE",
  projectId: "REPLACE_HERE",
  storageBucket: "REPLACE_HERE",
  messagingSenderId: "REPLACE_HERE",
  appId: "REPLACE_HERE",
  measurementId: "REPLACE_HERE",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState("");

  const onPressConnect = async () => {
    setLoading(true);

    try {
      const yourWebUrl = "localhost:5173";
      const deepLink = `https://metamask.app.link/dapp/${yourWebUrl}`;
      const downloadMetamaskUrl = "https://metamask.io/download.html";

      if (window?.ethereum?.isMetaMask) {
        // Desktop browser
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        const account = Web3.utils.toChecksumAddress(accounts[0]);
        await handleLogin(account);
      } else if (mobileCheck()) {
        // Mobile browser
        const linker = getLinker(downloadMetamaskUrl);
        linker.openURL(deepLink);
      } else {
        window.open(downloadMetamaskUrl);
      }
    } catch (error) {
      console.log(error);
    }

    setLoading(false);
  };

  const handleLogin = async (address) => {
    const baseUrl = "http://localhost:4000";
    const response = await axios.get(`${baseUrl}/message?address=${address}`);
    const messageToSign = response.data.messageToSign;

    if (!messageToSign) {
      throw new Error('Invalid message to sign');
    }

    const web3 = new Web3(Web3.givenProvider);
    const signature = await web3.eth.personal.sign(messageToSign, address);

    const jwtResponse = await axios.get(`${baseUrl}/jwt?address=${address}&signature=${signature}`);

    const customToken = jwtResponse.data.customToken;

    if (!customToken) {
      throw new Error("Invalid JWT");
    }

    const credentials = await signInWithCustomToken(auth, customToken);
    localStorage.setItem("token", (await credentials.user.getIdTokenResult()).token);
    setAddress(address);
  };

  const onPressLogout = () => {
    setAddress("");
    signOut(auth);
  };

  return (
    <div>
      <header>
        <ConnectWalletButton
          onPressConnect={onPressConnect}
          onPressLogout={onPressLogout}
          loading={loading}
          address={address}
        />
      </header>
      <p className="read-the-docs">
        {address !== ""
          ? `Hello ${address}`
          : "Please connect your wallet first."}
      </p>
    </div>
  );
}

export default App;
