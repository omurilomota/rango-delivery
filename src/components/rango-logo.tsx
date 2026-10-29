type RangoLogoProps = {
  inverse?: boolean;
  size?: number;
  showWordmark?: boolean;
  compact?: boolean;
};

export const RANGO_MARK_PATH =
  "M10 8h4v14h-4zM15 8h4v14h-4zM20 8h4v14h-4zM10 22h14v36H10zM24 14h10a12 12 0 0 1 0 24H24zM31 20h3a6 6 0 0 0 0 12h-3zM32 34 48 58H34L24 42z";

export function RangoMark({
  size = 40,
  ink = "#173f32",
  accent = "#f1c85b",
  title = "Rango",
}: {
  size?: number;
  ink?: string;
  accent?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="64" height="64" rx="17" fill={ink} />
      <path d={RANGO_MARK_PATH} fill={accent} fillRule="nonzero" />
    </svg>
  );
}

export function RangoLogo({ inverse = false, size = 40, showWordmark = true }: RangoLogoProps) {
  const ink = inverse ? "#f1c85b" : "#173f32";
  const accent = inverse ? "#173f32" : "#f1c85b";
  const wordColor = inverse ? "#fffdf8" : "#17352b";

  return (
    <span className="flex items-center gap-2.5">
      <RangoMark size={size} ink={ink} accent={accent} />
      {showWordmark && (
        <span className="leading-none">
          <span
            className="display-font block font-bold"
            style={{ color: wordColor, fontSize: Math.round(size * 0.68), letterSpacing: "-0.04em" }}
          >
            Rango
          </span>
          {!inverse && (
            <span
              className="mt-1 hidden font-bold uppercase sm:block"
              style={{ color: "#87978f", fontSize: Math.max(8, Math.round(size * 0.2)), letterSpacing: "0.16em" }}
            >
              Restaurante
            </span>
          )}
        </span>
      )}
    </span>
  );
}
