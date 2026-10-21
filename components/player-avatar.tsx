import Image from "next/image";

const portraits: Record<
  string,
  { src: string; width: number; height: number; crop: string }
> = {
  "brian scott": {
    src: "/images/players/brian-scott.png",
    width: 644,
    height: 622,
    crop: "avatar-photo-brian",
  },
  "derek mcmillan": {
    src: "/images/players/derek-mcmillan.png",
    width: 366,
    height: 384,
    crop: "avatar-photo-derek",
  },
  "tony mclean": {
    src: "/images/players/tony-mclean.png",
    width: 384,
    height: 380,
    crop: "avatar-photo-tony",
  },
  "john colreavey": {
    src: "/images/players/john-colreavey.png",
    width: 1060,
    height: 1162,
    crop: "avatar-photo-john",
  },
};

export default function PlayerAvatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const portrait = portraits[name.trim().toLowerCase()];
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <span
      className={`avatar ${portrait ? `avatar-photo ${portrait.crop}` : ""} ${className}`}
      title={name}
      role="img"
      aria-label={name}
    >
      {portrait ? (
        <Image
          src={portrait.src}
          alt=""
          width={portrait.width}
          height={portrait.height}
          sizes="140px"
        />
      ) : (
        initials
      )}
    </span>
  );
}
