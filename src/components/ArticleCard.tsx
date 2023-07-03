import Image from "next/image";
import Link from "next/link";
import { api } from "~/utils/api";
import catSrc from "images/cat1.svg";
import circleSrc from "images/circle.svg";

//todo:how to get a link to the image and remove the nasty type
export type ArticleCardProps = {
    id: string;
    imageUrl: string;
    title: string;
    author: string;
    date: Date;
    description: string;
    commentsCount: number;
    fullText?: string;
};
export function ArticleCard(article: ArticleCardProps) {
    //todo text title and description verticle size control
    //? note the numebr of charactes in the description
    //? we might have to use a hook for that ....
    //todo font family halvetica neu
    //todo ?
    const dateTimeFormater = new Intl.DateTimeFormat(undefined, {
        dateStyle: "short",
    });
    return (
        <div className="flex border">
            <Image
                objectFit="cover"
                width={272}
                height={244}
                src={article.imageUrl}
                alt="face of a cat"
                className="object-cover"
            />
            <div className="ml-6 max-w-xl flex-grow border">
                <h4 className="border  text-2xl font-medium">{article.title}</h4>
                <div className="flex border py-4 text-sm text-gray-500">
                    <div className="t border">{article.author}</div>
                    <Image src={circleSrc} alt="circle" className="mx-3" />
                    <div className="t border">
                        {dateTimeFormater.format(article.date)}
                    </div>
                </div>
                <div className="t border text-base">{article.description}</div>
                <div className="mt-5 flex gap-5 border">
                    <Link href={`./articles/${article.id}`}>
                        <button className=" border pl-1 text-sm text-blue-600">
                            Read whole article
                        </button>
                    </Link>
                    <div className="t border">
                        {article.commentsCount}
                        {getPlural(article.commentsCount, " comment", " comments")}{" "}
                    </div>
                </div>
            </div>
        </div>
    );
}
const pluralRules = new Intl.PluralRules();
function getPlural(number: number, singular: string, plural: string) {
    return pluralRules.select(number) === "one" ? singular : plural;
}

export function ArticleCardList() {
    // const trpcUtils = api.useContext()
    // const articles = api.article.getArticles.useQuery();
    const { data, isLoading } = api.article.getArticles.useQuery();
    const articles = { data }
    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (articles.data == undefined) return null;

    return (
        <ul className="mt-16 flex flex-col gap-8">
            {articles.data.map((article) => (
                <ArticleCard
                    key={article.id}
                    id={article.id}
                    // todo add image
                    imageUrl={article.imageUrl}
                    title={article.title}
                    date={article.createdAt}
                    // todo name can never be null
                    // ! should the article be removed if the user name is null
                    author={article.user.name ? article.user.name : ""}
                    description={article.perex}
                    // todo implement direct comment count
                    commentsCount={article._count.comments}
                />
            ))}
        </ul>
    );
}
