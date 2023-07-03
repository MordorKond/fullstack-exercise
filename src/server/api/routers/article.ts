import { v4 as uuidv4 } from 'uuid'
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { z } from "zod";
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '~/server/s3';
import { PutObjectCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';

export const articleRouter = createTRPCRouter({

    createPresignedUrlsDelete: protectedProcedure
        .input(z.object({ keys: z.array(z.string()) }))
        .mutation(async ({ input }) => {
            const Objects = input.keys.map(x => ({ Key: x }))
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Delete: {
                    Objects
                }
            })
            const response = await s3Client.send(deleteCommand)
            return response
        }),

    createPresignedUrlsGet: protectedProcedure
        .input(z.object({ keys: z.array(z.string()) }))
        .mutation(async ({ input }) => {
            const urls = [];
            for (let i = 0; i < input.keys.length; i++) {
                const key = input.keys[i]
                if (!key) return
                const url = await getSignedUrl(
                    s3Client,
                    new GetObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: key,
                    })
                );
                urls.push({
                    url,
                    key,
                });
            }
            return urls;
        }),

    createPresignedUrlsPut: protectedProcedure
        .input(z.object({ count: z.number().gte(1).lte(4) }))
        .mutation(async ({ input }) => {
            const urls = [];
            for (let i = 0; i < input.count; i++) {
                const key = uuidv4();
                const url = await getSignedUrl(
                    s3Client,
                    new PutObjectCommand({
                        Bucket: process.env.AWS_BUCKET_NAME,
                        Key: key,
                        ContentType: 'imageId/jpeg'
                    })
                );
                urls.push({
                    url,
                    key,
                });
            }
            return urls;
        }),

    getArticleById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input: { id }, ctx }) => {
            const article = await ctx.prisma.article.findUnique({
                where: { id },
                select: {
                    id: true,
                    title: true,
                    content: true,
                    user: { select: { name: true } },
                    imageId: true,
                    createdAt: true,
                    perex: true,
                    comments: true,
                    _count: { select: { comments: true } },
                },
            });
            if (article == null) return;
            const url = await getSignedUrl(
                s3Client,
                new GetObjectCommand({
                    Bucket: process.env.AWS_BUCKET_NAME,
                    Key: article.imageId,
                })
            )

            return {
                ...article,
                imageUrl: url
            };

        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                content: z.string(),
                title: z.string(),
                imageId: z.string(),
            })
        )
        .mutation(async ({ input: { id, content, imageId, title }, ctx }) => {
            await ctx.prisma.article.update({
                where: { id },
                data: {
                    title,
                    content,
                    imageId,
                },
            });
        }),
    delete: protectedProcedure
        .input(z.object({ articleId: z.string() }))
        .mutation(async ({ input: { articleId }, ctx }) => {
            await ctx.prisma.article.delete({ where: { id: articleId } });
        }),
    create: protectedProcedure
        .input(
            z.object({ content: z.string(), title: z.string(), imageId: z.string() })
        )
        .mutation(async ({ input: { title, content, imageId }, ctx }) => {
            const article = await ctx.prisma.article.create({
                data: {
                    title,
                    imageId,
                    content,
                    userId: ctx.session.user.id,
                    perex: content.slice(0, 250 - 3).split(' ').map((x, i) => !content.split(' ')[i + 1] ? '...' : x).join(' ')
                },
            });

            return article;
        }),
    getProfileArticles: publicProcedure
        .input(z.object({ userId: z.string().optional() }))
        .query(async ({ ctx }) => {
            const currentUserId = ctx.session?.user.id;
            const data = ctx.prisma.article.findMany({
                select: {
                    id: true,
                    title: true,
                    perex: true,
                    user: { select: { name: true } },
                    comments: true,
                    // todo implement direct comment count
                    // _count:{select:{comments}}
                    createdAt: true,
                },
                where: {
                    user: { id: currentUserId },
                },
                orderBy: { createdAt: "desc" },
            });
            return data;
        }),

    getArticles: publicProcedure
        .input(z.object({ take: z.number(), except: z.array(z.string()) }).optional())
        .query(async ({ input, ctx }) => {
            const take = input ? input.take : 100
            const blacklist = input ? input.except : []
            const data = await ctx.prisma.article.findMany({
                take: take || 100,
                select: {
                    id: true,
                    title: true,
                    imageId: true,
                    perex: true,
                    content: true,
                    user: { select: { name: true } },
                    createdAt: true,
                    _count: { select: { comments: true } },
                },
                where: { id: { notIn: blacklist } },
                orderBy: { createdAt: "desc" },
            });
            console.log('data', data);

            if (data.length == 0) return []

            const dataWithSignedImgUrls = await Promise.all(
                data.map(async (x) => {
                    const key = x.imageId
                    const url = await getSignedUrl(
                        s3Client,
                        new GetObjectCommand({
                            Bucket: process.env.AWS_BUCKET_NAME,
                            Key: key,
                        })
                    )
                    return { ...x, imageUrl: url };
                })
            )

            return dataWithSignedImgUrls
        })
})

