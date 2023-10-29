import type { NextPage } from "next";
import { NavBar } from "~/components/NavBar";
import { TitleAndAction } from "./CreateArticle";
import { api } from "~/utils/api";
import orderIcon from "images/Union.svg";
import Image from "next/image";
import trashImg from "images/trash.svg";
import penImg from "images/pen.svg";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "~/components/Button";
import { log } from "console";

const MyArticles: NextPage = () => {
    return (
        <>
            <div className=""></div>
            <NavBar />
            <TitleAndAction title={"My articles"} action={"Create new article"} />
            <ArticlesTable />
        </>
    );
};



type Article = {
    id: string;
    title: string;
    perex: string;
    user: {
        name: string | null;
    };
    _count: {
        comments: number;
    };
    createdAt: Date;
}
// interface FilterValues {
//     title?: "asc" | "desc";
//     author?: "asc" | "desc";
//     createdAt?: "asc" | "desc";
//     comments?: "asc" | "desc";
//     perex: string;
//     // perex?: "asc" | "desc";
// }
// type Filter  = 'title' | 'perex' | 'author' | 'createdAt' | 'comments';
// type Filter = { [k in 'title'? | 'perex' | 'author' | 'createdAt' | 'comments']: 'asc' | 'desc' }
type FilterKeys = 'title' | 'perex' | 'author' | 'createdAt' | 'comments';
type FilterVals = 'asc' | 'desc';
type Filter = Partial<Record<FilterKeys, FilterVals>>;

function ArticlesTable() {
    const trpcUtils = api.useContext();
    const [order, setOrder] = useState<FilterVals>("desc");
    let [articles, setArticles] = useState<Article[]>([]);
    const [filter, setFilter] = useState<Filter>({ createdAt: order });
    let { data, error } = api.article.getProfileArticles.useQuery({
        userId: "",
        orderBy: filter,
    })
    if (data) articles = data;
    // useEffect(() => {
    //     console.log('data is changing');
    //
    //     data &&
    //         setArticles(data)
    // }, [data])

    const deleteArticles = api.article.deleteMany.useMutation({
        onSuccess: () => {
            //todo Optimise the invalidation
            const updater = trpcUtils.article.invalidate();
            setSelected([]);
        },
    });
    const deleteArticle = api.article.delete.useMutation({
        onSuccess: () => {
            //todo Optimise the invalidation
            const updater = trpcUtils.article.invalidate();
        },
    });
    const [selected, setSelected] = useState<string[]>([]);

    function handleCheckboxChange(id: string): void {
        setSelected((prevSelected) => {
            if (prevSelected.includes(id)) {
                return prevSelected.filter(s => s !== id);
            }
            return [...prevSelected, id];
        })
    }


    function handleFilter(f: Filter): void {
        console.log("f: ", f);
        console.log("filter: ", filter);

        if (Object.keys(filter)[0] === Object.keys(f)[0]) {
            setFilter((prevFilter) => {

                const key = Object.keys(prevFilter)[0] as FilterKeys | undefined;

                if (key) {
                    console.log('from: ', prevFilter[key])
                    const nVal = prevFilter[key] === 'asc' ? 'desc' : 'asc'
                    prevFilter[key] = nVal;
                    console.log('to: ', prevFilter[key])
                }

                return prevFilter

            })
        } else {
            setFilter(f);
        }


    }
    return (
        <>
            <div className="h-4">
                <Button gray small className="mt-6 self-end"
                    hidden={(selected.length === 0)}
                    onClick={() =>
                        void deleteArticles.mutate({ articleIds: selected })
                    }
                >Delete Selected</Button>
            </div>
            <table className="mt-9 w-full ">
                <thead>
                    <tr className="border-b-2 gap-4 ">
                        <th className="">
                            <input type="checkbox" onChange={(e) => {
                                if (!e.target.checked)
                                    return setSelected([]);
                                setSelected(articles.map(a => a.id));
                            }} />
                        </th>
                        <th className=" w-64 p-3 text-start">
                            <HeaderWrap fn={() => handleFilter({ title: "asc" })}>Article title</HeaderWrap>
                        </th>
                        <th className="max-w-md p-3 text-start">
                            <HeaderWrap fn={() => handleFilter({ perex: "asc" })}>Perex</HeaderWrap>
                        </th>
                        <th className=" w-40 p-3 text-start">
                            <HeaderWrap fn={() => handleFilter({ author: order })}>Author</HeaderWrap>
                        </th>
                        <th className=" w-40 p-3 text-start">
                            <HeaderWrap fn={() => handleFilter({ comments: order })}># of comments</HeaderWrap>
                        </th>
                        <th className=" w-28 p-3 text-start mr-4">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {articles.map((x) => {

                        return (
                            <tr key={x.id} className="-2 -b">
                                <td className="">
                                    <input className='m-3' type="checkbox"
                                        checked={selected.includes(x.id)}
                                        onChange={() => {
                                            handleCheckboxChange(x.id)
                                        }} />
                                </td>
                                <TdWrap className='w-64'>{x.title}</TdWrap>
                                <TdWrap className='max-w-md'>{x.perex}</TdWrap>
                                <TdWrap className='w-40 '>{x.user.name}</TdWrap>
                                <TdWrap className='w-40'>{x._count.comments}</TdWrap>
                                <td className="border-b">
                                    <div className="flex items-center gap-3 px-3">
                                        <Link href={`/Edit/${x.id}`}>
                                            <Image id="eddit" className="m-2 " src={penImg} alt="eddit icon" />
                                        </Link>
                                        <button
                                            id='delete'
                                            onClick={() =>
                                                void deleteArticle.mutate({ articleId: x.id })
                                            }
                                        >
                                            <Image className="m-2 " src={trashImg} alt="trash icon" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </>
    );
}

interface WrapProps {
    children: ReactNode;
    fn?: () => void;
}
const HeaderWrap: React.FC<WrapProps> = ({
    children, fn = () => console.log("filter: ", children)
}) => {
    return (
        <div className="flex gap-2" onClick={fn}>

            {children}
            <Image src={orderIcon} alt="order by icon" />
        </div>
    );
};
interface WrapProps2 {
    children: ReactNode;
    className?: string;
}

const TdWrap: React.FC<WrapProps2> = ({ children, className }) => {
    return (
        <td className={`p-3 overflow-hidden text-ellipsis whitespace-nowrap border-b ${className}`}>{
            children
        }</td>
    );
};
export default MyArticles;

