// src/utils/trpc.ts
import superjson from "superjson";

import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCNext } from "@trpc/next";
// import type { GetInferenceHelpers } from "@trpc/server";
import { inferRouterInputs, inferRouterOutputs } from "@trpc/server";


import type { AppRouter } from "../server/trpc/router/_app";
import { delay } from "./delay";

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
     transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          fetch: async (input, init) => {
            // await delay(1000);
            return fetch(input, init);
          }
        }),
      ],
    };
  },
  ssr: false,
});
/**
 * Inference helpers
 * @example type HelloOutput = AppRouterTypes['example']['hello']['output']
 **/
// export type AppRouterTypes = GetInferenceHelpers<AppRouter>;
export type AppRouterInputTypes = inferRouterInputs<AppRouter>;
export type AppRouterOutputTypes = inferRouterOutputs<AppRouter>;