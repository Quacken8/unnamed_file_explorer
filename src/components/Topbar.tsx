import { useState } from "react";
import { getContext } from "../App";
import { useWritableSignal } from "../hooks";
import { emit } from "@tauri-apps/api/event";

function Topbar() {
  const context = getContext();
  const [currDirectory, setCurrDirectory] = useWritableSignal(
    context.currDirectory
  );
  const [searchString, setSearchString] = useState("");

  return (
    <div className="flex flex-row">
      <h1>Topbar</h1>
      <input
        type="text"
        value={currDirectory}
        onChange={(e) => setCurrDirectory(e.target.value)}
      />
      <input
        type="search"
        placeholder="Search"
        value={searchString}
        onChange={(e) => setSearchString(e.target.value)}
        onKeyDownCapture={(e) => {
          if (e.key === "Enter") {
            emit("search", { searchString });
          }
        }}
      />
    </div>
  );
}

export default Topbar;
