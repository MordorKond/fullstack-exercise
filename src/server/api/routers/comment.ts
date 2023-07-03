import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import type { createTRPCContext } from "~/server/api/trpc"
import type { Prisma } from "@prisma/client";
import type { inferAsyncReturnType } from "@trpc/server";
import { z } from "zod";

export const commentRouter = createTRPCRouter({
    infiniteProfileFeed: publicProcedure
        .input(
            z.object({
                userId: z.string(),
                limit: z.number().optional(),
                cursor: z
                    .object({
                        id: z.string(),
                        createdAt: z.date(),
                    })
                    .optional(),
            })
        )
        .query(async ({ input: { limit = 10, userId, cursor }, ctx }) => {
            return await getInfiniteComments({
                ctx,
                limit,
                cursor,
                whereClause: { userId },
            });
        }),
    infiniteFeed: publicProcedure
        .input(
            z.object({
                articleId: z.string(),
                limit: z.number().optional(),
                cursor: z
                    .object({
                        id: z.string(),
                        createdAt: z.date(),
                    })
                    .optional(),
            })
        )
        .query(async ({ input: { limit = 10, articleId, cursor }, ctx }) => {
            return await getInfiniteComments({
                ctx,
                limit,
                cursor,
                whereClause: {
                    articleId,
                },
            });
        }),
    create: protectedProcedure
        .input(z.object({ content: z.string(), articleId: z.string() }))
        .mutation(async ({ input: { content, articleId }, ctx }) => {
            const comment = await ctx.prisma.comment.create({
                data: { content, articleId, userId: ctx.session.user.id },
            });
            // void ctx.revalidateSSG?.(`/profiles/${ctx.session.user.id}`);

            return comment;
        }),
    toggleVote: protectedProcedure
        .input(z.object({ id: z.string(), votedUp: z.boolean() }))
        .mutation(async ({ input: { id, votedUp }, ctx }) => {
            const data = { commentId: id, userId: ctx.session.user.id };

            const existingUpVote =
                await ctx.prisma.upVote.findUnique({
                    where: { userId_commentId: data },
                })
            const existingDownVote =
                await ctx.prisma.downVote.findUnique({
                    where: { userId_commentId: data },
                });
            //create
            if (existingUpVote == null && votedUp) {
                await ctx.prisma.upVote.create({ data })
                if (existingDownVote)
                    await ctx.prisma.downVote.delete({ where: { userId_commentId: data } });
                return { addedUpVote: true, addedDownVote: false, votedUp };
            }
            if (existingDownVote == null && !votedUp) {
                await ctx.prisma.downVote.create({ data })
                if (existingUpVote)
                    await ctx.prisma.upVote.delete({ where: { userId_commentId: data } })
                return { addedUpVote: false, addedDownVote: true, votedUp };
            }
            //delete
            if (existingUpVote && votedUp) {
                await ctx.prisma.upVote.delete({ where: { userId_commentId: data } })
            }
            if (existingDownVote && !votedUp) {
                await ctx.prisma.downVote.delete({ where: { userId_commentId: data } });
            }
            return { addedUpVote: false, addedDownVote: false, votedUp };
        }),
});

async function getInfiniteComments({
    whereClause,
    ctx,
    limit,
    cursor,
}: {
    whereClause?: Prisma.CommentWhereInput;
    limit: number;
    cursor:
    | {
        id: string;
        createdAt: Date;
    }
    | undefined;
    ctx: inferAsyncReturnType<typeof createTRPCContext>;
}) {
    const currentUserId = ctx.session?.user.id;
    const data = await ctx.prisma.comment.findMany({
        take: limit + 1,
        cursor: cursor ? { createdAt_id: cursor } : undefined,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        where: whereClause,
        select: {
            id: true,
            createdAt: true,
            content: true,
            _count: { select: { upVotes: true, downVotes: true } },
            downVotes:
                currentUserId == null ? false : { where: { userId: currentUserId } },
            upVotes:
                currentUserId == null ? false : { where: { userId: currentUserId } },
            user: {
                select: {
                    name: true,
                    id: true,
                    image: true,
                },
            },
        },
    });
    let nextCursor: typeof cursor | undefined;

    if (data.length > limit) {
        const nextItem = data.pop();
        if (nextItem != null) {
            nextCursor = {
                id: nextItem.id,
                createdAt: nextItem.createdAt,
            };
        }
    }
    return {
        comments: data.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            user: comment.user,
            sumVotes: comment._count.upVotes - comment._count.downVotes,
            upVotedByMe: comment.upVotes.length > 0,
            downVotedByMe: comment.downVotes.length > 0,

        })),
        nextCursor,
    };
}

