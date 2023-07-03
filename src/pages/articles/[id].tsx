import { FormEvent, useState } from "react";
import type {
    GetStaticPaths,
    GetStaticPropsContext,
    InferGetStaticPropsType,
    NextPage,
} from "next";

import type { ArticleCardProps } from "~/components/ArticleCard";
import { Button } from "~/components/Button";
import ErrorPage from "next/error";
import Image from "next/image";
import InfiniteScroll from "react-infinite-scroll-component";
import { LoadingSpinner } from "~/components/LoadingSpinner";
import { NavBar } from "~/components/NavBar";
import { VscAccount } from "react-icons/vsc";
import { api } from "~/utils/api";
import circleSrc from "images/circle.svg";
import downVoteIcon from "images/chevron-Down.svg";
import { ssgHelper } from "~/server/api/ssgHelper";
import upVoteIcon from "images/chevron-up.svg";
import { useSession } from "next-auth/react";
import ReactMarkdown from 'react-markdown'

const ArticlePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
    id,
}) => {
    const { data: article } = api.article.getArticleById.useQuery({ id });

    if (article == null || article.title == null) {
        return <ErrorPage statusCode={404} />;
    }
    const dateTimeFormater = new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
    });
    const trpcUtils = api.useContext();
    return (
        <>
            {/* //todo:make navbar global */}
            <NavBar />
            {/* //todo:fix the image to come from article*/}
            {/* //todo:remove the !asertion*/}
            <main className="flex gap-6 pt-16">
                <Article
                    key={article.id}
                    id={article.id}
                    imageUrl={article.imageUrl}
                    title={article.title}
                    date={article.createdAt}
                    author={article.user.name || ""}
                    description={article.perex}
                    fullText={article.content}
                    commentsCount={article._count.comments}
                />
                <SideArticlesList mainArticleId={article.id} />
            </main>
        </>
    );
};

function SideArticlesList({ mainArticleId }: { mainArticleId: string }) {
    const { data: sideArticles } = api.article.getArticles.useQuery({ take: 5, except: [mainArticleId] })
    console.log('side articles', sideArticles)
    if (!sideArticles || sideArticles.length == 0) return null
    return (
        <div className="hidden lg:inline sticky top-16 h-fit max-w-sm border-l">
            <div className="flex flex-col pl-6 ">
                <h1 className="mb-8  text-2xl">Related Articles</h1>
                <ul className="flex flex-col gap-y-6 ">
                    {sideArticles.map(article => {
                        return (<li key={article.id}>
                            <h6 className="mb-2  text-base font-medium">
                                {article.title}
                            </h6>
                            <div className=" font-normal text-neutral-800">
                                {article.perex}
                            </div>

                        </li>)
                    })}
                </ul>
            </div>
        </div>
    );
}

function Article(article: ArticleCardProps) {
    //todo text title and description verticle size control
    //? note the numebr of charactes in the description
    //? we might have to use a hook for that ....
    //todo font family halvetica neu
    //todo ?
    if (!article.fullText) article.fullText = ''
    const fullText = article.fullText
    return (
        <>
            <div className="grid max-w-3xl grid-cols-1 gap-6 ">
                {/* article */}
                <h1 className=" text-4xl font-medium">{article.title}</h1>
                <div className="flex   text-sm text-gray-500">
                    <div className="t ">{article.author}</div>
                    <Image src={circleSrc} alt="circle" className="mx-3" />
                    <div className="t ">
                        {dateTimeFormater.format(article.date)}
                    </div>
                </div>
                <Image src={article.imageUrl} alt="face of a cat" width={760} height={504} />
                <p className="whitespace-pre-wrap border-b -neutral-200 pb-10 text-base">
                    {article.fullText}
                </p>
                <ReactMarkdown >
                    {fullText}
                </ReactMarkdown>
                {/* <div className="h-10 -b -neutral-200"></div> */}
                {/* comments count */}
                <div className=" text-xl">
                    {getPlural(article.commentsCount, "Comment", " Comments")}{" "}
                    {`(${article.commentsCount})`}
                </div>
                {/* comments section */}
                <CommentForm articleId={article.id} />
                {/* {api.comment.} */}
                <ArticleComments articleId={article.id} />
            </div>
        </>
    );
}

