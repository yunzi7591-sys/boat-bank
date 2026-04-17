type A8BannerProps = {
  href: string;
  imgSrc: string;
  pixelSrc: string;
  width: number;
  height: number;
};

export function A8Banner({ href, imgSrc, pixelSrc, width, height }: A8BannerProps) {
  return (
    <div className="mt-6 px-4 flex flex-col items-center">
      <span className="text-[9px] text-slate-400 mb-1">広告</span>
      <a
        href={href}
        rel="nofollow sponsored noopener"
        target="_blank"
        className="block w-full"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={width}
          height={height}
          alt=""
          src={imgSrc}
          className="rounded-lg block w-full h-auto"
          style={{ aspectRatio: `${width} / ${Math.round(height * 1.3)}` }}
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

export const A8_BANNER_BOTTOM = {
  href: "https://px.a8.net/svt/ejp?a8mat=4B1N9Q+AVR8TU+4J34+60H7L",
  imgSrc: "https://www23.a8.net/svt/bgt?aid=260417294658&wid=001&eno=01&mid=s00000021136001010000&mc=1",
  pixelSrc: "https://www19.a8.net/0.gif?a8mat=4B1N9Q+AVR8TU+4J34+60H7L",
  width: 320,
  height: 50,
} as const;

export const A8_BANNER_MIDDLE = {
  href: "https://px.a8.net/svt/ejp?a8mat=4B1N9Q+7MGUNM+4EKC+631SX",
  imgSrc: "https://www28.a8.net/svt/bgt?aid=260417294461&wid=001&eno=01&mid=s00000020550001022000&mc=1",
  pixelSrc: "https://www16.a8.net/0.gif?a8mat=4B1N9Q+7MGUNM+4EKC+631SX",
  width: 600,
  height: 100,
} as const;
