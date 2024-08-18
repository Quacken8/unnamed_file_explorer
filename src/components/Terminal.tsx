import { useCallback, useEffect, useRef, useState } from "react";
import { readTty, writeTty } from "../bindings";
import { useInterval } from "../hooks";

const moveCursorToEnd = (target: HTMLElement) => {
  const range = document.createRange();
  range.selectNodeContents(target);
  range.collapse(false);
  window.getSelection()?.removeAllRanges();
  window.getSelection()!.addRange(range);
};

function Terminal() {
  const [text, setText] = useState("");
  const ref = useRef<HTMLPreElement>(null);

  useInterval(100, async () => {
    const { bytes } = await readTty();
    if (bytes.length === 0) return;
    console.log(bytes);

    let modifText = text;
    for (const b of bytes) {
      const ch = String.fromCharCode(b);
      switch (ch) {
        case "\b":
          modifText = modifText.substring(0, modifText.length - 1);
          break;
        default:
          modifText += ch;
      }
    }
    setText(modifText);
  });

  useEffect(() => {
    ref.current!.textContent = text;
    moveCursorToEnd(ref.current!);
  }, [text]);

  const onInput = useCallback((e: InputEvent) => {
    const { data, inputType } = e;
    switch (inputType) {
      case "insertText":
        console.log(data);
        writeTty({ bytes: [...data!].map((ch) => ch.charCodeAt(0)) });
        break;
      case "insertLineBreak":
        writeTty({ bytes: [10] });
        break;
      case "deleteContentBackward":
        writeTty({ bytes: [127] });
        break;
      default:
        console.log("unknown key", data, e);
    }

    moveCursorToEnd(e.target as HTMLElement);
    e.preventDefault();
  }, []);

  useEffect(() => {
    const target = ref.current;
    const callback = onInput;
    if (!target) return;
    target.addEventListener("beforeinput", callback);
    return () => target.removeEventListener("beforeinput", callback);
  }, [onInput, ref.current]);

  return (
    <div className="flex flex-col">
      <pre
        ref={ref}
        className="max-h-52 overflow-y-scroll"
        contentEditable="plaintext-only"
      />
      <button
        onClick={() => {
          writeTty({
            bytes: [104, 101, 108, 112, 10],
          });
        }}
      >
        help!
      </button>
    </div>
  );
}

export default Terminal;
