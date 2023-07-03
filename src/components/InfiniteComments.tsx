import InfiniteScroll from "react-infinite-scroll-component";
import { ProfileImage } from "./ProfileImage";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { VscHeart, VscHeartFilled } from "react-icons/vsc";
import { IconHoverEffect } from "./IconHoverEffect";
import { api } from "~/utils/api";
import { LoadingSpinner } from "./LoadingSpinner";

type Comment = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
  user: { id: string; image: string | null; name: string | null };
};
type InfiniteListPropps = {
  comments?: Comment[];
  isError: boolean;
  isLoading: boolean;
  hasMore: boolean | undefined;
  fetchNewComments: () => Promise<unknown>;
};
export function InfiniteCommentList({
  comments,
  isError,
  isLoading,
  fetchNewComments,
  hasMore = false,
}: InfiniteListPropps) {
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
const dateTimeFormater = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});
function CommentCard({
  id,
  content,
  createdAt,
  likeCount,
  likedByMe,
  user,
}: Comment) {
  const trpcUtils = api.useContext();
  const toggleLike = api.comment.toggleLike.useMutation({
    onSuccess: ({ addedLike }) => {
      const updater: Parameters<
        typeof trpcUtils.comment.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;
        const countModifier = addedLike ? 1 : -1;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              comments: page.comments.map((comment) => {
                if (comment.id === id) {
                  return {
                    ...comment,
                    likeCount: comment.likeCount + countModifier,
                    likedByMe: addedLike,
                  };
                }
                return comment;
              }),
            };
          }),
        };
      };
      trpcUtils.comment.infiniteFeed.setInfiniteData({}, updater);
      trpcUtils.comment.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updater
      );
      trpcUtils.comment.infiniteProfileFeed.setInfiniteData(
        { userId: user.id },
        updater
      );
    },
  });
  function handleToggleLike() {
    toggleLike.mutate({ id });
  }
  return (
    <li className="flex gap-2 border-b p-4">
      <Link href={`/profiles/${user.id}`}>
        <ProfileImage src={user.image} />
      </Link>

      <div className="flex flex-grow flex-col">
        <div className="flex gap-1">
          <Link
            href={`/profiles/${user.id}`}
            className="font-bold hover:underline focus-visible:underline"
          >
            {user.name}
          </Link>
          <span className="text-gray-500">-</span>
          <span className="text-gray-500">
            {dateTimeFormater.format(createdAt)}
          </span>
        </div>
        <p className="whitespace-pre-wrap">{content}</p>
        <HeartButton
          onClick={handleToggleLike}
          isLoading={toggleLike.isLoading}
          likeCount={likeCount}
          likedByMe={likedByMe}
        />
      </div>
    </li>
  );
}
type HeartButtonProps = {
  isLoading: boolean;
  likedByMe: boolean;
  likeCount: number;
  onClick: () => void;
};
function HeartButton({
  isLoading,
  onClick,
  likedByMe,
  likeCount,
}: HeartButtonProps) {
  const session = useSession();
  console.log(likedByMe);

  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;
  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <HeartIcon />
        <span>0</span>
      </div>
    );
  }
  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        likedByMe
          ? "text-red-500"
          : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
      }`}
    >
      <IconHoverEffect red>
        <HeartIcon
          className={`transition-colors duration-200 ${
            likedByMe
              ? "fill-red-500"
              : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"
          }`}
        />
      </IconHoverEffect>
      <span>{likeCount}</span>
    </button>
  );
}
