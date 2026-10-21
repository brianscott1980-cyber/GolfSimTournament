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

const aliases: Record<string, string> = {
  brian: "brian scott",
  john: "john colreavey",
  derek: "derek mcmillan",
  tony: "tony mclean",
};

export default function PlayerAvatar({
  name,
  className = "",
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const normalizedKey = name.trim().toLowerCase();
  const resolvedKey = aliases[normalizedKey] || normalizedKey;
  const portrait = portraits[resolvedKey];
  const displayName =
    resolvedKey !== normalizedKey
      ? resolvedKey
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ")
      : name;
  const initials = displayName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <span
      className={`avatar ${portrait ? `avatar-photo ${portrait.crop}` : ""} ${className}`}
      style={
        size
          ? {
              width: size,
              height: size,
              minWidth: size,
              minHeight: size,
              fontSize: `${Math.round(size * 0.42)}px`,
            }
          : undefined
      }
      title={displayName}
      role="img"
      aria-label={displayName}
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
