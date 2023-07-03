import { createServerSideHelpers } from "@trpc/react-query/server";
import { appRouter } from "./root";
import superjson from "superjson";
import { createInnerTRPCContext } from "./trpc";

export function ssgHelper() {
  return createServerSideHelpers({
    ctx: createInnerTRPCContext({ session: null, revalidateSSG: null }),
    router: appRouter,
    transformer: superjson,
  });
}
