import type {
    GetStaticPaths,
    GetStaticPropsContext,
    InferGetStaticPropsType,
    NextPage,
} from "next";

import { ArticleEditor } from "../CreateArticle";
import ErrorPage from "next/error";
import Head from "next/head";
import { api } from "~/utils/api";
import { ssgHelper } from "~/server/api/ssgHelper";

const EditPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
    id,
}) => {
    console.log(id);

    const { data: article } = api.article.getArticleById.useQuery({ id });

    if (article == null || article.title == null) {
        return <ErrorPage statusCode={404} />;
    }

    return (
        <>
            <Head>
                <title>{`Edit - ${article.title}`}</title>
            </Head>
            <ArticleEditor
                isNew={false}
                title={article.title}
                content={article.content}
                imageId={article.imageId}
                id={id}
            />
        </>
    );
};

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

export default EditPage;
