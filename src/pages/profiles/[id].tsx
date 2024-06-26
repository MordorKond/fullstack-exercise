import type {
  GetStaticPaths,
  GetStaticPropsContext,
  InferGetStaticPropsType,
  NextPage,
} from "next";

import { Button } from "~/components/Button";
import ErrorPage from "next/error";
import Head from "next/head";
import { IconHoverEffect } from "~/components/IconHoverEffect";
import { InfiniteTweetList } from "~/components/InfiniteTweetList";
import Link from "next/link";
import { ProfileImage } from "~/components/ProfileImage";
import { VscArrowLeft } from "react-icons/vsc";
import { api } from "~/utils/api";
import { ssgHelper } from "~/server/api/ssgHelper";
import { useContext } from "react";
import { useSession } from "next-auth/react";

const ProfilePage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  id,
}) => {
  const { data: profile } = api.profile.getById.useQuery({ id });
  const tweets = api.tweet.infiniteProfileFeed.useInfiniteQuery(
    { userId: id },
    { getNextPageParam: (lastPage) => lastPage.nextCursor }
  );
  if (profile == null || profile.name == null) {
    return <ErrorPage statusCode={404} />;
  }
  const trpcUtils = api.useContext();
  const toggleFollow = api.profile.toggleFollow.useMutation({
    onSuccess({ addedFollow }, variables, context) {
      trpcUtils.profile.getById.setData({ id }, (oldData) => {
        if (oldData == null) return;
        const countModifier = addedFollow ? 1 : -1;
        return {
          ...oldData,
          isFollowing: addedFollow,
          followersCount: oldData.followersCount + countModifier,
        };
      });
    },
  });

  return (
    <>
      <Head>
        <title>{`Twitter Clone - ${profile.name}`}</title>
      </Head>
      <header className="flex items-center border-b px-4 py-2">
        <Link href={".."} className="mr-2 ">
          <IconHoverEffect>
            <VscArrowLeft className="h-6 w-6 " />
          </IconHoverEffect>
        </Link>
        <ProfileImage src={profile.image} className="" />
        <div className="ml-2 flex-grow ">
          <h1 className=" text-lg font-bold">{profile.name}</h1>
          <div className="text-gray-500">
            {profile.tweetsCount}
            {getPlural(profile.tweetsCount, " Tweet", " Tweets")}{" "}
            {profile.followersCount}
            {getPlural(profile.followersCount, " Follower", " Followers")}{" "}
            {profile.followsCount} Following
          </div>
        </div>
        <FollowButton
          isFollowing={profile.isFollowing}
          isLoading={toggleFollow.isLoading}
          userId={id}
          onClick={() => toggleFollow.mutate({ userId: id })}
        />
      </header>
      <main>
        <InfiniteTweetList
          tweets={tweets.data?.pages.flatMap((page) => page.tweets)}
          isError={tweets.isError}
          isLoading={tweets.isLoading}
          hasMore={tweets.hasNextPage}
          fetchNewTweets={tweets.fetchNextPage}
        />
      </main>
    </>
  );
};

type FollowButtonProps = {
  isFollowing: boolean;
  isLoading: boolean;
  userId: string;
  onClick: () => void;
};
function FollowButton({
  isFollowing,
  isLoading,
  userId,
  onClick,
}: FollowButtonProps) {
  const session = useSession();

  if (session.status !== "authenticated") return null;

  if (session.data.user.id === userId) return null;

  return (
    <Button disabled={isLoading} onClick={onClick} small gray={isFollowing}>
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
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
  await ssg.profile.getById.prefetch({ id });
  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
}

export default ProfilePage;
