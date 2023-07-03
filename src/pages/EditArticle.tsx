// You need to import our styles for the button to look right. Best to import in the root /_app.tsx but this is fine
import "@uploadthing/react/styles.css";

import { ChangeEvent, useEffect, useRef, useState } from "react";

import Image from "next/image";
import { NavBar } from "~/components/NavBar";
import { NextPage } from "next";
import type { OurFileRouter } from "~/server/uploadthing";
import { UploadButton } from "@uploadthing/react";
import UploadImageToS3WithNativeSdk from "~/components/UploadImageToS3WithNativeSdk";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

const EditArticle: NextPage = () => {
  const session = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    content: "",
  });
  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    inputRef.current && inputRef.current.click();
  };

  const handleFileSelect = (file: File) => {
    // Process the file in the parent component
    console.log(file);
  };
  //   if (session.status !== "authenticated") return null;

  const createArticle = api.article.create.useMutation({
    onSuccess(data, variables, context) {
      console.log("article created");
      setFormData({
        title: "",
        image: "",
        content: "",
      });
    },
  });
  return (
    <>
      <NavBar />
      <div className="max-w-4xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createArticle.mutate({
              title: formData.title,
              image: formData.image,
              content: formData.content,
            });
            console.log(formData);
          }}
        >
          <TitleAndAction
            title={"Create new article"}
            action={"Publish Article"}
          />
          <div className="mt-8 border ">Article Title</div>
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
          <input
            type="file"
            name="image"
            id="file"
            value={formData.image}
            style={{ display: "none" }}
            onChange={handleInputChange}
            ref={inputRef}
          />
          <button
            className="mt-2 h-9 rounded bg-gray-500 px-3 text-white"
            onClick={handleButtonClick}
          >
            Upload an Image
          </button>
          <UploadButton<OurFileRouter>
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              // Do something with the response
              console.log("Files: ", res);
              setImgSrc(res[0]!.fileUrl);
              // alert("Upload Completed");
            }}
            onUploadError={(error: Error) => {
              // Do something with the error.
              alert(`ERROR! ${error.message}`);
            }}
          />
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
      <button className="h-9 rounded bg-blue-600 px-3 text-white">
        {action}
      </button>
    </div>
  );
}

export default EditArticle;
