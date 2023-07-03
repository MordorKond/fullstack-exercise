import "@uploadthing/react/styles.css";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { NavBar } from "~/components/NavBar";
import { api } from "~/utils/api";
import { useRouter } from "next/router";
import type { ChangeEvent } from "react"
import type { NextPage } from "next";
import axios from "axios";

const CreateArticle: NextPage = () => {
    return (<>
        <ArticleEditor />
    </>
    );
};

export function TitleAndAction({
    title,
    action,
}: {
    title: string;
    action: string;
}) {
    return (
        <div className="mt-12 flex items-center gap-8 border">
            <h1 className=" border text-5xl">{title}</h1>
            <button id='action' className="h-9 rounded bg-blue-600 px-3 text-white">
                {action}
            </button>
        </div>
    );
}
type ArticleEditorProps = {
    isNew?: boolean;
    title?: string;
    imageId?: string;
    content?: string;
    id?: string;
};
export function ArticleEditor({
    isNew = true,
    title = "",
    imageId = "",
    content = "",
    id,
}: ArticleEditorProps) {
    //hooks
    useEffect(() => {
        createPresignedGetUrls.mutate({ keys: [imageId] })
        console.log('this is useEffect creating a get img url', articleImageSrc);

    }, [])
    const [formData, setFormData] = useState({
        title: title,
        imageId: imageId,
        content: content,
    });
    const [hasImage, setHasImage] = useState(!isNew)

    const createPresignedDeleteUrls = api.article.createPresignedUrlsDelete.useMutation({
        onSuccess(data) {
            console.log(data)
        },
    })

    const createPresignedGetUrls = api.article.createPresignedUrlsGet.useMutation({
        onSuccess(data) {
            console.log('list of presigned get urls recieved', data)
            if (!(data && data[0] && data[0].key)) return
            setArticleImageSrc(data[0].url)
            console.log('setting the image key in the form')
            setHasImage(true)
            setFormData((prevFormData) => {
                if (!(data[0] && data[0].key)) return { ...prevFormData }
                return {
                    ...prevFormData,
                    imageId: data[0].key,
                }
            });
        },
    })

    const createPresignedPutUrls = api.article.createPresignedUrlsPut.useMutation({
        async onSuccess(data) {
            console.log('list of presigned put urls recieved', data)
            if (!(testInputRef.current && testInputRef.current.files && testInputRef.current.files[0])) return
            const testFile = testInputRef.current.files[0]
            if (!testFile) return
            console.log('putUrls set', data)
            if (!(data && data[0])) return console.log('something is null or undefined', data, data[0])
            console.log('shooting a req to upload imgae')
            await axios.put(data[0].url, testFile, {
                headers: {
                    'Content-Type': 'image/jpeg',
                },
            })
            console.log('about to shoot request for get obj urls')
            await createPresignedGetUrls.mutateAsync({ keys: data.map(x => x.key) })
            console.log('about to shoot request for get obj urls')
            console.log('submititng form');
        },
    })
    const [articleImageSrc, setArticleImageSrc] = useState<string>('')
    const router = useRouter();


    const handleInputChange = (
        event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };

    const createArticle = api.article.create.useMutation({
        async onSuccess() {
            console.log("article created");
            setFormData({
                title: "",
                imageId: "",
                content: "",
            });
            await router.push("/blog");
        },
    });

    const updateArticle = api.article.update.useMutation({
        async onSuccess() {
            console.log("article updated");
            setFormData({
                title: "",
                imageId: "",
                content: "",
            });
            await router.push('/MyArticles')
        },
    });

    const testInputRef = useRef<HTMLInputElement>(null)
    const triggerHiddenInputFileElement = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        testInputRef.current && testInputRef.current.click()
    }

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        console.log(formData)
        if (formData.imageId.length > 0) {
            console.log('testing the hadnle delete condition', (!(formData.imageId.length > 0)));

            const response = await createPresignedDeleteUrls.mutateAsync({ keys: [formData.imageId] })
            if (response.Errors) return console.error('could not delete previous image', response.Errors);
        }
        console.log('files to be send', e.target.files)
        if (!(e.target.files && e.target.files[0])) return
        createPresignedPutUrls.mutate({ count: 1 })
    }

    const handleDeleteImage = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        console.log('start delete function');
        const response = await createPresignedDeleteUrls.mutateAsync({ keys: [formData.imageId] })
        if (response.Errors) return console.error('could not delete the  image', response.Errors);
        setHasImage(false)
        setFormData((prevFormData) => {
            return {
                ...prevFormData,
                imageId: '',
            }
        });
    }
    const [md, setMd] = useState('hi')
    const handleMD = (e: ChangeEvent<HTMLTextAreaElement>) => {
        e.preventDefault()
        const text = e.target.value
        if (text.length > 0) return setMd(text)
        setMd(' ')

    }
    return (
        <>
            <NavBar />
            <div className="max-w-4xl">
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        isNew
                            ? createArticle.mutate({ ...formData })
                            : id == undefined
                                ? null
                                : updateArticle.mutate({ ...formData, id });
                    }}
                >
                    <TitleAndAction
                        title={isNew ? "Create new article" : "Edit article"}
                        action={"Publish Article"}
                    />
                    <div className="mt-8 ">Article Title</div>
                    <input
                        placeholder="My First Article"
                        type="text"
                        name="title"
                        id="title"
                        value={formData.title}
                        className="mt-2 w-full rounded border px-4 py-2 text-xl"
                        onChange={handleInputChange}
                    />

                    <div className="mt-8 border">Featured image</div>
                    <input type="file" accept="image/*"
                        ref={testInputRef}
                        hidden
                        name='upload file'
                        onClick={() => { console.log('brawsing for image') }}
                        onChange={(e) => { handleFileChange(e).catch(err => console.error(err)) }}
                    />
                    {hasImage ? (
                        <>
                            <Image src={articleImageSrc} width={112} height={74} alt="article image" />
                            <div className="flex gap-2 mt-2 items-center">
                                <button className='text-blue-600'
                                    id='change-image'
                                    type='button'
                                    name='browse'
                                    onClick={(e) => { console.log('trigger hidden input file element'); triggerHiddenInputFileElement(e) }}
                                >Upload new </button>
                                <div className="border-stone-300 border-l w-px h-4" />
                                <button className='text-red-500'
                                    onClick={(e) => { handleDeleteImage(e).catch(err => console.error(err)) }}
                                >Delete</button>
                            </div>
                        </>) : (

                        <button
                            id='upload-image'
                            className="mt-2 h-9 rounded bg-gray-500 px-3 text-white"
                            onClick={(e) => { console.log('trigger hidden input file element'); triggerHiddenInputFileElement(e) }}
                        >
                            Upload an Image
                        </button>)
                    }
                    <div className="">
                    </div>
                    <div className="mt-10 border">Content</div>
                    <textarea

                        placeholder="Supports markdown. Yay!"
                        name="content"
                        id="contnet"
                        value={formData.content}
                        className="gray-500 mb-36 mt-2 h-screen w-full resize-none rounded border px-4 py-2 text-xl"
                        onChange={handleInputChange}
                    ></textarea>
                </form>
            </div>
        </>
    );
}
export default CreateArticle;