export function ArticleComments({ articleId }: { articleId: string }) {
    const comments = api.comment.infiniteFeed.useInfiniteQuery(
        { articleId },
        { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );
    console.log('comments', comments);

    return (
        <>
            <InfiniteCommentList
                comments={comments.data?.pages.flatMap((page) =>
                    page.comments.map((comment) => ({ ...comment, articleId }))
                )}
                isError={comments.isError}
                isLoading={comments.isLoading}
                hasMore={comments.hasNextPage}
                fetchNewComments={comments.fetchNextPage}
            />
        </>
    );
}
type Comment = {
    articleId: string;
    id: string;
    content: string;
    createdAt: Date;
    sumVotes: number;
    upVotedByMe: boolean;
    downVotedByMe: boolean;
    user: { id: string; image: string | null; name: string | null };
};
type InfinateListPropps = {
    comments?: Comment[];
    isError: boolean;
    isLoading: boolean;
    hasMore: boolean | undefined;
    fetchNewComments: () => Promise<unknown>;
};
function InfiniteCommentList({
    comments,
    isError,
    isLoading,
    hasMore = false,
    fetchNewComments,
}: InfinateListPropps) {
    if (isError) return <h1>Error...</h1>;
    if (isLoading) return <LoadingSpinner />;

    if (comments == null || comments?.length === 0) {
        return (
            <h2 className="my-4 text-center text-2xl text-gray-500">No Comments</h2>
        );
    }
    return (
        <ul>
            <InfiniteScroll
                className="flex flex-col gap-5"
                dataLength={comments.length}
                next={fetchNewComments}
                hasMore={hasMore}
                loader={<LoadingSpinner />}
            >
                {comments.map((comment) => (
                    <CommentCard key={comment.id} {...comment} />
                ))}
            </InfiniteScroll>
        </ul>
    );
}

function CommentForm({
    className,
    articleId,
}: {
    className?: string;
    articleId: string;
}) {
    const [comment, setComment] = useState("");
    const trpcUtils = api.useContext();
    const session = useSession();

    const createComment = api.comment.create.useMutation({
        onSuccess(newComment) {
            if (session.status != "authenticated") return;
            setComment("");
            trpcUtils.article.getArticleById.setData({ id: articleId }, (oldData) => {
                if (oldData == null) return undefined;
                return {
                    ...oldData,
                    _count: { comments: oldData._count.comments + 1 },
                };
            });
            trpcUtils.comment.infiniteFeed.setInfiniteData(
                { articleId },
                (oldData) => {
                    if (oldData == null || oldData.pages[0] == null) return;
                    const newCachedComment = {
                        ...newComment,
                        sumVotes: 0,
                        upVotedByMe: false,
                        downVotedByMe: false,
                        user: {
                            id: session.data.user.id,
                            name: session.data.user.name || null,
                            image: session.data.user.image || null,
                        },
                    };
                    return {
                        ...oldData,
                        pages: [
                            {
                                ...oldData.pages[0],
                                comments: [newCachedComment, ...oldData.pages[0].comments],
                            },
                            ...oldData.pages.slice(1),
                        ],
                    };
                }
            );
        },
    });
    // todo: there is no submit button on figma
    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        createComment.mutate({ content: comment, articleId: articleId });
    }
    if (!(session.data && session.status === 'authenticated')) return null
    return (
        <form onSubmit={handleSubmit} className="flex flex-row  ">
            <div className="flex flex-grow gap-6">
                <ProfileImage src={session.data.user.image || undefined} />
                <input
                    id='comment-field'
                    // ref={inputRef}
                    // style={{ height: 0 }}
                    style={{ height: 46 }}
                    className="flex-grow resize-none overflow-hidden rounded border px-4 py-2 text-xl outline-none"
                    placeholder="Join the discussion"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                ></input>

            </div>
        </form>
    );
}

const dateTimeFormater = new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
});

