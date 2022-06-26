import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
  useAnchorWallet,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import {
  GlowWalletAdapter,
  PhantomWalletAdapter,
  SlopeWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import {
  clusterApiUrl,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import React, { FC, ReactNode, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import idl from "./problematic_dev.json";
import {
  Program,
  AnchorProvider,
  web3,
} from "@project-serum/anchor";

import "./App.css";
require("@solana/wallet-adapter-react-ui/styles.css");

const App: FC = () => {
  let params = useParams();

  return (
    <Context>
      <Content receiver={params.receiver as string} />
    </Context>
  );
};
export default App;

const network = WalletAdapterNetwork.Devnet;

const Context: FC<{ children: ReactNode }> = ({ children }) => {
  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  // @solana/wallet-adapter-wallets includes all the adapters but supports tree shaking and lazy loading --
  // Only the wallets you configure here will be compiled into your application, and only the dependencies
  // of wallets that your users connect to will be loaded.
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new GlowWalletAdapter(),
      new SlopeWalletAdapter(),
      new SolflareWalletAdapter({ network }),
      new TorusWalletAdapter(),
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

interface ReceiverProps {
  receiver: string;
}

const Content: FC<ReceiverProps> = (props) => {
  const wallet = useAnchorWallet();
  const [twitterInput, setTwitterInput] = useState(props.receiver);
  if (twitterInput == "" || twitterInput == null) {
    setTwitterInput("Fill the address here");
  }
  const [solInput, setSolInput] = useState(0.5);
  function getProvider() {
    if (!wallet) {
      return null;
    }

    const connection = new web3.Connection(
      clusterApiUrl("devnet"),
      "confirmed"
    );
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    });
    return provider;
  }

  async function transfer() {
    const provider = getProvider();
    if (!provider) {
      return null;
    }
    const b = JSON.parse(JSON.stringify(idl));
    const program = new Program(b, idl.metadata.address, provider);

    try {
      let tx = new Transaction();
      tx.add(
        SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: new web3.PublicKey(twitterInput),
          lamports: solInput * LAMPORTS_PER_SOL,
        })
      );

      const recent = await provider.connection.getLatestBlockhash();
      tx.feePayer = wallet?.publicKey;
      tx.recentBlockhash = recent.blockhash;
      await setTimeout(function () {}, 30000);
      tx.lastValidBlockHeight = recent.lastValidBlockHeight;
      let x = (await wallet?.signTransaction(tx)) as Transaction;
      let x2 = await provider.connection.sendRawTransaction(x.serialize());
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  return (
    <div className="App">
      <div className="w-full m-3 flex flew-row justify-end">
        <WalletMultiButton />
      </div>

      <div className=" border bg-white rounded-md p-2">
        <div className="flex flex-row justify-between items-center">
          <h1 className="font-black text-4xl uppercase title">Solana Tip</h1>
          <p>to @twitterUser</p>
        </div>
        <div>
          <input
            className="w-full m-1 mr-1 focus:outline-0 input-area"
            type="text"
            value={twitterInput}
            onChange={(e) => setTwitterInput(e.target.value)}
          />
          <div className="grid grid-cols-2">
            <div className="col-span-1 flex flex-col m-1 mb-2">
              <input
                type="number"
                className="pl-2 mb-1 focus:outline-0 input-area"
                value={solInput}
                onChange={(e) => {
                  setSolInput(parseInt(e.target.value));
                }}
              />
              <input
                type="range"
                min="1"
                max="50"
                className="range"
                value={solInput * 10}
                onChange={(e) => {
                  setSolInput(parseInt(e.target.value) / 10);
                }}
              />
            </div>
            <div className="col-span-1 pl-2">
              <button
                className="w-full h-full bg-gray-100 rounded-md"
                onClick={transfer}
              >
                SEND IT
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
