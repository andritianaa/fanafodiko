import { createContext, useContext, useEffect, useState } from "react";

export type FontSize = "sm" | "md" | "lg";

export const FONT_SIZE_OPTIONS: {
  value: FontSize;
  label: string;
  htmlPx: string;
  iconSize: number;
}[] = [
  { value: "sm", label: "Petite", htmlPx: "14px", iconSize: 20 },
  { value: "md", label: "Moyenne", htmlPx: "16px", iconSize: 24 },
  { value: "lg", label: "Grande", htmlPx: "18px", iconSize: 28 },
];

interface FontSizeContextValue {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  iconSize: number;
}

const FontSizeContext = createContext<FontSizeContextValue>({
  fontSize: "md",
  setFontSize: () => {},
  iconSize: 20,
});

export const FontSizeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem("fontSize") as FontSize) ?? "md";
  });

  useEffect(() => {
    const opt = FONT_SIZE_OPTIONS.find((o) => o.value === fontSize);
    if (opt) document.documentElement.style.fontSize = opt.htmlPx;
  }, [fontSize]);

  const setFontSize = (size: FontSize) => {
    const opt = FONT_SIZE_OPTIONS.find((o) => o.value === size);
    localStorage.setItem("fontSize", size);
    setFontSizeState(size);
    if (opt) document.documentElement.style.fontSize = opt.htmlPx;
  };

  const iconSize =
    FONT_SIZE_OPTIONS.find((o) => o.value === fontSize)?.iconSize ?? 20;

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize, iconSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};

export const useFontSize = () => useContext(FontSizeContext);
