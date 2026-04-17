export function A8Banner() {
  return (
    <div className="mt-6 px-4 flex flex-col items-center">
      <span className="text-[9px] text-slate-400 mb-1">広告</span>
      <a
        href="https://px.a8.net/svt/ejp?a8mat=4B1N9Q+AVR8TU+4J34+60H7L"
        rel="nofollow sponsored noopener"
        target="_blank"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width={320}
          height={50}
          alt=""
          src="https://www23.a8.net/svt/bgt?aid=260417294658&wid=001&eno=01&mid=s00000021136001010000&mc=1"
          className="rounded-lg block"
          style={{ width: "320px", height: "50px", maxWidth: "none" }}
        />
      </a>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        width={1}
        height={1}
        src="https://www19.a8.net/0.gif?a8mat=4B1N9Q+AVR8TU+4J34+60H7L"
        alt=""
        style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
