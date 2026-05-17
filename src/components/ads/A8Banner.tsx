"use client";

import { isIOS } from "@/lib/platform";

type A8BannerProps = {
  href: string;
  imgSrc: string;
  pixelSrc: string;
  width: number;
  height: number;
  iosSafe?: boolean;
};

export function A8Banner({ href, imgSrc, pixelSrc, width, height, iosSafe }: A8BannerProps) {
  if (isIOS() && !iosSafe) return null;

  return (
    <div className="mt-6 px-4 flex flex-col items-center">
      <span className="text-[9px] text-slate-400 mb-1">広告</span>
      <a
        href={href}
        rel="nofollow sponsored noopener"
        target="_blank"
        className="block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={width}
          height={height}
          alt=""
          src={imgSrc}
          className="rounded-lg block max-w-full h-auto"
          style={{ width, maxWidth: "100%" }}
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        width={1}
        height={1}
        src={pixelSrc}
        alt=""
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
}

