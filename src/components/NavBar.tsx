import { signIn, useSession } from "next-auth/react";

import Image from "next/image";
import Link from "next/link";
import { ProfileImage } from "~/pages/articles/[id]";
import React from "react";
import arrowSrc from "../../images/Arrow.svg";
import logoSrc from "../../images/logo.svg";
import arrowStepper from "../../images/arrow-stepper.svg";

export function NavBar() {
    const session = useSession();
    return (
        <header className="sticky top-0 flex  bg-gray-100 z-10 ">
            <Image
                className="mb-2 mt-1"
                width={39}
                src={logoSrc}
                alt={"website logo"}
            />
            <div className="mb-4 ml-10 mt-3 flex ">
                <Link href="/blog">
                    <div id="recent-articles" className=" text-neutral-800">Recent Articles</div>
                </Link>
                <Link href="/blog/about" className="ml-10">
                    <div id="about" className=" text-gray-500">About</div>
                </Link>
            </div>
            {session.status == "authenticated" ? (
                <div className="cente flex flex-grow justify-end  -blue-500">
                    <div className=" flex flex-row items-center gap-10 ">
                        <Link href={"/MyArticles/"}>
                            <div id="my-articles">My Articles</div>
                        </Link>
                        <Link href={"/CreateArticle/"}>
                            <div id="create-article" className="text-blue-600">Create Article</div>
                        </Link>
                        <div className="flex">
                            <Image src={arrowStepper} alt='arrow stepper' />
                            <ProfileImage src={session.data.user.image || undefined} className="w-8" />
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => void signIn()}
                    className=" flex flex-grow justify-end"
                >
                    <div className=" mb-4 mt-4  text-blue-500">Log in</div>
                    <Image
                        src={arrowSrc}
                        alt="arrow right"
                        className="mb-4 ml-1 mt-4  text-blue-500"
                    />
                </button>
            )}
        </header>
    );
}
