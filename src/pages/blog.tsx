import type { NextPage } from "next";
import { NavBar } from "~/components/NavBar";
import { ArticleCardList } from "~/components/ArticleCard";

const Blog: NextPage = () => {

    return (
        <>
            <NavBar />
            <h1 className="mt-16 border text-5xl">Recent articles</h1>
            <ArticleCardList />
        </>
    );
};

export default Blog;
