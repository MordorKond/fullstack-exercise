import {
    createTRPCRouter,
    protectedProcedure,
    // publicProcedure,
} from "~/server/api/trpc";
// import type { createTRPCContext } from "~/server/api/trpc"
// import type { Prisma } from "@prisma/client";
// import type { inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";

export const s3Router = createTRPCRouter({
    upload: protectedProcedure
        .input(z.object({ name: z.string(), buffer: z.string() }))
        .mutation(async ({ input, ctx }) => {
            console.log('hi')
            console.log(input.name, input.buffer)
            return null
        })
});

