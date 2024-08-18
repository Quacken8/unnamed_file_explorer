import { createContext, useContext, useState } from "react";
import "./App.css";
import Layout from "./Layout";
import Topbar from "./components/Topbar";
import * as command from "./bindings";
import {
  AwaitedSignal,
  derived,
  mut,
  Signal,
  WritableSignal,
} from "@mod.js/signals";
import { useAwaited, useSignal, useWritableSignal } from "./hooks";
import Sidebar from "./Sidebar";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api";
import FileFolder from "./components/FileFolder";
import Terminal from "./components/Terminal";

// function App() {
//   const [greetMsg, setGreetMsg] = useState("");
//   const [name, setName] = useState("");

//   async function greet() {
//     // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
//     setGreetMsg(await invoke("greet", { name }));
//   }

//   return (
//     <div className="container">
//       <h1 className="font-thin">Welcome to Taursds!</h1>

//       <div className="row">
//         <a href="https://vitejs.dev" target="_blank">
//           <img src="/vite.svg" className="logo vite" alt="Vite logo" />
//         </a>
//         <a href="https://tauri.app" target="_blank">
//           <img src="/tauri.svg" className="logo tauri" alt="Tauri logo" />
//         </a>
//         <a href="https://reactjs.org" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>

//       <p>Click on the Tauri, Vite, and React logos to learn more.</p>

//       <form
//         className="row"
//         onSubmit={(e) => {
//           e.preventDefault();
//           greet();
//         }}
//       >
//         <input
//           id="greet-input"
//           onChange={(e) => setName(e.currentTarget.value)}
//           placeholder="Enter a name..."
//         />
//         <button type="submit">Greet</button>
//       </form>

//       <p>{greetMsg}</p>
//     </div>
//   );
// };

export type AppContext = {
  currDirectory: WritableSignal<string>;
};

const searchRes = mut(Promise.resolve([] as string[]));
const currDirectory = mut("~");
const currContents = derived(($) =>
  command.getContents($(currDirectory))
).awaited();

listen("search", ({ payload }) => {
  searchRes.set(
    command.search((payload as any).searchString, currDirectory.get(), null)
  );
});
const awaitedSearchRes = searchRes.awaited();
const Context = createContext<AppContext>({ currDirectory });
export const getContext = () => useContext(Context);
function App() {
  const searchResHooked = useAwaited(awaitedSearchRes);
  const contentsHooked = useAwaited(currContents);
  return (
    <Context.Provider value={{ currDirectory }}>
      <Layout
        topbar={<Topbar />}
        sidebar={<></>}
        content={
          <>
            {contentsHooked.status === "fulfilled"
              ? contentsHooked.value.map((f) => <FileFolder fileMetadata={f} />)
              : "—"}
          </>
        }
        footer={<Terminal />}
      />
    </Context.Provider>
  );
}
export default App;
