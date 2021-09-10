// import { Button } from 'react-bootstrap'
import { signIn } from "next-auth/client";
import { useState } from "react";
import { Button } from "../components/Button";
import { useRouter } from 'next/router'

const deployments = require("../../deployments/mainnet.json");

const ethers = require("ethers");
const {
  utils: { toUtf8Bytes, hexlify },
} = ethers;
import { useToasts } from "react-toast-notifications";

// import { getCsrfToken } from 'next-auth/client'

// // This is the recommended way for Next.js 9.3 or newer
// export async function getServerSideProps(context) {
//     return {
//         props: {
//             csrfToken: await getCsrfToken(context)
//         }
//     }
// }

export function SignInWithEthereum({ size = "lg" }) {
  const { addToast } = useToasts();
  const [status, setStatus] = useState("");
  const router = useRouter();

  async function requestSignature() {
    setStatus("loading");
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    // Check that the user has lazylions
    const { contracts: { LazyLions } } = deployments
    const lazyLionsNFT = new ethers.Contract(
        LazyLions.address,
        LazyLions.abi,
        provider
    )
    const events = await lazyLionsNFT.queryFilter(
        lazyLionsNFT.filters.Transfer(null, address, null),
        LazyLions.deployTransaction.blockNumber,
        'latest'
    )
    const tokens = events.reduce((acc, curr) => {
        return [...acc, curr.args.tokenId.toString()]
    }, [])
    if (!tokens.length) {
        addToast(`Error: can't create account as address (${address}) has not owned any Lazy Lions!`, {
            appearance: 'error',
            autoDismiss: true,
        })
        setStatus('')
        return
    }

    // See: https://github.com/ethers-io/ethers.js/issues/491
    const message = `Connect my Ethereum address ${address} to my account.`;
    const signature = await provider.send("personal_sign", [
      hexlify(toUtf8Bytes(message)),
      address.toLowerCase(),
    ]);
    console.log(signature);

    // const response = await fetch('/api/users/connect-ethereum', {
    //     method: 'POST',
    //     body: JSON.stringify({
    //         message,
    //         signature
    //     })
    // })
    const res = await signIn("ethereum", { message, signature, redirect: false });
    if(res.error) {
      alert(error.toString())
      return
    }
    console.log(`signin`, res);

    router.push('/dashboard')
    setStatus("");
  }

  return (
    <>
      <Button
        variant="primary"
        onClick={requestSignature}
        loading={status == "loading"}
        size={size}
      >
        Connect
      </Button>
      <p>{status != "loading" && status}</p>
    </>
  );
}