function CommentCard({
    articleId,
    id,
    content,
    createdAt,
    sumVotes,
    upVotedByMe,
    downVotedByMe,
    user,
}: Comment) {
    const trpcUtils = api.useContext();
    const toggleVote = api.comment.toggleVote.useMutation({
        onSuccess: ({ addedDownVote, addedUpVote }) => {
            const updater: Parameters<
                typeof trpcUtils.comment.infiniteFeed.setInfiniteData
            >[1] = (oldData) => {
                if (oldData == null) return;
                console.log('addedDownVote', addedDownVote)
                console.log('addedUpVote', addedUpVote)

                return {
                    ...oldData,
                    pages: oldData.pages.map((page) => {
                        return {
                            ...page,
                            comments: page.comments.map((comment) => {
                                if (comment.id != id) return comment;
                                return {
                                    ...comment,
                                    sumVotes:
                                        comment.sumVotes + ((
                                            comment.upVotedByMe && !addedDownVote) ? -1 : (
                                                comment.upVotedByMe && addedDownVote) ? -2 : (
                                                    comment.downVotedByMe && !addedUpVote) ? +1 : (
                                                        comment.downVotedByMe && addedUpVote) ? +2 : (
                                                            addedUpVote) ? 1 : -1),
                                    upVotedByMe: addedUpVote,
                                    downVotedByMe: addedDownVote,
                                };
                            }),
                        };
                    }),
                };
            };
            trpcUtils.comment.infiniteFeed.setInfiniteData({ articleId }, updater);
            trpcUtils.article.getArticleById.setData({ id: articleId }, (oldData) => {
                if (oldData == null) return;
                return { ...oldData, comments: [] };
            });
        },
    });
    function handleToggleUpVote() {
        toggleVote.mutate({ id, votedUp: true });
    }
    function handleToggleDownVote() {
        toggleVote.mutate({ id, votedUp: false });
    }
    return (
        <li className="flex flex-col  text-neutral-800 ">
            <div className="flex gap-6">
                <div>
                    <ProfileImage src={user.image || undefined} />
                </div>
                <div className="flex-col-1  gap-y-2 ">
                    <div className="flex gap-2  pb-2">
                        <div className=" text-base font-bold">{user.name}</div>
                        <div className=" text-base  text-gray-500">
                            {dateTimeFormater.format(createdAt)}
                        </div>
                    </div>
                    <div className="pb-2">{content}</div>
                    <div className="flex ">
                        <div className="">{sumVotes}</div>
                        <div className="flex items-center">
                            <div className="mx-2 h-4 w-px border-l"></div>
                            <button
                                name="upvote"
                                onClick={handleToggleUpVote}
                                disabled={toggleVote.isLoading}
                                className={
                                    upVotedByMe ?
                                        "rounded-full bg-orange-300" : ""
                                }
                            >
                                <Image src={upVoteIcon} alt="up vote icon" className=" " />
                            </button>
                            <div className="mx-2 h-4 w-px border-l"></div>

                            <button
                                name="downvote"
                                onClick={handleToggleDownVote}
                                disabled={toggleVote.isLoading}
                                className={
                                    downVotedByMe ?
                                        "rounded-full bg-orange-300" : ""
                                }
                            >
                                <Image src={downVoteIcon} alt="down vote icon" className="" />
                            </button>
                            <div className="mx-2 h-4 w-px border-l"></div>
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
}

export function ProfileImage({
    src,
    className,
}: {
    src?: string;
    className?: string;
}) {
    //todo:add better alt text => the name if the user
    return (
        <>
            <div className=" flex items-center justify-center ">
                {src == undefined ? (
                    <VscAccount
                        width={44}
                        height={44}
                        className={`h-full w-full ${className}`}
                    />
                ) : (
                    <Image
                        src={src}
                        className={`rounded-full ${className}`}
                        alt="profile image"
                        width={44}
                        height={44}
                    />
                )}
            </div>
        </>
    );
}
const pluralRules = new Intl.PluralRules();

function getPlural(number: number, singular: string, plural: string) {
    return pluralRules.select(number) === "one" ? singular : plural;
}

export const getStaticPaths: GetStaticPaths = () => {
    return {
        paths: [],
        fallback: "blocking",
    };
};

export async function getStaticProps(
    context: GetStaticPropsContext<{ id: string }>
) {
    const id = context.params?.id;
    if (id == null) {
        return {
            redirect: {
                destination: "/",
            },
        };
    }

    const ssg = ssgHelper();
    await ssg.article.getArticleById.prefetch({ id });
    return {
        props: {
            trpcState: ssg.dehydrate(),
            id,
        },
    };
}

export default ArticlePage;
