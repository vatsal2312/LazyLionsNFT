import "reflect-metadata"; // typeorm
import { ChakraProvider } from "@chakra-ui/react";
import { Provider as NextAuthProvider } from "next-auth/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/globals.css";

import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { Hydrate } from "react-query/hydration";
import { useState } from "react";
import { ToastProvider } from "react-toast-notifications";

import Head from "next/head";
const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  const { session } = pageProps;

  const getLayout = Component.getLayout || ((page) => page);

  // return getLayout(<Component {...pageProps} />)

  return (
    <>
      <Head>
        <title>LazyLions ROARwards</title>
        <meta name="description" content="LazyLions Roarwards" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <NextAuthProvider session={session}>
        <QueryClientProvider client={queryClient}>
          <Hydrate state={pageProps.dehydratedState}>
            <ToastProvider>
              {getLayout(<Component {...pageProps} />)}
            </ToastProvider>
          </Hydrate>
        </QueryClientProvider>
      </NextAuthProvider>
    </>
  );
}

export default MyApp;
